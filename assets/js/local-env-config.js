// Safe local environment bootstrap.
// Do not commit real credentials here.
// For local direct API access, use one of these non-committed options:
// 1. Create a local .env file in the project root
// 2. Define window.LOCAL_ENV_CONFIG or window.__DAIVIIS_LOCAL_ENV_CONFIG__ before this file loads
// 3. Store a JSON config object in localStorage under "daiviis.localEnvConfig"

(function bootstrapLocalEnvConfig() {
    const isLocalEnvironment =
        window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    if (!isLocalEnvironment) {
        return;
    }

    let storedConfig = null;
    try {
        storedConfig = JSON.parse(window.localStorage.getItem('daiviis.localEnvConfig') || 'null');
    } catch (error) {
        console.warn('Ignoring invalid local env config from localStorage');
    }

    const runtimeConfig =
        window.LOCAL_ENV_CONFIG ||
        window.__DAIVIIS_LOCAL_ENV_CONFIG__ ||
        storedConfig;

    if (runtimeConfig && typeof runtimeConfig === 'object') {
        window.LOCAL_ENV_CONFIG = runtimeConfig;
        console.log('Local environment override loaded from runtime config');
        return;
    }

    window.LOCAL_ENV_CONFIG = {
        ENVIRONMENT_MODE: 'proxy',
        NETLIFY_PROXY_URL: 'https://radiant-dodol-0c0bca.netlify.app'
    };

    console.log('Local environment config defaulted to secure proxy mode');
})();
