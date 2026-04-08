// Database Service for Feedback System
// Supports multiple database backends: Supabase, Firebase, Airtable, Google Sheets

class FeedbackDatabase {
    constructor(config) {
        this.config = config;
        this.provider = config.provider; // 'supabase', 'firebase', 'airtable', 'sheets'
        this.client = null;
        this.isInitialized = false;
        this.useProxyMode = false;
    }

    async initialize() {
        try {
            switch (this.provider) {
                case 'supabase':
                    await this.initializeSupabase();
                    break;
                case 'firebase':
                    await this.initializeFirebase();
                    break;
                case 'airtable':
                    this.initializeAirtable();
                    break;
                case 'sheets':
                    await this.initializeSheets();
                    break;
                default:
                    throw new Error(`Unsupported database provider: ${this.provider}`);
            }
            this.isInitialized = true;
            console.log(`✅ Database initialized: ${this.provider}`);
        } catch (error) {
            console.error(`❌ Database initialization failed: ${this.provider}`, error);
            throw error;
        }
    }

    // ==================== SUPABASE IMPLEMENTATION ====================
    async initializeSupabase() {
        // Check if we have placeholder URLs (means we're using proxy mode)
        if (this.config.supabaseUrl === 'SECURE_PROXY_ENDPOINT' || 
            this.config.supabaseKey === 'SECURE_PROXY_ENDPOINT') {
            console.log('FeedbackDatabase using secure proxy mode');
            this.useProxyMode = true;
            
            // Initialize ApiHelper for proxy mode
            if (window.ApiHelper) {
                await window.ApiHelper.initialize();
            } else {
                throw new Error('ApiHelper not available for proxy mode');
            }
        } else {
            if (!window.supabase) {
                throw new Error('Supabase client not loaded. Include: <script src="https://unpkg.com/@supabase/supabase-js@2"></script>');
            }
            
            this.useProxyMode = false;
            this.client = window.supabase.createClient(
                this.config.supabaseUrl,
                this.config.supabaseKey
            );
        }
    }

    async saveToSupabase(feedbackData) {
        const dbData = {
            customer_name: feedbackData.customer_name,
            customer_website: feedbackData.customer_website,
            customer_ref: feedbackData.customer_ref,
            process_rating: parseInt(feedbackData.process_rating),
            product_rating: parseInt(feedbackData.product_rating),
            recommendation_rating: parseInt(feedbackData.recommendation_rating),
            overall_rating: parseInt(feedbackData.overall_rating),
            average_rating: parseFloat(feedbackData.average_rating),
            comments: feedbackData.comments,
            share_permission: feedbackData.share_permission === 'Yes',
            submission_date: feedbackData.submission_date,
            submission_time: feedbackData.submission_time,
            page_url: feedbackData.page_url,
            user_agent: navigator.userAgent
        };

        if (this.useProxyMode) {
            // Use ApiHelper for proxy mode
            return await window.ApiHelper.callDatabase(
                'insert',
                'feedback_submissions',
                dbData,
                {},
                '*'
            );
        } else {
            // Use direct Supabase client
            const { data, error } = await this.client
                .from('feedback_submissions')
                .insert([dbData]);

            if (error) throw error;
            return data;
        }
    }

    // ==================== FIREBASE IMPLEMENTATION ====================
    async initializeFirebase() {
        if (!window.firebase) {
            throw new Error('Firebase not loaded. Include Firebase SDK scripts.');
        }

        if (!window.firebase.apps.length) {
            window.firebase.initializeApp(this.config.firebaseConfig);
        }
        
        this.client = window.firebase.firestore();
    }

    async saveToFirebase(feedbackData) {
        const docRef = await this.client.collection('feedback_submissions').add({
            ...feedbackData,
            process_rating: parseInt(feedbackData.process_rating),
            product_rating: parseInt(feedbackData.product_rating),
            recommendation_rating: parseInt(feedbackData.recommendation_rating),
            overall_rating: parseInt(feedbackData.overall_rating),
            average_rating: parseFloat(feedbackData.average_rating),
            share_permission: feedbackData.share_permission === 'Yes',
            user_agent: navigator.userAgent,
            created_at: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { id: docRef.id };
    }

    // ==================== AIRTABLE IMPLEMENTATION ====================
    initializeAirtable() {
        // Airtable doesn't require initialization, just API calls
        this.client = {
            baseId: this.config.airtableBaseId,
            apiKey: this.config.airtableApiKey,
            tableName: this.config.airtableTableName || 'Feedback'
        };
    }

    async saveToAirtable(feedbackData) {
        const url = `https://api.airtable.com/v0/${this.client.baseId}/${this.client.tableName}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.client.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    'Customer Name': feedbackData.customer_name,
                    'Customer Website': feedbackData.customer_website,
                    'Customer Ref': feedbackData.customer_ref,
                    'Process Rating': parseInt(feedbackData.process_rating),
                    'Product Rating': parseInt(feedbackData.product_rating),
                    'Recommendation Rating': parseInt(feedbackData.recommendation_rating),
                    'Overall Rating': parseInt(feedbackData.overall_rating),
                    'Average Rating': parseFloat(feedbackData.average_rating),
                    'Comments': feedbackData.comments,
                    'Share Permission': feedbackData.share_permission === 'Yes',
                    'Submission Date': feedbackData.submission_date,
                    'Submission Time': feedbackData.submission_time,
                    'Page URL': feedbackData.page_url,
                    'User Agent': navigator.userAgent,
                    'Created At': new Date().toISOString()
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status}`);
        }

        return await response.json();
    }

