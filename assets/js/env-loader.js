// Environment Loader - Detects local vs production and loads appropriate config
// 
// SECURE DEVELOPMENT SETUP:
// 
// For HTTP-served local development (localhost, etc.):
// - Your .env file will be loaded automatically
//
// For file:// protocol development:
// - Add this before loading env-loader.js:
//   <script>
//   window.LOCAL_ENV_CONFIG = {
//     ENVIRONMENT_MODE: 'local',  // or 'proxy'
//     GEMINI_API_KEY: 'your_key',
//     SUPABASE_URL: 'your_url',
//     SUPABASE_ANON_KEY: 'your_key'
//   };
//   </script>
//
// Production automatically uses secure proxy endpoints.
class EnvironmentLoader {
    constructor() {
        this.config = null;
        this.isLocal = this.detectLocalEnvironment();
    }

    // Detect if we're running locally
    detectLocalEnvironment() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // Check for file:// protocol (opening HTML directly)
        if (protocol === 'file:') {
            return true;
        }
        
        // Check for local development servers
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               hostname === '' || // Sometimes empty for file://
               hostname.startsWith('192.168.') || 
               hostname.startsWith('10.') || 
               hostname.includes('local');
    }

    // Load environment configuration
    async loadConfig() {
        if (this.config) {
            return this.config; // Return cached config
        }

        if (this.isLocal) {
            try {
                // Check if LOCAL_ENV_CONFIG is defined (manual override for file:// protocol)
                if (typeof window.LOCAL_ENV_CONFIG !== 'undefined') {
                    if (window.LOCAL_ENV_CONFIG.ENVIRONMENT_MODE === 'proxy') {
                        console.log('🔐 Using secure proxy mode from LOCAL_ENV_CONFIG');
                        this.config = {
                            mode: 'local-proxy',
                            useProxy: true,
                            proxyUrl: window.LOCAL_ENV_CONFIG.NETLIFY_PROXY_URL || 'https://radiant-dodol-0c0bca.netlify.app',
                            geminiKey: null,
                            supabaseUrl: null,
                            supabaseKey: null
                        };
                        return this.config;
                    } else if (window.LOCAL_ENV_CONFIG.ENVIRONMENT_MODE === 'local' && 
                              window.LOCAL_ENV_CONFIG.GEMINI_API_KEY && 
                              window.LOCAL_ENV_CONFIG.SUPABASE_URL && 
                              window.LOCAL_ENV_CONFIG.SUPABASE_ANON_KEY) {
                        console.log('🔧 Using direct API calls from LOCAL_ENV_CONFIG');
                        this.config = {
                            mode: 'local-direct',
                            useProxy: false,
                            geminiKey: window.LOCAL_ENV_CONFIG.GEMINI_API_KEY,
                            supabaseUrl: window.LOCAL_ENV_CONFIG.SUPABASE_URL,
                            supabaseKey: window.LOCAL_ENV_CONFIG.SUPABASE_ANON_KEY,
                            proxyUrl: null
                        };
                        return this.config;
                    }
                }
                
                // Try to load .env file (works for HTTP-served local development)
                const envConfig = await this.loadEnvFile();
                if (envConfig && envConfig.ENVIRONMENT_MODE === 'local') {
                    console.log('🔧 Using local development mode with .env file');
                    this.config = {
                        mode: 'local',
                        useProxy: false,
                        geminiKey: envConfig.GEMINI_API_KEY,
                        supabaseUrl: envConfig.SUPABASE_URL,
                        supabaseKey: envConfig.SUPABASE_ANON_KEY,
                        proxyUrl: null
                    };
                    return this.config;
                } else if (envConfig && envConfig.ENVIRONMENT_MODE === 'proxy') {
                    console.log('🔧 Using local development mode with proxy from .env');
                    this.config = {
                        mode: 'proxy-local',
                        useProxy: true,
                        proxyUrl: envConfig.NETLIFY_PROXY_URL || 'https://radiant-dodol-0c0bca.netlify.app',
                        geminiKey: null,
                        supabaseUrl: null,
                        supabaseKey: null
                    };
                    return this.config;
                }
                
            } catch (error) {
                console.log('⚠️ Could not load .env file, falling back to proxy mode');
            }
            
            // Default fallback for local environments when .env is not accessible
            console.log('🔐 Local environment detected, defaulting to secure proxy mode');
            console.log('💡 To use direct API calls, define window.LOCAL_ENV_CONFIG or serve via HTTP');
            this.config = {
                mode: 'local-proxy',
                useProxy: true,
                proxyUrl: 'https://radiant-dodol-0c0bca.netlify.app',
                geminiKey: null,
                supabaseUrl: null,
                supabaseKey: null
            };
            return this.config;
        }

        // Default to production proxy mode
        console.log('🌐 Using production mode with secure proxy');
        this.config = {
            mode: 'production',
            useProxy: true,
            proxyUrl: 'https://radiant-dodol-0c0bca.netlify.app',
            geminiKey: null,
            supabaseUrl: null,
            supabaseKey: null
        };
        
        return this.config;
    }

    // Attempt to load .env file (works only when served via HTTP, not file://)
    async loadEnvFile() {
        try {
            const response = await fetch('/.env');
            if (!response.ok) {
                throw new Error('No .env file found');
            }
            
            const text = await response.text();
            const envConfig = {};
            
            // Parse .env file
            text.split('\n').forEach(line => {
                line = line.trim();
                if (line && !line.startsWith('#') && line.includes('=')) {
                    const [key, ...valueParts] = line.split('=');
                    envConfig[key.trim()] = valueParts.join('=').trim();
                }
            });
            
            return envConfig;
        } catch (error) {
            return null;
        }
    }

    // Check if proxy endpoint is available
    async testProxyConnection(proxyUrl) {
        try {
            const response = await fetch(`${proxyUrl}/.netlify/functions/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'test' })
            });
            return response.status !== 404; // 404 means function not found
        } catch (error) {
            return false;
        }
    }
}

// Global instance
window.EnvironmentLoader = EnvironmentLoader;