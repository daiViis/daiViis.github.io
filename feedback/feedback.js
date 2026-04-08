// Customer Feedback System JavaScript
// Handles form interactions, validation, and submission

// EmailJS configuration (using existing credentials)
emailjs.init("ZugXXK1wLfdxOGV0b");

// Database integration
let feedbackDB = null;

// Global state
let ratings = {
    process: 0,
    product: 0,
    recommendation: 0,
    overall: 0
};

let isSubmitting = false;

// Initialize feedback system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initFeedbackSystem();
});

function initFeedbackSystem() {
    initStarRatings();
    initFormHandlers();
    initCustomerRef();
    initCharacterCounter();
    checkPreviousSubmission();
    initDatabase();
}

// Initialize database connection
async function initDatabase() {
    try {
        if (window.DATABASE_CONFIG && window.DATABASE_CONFIG.enabled && window.FeedbackDatabase) {
            feedbackDB = new FeedbackDatabase(window.DATABASE_CONFIG);
            await feedbackDB.initialize();
            showMessage('✅ Database connected successfully', 'success');
            
            // Hide success message after 3 seconds
            setTimeout(() => {
                const messageEl = document.getElementById('statusMessage');
                if (messageEl && !messageEl.classList.contains('hidden')) {
                    messageEl.classList.add('hidden');
                }
            }, 3000);
        } else {
            console.log('📦 Database disabled - using localStorage only');
        }
    } catch (error) {
        console.error('Database initialization failed:', error);
        showMessage('⚠️ Database connection failed - feedback will be stored locally', 'warning');
    }
}

// Star Rating System
function initStarRatings() {
    const starRatings = document.querySelectorAll('.star-rating');
    
    starRatings.forEach(ratingContainer => {
        const question = ratingContainer.dataset.question;
        const stars = ratingContainer.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
            const rating = parseInt(star.dataset.rating);
            
            // Click handler
            star.addEventListener('click', function() {
                setRating(question, rating);
                updateStarDisplay(ratingContainer, rating);
                updateRatingText(question, rating);
                updateOverallRating();
            });
            
            // Hover effects
            star.addEventListener('mouseenter', function() {
                highlightStars(ratingContainer, rating);
            });
            
            ratingContainer.addEventListener('mouseleave', function() {
                const currentRating = ratings[question];
                highlightStars(ratingContainer, currentRating);
            });
        });
    });
}

function setRating(question, rating) {
    ratings[question] = rating;
    document.getElementById(`${question}_rating_value`).value = rating;
}

function updateStarDisplay(container, rating) {
    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function updateStarDisplayReadonly(container, rating) {
    const stars = container.querySelectorAll('.star-readonly');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function highlightStars(container, rating) {
    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#fbbf24';
        } else {
            star.style.color = '#d1d5db';
        }
    });
}

function updateRatingText(question, rating) {
    const textElement = document.getElementById(`${question}-rating`);
    const ratingTexts = {
        1: 'Very Poor',
        2: 'Poor',
        3: 'Average',
        4: 'Good',
        5: 'Excellent'
    };
    textElement.textContent = `${rating}/5 - ${ratingTexts[rating]}`;
    textElement.style.color = rating >= 4 ? '#059669' : rating >= 3 ? '#d97706' : '#dc2626';
}

function updateOverallRating() {
    const { process, product, recommendation } = ratings;
    if (process > 0 && product > 0 && recommendation > 0) {
        const overall = Math.round((process + product + recommendation) / 3);
        setRating('overall', overall);
        
        const overallContainer = document.querySelector('[data-question="overall"]');
        updateStarDisplayReadonly(overallContainer, overall);
        updateRatingText('overall', overall);
        
        // Show/hide share permission checkbox based on rating
        toggleSharePermissionVisibility(overall);
    }
}

function toggleSharePermissionVisibility(overallRating) {
    const shareSection = document.getElementById('sharePermissionSection');
    
    if (overallRating > 3.5) {
        shareSection.classList.remove('hidden');
        shareSection.style.animation = 'fadeInUp 0.5s ease-out';
    } else {
        shareSection.classList.add('hidden');
        // Reset checkbox if hidden
        document.getElementById('share_permission').checked = false;
    }
}

// Form Handling
function initFormHandlers() {
    const form = document.getElementById('feedbackForm');
    form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!validateForm()) {
        return;
    }
    
    isSubmitting = true;
    setLoadingState(true);
    
    try {
        await submitFeedback();
        showMessage('Thank you! Your feedback has been submitted successfully.', 'success');
        
        // Store submission to prevent duplicates
        markAsSubmitted();
        
        // Redirect to success page after a short delay
        setTimeout(() => {
            window.location.href = 'success.html';
        }, 2000);
        
    } catch (error) {
        console.error('Feedback submission error:', error);
        showMessage('Sorry, there was an error submitting your feedback. Please try again.', 'error');
        setLoadingState(false);
        isSubmitting = false;
    }
}

