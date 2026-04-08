// Currency switcher with auto-detection and real-time exchange rates
class CurrencySwitcher {
    constructor() {
        this.currentCurrency = 'USD';
        this.exchangeRates = {};
        this.apiKey = null; // ExchangeRate-API doesn't require key for free tier
        this.apiUrl = 'https://api.exchangerate-api.com/v4/latest/USD';
        this.cacheKey = 'currencyRates';
        this.cacheTimeKey = 'currencyRatesTime';
        this.preferencesKey = 'preferredCurrency';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        // Currency symbols and country mapping
        this.currencies = {
            'USD': { symbol: '$', name: 'US Dollar', flag: '🇺🇸', countries: ['US'] },
            'EUR': { symbol: '€', name: 'Euro', flag: '🇪🇺', countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'BE', 'FI', 'IE', 'PT', 'GR', 'LU', 'MT', 'CY', 'EE', 'LV', 'LT', 'SI', 'SK'] },
            'CZK': { symbol: 'Kč', name: 'Czech Koruna', flag: '🇨🇿', countries: ['CZ'] },
            'GBP': { symbol: '£', name: 'British Pound', flag: '🇬🇧', countries: ['GB'] }
        };
        
        this.fallbackRates = {
            'USD': 1,
            'EUR': 0.85,
            'CZK': 23.5,
            'GBP': 0.75
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log('💱 Initializing currency switcher...');
            
            // Auto-detect user's currency based on location
            const detectedCurrency = await this.detectUserCurrency();
            console.log(`🌍 Detected currency: ${detectedCurrency}`);
            
            // Check for saved preference
            const savedCurrency = localStorage.getItem(this.preferencesKey);
            console.log(`💾 Saved currency: ${savedCurrency}`);
            
            this.currentCurrency = savedCurrency || detectedCurrency || 'USD';
            console.log(`✅ Using currency: ${this.currentCurrency}`);
            
            // Load exchange rates first
            await this.loadExchangeRates();
            
            // Initialize buttons
            this.initializeButtons();
            this.updateButtons();
            
            // Always update prices to ensure correct display and styling
            this.updatePrices();
            
            // Update disclaimer visibility
            this.updateDisclaimer();
            
            console.log(`💰 Currency switcher initialized with ${this.currentCurrency}`);
        } catch (error) {
            console.error('Currency switcher initialization failed:', error);
            this.useFallbackRates();
            // Still initialize buttons even if other parts fail
            this.currentCurrency = 'USD'; // Set default
            this.initializeButtons();
            this.updateButtons();
        }
    }
    
    async detectUserCurrency() {
        try {
            // First try to detect based on user's location
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('https://ipapi.co/json/', { 
                signal: controller.signal 
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                const countryCode = data.country_code;
                console.log(`🌍 Detected country: ${countryCode}`);
                
                // Map country to currency
                for (const [currency, info] of Object.entries(this.currencies)) {
                    if (info.countries.includes(countryCode)) {
                        console.log(`🌍 Auto-detected currency: ${currency} (${countryCode})`);
                        return currency;
                    }
                }
            }
        } catch (error) {
            console.log('Location-based currency detection failed:', error.message);
        }
        
        try {
            // Fallback to browser locale
            const locale = navigator.language || navigator.languages[0];
            if (locale.includes('cs') || locale.includes('CZ')) return 'CZK';
            if (locale.includes('de') || locale.includes('fr') || locale.includes('it') || locale.includes('es')) return 'EUR';
        } catch (error) {
            console.log('Locale-based currency detection failed');
        }
        
        return 'USD'; // Default fallback
    }
    
    async loadExchangeRates() {
        try {
            // Check cache first
            const cachedRates = this.getCachedRates();
            if (cachedRates) {
                this.exchangeRates = cachedRates;
                console.log('💾 Using cached exchange rates');
                return;
            }
            
            // Fetch fresh rates
            console.log('🔄 Fetching fresh exchange rates...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(this.apiUrl, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 API response:', data);
            
            this.exchangeRates = data.rates;
            this.exchangeRates.USD = 1; // Base currency
            
            // Cache the rates
            this.cacheRates(this.exchangeRates);
            console.log('✅ Exchange rates loaded and cached:', this.exchangeRates);
            
        } catch (error) {
            console.error('Failed to load exchange rates:', error);
            this.useFallbackRates();
        }
    }
    
    getCachedRates() {
        try {
            const cachedRates = localStorage.getItem(this.cacheKey);
            const cacheTime = localStorage.getItem(this.cacheTimeKey);
            
            if (cachedRates && cacheTime) {
                const age = Date.now() - parseInt(cacheTime);
                if (age < this.cacheExpiry) {
                    return JSON.parse(cachedRates);
                }
            }
        } catch (error) {
            console.error('Cache read error:', error);
        }
        return null;
    }
    
    cacheRates(rates) {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(rates));
            localStorage.setItem(this.cacheTimeKey, Date.now().toString());
        } catch (error) {
            console.error('Cache write error:', error);
        }
    }
    
    useFallbackRates() {
        console.log('⚠️ Using fallback exchange rates');
        this.exchangeRates = { ...this.fallbackRates };
        // Immediately update prices with fallback rates
        this.updatePrices();
    }
    
    switchCurrency(newCurrency) {
        if (this.currentCurrency === newCurrency) return;
        
        console.log(`💱 Switching currency from ${this.currentCurrency} to ${newCurrency}`);
        this.currentCurrency = newCurrency;
        
        // Save preference
        localStorage.setItem(this.preferencesKey, newCurrency);
        
        // Update all prices
        this.updatePrices();
        
        // Show/hide disclaimer
        this.updateDisclaimer();
    }
    
    updatePrices() {
        const priceElements = document.querySelectorAll('.price-display');
        const rate = this.exchangeRates[this.currentCurrency] || this.fallbackRates[this.currentCurrency] || 1;
        const currency = this.currencies[this.currentCurrency];
        
        console.log(`💱 Updating prices with rate: ${rate} for ${this.currentCurrency}`);
        
        priceElements.forEach(element => {
            const usdPrice = parseFloat(element.dataset.usdPrice);
            if (isNaN(usdPrice)) {
                console.warn('❌ Invalid USD price:', element.dataset.usdPrice, element);
                return;
            }
            
            const convertedPrice = usdPrice * rate;
            const formattedPrice = this.formatPrice(convertedPrice, this.currentCurrency);
            
            console.log(`💰 Converting $${usdPrice} → ${formattedPrice}`);
            
            // Add smooth transition
            element.style.opacity = '0.7';
            setTimeout(() => {
                element.textContent = formattedPrice;
                element.style.opacity = '1';
                
                // Add subtle visual indicator for non-USD prices
                if (this.currentCurrency !== 'USD') {
                    element.style.color = '#d97706'; // amber color
                    element.style.fontWeight = '600';
                } else {
                    element.style.color = '';
                    element.style.fontWeight = '';
                }
            }, 150);
        });
        
        // Update button states
        this.updateButtons();
    }
    
    updateDisclaimer() {
        const disclaimer = document.getElementById('currency-disclaimer');
        if (!disclaimer) return;
        
        if (this.currentCurrency !== 'USD') {
            // Show disclaimer with animation
            disclaimer.classList.remove('hidden');
            setTimeout(() => {
                disclaimer.style.opacity = '1';
                disclaimer.style.transform = 'translateY(0)';
            }, 10);
        } else {
            // Hide disclaimer with animation
            disclaimer.style.opacity = '0';
            disclaimer.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                disclaimer.classList.add('hidden');
            }, 200);
        }
    }
    
    initializeButtons() {
        const buttons = document.querySelectorAll('.currency-btn');
        console.log(`💱 Found ${buttons.length} currency buttons`);
        buttons.forEach(button => {
            button.addEventListener('click', async (e) => {
                console.log(`💱 Button clicked: ${e.target.dataset.currency}`);
                const currency = e.target.dataset.currency;
                if (currency === 'AUTO') {
                    // Re-detect and switch to detected currency
                    const detectedCurrency = await this.detectUserCurrency();
                    this.switchCurrency(detectedCurrency || 'USD');
                } else {
                    this.switchCurrency(currency);
                }
            });
        });
    }
    
    updateButtons() {
        const buttons = document.querySelectorAll('.currency-btn');
        buttons.forEach(button => {
            const currency = button.dataset.currency;
            if (currency === this.currentCurrency) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    formatPrice(price, currency) {
        const currencyInfo = this.currencies[currency];
        const symbol = currencyInfo.symbol;
        
        // Format based on currency conventions
        if (currency === 'CZK') {
            // Czech koruna: no decimals, space before symbol
            return `${Math.round(price).toLocaleString()} ${symbol}`;
        } else if (currency === 'EUR') {
            // Euro: can be before or after, using after with space
            return `${price.toLocaleString('de-DE', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: price >= 1000 ? 0 : 2 
            })} ${symbol}`;
        } else if (currency === 'GBP') {
            // British pound: symbol before
            return `${symbol}${price.toLocaleString('en-GB', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: price >= 1000 ? 0 : 2 
            })}`;
        } else {
            // USD: symbol before
            return `${symbol}${price.toLocaleString('en-US', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: price >= 1000 ? 0 : 2 
            })}`;
        }
    }
    
    // Public method to get current rate for other scripts
    getCurrentRate() {
        return this.exchangeRates[this.currentCurrency] || 1;
    }
    
    // Public method to convert price
    convertPrice(usdPrice, targetCurrency = null) {
        const currency = targetCurrency || this.currentCurrency;
        const rate = this.exchangeRates[currency] || this.fallbackRates[currency] || 1;
        return usdPrice * rate;
    }
}

// Initialize currency switcher when DOM is ready
let currencySwitcher = null;

function initCurrencySwitcher() {
    console.log('🚀 initCurrencySwitcher called');
    const currencyButtons = document.getElementById('currency-buttons');
    console.log('💱 Currency buttons element:', currencyButtons);
    if (currencyButtons) {
        console.log('✅ Creating CurrencySwitcher instance');
        currencySwitcher = new CurrencySwitcher();
    } else {
        console.error('❌ Currency buttons not found');
    }
}

// Export for use in other scripts
window.CurrencySwitcher = CurrencySwitcher;
window.currencySwitcher = currencySwitcher;
window.initCurrencySwitcher = initCurrencySwitcher;