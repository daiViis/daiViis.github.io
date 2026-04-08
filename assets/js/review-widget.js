/**
 * Review Widget - Quick Rating System
 * Handles the expandable rating widget on the main page
 */

class ReviewWidget {
    constructor() {
        this.currentRating = 0;
        this.isSubmitting = false;
        this.database = null;
        
        this.initializeWidget();
        this.initializeDatabase();
    }

    async initializeDatabase() {
        try {
            // Use the same database configuration as other components
            if (window.DATABASE_CONFIG && window.DATABASE_CONFIG.enabled && window.FeedbackDatabase) {
                this.database = new FeedbackDatabase(window.DATABASE_CONFIG);
                await this.database.initialize();
                console.log('✅ Review widget database connected');
            } else {
                console.log('📦 Review widget database disabled');
            }
        } catch (error) {
            console.error('Review widget database initialization failed:', error);
        }
    }

    initializeWidget() {
        // Widget expansion/collapse
        this.initializeWidgetToggle();
        
        // Quick rating stars
        this.initializeQuickRating();
        
        // Action buttons
        this.initializeActionButtons();
        
        // Info modal
        this.initializeInfoModal();
        
        // Initialize display on load
        setTimeout(() => this.loadInitialData(), 1000); // Wait for other scripts to load
        
        console.log('Review widget initialized');
    }

    initializeWidgetToggle() {
        const collapsed = document.getElementById('ratingWidgetCollapsed');
        const expanded = document.getElementById('quickRatingForm');
        
        if (collapsed && expanded) {
            collapsed.addEventListener('click', () => {
                if (expanded.classList.contains('hidden')) {
                    expanded.classList.remove('hidden');
                    collapsed.classList.add('bg-gray-100');
                } else {
                    expanded.classList.add('hidden');
                    collapsed.classList.remove('bg-gray-100');
                    this.resetQuickRating();
                }
            });
        }
    }

    initializeQuickRating() {
        const stars = document.querySelectorAll('.quick-star');
        const ratingText = document.getElementById('quickRatingText');
        
        stars.forEach((star, index) => {
            const rating = parseInt(star.dataset.rating);
            
            // Click handler
            star.addEventListener('click', () => {
                this.currentRating = rating;
                this.updateQuickRatingDisplay(rating);
                this.updateRatingText(rating);
            });
            
            // Hover effects
            star.addEventListener('mouseenter', () => {
                this.highlightStars(rating);
            });
        });
        
        // Reset on mouse leave
        const starsContainer = document.getElementById('quickRatingStars');
        if (starsContainer) {
            starsContainer.addEventListener('mouseleave', () => {
                this.highlightStars(this.currentRating);
            });
        }
    }

