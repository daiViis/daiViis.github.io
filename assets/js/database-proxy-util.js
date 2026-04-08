// Database Proxy Mode Utility
// Provides shared functionality for detecting proxy mode and initializing database connections

class DatabaseProxyUtil {
    /**
     * Detect if we should use proxy mode based on database configuration
     * @param {Object} config - Database configuration object
     * @returns {boolean} - True if proxy mode should be used
     */
    static isProxyMode(config = window.DATABASE_CONFIG) {
        if (!config || !config.enabled || config.provider !== 'supabase') {
            return false;
        }
        
        return config.supabaseUrl === 'SECURE_PROXY_ENDPOINT' || 
               config.supabaseKey === 'SECURE_PROXY_ENDPOINT';
    }
    
    /**
     * Initialize database connection with proper proxy or direct mode
     * @param {Object} config - Database configuration object
     * @returns {Object} - Connection info with useProxyMode flag and client (if direct mode)
     */
    static async initializeConnection(config = window.DATABASE_CONFIG) {
        if (!config || !config.enabled || config.provider !== 'supabase') {
            throw new Error('Database not configured or not using Supabase');
        }
        
        const useProxyMode = this.isProxyMode(config);
        
        if (useProxyMode) {
            console.log('Database: Using secure proxy mode');
            
            // Initialize ApiHelper for proxy mode
            if (!window.ApiHelper) {
                throw new Error('ApiHelper not available for proxy mode');
            }
            
            await window.ApiHelper.initialize();
            
            return {
                useProxyMode: true,
                client: null
            };
        } else {
            console.log('Database: Using direct mode');
            
            if (!window.supabase) {
                throw new Error('Supabase client not loaded. Include: <script src="https://unpkg.com/@supabase/supabase-js@2"></script>');
            }
            
            const client = window.supabase.createClient(
                config.supabaseUrl,
                config.supabaseKey
            );
            
            return {
                useProxyMode: false,
                client: client
            };
        }
    }
    
    /**
     * Execute a database operation with automatic proxy/direct mode handling
     * @param {string} operation - Database operation: 'insert', 'select', 'update', 'delete'
     * @param {string} table - Table name
     * @param {Object|null} data - Data for insert/update operations
     * @param {Object} filters - Filters for select/update/delete operations
     * @param {string} select - Select fields for select operations
     * @param {Object} connection - Connection object from initializeConnection()
     * @returns {Promise<any>} - Query result
     */
    static async executeOperation(operation, table, data, filters, select, connection) {
        if (connection.useProxyMode) {
            // Use ApiHelper for proxy mode
            return await window.ApiHelper.callDatabase(operation, table, data, filters, select);
        } else {
            // Use direct Supabase client
            let query = connection.client.from(table);
            
            switch (operation) {
                case 'insert':
                    const { data: insertResult, error: insertError } = await query.insert([data]);
                    if (insertError) throw insertError;
                    return insertResult;
                    
                case 'select':
                    query = query.select(select || '*');
                    if (filters) {
                        Object.entries(filters).forEach(([key, value]) => {
                            query = query.eq(key, value);
                        });
                    }
                    const { data: selectResult, error: selectError } = await query;
                    if (selectError) throw selectError;
                    return selectResult;
                    
                case 'update':
                    query = query.update(data);
                    if (filters) {
                        Object.entries(filters).forEach(([key, value]) => {
                            query = query.eq(key, value);
                        });
                    }
                    const { data: updateResult, error: updateError } = await query;
                    if (updateError) throw updateError;
                    return updateResult;
                    
                case 'delete':
                    if (filters) {
                        Object.entries(filters).forEach(([key, value]) => {
                            query = query.eq(key, value);
                        });
                    }
                    const { data: deleteResult, error: deleteError } = await query.delete();
                    if (deleteError) throw deleteError;
                    return deleteResult;
                    
                default:
                    throw new Error(`Unsupported operation: ${operation}`);
            }
        }
    }
    
    /**
     * Simplified method to perform common database operations
     * @param {string} operation - Database operation
     * @param {string} table - Table name
     * @param {Object} options - Operation options
     * @param {Object|null} options.data - Data for insert/update
     * @param {Object} options.filters - Filters for operations
     * @param {string} options.select - Select fields
     * @param {Object} options.config - Database config (optional, defaults to window.DATABASE_CONFIG)
     * @returns {Promise<any>} - Query result
     */
    static async performOperation(operation, table, options = {}) {
        const {
            data = null,
            filters = {},
            select = '*',
            config = window.DATABASE_CONFIG
        } = options;
        
        const connection = await this.initializeConnection(config);
        return await this.executeOperation(operation, table, data, filters, select, connection);
    }
}

// Export for use in other scripts
window.DatabaseProxyUtil = DatabaseProxyUtil;