    // ==================== GOOGLE SHEETS IMPLEMENTATION ====================
    async initializeSheets() {
        // Google Sheets API requires authentication
        this.client = {
            apiKey: this.config.sheetsApiKey,
            spreadsheetId: this.config.spreadsheetId,
            range: this.config.sheetRange || 'Sheet1!A:P'
        };
    }

    async saveToSheets(feedbackData) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.client.spreadsheetId}/values/${this.client.range}:append`;
        
        const values = [[
            new Date().toISOString(), // Created At
            feedbackData.customer_name,
            feedbackData.customer_website,
            feedbackData.customer_ref,
            feedbackData.process_rating,
            feedbackData.product_rating,
            feedbackData.recommendation_rating,
            feedbackData.overall_rating,
            feedbackData.average_rating,
            feedbackData.comments,
            feedbackData.share_permission,
            feedbackData.submission_date,
            feedbackData.submission_time,
            feedbackData.page_url,
            navigator.userAgent
        ]];

        const response = await fetch(`${url}?key=${this.client.apiKey}&valueInputOption=RAW`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: values
            })
        });

        if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status}`);
        }

        return await response.json();
    }

    // ==================== MAIN SAVE METHOD ====================
    async saveFeedback(feedbackData) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            let result;
            
            switch (this.provider) {
                case 'supabase':
                    result = await this.saveToSupabase(feedbackData);
                    break;
                case 'firebase':
                    result = await this.saveToFirebase(feedbackData);
                    break;
                case 'airtable':
                    result = await this.saveToAirtable(feedbackData);
                    break;
                case 'sheets':
                    result = await this.saveToSheets(feedbackData);
                    break;
            }

            console.log(`✅ Feedback saved to ${this.provider}:`, result);
            return result;
        } catch (error) {
            console.error(`❌ Failed to save feedback to ${this.provider}:`, error);
            throw error;
        }
    }

    // ==================== ANALYTICS METHODS ====================
    async getAnalytics() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            switch (this.provider) {
                case 'supabase':
                    return await this.getSupabaseAnalytics();
                case 'firebase':
                    return await this.getFirebaseAnalytics();
                default:
                    return null; // Analytics not implemented for this provider
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            return null;
        }
    }

    async getSupabaseAnalytics() {
        let data;
        
        if (this.useProxyMode) {
            // Use ApiHelper for proxy mode
            data = await window.ApiHelper.callDatabase(
                'select',
                'feedback_submissions',
                null,
                {},
                'average_rating, created_at, share_permission'
            );
            // Sort by created_at desc in JavaScript since proxy mode doesn't support order()
            data = data?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100) || [];
        } else {
            // Use direct Supabase client
            const { data: result, error } = await this.client
                .from('feedback_submissions')
                .select('average_rating, created_at, share_permission')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            data = result;
        }

        const totalSubmissions = data.length;
        const averageRating = data.reduce((sum, item) => sum + item.average_rating, 0) / totalSubmissions;
        const shareableCount = data.filter(item => item.share_permission).length;

        return {
            totalSubmissions,
            averageRating: Math.round(averageRating * 10) / 10,
            shareableTestimonials: shareableCount,
            recentSubmissions: data.slice(0, 10)
        };
    }

    async getFirebaseAnalytics() {
        const snapshot = await this.client
            .collection('feedback_submissions')
            .orderBy('created_at', 'desc')
            .limit(100)
            .get();

        const data = snapshot.docs.map(doc => doc.data());
        const totalSubmissions = data.length;
        const averageRating = data.reduce((sum, item) => sum + item.average_rating, 0) / totalSubmissions;
        const shareableCount = data.filter(item => item.share_permission).length;

        return {
            totalSubmissions,
            averageRating: Math.round(averageRating * 10) / 10,
            shareableTestimonials: shareableCount,
            recentSubmissions: data.slice(0, 10)
        };
    }
}

// Export for use in other scripts
window.FeedbackDatabase = FeedbackDatabase;