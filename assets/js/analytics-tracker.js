/**
 * Custom Analytics Tracker
 * Privacy-friendly page view tracking for daiviis.github.io
 */

class AnalyticsTracker {
    constructor() {
        this.config = window.DATABASE_CONFIG;
        this.client = null;
        this.useProxyMode = false;
        this.visitorId = this.getOrCreateVisitorId();
        this.sessionId = this.getOrCreateSessionId();
        this.startTime = Date.now();
        this.isBot = this.detectBot();
        this.disabled = false;
        
        this.init();
    }

    async init() {
        try {
            // Initialize Supabase client using existing config
            if (this.config && this.config.enabled && this.config.provider === 'supabase') {
                // Check if we have placeholder URLs (means we're using proxy mode)
                if (this.config.supabaseUrl === 'SECURE_PROXY_ENDPOINT' || 
                    this.config.supabaseKey === 'SECURE_PROXY_ENDPOINT') {
                    console.log('Analytics tracking using secure proxy mode');
                    this.useProxyMode = true;
                    
                    // Initialize ApiHelper for proxy mode
                    if (window.ApiHelper) {
                        await window.ApiHelper.initialize();
                    } else {
                        console.warn('ApiHelper not available for proxy mode');
                        this.disabled = true;
                        return;
                    }
                } else {
                    this.useProxyMode = false;
                    this.client = window.supabase?.createClient(
                        this.config.supabaseUrl,
                        this.config.supabaseKey
                    );
                }
            } else {
                this.disabled = true;
                return;
            }

            // Track page view immediately
            await this.trackPageView();
            
            // Track page exit/unload
            this.setupExitTracking();
            
        } catch (error) {
            console.warn('Analytics tracker initialization failed:', error);
            this.disabled = true;
        }
    }

    /**
     * Generate or retrieve visitor ID from localStorage
     */
    getOrCreateVisitorId() {
        let visitorId = localStorage.getItem('dc_visitor_id');
        if (!visitorId) {
            visitorId = 'v_' + this.generateId();
            localStorage.setItem('dc_visitor_id', visitorId);
        }
        return visitorId;
    }

    /**
     * Generate or retrieve session ID (30 minutes timeout)
     */
    getOrCreateSessionId() {
        const sessionKey = 'dc_session_id';
        const sessionTimeKey = 'dc_session_time';
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes
        
        let sessionId = localStorage.getItem(sessionKey);
        let sessionTime = localStorage.getItem(sessionTimeKey);
        
        const now = Date.now();
        
        // Create new session if doesn't exist or expired
        if (!sessionId || !sessionTime || (now - parseInt(sessionTime)) > sessionTimeout) {
            sessionId = 's_' + this.generateId();
            localStorage.setItem(sessionKey, sessionId);
        }
        
        // Update session time
        localStorage.setItem(sessionTimeKey, now.toString());
        
        return sessionId;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Basic bot detection
     */
    detectBot() {
        const userAgent = navigator.userAgent.toLowerCase();
        const botPatterns = [
            'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
            'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
            'whatsapp', 'telegram', 'crawler', 'spider', 'bot'
        ];
        
        return botPatterns.some(pattern => userAgent.includes(pattern));
    }

    /**
     * Collect device and browser information
     */
    collectDeviceInfo() {
        const screen = window.screen;
        const viewport = {
            width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };

        return {
            screen_width: screen.width,
            screen_height: screen.height,
            viewport_width: viewport.width,
            viewport_height: viewport.height,
            language: navigator.language || 'unknown',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
            is_mobile: this.isMobile(),
            user_agent: navigator.userAgent
        };
    }

    /**
     * Mobile device detection
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Track page view
     */
    async trackPageView() {
        if (this.disabled) return;
        if (this.isBot) return;
        if (!this.useProxyMode && !this.client) return;

        const deviceInfo = this.collectDeviceInfo();
        const pageData = {
            page_url: window.location.href,
            page_title: document.title,
            visitor_id: this.visitorId,
            session_id: this.sessionId,
            referrer: document.referrer || null,
            is_bot: this.isBot,
            timestamp: new Date().toISOString(),
            ...deviceInfo
        };

        try {
            if (this.useProxyMode) {
                // Use ApiHelper for proxy mode
                await window.ApiHelper.callDatabase(
                    'insert',
                    'page_analytics',
                    pageData,
                    {},
                    '*'
                );
            } else {
                // Use direct Supabase client
                const { error } = await this.client
                    .from('page_analytics')
                    .insert([pageData]);

                if (error) {
                    console.warn('Analytics tracking failed:', error);
                }
            }
        } catch (error) {
            console.warn('Analytics request failed:', error);
        }
    }

    /**
     * Setup tracking for when user leaves the page
     */
    setupExitTracking() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.trackTimeOnPage();
            }
        });

        // Track before page unload
        window.addEventListener('beforeunload', () => {
            this.trackTimeOnPage();
        });
    }

    /**
     * Track time spent on page (future enhancement)
     */
    trackTimeOnPage() {
        const timeOnPage = Math.round((Date.now() - this.startTime) / 1000);
        
        // Store time on page for potential future use
        sessionStorage.setItem('dc_time_on_page', timeOnPage.toString());
        
        // Could extend to track time_on_page in database
        // This would require modifying the database schema
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AnalyticsTracker();
    });
} else {
    new AnalyticsTracker();
}

// Export for testing purposes
window.AnalyticsTracker = AnalyticsTracker;