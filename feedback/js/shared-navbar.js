/**
 * Shared Admin Navbar Component
 * Provides consistent navigation across all admin pages
 */

class AdminNavbar {
    constructor(currentPage) {
        this.currentPage = currentPage;
        this.pages = {
            'feedback': { url: 'admin-dashboard.html', title: 'Feedback' },
            'customers': { url: 'customers.html', title: 'Customers' },
            'analytics': { url: 'analytics.html', title: 'Analytics' }
        };
    }

    render(title) {
        const navbarHTML = `
            <div class="mb-4 sm:mb-6 pb-4 border-b-2 border-black section-header pl-2 sm:pl-4">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                    <h1 class="text-xl sm:text-2xl font-light text-black">${title}</h1>
                    <div class="flex flex-wrap gap-2 text-sm sm:text-base">
                        ${this.renderNavLinks()}
                        ${this.renderPageSpecificButtons()}
                        <button id="refreshBtn" class="border border-black text-black px-2 sm:px-3 py-1 sm:py-2 hover:bg-gray-100 btn-secondary">Refresh</button>
                        <button id="logoutBtn" class="border border-black text-black px-2 sm:px-3 py-1 sm:py-2 hover:bg-gray-100 btn-secondary">Logout</button>
                    </div>
                </div>
            </div>
        `;
        
        return navbarHTML;
    }

    renderNavLinks() {
        let links = '';
        
        for (const [key, page] of Object.entries(this.pages)) {
            if (key !== this.currentPage) {
                links += `<a href="${page.url}" class="border border-black text-black px-2 sm:px-3 py-1 sm:py-2 hover:bg-gray-100 btn-secondary">${page.title}</a>`;
            }
        }
        
        return links;
    }

    renderPageSpecificButtons() {
        switch (this.currentPage) {
            case 'feedback':
                return `
                    <button id="createLinkBtn" class="bg-black text-white px-3 sm:px-4 py-1 sm:py-2 hover:bg-gray-800 btn-primary">Create Link</button>
                    <button id="exportBtn" class="border border-black text-black px-2 sm:px-3 py-1 sm:py-2 hover:bg-gray-100 btn-secondary">Export</button>
                `;
            case 'customers':
            case 'analytics':
            default:
                return '';
        }
    }

    setupEventListeners() {
        // Setup logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout);
        }

        // Setup refresh functionality
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                window.location.reload();
            });
        }
    }

    handleLogout() {
        localStorage.removeItem('admin_auth');
        window.location.reload();
    }
}

// Initialize navbar when DOM is loaded
function initializeNavbar(currentPage, title) {
    const navbar = new AdminNavbar(currentPage);
    
    // Find the dashboard container and prepend navbar
    const dashboardContainer = document.getElementById('dashboardContainer');
    if (dashboardContainer) {
        dashboardContainer.innerHTML = navbar.render(title) + dashboardContainer.innerHTML;
        navbar.setupEventListeners();
    }
}

// Export for use in other scripts
window.AdminNavbar = AdminNavbar;
window.initializeNavbar = initializeNavbar;