function validateForm() {
    // Check if at least the overall rating is provided
    if (ratings.overall === 0) {
        showMessage('Please provide at least an overall rating before submitting.', 'error');
        return false;
    }
    
    // Check if all individual ratings are provided
    const { process, product, recommendation } = ratings;
    if (process === 0 || product === 0 || recommendation === 0) {
        showMessage('Please rate all three questions before submitting.', 'error');
        return false;
    }
    
    return true;
}

async function submitFeedback() {
    const formData = new FormData(document.getElementById('feedbackForm'));
    
    // Calculate average rating
    const averageRating = ((ratings.process + ratings.product + ratings.recommendation) / 3).toFixed(1);
    
    // Format feedback message for existing contact template
    const feedbackMessage = `
🌟 CUSTOMER FEEDBACK SUBMISSION 🌟

👤 CUSTOMER INFORMATION:
Name: ${formData.get('customer_name') || 'Not provided'}
Website/Project: ${formData.get('customer_website') || 'Not provided'}
Reference: ${getCustomerRef()}

⭐ RATINGS SUMMARY:
Overall Rating: ${ratings.overall}/5 stars (⭐ Average: ${averageRating}/5)

📊 DETAILED RATINGS:
• Development Process: ${ratings.process}/5 stars
• Final Product Quality: ${ratings.product}/5 stars
• Recommendation Likelihood: ${ratings.recommendation}/5 stars

💬 CUSTOMER COMMENTS:
${formData.get('comments') || 'No additional comments provided'}

🌐 SHARING PERMISSION:
${formData.get('share_permission') ? '✅ Customer allows sharing their feedback as testimonial' : '❌ Customer prefers to keep feedback private'}

📋 SUBMISSION DETAILS:
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Page: ${window.location.href}

---
This feedback was submitted via the customer feedback system.
    `.trim();
    
    // Map to existing contact form template parameters
    const templateParams = {
        // Map to existing contact form fields
        from_name: formData.get('customer_name') || 'Customer Feedback',
        from_email: 'feedback@system.generated',
        message: feedbackMessage,
        project_type: 'Customer Feedback Submission',
        current_website: 'Portfolio Feedback System',
        alt_contact: 'No',
        social_platform: 'Feedback System',
        social_username: getCustomerRef(),
        privacy_consent: 'Feedback Submission'
    };
    
    // Also prepare future feedback template parameters (for when new template is set up)
    const feedbackTemplateParams = {
        // Customer info
        customer_name: formData.get('customer_name') || 'Not provided',
        customer_website: formData.get('customer_website') || 'Not provided',
        customer_ref: getCustomerRef(),
        
        // Ratings
        process_rating: `${ratings.process}/5`,
        product_rating: `${ratings.product}/5`,
        recommendation_rating: `${ratings.recommendation}/5`,
        overall_rating: `${ratings.overall}/5`,
        average_rating: averageRating,
        
        // Comments
        comments: formData.get('comments') || 'No additional comments',
        
        // Sharing permission
        share_permission: formData.get('share_permission') ? 'Yes' : 'No',
        share_permission_details: formData.get('share_permission') ? 'Customer allows sharing feedback as testimonial' : 'Customer prefers to keep feedback private',
        
        // Meta info
        submission_date: new Date().toLocaleDateString(),
        submission_time: new Date().toLocaleTimeString(),
        page_url: window.location.href
    };
    
    // Try feedback template first, fallback to contact template
    try {
        // Use dedicated feedback template
        const response = await emailjs.send('service_2uq6kt8', 'template_wi5yknj', feedbackTemplateParams);
        
        // Store feedback data locally for potential Rich Snippets integration
        storeFeedbackData(feedbackTemplateParams);
        
        // Save to external database if configured
        await saveFeedbackToDatabase(feedbackTemplateParams);
        
        return response;
    } catch (error) {
        console.error('EmailJS feedback template error, trying fallback:', error);
        
        // Fallback to contact template if feedback template fails
        try {
            const fallbackResponse = await emailjs.send('service_2uq6kt8', 'template_fryqiz8', templateParams);
            storeFeedbackData(feedbackTemplateParams);
            await saveFeedbackToDatabase(feedbackTemplateParams);
            return fallbackResponse;
        } catch (fallbackError) {
            console.error('Both EmailJS templates failed:', fallbackError);
            throw fallbackError;
        }
    }
}

function storeFeedbackData(data) {
    try {
        let feedbackHistory = JSON.parse(localStorage.getItem('feedback_history') || '[]');
        feedbackHistory.push({
            ...data,
            timestamp: Date.now(),
            id: generateFeedbackId()
        });
        
        // Keep only last 100 submissions for performance
        if (feedbackHistory.length > 100) {
            feedbackHistory = feedbackHistory.slice(-100);
        }
        
        localStorage.setItem('feedback_history', JSON.stringify(feedbackHistory));
        updateAverageRating(feedbackHistory);
    } catch (error) {
        console.error('Error storing feedback data:', error);
    }
}

