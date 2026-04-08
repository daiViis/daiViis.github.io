// Shared Admin Authentication System
class AdminAuth {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.useProxyMode = false;
        this.supabaseClient = null;
    }

    async initialize() {
        console.log('🔐 Initializing admin authentication...');
        
        // Detect proxy mode
        if (window.DATABASE_CONFIG && 
            (window.DATABASE_CONFIG.supabaseUrl === 'SECURE_PROXY_ENDPOINT' || 
             window.DATABASE_CONFIG.supabaseKey === 'SECURE_PROXY_ENDPOINT')) {
            console.log('🔒 Using secure proxy mode');
            this.useProxyMode = true;
            
            // Initialize API Helper for proxy mode
            if (window.ApiHelper) {
                await window.ApiHelper.initialize();
            }
        } else {
            console.log('🔓 Using direct database mode (local development)');
            this.useProxyMode = false;
            
            // Initialize Supabase client for local development
            if (window.supabase && window.DATABASE_CONFIG) {
                this.supabaseClient = window.supabase.createClient(
                    window.DATABASE_CONFIG.supabaseUrl,
                    window.DATABASE_CONFIG.supabaseKey
                );
            }
        }

        // Check if user is already logged in
        await this.checkExistingSession();
    }

    async checkExistingSession() {
        const savedAuth = localStorage.getItem('admin_auth');
        const jwtToken = localStorage.getItem('admin_jwt_token');

        if (jwtToken) {
            // Verify JWT token
            try {
                const tokenPayload = this.parseJWT(jwtToken);
                if (tokenPayload.exp * 1000 > Date.now()) {
                    this.currentUser = {
                        id: tokenPayload.id,
                        email: tokenPayload.email,
                        full_name: tokenPayload.full_name || tokenPayload.email,
                        role: tokenPayload.role
                    };
                    this.isAuthenticated = true;
                    return true;
                }
            } catch (error) {
                console.warn('Invalid JWT token:', error);
            }
        }

        if (savedAuth) {
            const authData = JSON.parse(savedAuth);
            if (await this.validateSession(authData)) {
                this.currentUser = authData;
                this.isAuthenticated = true;
                return true;
            }
        }

        return false;
    }

    parseJWT(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }

    async validateSession(authData) {
        try {
            if (!authData || !authData.id) {
                return false;
            }

            // Check if session is too old (24 hours)
            const loginTime = new Date(authData.loginTime || authData.iat * 1000);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                this.logout();
                return false;
            }

            // Verify user still exists and is active
            let data, error;
            
            if (this.useProxyMode) {
                try {
                    const response = await window.ApiHelper.callDatabase(
                        'select',
                        'admin_users',
                        null,
                        { id: authData.id },
                        'is_active'
                    );
                    data = response && response.length > 0 ? response[0] : null;
                    error = null;
                } catch (err) {
                    data = null;
                    error = err;
                }
            } else {
                const result = await this.supabaseClient
                    .from('admin_users')
                    .select('is_active')
                    .eq('id', authData.id)
                    .single();
                data = result.data;
                error = result.error;
            }

            if (error || !data || !data.is_active) {
                this.logout();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Session validation error:', error);
            return false;
        }
    }

    async login(email, password) {
        console.log('🔐 Attempting admin login for:', email);

        if (this.useProxyMode) {
            let authData;
            try {
                // Try secure admin auth endpoint first
                console.log('🔐 Attempting secure admin auth endpoint...');
                const authResponse = await fetch('https://radiant-dodol-0c0bca.netlify.app/.netlify/functions/admin-auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password, action: 'login' }),
                });

                if (!authResponse.ok) {
                    throw new Error(`HTTP ${authResponse.status}: Admin auth endpoint not available`);
                }

                const responseText = await authResponse.text();
                console.log('📨 Auth response:', responseText);

                try {
                    authData = JSON.parse(responseText);
                } catch (parseError) {
                    throw new Error('Invalid JSON response from auth endpoint');
                }

                if (!authData.success) {
                    throw new Error(authData.error || 'Authentication failed');
                }
            } catch (authEndpointError) {
                console.warn('⚠️ Admin auth endpoint failed:', authEndpointError.message);
                throw new Error('Admin authentication endpoint is not available. Please deploy the admin-auth function to your Netlify site.');
            }

            // Store JWT token and user data
            this.currentUser = authData.user;
            this.isAuthenticated = true;
            localStorage.setItem('admin_jwt_token', authData.token);
            localStorage.setItem('admin_auth', JSON.stringify({
                ...authData.user,
                loginTime: new Date().toISOString(),
                sessionId: this.generateSessionId()
            }));

            return authData.user;
        } else {
            // Local development - direct database access
            const { data: userData, error: userError } = await this.supabaseClient
                .from('admin_users')
                .select('id, email, full_name, role, is_active, password_hash')
                .eq('email', email)
                .single();

            if (userError || !userData) {
                throw new Error('Invalid email or password');
            }

            // Verify password using Supabase function
            const { data: passwordValid, error: passwordError } = await this.supabaseClient
                .rpc('verify_password', { input_password: password, stored_hash: userData.password_hash });

            if (passwordError || !passwordValid) {
                throw new Error('Invalid email or password');
            }

            if (!userData.is_active) {
                throw new Error('Account is inactive');
            }

            // Update last login
            await this.supabaseClient
                .from('admin_users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', userData.id);

            // Store authentication data
            this.currentUser = userData;
            this.isAuthenticated = true;
            const authData = {
                ...userData,
                loginTime: new Date().toISOString(),
                sessionId: this.generateSessionId()
            };
            
            localStorage.setItem('admin_auth', JSON.stringify(authData));
            return userData;
        }
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('admin_auth');
        localStorage.removeItem('admin_jwt_token');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        } else {
            window.location.reload();
        }
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    requireAuth() {
        if (!this.isAuthenticated) {
            // Store current page to return to after login
            const currentPage = window.location.pathname.split('/').pop();
            const returnUrl = encodeURIComponent(currentPage);
            window.location.href = `login.html?returnTo=${returnUrl}`;
            return false;
        }
        return true;
    }

    getAuthHeaders() {
        const token = localStorage.getItem('admin_jwt_token');
        if (token) {
            return {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
        }
        return {
            'Content-Type': 'application/json'
        };
    }
}

// Create global instance with error handling
try {
    console.log('🔧 Creating AdminAuth instance...');
    window.AdminAuth = new AdminAuth();
    console.log('✅ AdminAuth instance created successfully');
    console.log('🔍 AdminAuth methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.AdminAuth)));
} catch (error) {
    console.error('❌ Failed to create AdminAuth instance:', error);
}