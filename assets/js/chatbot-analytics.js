/**
 * Chatbot Analytics Tracker
 * Tracks chatbot interactions and usage for analytics dashboard
 */

class ChatbotAnalytics {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.visitorId = this.getOrCreateVisitorId();
        this.chatSessionId = null;
        this.messageCount = 0;
        this.sessionStartTime = null;
        this.isSessionActive = false;
        this.disabled = false;
        this.useProxyMode = false;
        
        this.initializeTracking();
    }

    initializeTracking() {
        // Initialize database connection
        this.initializeDatabase();
    }

    async initializeDatabase() {
        try {
            if (!window.DATABASE_CONFIG || !window.DATABASE_CONFIG.enabled) {
                console.warn('Database config not available for chatbot analytics');
                this.disabled = true;
                return;
            }

            // Check if we have placeholder URLs (means we're using proxy mode)
            if (window.DATABASE_CONFIG.supabaseUrl === 'SECURE_PROXY_ENDPOINT' || 
                window.DATABASE_CONFIG.supabaseKey === 'SECURE_PROXY_ENDPOINT') {
                console.log('Chatbot analytics using secure proxy mode');
                this.useProxyMode = true;
                
                // Initialize ApiHelper for proxy mode
                if (window.ApiHelper) {
                    await window.ApiHelper.initialize();
                } else {
                    console.warn('ApiHelper not available for chatbot analytics proxy mode');
                    this.disabled = true;
                    return;
                }
            } else if (window.DATABASE_CONFIG.provider === 'supabase' && window.supabase) {
                this.useProxyMode = false;
                this.client = window.supabase.createClient(
                    window.DATABASE_CONFIG.supabaseUrl,
                    window.DATABASE_CONFIG.supabaseKey
                );
            } else {
                this.disabled = true;
            }
        } catch (error) {
            console.error('Failed to initialize chatbot analytics database:', error);
            this.disabled = true;
        }
    }

    getOrCreateVisitorId() {
        let visitorId = localStorage.getItem('dc_visitor_id');
        if (!visitorId) {
            visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('dc_visitor_id', visitorId);
        }
        return visitorId;
    }

    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('dc_session_id');
        let sessionTime = localStorage.getItem('dc_session_time');
        
        // Check if session is expired (30 minutes)
        if (sessionTime && (Date.now() - parseInt(sessionTime)) > 30 * 60 * 1000) {
            sessionId = null;
        }
        
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('dc_session_id', sessionId);
        }
        
        localStorage.setItem('dc_session_time', Date.now().toString());
        return sessionId;
    }

    // Track when chat session starts
    async trackChatSessionStart() {
        if (this.disabled) return;
        if (this.isSessionActive) return;
        
        this.chatSessionId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.sessionStartTime = new Date();
        this.messageCount = 0;
        this.isSessionActive = true;

        await this.sendChatAnalytics({
            event_type: 'chat_session_start',
            chat_session_id: this.chatSessionId,
            message_count: 0,
            session_duration: 0
        });

        console.log('Chatbot session started:', this.chatSessionId);
    }

    // Track individual messages
    async trackMessage(sender, message, messageLength, errorInfo = null) {
        if (this.disabled) return;
        if (!this.isSessionActive) {
            await this.trackChatSessionStart();
        }

        this.messageCount++;

        const analyticsData = {
            event_type: 'message',
            chat_session_id: this.chatSessionId,
            message_sender: sender,
            message_length: messageLength,
            message_count: this.messageCount,
            session_duration: this.getSessionDuration()
        };

        // Add error information if provided
        if (errorInfo) {
            analyticsData.has_error = true;
            analyticsData.error_type = errorInfo.type;
            analyticsData.error_message = errorInfo.message;
            analyticsData.error_code = errorInfo.code;
        }

        await this.sendChatAnalytics(analyticsData);

        console.log(`Chatbot ${sender} message tracked:`, { 
            length: messageLength, 
            count: this.messageCount,
            error: errorInfo ? errorInfo.type : 'none'
        });
    }

    // Track when chat session ends
    async trackChatSessionEnd(endReason = 'user_action') {
        if (!this.isSessionActive) return;

        const sessionDuration = this.getSessionDuration();

        await this.sendChatAnalytics({
            event_type: 'chat_session_end',
            chat_session_id: this.chatSessionId,
            message_count: this.messageCount,
            session_duration: sessionDuration,
            end_reason: endReason
        });

        console.log('Chatbot session ended:', { 
            sessionId: this.chatSessionId, 
            messages: this.messageCount, 
            duration: sessionDuration,
            reason: endReason 
        });

        this.isSessionActive = false;
        this.chatSessionId = null;
        this.messageCount = 0;
        this.sessionStartTime = null;
    }

    getSessionDuration() {
        if (!this.sessionStartTime) return 0;
        return Math.floor((new Date() - this.sessionStartTime) / 1000); // Duration in seconds
    }

    async sendChatAnalytics(analyticsData) {
        if (this.disabled) return;
        if (!this.useProxyMode && !this.client) return;

        try {
            const payload = {
                visitor_id: this.visitorId,
                session_id: this.sessionId,
                chat_session_id: analyticsData.chat_session_id,
                event_type: analyticsData.event_type,
                message_sender: analyticsData.message_sender || null,
                message_length: analyticsData.message_length || null,
                message_count: analyticsData.message_count || 0,
                session_duration: analyticsData.session_duration || 0,
                end_reason: analyticsData.end_reason || null,
                has_error: analyticsData.has_error || false,
                error_type: analyticsData.error_type || null,
                error_message: analyticsData.error_message || null,
                error_code: analyticsData.error_code || null,
                timestamp: new Date().toISOString(),
                page_url: window.location.href,
                user_agent: navigator.userAgent,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            if (this.useProxyMode) {
                // Use ApiHelper for proxy mode
                await window.ApiHelper.callDatabase(
                    'insert',
                    'chatbot_analytics',
                    payload,
                    {},
                    '*'
                );
            } else {
                // Use direct Supabase client
                const { error } = await this.client
                    .from('chatbot_analytics')
                    .insert([payload]);

                if (error) {
                    console.error('Failed to send chatbot analytics:', error);
                }
            }
        } catch (error) {
            console.error('Error sending chatbot analytics:', error);
        }
    }

    // Track errors specifically
    async trackError(errorType, errorMessage, errorCode = null) {
        if (this.disabled) return;
        if (!this.isSessionActive) {
            await this.trackChatSessionStart();
        }

        await this.sendChatAnalytics({
            event_type: 'error',
            chat_session_id: this.chatSessionId,
            message_count: this.messageCount,
            session_duration: this.getSessionDuration(),
            has_error: true,
            error_type: errorType,
            error_message: errorMessage,
            error_code: errorCode
        });

        console.log('Chatbot error tracked:', { type: errorType, message: errorMessage, code: errorCode });
    }

    // Track chat reset
    async trackChatReset() {
        await this.trackChatSessionEnd('chat_reset');
    }

    // Track when user leaves page (cleanup)
    setupPageUnloadTracking() {
        window.addEventListener('beforeunload', () => {
            if (this.isSessionActive) {
                // Use sendBeacon for reliable tracking on page unload
                this.trackChatSessionEnd('page_unload');
            }
        });

        // Track visibility changes (tab switching, etc.)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isSessionActive) {
                // User switched tabs or minimized browser
                this.trackChatSessionEnd('tab_hidden');
            }
        });
    }
}

// Export for use in other scripts
window.ChatbotAnalytics = ChatbotAnalytics;