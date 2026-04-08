// Database Configuration for Feedback System
// Choose your database provider and configure credentials

const DATABASE_CONFIG = {
    // ==================== CHOOSE YOUR DATABASE PROVIDER ====================
    // Options: 'supabase', 'firebase', 'airtable', 'sheets', 'disabled'
    provider: 'supabase', // Using Supabase as recommended
    
    // Enable/disable database integration (falls back to localStorage only)
    enabled: true, // Database integration enabled
    
    // ==================== SUPABASE CONFIGURATION (Recommended) ====================
    // 1. Go to https://supabase.com
    // 2. Create a new project
    // 3. Go to Settings > API
    // 4. Copy your URL and anon/public key
    // Supabase credentials now handled securely via proxy
    // For proxy setup: use ApiHelper.callDatabase() instead of direct Supabase calls
    supabaseUrl: 'SECURE_PROXY_ENDPOINT', // Handled by api-config.js
    supabaseKey: 'SECURE_PROXY_ENDPOINT', // Handled by api-config.js
    
    // ==================== FIREBASE CONFIGURATION ====================
    // 1. Go to https://console.firebase.google.com
    // 2. Create a new project
    // 3. Enable Firestore
    // 4. Go to Project Settings > General
    // 5. Add a web app and copy the config
    firebaseConfig: {
        apiKey: "YOUR_FIREBASE_API_KEY",
        authDomain: "your-project.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:abcdef"
    },
    
    // ==================== AIRTABLE CONFIGURATION ====================
    // 1. Go to https://airtable.com
    // 2. Create a base (or use existing)
    // 3. Create an API key at https://airtable.com/account
    // 4. Get your Base ID from the API documentation
    airtableBaseId: 'YOUR_AIRTABLE_BASE_ID', // e.g., 'appXXXXXXXXXX'
    airtableApiKey: 'YOUR_AIRTABLE_API_KEY', // e.g., 'keyXXXXXXXXXX'
    airtableTableName: 'Feedback', // Name of your table
    
    // ==================== GOOGLE SHEETS CONFIGURATION ====================
    // 1. Create a Google Sheet
    // 2. Go to Google Cloud Console
    // 3. Enable Sheets API
    // 4. Create credentials (API key)
    // 5. Make your sheet publicly readable (or use OAuth)
    sheetsApiKey: 'YOUR_GOOGLE_SHEETS_API_KEY',
    spreadsheetId: 'YOUR_SPREADSHEET_ID', // From the Google Sheets URL
    sheetRange: 'Sheet1!A:P', // Range to append data
    
    // ==================== RETRY AND ERROR HANDLING ====================
    retryAttempts: 3,
    retryDelay: 1000, // ms
    enableFallbackToLocalStorage: true,
    
    // ==================== DEBUGGING ====================
    debug: false // Set to true for detailed logging
};

// Quick setup functions for each provider
const DATABASE_QUICK_SETUP = {
    // Copy-paste setup for Supabase (after creating project)
    setupSupabase: (url, key) => {
        DATABASE_CONFIG.provider = 'supabase';
        DATABASE_CONFIG.enabled = true;
        DATABASE_CONFIG.supabaseUrl = url;
        DATABASE_CONFIG.supabaseKey = key;
        console.log('✅ Supabase configured');
    },
    
    // Copy-paste setup for Firebase (after getting config object)
    setupFirebase: (config) => {
        DATABASE_CONFIG.provider = 'firebase';
        DATABASE_CONFIG.enabled = true;
        DATABASE_CONFIG.firebaseConfig = config;
        console.log('✅ Firebase configured');
    },
    
    // Copy-paste setup for Airtable
    setupAirtable: (baseId, apiKey, tableName = 'Feedback') => {
        DATABASE_CONFIG.provider = 'airtable';
        DATABASE_CONFIG.enabled = true;
        DATABASE_CONFIG.airtableBaseId = baseId;
        DATABASE_CONFIG.airtableApiKey = apiKey;
        DATABASE_CONFIG.airtableTableName = tableName;
        console.log('✅ Airtable configured');
    },
    
    // Copy-paste setup for Google Sheets
    setupSheets: (apiKey, spreadsheetId, range = 'Sheet1!A:P') => {
        DATABASE_CONFIG.provider = 'sheets';
        DATABASE_CONFIG.enabled = true;
        DATABASE_CONFIG.sheetsApiKey = apiKey;
        DATABASE_CONFIG.spreadsheetId = spreadsheetId;
        DATABASE_CONFIG.sheetRange = range;
        console.log('✅ Google Sheets configured');
    },
    
    // Disable database (use only localStorage)
    disable: () => {
        DATABASE_CONFIG.provider = 'disabled';
        DATABASE_CONFIG.enabled = false;
        console.log('✅ Database disabled - using localStorage only');
    }
};

// Example usage (uncomment and modify as needed):
// DATABASE_QUICK_SETUP.setupSupabase('https://your-project.supabase.co', 'your-anon-key');
// DATABASE_QUICK_SETUP.setupFirebase({your: 'firebase-config'});
// DATABASE_QUICK_SETUP.setupAirtable('appXXXXXX', 'keyXXXXXX', 'Feedback');
// DATABASE_QUICK_SETUP.setupSheets('your-api-key', 'your-spreadsheet-id');

// Export configuration
window.DATABASE_CONFIG = DATABASE_CONFIG;
window.DATABASE_QUICK_SETUP = DATABASE_QUICK_SETUP;