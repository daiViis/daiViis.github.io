// Smart API Configuration - Auto-detects environment and chooses best method
class SmartAPIConfig {
    constructor() {
        this.envLoader = new EnvironmentLoader();
        this.config = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            this.config = await this.envLoader.loadConfig();
            this.initialized = true;
            
            console.log(`🔧 API Configuration: ${this.config.mode} mode`);
        } catch (error) {
            console.error('❌ Failed to initialize API configuration:', error);
            
            // Fallback configuration
            this.config = {
                mode: 'fallback',
                useProxy: true,
                proxyUrl: window.location.origin,
                geminiKey: null,
                supabaseUrl: null,
                supabaseKey: null
            };
            this.initialized = true;
            
            console.log('⚠️ Using fallback configuration');
        }
    }

    getEndpointUrl(endpoint) {
        if (!this.config) {
            throw new Error('API Config not initialized. Call initialize() first.');
        }
        
        return this.config.useProxy ? 
            `${this.config.proxyUrl}${endpoint}` : 
            null; // Will use direct API calls
    }

    isUsingProxy() {
        return this.config?.useProxy || false;
    }

    getDirectAPIConfig() {
        return this.config?.useProxy ? null : {
            geminiKey: this.config.geminiKey,
            supabaseUrl: this.config.supabaseUrl,
            supabaseKey: this.config.supabaseKey
        };
    }
}

// Global instance
const API_CONFIG = new SmartAPIConfig();

// Legacy constants for backward compatibility
const CHATBOT_ENDPOINT = '/.netlify/functions/chatbot';
const DATABASE_ENDPOINT = '/.netlify/functions/database';

// Smart API Helper - Automatically chooses proxy or direct API calls
const ApiHelper = {
    // Initialize API configuration
    async initialize() {
        await API_CONFIG.initialize();
    },
    
    // Make a smart chatbot request
    async callChatbot(message, conversationHistory = []) {
        await this.initialize();
        
        if (API_CONFIG.isUsingProxy()) {
            // Use secure proxy
            const response = await fetch(API_CONFIG.getEndpointUrl(CHATBOT_ENDPOINT), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, conversationHistory }),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Chatbot API error ${response.status}:`, errorText);
                throw new Error(`Chatbot API error: ${response.status} - ${errorText}`);
            }
            
            return response.json();
        } else {
            // Use direct API call with local environment keys
            const directConfig = API_CONFIG.getDirectAPIConfig();
            if (!directConfig || !directConfig.geminiKey) {
                throw new Error('No API key available for direct calls');
            }
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${directConfig.geminiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: message }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                }),
            });
            
            if (!response.ok) {
                throw new Error(`Direct Gemini API error: ${response.status}`);
            }
            
            return response.json();
        }
    },
    
    // Make a smart database request
    async callDatabase(operation, table, data = null, filters = null, select = null) {
        await this.initialize();
        
        if (API_CONFIG.isUsingProxy()) {
            // Use secure proxy
            const response = await fetch(API_CONFIG.getEndpointUrl(DATABASE_ENDPOINT), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ operation, table, data, filters, select }),
            });
            
            if (!response.ok) {
                throw new Error(`Database API error: ${response.status}`);
            }
            
            return response.json();
        } else {
            // Use direct Supabase API call with local environment keys
            const directConfig = API_CONFIG.getDirectAPIConfig();
            if (!directConfig || !directConfig.supabaseUrl || !directConfig.supabaseKey) {
                throw new Error('No Supabase credentials available for direct calls');
            }
            
            let url = `${directConfig.supabaseUrl}/rest/v1/${table}`;
            let fetchOptions = {
                headers: {
                    'apikey': directConfig.supabaseKey,
                    'Authorization': `Bearer ${directConfig.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                }
            };
            
            // Handle different operations
            switch (operation) {
                case 'insert':
                    fetchOptions.method = 'POST';
                    fetchOptions.body = JSON.stringify(data);
                    fetchOptions.headers.Prefer = 'return=representation';
                    break;
                case 'select':
                    fetchOptions.method = 'GET';
                    if (select) url += `?select=${select}`;
                    if (filters) {
                        const params = new URLSearchParams();
                        Object.entries(filters).forEach(([key, value]) => {
                            params.append(key, `eq.${value}`);
                        });
                        url += (url.includes('?') ? '&' : '?') + params.toString();
                    }
                    break;
                case 'update':
                    fetchOptions.method = 'PATCH';
                    fetchOptions.body = JSON.stringify(data);
                    if (filters) {
                        const params = new URLSearchParams();
                        Object.entries(filters).forEach(([key, value]) => {
                            params.append(key, `eq.${value}`);
                        });
                        url += '?' + params.toString();
                    }
                    break;
                case 'delete':
                    fetchOptions.method = 'DELETE';
                    if (filters) {
                        const params = new URLSearchParams();
                        Object.entries(filters).forEach(([key, value]) => {
                            params.append(key, `eq.${value}`);
                        });
                        url += '?' + params.toString();
                    }
                    break;
                default:
                    throw new Error(`Unsupported operation: ${operation}`);
            }
            
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`Direct Supabase API error: ${response.status}`);
            }
            
            return response.json();
        }
    }
};

// Export for use in other scripts
window.API_CONFIG = API_CONFIG;
window.ApiHelper = ApiHelper;