    initializeActionButtons() {
        const submitBtn = document.getElementById('submitQuickRating');
        const cancelBtn = document.getElementById('cancelQuickRating');
        
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitQuickRating());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelQuickRating());
        }
    }

    initializeInfoModal() {
        const infoBtn = document.getElementById('infoButton');
        const modal = document.getElementById('infoModal');
        const closeBtn = document.getElementById('closeInfoModal');
        
        if (infoBtn && modal) {
            infoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                modal.classList.remove('hidden');
            });
        }
        
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
            
            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    }

    updateQuickRatingDisplay(rating) {
        const stars = document.querySelectorAll('.quick-star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('text-yellow-400');
                star.classList.remove('text-gray-300');
            } else {
                star.classList.remove('text-yellow-400');
                star.classList.add('text-gray-300');
            }
        });
    }

    highlightStars(rating) {
        const stars = document.querySelectorAll('.quick-star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#fbbf24'; // yellow-400
            } else {
                star.style.color = '#d1d5db'; // gray-300
            }
        });
    }

    updateRatingText(rating) {
        const ratingText = document.getElementById('quickRatingText');
        const texts = {
            1: 'Very Poor - Click Submit to rate',
            2: 'Poor - Click Submit to rate',
            3: 'Average - Click Submit to rate',
            4: 'Good - Click Submit to rate',
            5: 'Excellent - Click Submit to rate'
        };
        
        if (ratingText) {
            ratingText.textContent = texts[rating] || 'Click a star to rate';
            ratingText.style.color = rating >= 4 ? '#059669' : rating >= 3 ? '#d97706' : '#dc2626';
        }
    }

    async submitQuickRating() {
        if (this.isSubmitting || this.currentRating === 0) return;
        
        this.isSubmitting = true;
        const submitBtn = document.getElementById('submitQuickRating');
        const originalText = submitBtn?.textContent;
        
        try {
            if (submitBtn) {
                submitBtn.textContent = 'Submitting...';
                submitBtn.disabled = true;
            }

            const comment = document.getElementById('quickComment')?.value?.trim() || '';
            
            // Prepare feedback data in the same format as the full feedback form
            const feedbackData = {
                customer_name: 'Anonymous User',
                customer_website: '',
                customer_ref: `quick_${Date.now()}`,
                process_rating: this.currentRating,
                product_rating: this.currentRating,
                recommendation_rating: this.currentRating,
                overall_rating: this.currentRating,
                average_rating: this.currentRating,
                comments: comment,
                share_permission: 'No', // Quick ratings are not shared by default
                submission_date: new Date().toLocaleDateString(),
                submission_time: new Date().toLocaleTimeString(),
                page_url: window.location.href
            };

            // Submit to database if available
            if (this.database) {
                await this.database.saveFeedback(feedbackData);
                console.log('Quick rating saved to database');
                
                // Update the display with new data after a short delay
                setTimeout(() => {
                    if (window.updateRichSnippetsFromFeedback) {
                        window.updateRichSnippetsFromFeedback();
                    }
                }, 1000);
            } else {
                console.log('Database not available, quick rating not saved');
            }

            // Show success message
            this.showSuccessMessage();
            
            // Reset and collapse the form
            setTimeout(() => {
                this.cancelQuickRating();
            }, 2000);

        } catch (error) {
            console.error('Error submitting quick rating:', error);
            this.showErrorMessage();
        } finally {
            this.isSubmitting = false;
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    cancelQuickRating() {
        // Reset form
        this.resetQuickRating();
        
        // Collapse widget
        const expanded = document.getElementById('quickRatingForm');
        const collapsed = document.getElementById('ratingWidgetCollapsed');
        
        if (expanded && collapsed) {
            expanded.classList.add('hidden');
            collapsed.classList.remove('bg-gray-100');
        }
    }

    resetQuickRating() {
        this.currentRating = 0;
        this.updateQuickRatingDisplay(0);
        
        const ratingText = document.getElementById('quickRatingText');
        const comment = document.getElementById('quickComment');
        
        if (ratingText) {
            ratingText.textContent = 'Click a star to rate';
            ratingText.style.color = '';
        }
        
        if (comment) {
            comment.value = '';
        }
    }

    showSuccessMessage() {
        const ratingText = document.getElementById('quickRatingText');
        if (ratingText) {
            ratingText.textContent = '✅ Thank you for your rating!';
            ratingText.style.color = '#059669';
        }
    }

    showErrorMessage() {
        const ratingText = document.getElementById('quickRatingText');
        if (ratingText) {
            ratingText.textContent = '❌ Failed to submit rating. Please try again.';
            ratingText.style.color = '#dc2626';
        }
    }

    async loadInitialData() {
        // Trigger rich snippets update to load database data into the widget display
        if (window.updateRichSnippetsFromFeedback) {
            try {
                await window.updateRichSnippetsFromFeedback();
                console.log('Review widget: Initial data loaded');
            } catch (error) {
                console.error('Review widget: Failed to load initial data:', error);
            }
        }
    }

    // Public API for manual refresh
    async refresh() {
        await this.loadInitialData();
    }
}

// Wait for ApiHelper to be ready
async function waitForApiHelper() {
    const maxWaitTime = 20000; // 20 seconds - match rich snippets timing
    const checkInterval = 100; // Check every 100ms
    let waitTime = 0;
    
    while (waitTime < maxWaitTime) {
        // Check if ApiHelper is available and initialized
        if (window.ApiHelper && typeof window.ApiHelper.callDatabase === 'function') {
            console.log('ReviewWidget: ApiHelper is ready');
            return true; // Successfully connected
        }
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waitTime += checkInterval;
    }
    
    console.log('ReviewWidget: ApiHelper not available after 20s, will show fallback');
    return false; // Failed to connect
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for ApiHelper to be available
    waitForApiHelper().then((connected) => {
        if (connected) {
            // Successfully connected, initialize with full functionality
            window.reviewWidget = new ReviewWidget();
            console.log('ReviewWidget: Initialized with database connection');
        } else {
            // Failed to connect, initialize with limited functionality
            window.reviewWidget = new ReviewWidget();
            console.log('ReviewWidget: Initialized without database connection - will show fallbacks');
        }
    });
});

// Export for external use
window.ReviewWidget = ReviewWidget;