function updateAverageRating(feedbackHistory) {
    if (feedbackHistory.length === 0) return;
    
    const totalRating = feedbackHistory.reduce((sum, feedback) => {
        return sum + parseFloat(feedback.average_rating);
    }, 0);
    
    const avgRating = (totalRating / feedbackHistory.length).toFixed(1);
    const reviewCount = feedbackHistory.length;
    
    localStorage.setItem('site_average_rating', avgRating);
    localStorage.setItem('site_review_count', reviewCount.toString());
}

function generateFeedbackId() {
    return 'fb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Customer Reference Handling
function initCustomerRef() {
    const urlParams = new URLSearchParams(window.location.search);
    const customerParam = urlParams.get('customer') || urlParams.get('ref') || urlParams.get('id');
    
    if (customerParam) {
        document.getElementById('customerRef').value = customerParam;
    }
}

function getCustomerRef() {
    const ref = document.getElementById('customerRef').value;
    return ref || 'Direct access - no reference';
}

// Character Counter
function initCharacterCounter() {
    const textarea = document.getElementById('comments');
    const counter = document.getElementById('char-count');
    const maxLength = 1000;
    
    textarea.addEventListener('input', function() {
        const currentLength = this.value.length;
        counter.textContent = `${currentLength} / ${maxLength}`;
        
        if (currentLength > maxLength * 0.9) {
            counter.style.color = '#dc2626';
        } else if (currentLength > maxLength * 0.75) {
            counter.style.color = '#d97706';
        } else {
            counter.style.color = '#6b7280';
        }
        
        // Prevent exceeding max length
        if (currentLength > maxLength) {
            this.value = this.value.substring(0, maxLength);
            counter.textContent = `${maxLength} / ${maxLength}`;
        }
    });
}

// Duplicate Submission Prevention
function checkPreviousSubmission() {
    const customerRef = getCustomerRef();
    const submissionKey = `feedback_submitted_${customerRef}`;
    const hasSubmitted = localStorage.getItem(submissionKey);
    
    if (hasSubmitted && customerRef !== 'Direct access - no reference') {
        const submitDate = new Date(parseInt(hasSubmitted));
        const daysSince = (Date.now() - submitDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Allow resubmission after 30 days
        if (daysSince < 30) {
            showMessage(`You've already submitted feedback for this project on ${submitDate.toLocaleDateString()}. Thank you!`, 'info');
            document.getElementById('submitBtn').disabled = true;
            document.getElementById('submitBtn').textContent = 'Already Submitted';
        }
    }
}

function markAsSubmitted() {
    const customerRef = getCustomerRef();
    const submissionKey = `feedback_submitted_${customerRef}`;
    localStorage.setItem(submissionKey, Date.now().toString());
}

// UI State Management
function setLoadingState(loading) {
    const submitBtn = document.getElementById('submitBtn');
    const submitText = submitBtn.querySelector('.submit-text');
    const loadingText = submitBtn.querySelector('.loading-text');
    const arrowIcon = submitBtn.querySelector('.arrow-icon');
    
    if (loading) {
        submitBtn.disabled = true;
        submitText.classList.add('hidden');
        loadingText.classList.remove('hidden');
        arrowIcon.textContent = '⟳';
        arrowIcon.classList.add('animate-spin');
        submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        loadingText.classList.add('hidden');
        arrowIcon.textContent = '→';
        arrowIcon.classList.remove('animate-spin');
        submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

function showMessage(message, type) {
    const messageEl = document.getElementById('statusMessage');
    messageEl.textContent = message;
    messageEl.className = `p-4 rounded-lg text-center font-medium ${getMessageClasses(type)}`;
    messageEl.classList.remove('hidden');
    
    // Auto-hide non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 5000);
    }
    
    // Scroll to message
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function getMessageClasses(type) {
    const classes = {
        'success': 'bg-green-100 text-green-800 border border-green-200',
        'error': 'bg-red-100 text-red-800 border border-red-200',
        'info': 'bg-blue-100 text-blue-800 border border-blue-200',
        'warning': 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    };
    return classes[type] || classes.info;
}

// Database Integration Functions
async function saveFeedbackToDatabase(feedbackData) {
    if (!feedbackDB) {
        console.log('📦 No database configured - skipping database save');
        return null;
    }

    try {
        const result = await feedbackDB.saveFeedback(feedbackData);
        console.log('✅ Feedback saved to database:', result);
        return result;
    } catch (error) {
        console.error('❌ Failed to save feedback to database:', error);
        
        // Don't throw error - we don't want database issues to break the submission
        // The email and localStorage saves are more critical
        if (window.DATABASE_CONFIG && window.DATABASE_CONFIG.debug) {
            showMessage('⚠️ Database save failed, but feedback was sent via email', 'warning');
        }
        return null;
    }
}

// Utility Functions
function stripHTML(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Export for potential external use
window.FeedbackSystem = {
    getRatings: () => ({ ...ratings }),
    getAverageRating: () => {
        const { process, product, recommendation } = ratings;
        return process > 0 && product > 0 && recommendation > 0 
            ? ((process + product + recommendation) / 3).toFixed(1) 
            : 0;
    },
    getStoredAverageRating: () => localStorage.getItem('site_average_rating'),
    getStoredReviewCount: () => localStorage.getItem('site_review_count')
};