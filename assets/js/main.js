// Modern portfolio website script with enhanced functionality

// EmailJS configuration
emailjs.init("ZugXXK1wLfdxOGV0b");

// Global state
let skillsNetworkInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initSmoothScrolling();
    initPageTransitions();
    initMobileMenu();
    initContactForm();
    initMessageCounter();
    initSkillsNetwork();
    initCompanyLogoAnimations();
    initCodeEditor();
    initStickyNavbar();
    initBackToTop();
    initLocalTime();
    initSEODemo();
    initRatingWidget();
    initInfoPopup();
    initActiveNavHighlighting();
    initAnimatedHeading();
    initCurrencySwitcher();
    
    console.log('🚀 Portfolio website loaded successfully');
});

// Smooth scrolling for navigation links with enhanced page transitions
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 100;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                // Add transition effect
                triggerPageTransition(target);

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Enhanced page transition system
function initPageTransitions() {
    const transitionElements = document.querySelectorAll('.page-transition');
    const staggerElements = document.querySelectorAll('.stagger-children');
    
    // Create intersection observer for smooth animations
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.15
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add visible class with small delay for better effect
                setTimeout(() => {
                    entry.target.classList.add('visible');
                    
                    // Trigger stagger animation if element has stagger-children class
                    if (entry.target.classList.contains('stagger-children') || 
                        entry.target.querySelector('.stagger-children')) {
                        const staggerElement = entry.target.classList.contains('stagger-children') 
                            ? entry.target 
                            : entry.target.querySelector('.stagger-children');
                        if (staggerElement) {
                            setTimeout(() => {
                                staggerElement.classList.add('animate');
                            }, 300);
                        }
                    }
                }, 100);
            }
        });
    }, observerOptions);
    
    // Observe all page transition elements
    transitionElements.forEach(element => {
        observer.observe(element);
    });
    
    // Initial animation for hero section (should appear immediately)
    const heroSection = document.getElementById('hero');
    if (heroSection && heroSection.classList.contains('page-transition')) {
        setTimeout(() => {
            heroSection.classList.add('visible');
        }, 300);
    }
}

// Trigger page transition effect when navigating
function triggerPageTransition(targetElement) {
    // Add a subtle pulse effect to the target section
    if (targetElement && targetElement.classList.contains('page-transition')) {
        targetElement.style.transform = 'scale(0.98)';
        targetElement.style.transition = 'transform 0.2s ease-out';
        
        setTimeout(() => {
            targetElement.style.transform = 'scale(1)';
            setTimeout(() => {
                targetElement.style.transform = '';
                targetElement.style.transition = '';
            }, 200);
        }, 100);
    }
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuPanel = document.getElementById('mobileMenuPanel');
    const closeMobileMenu = document.getElementById('closeMobileMenu');
    const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
    
    if (!mobileMenuBtn || !mobileMenu) return;
    
    // Function to open mobile menu
    function openMobileMenu() {
        mobileMenu.classList.remove('hidden');
        mobileMenuBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Trigger animation after element is visible
        setTimeout(() => {
            mobileMenu.classList.add('show');
        }, 10);
    }
    
    // Function to close mobile menu
    function closeMobileMenuFunc() {
        mobileMenu.classList.remove('show');
        mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
        
        // Hide element after animation completes
        setTimeout(() => {
            mobileMenu.classList.add('hidden');
        }, 300);
    }
    
    // Event listeners
    mobileMenuBtn.addEventListener('click', openMobileMenu);
    closeMobileMenu.addEventListener('click', closeMobileMenuFunc);
    mobileMenuBackdrop.addEventListener('click', closeMobileMenuFunc);
    
    // Close menu when clicking on navigation links
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenuFunc);
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
            closeMobileMenuFunc();
        }
    });
}

// Company logo hover animations
function initCompanyLogoAnimations() {
    document.querySelectorAll('.company-logo').forEach(logo => {
        logo.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px) scale(1.05)';
            this.style.filter = 'grayscale(0%) opacity(1)';
        });
        
        logo.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.filter = 'grayscale(100%) opacity(0.6)';
        });
    });
}

// Skills Network Visualization (simplified for new design)
function initSkillsNetwork() {
    const canvas = document.getElementById('skillsCanvas');
    if (!canvas || skillsNetworkInitialized) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight || 400;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Simple skills visualization
    const skills = [
        { name: 'React', x: 0.2, y: 0.3, color: '#61DAFB' },
        { name: 'TypeScript', x: 0.8, y: 0.2, color: '#3178C6' },
        { name: 'Node.js', x: 0.3, y: 0.7, color: '#339933' },
        { name: 'Python', x: 0.7, y: 0.8, color: '#3776AB' },
        { name: 'HTML5', x: 0.5, y: 0.4, color: '#E34F26' },
        { name: 'CSS3', x: 0.6, y: 0.6, color: '#1572B6' }
    ];
    
    let animationFrame;
    let time = 0;
    
    function animate() {
        time += 0.01;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < skills.length; i++) {
            for (let j = i + 1; j < skills.length; j++) {
                const skill1 = skills[i];
                const skill2 = skills[j];
                const x1 = skill1.x * canvas.width;
                const y1 = skill1.y * canvas.height;
                const x2 = skill2.x * canvas.width;
                const y2 = skill2.y * canvas.height;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        
        // Draw skill nodes
        skills.forEach((skill, index) => {
            const x = skill.x * canvas.width + Math.sin(time + index) * 10;
            const y = skill.y * canvas.height + Math.cos(time + index) * 10;
            
            // Draw node
            ctx.fillStyle = skill.color;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw label
            ctx.fillStyle = '#374151';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(skill.name, x, y - 15);
        });
        
        animationFrame = requestAnimationFrame(animate);
    }
    
    animate();
    skillsNetworkInitialized = true;
}

// Interactive Code Editor
function initCodeEditor() {
    const codeEditor = document.getElementById('codeEditor');
    const lineNumbers = document.getElementById('lineNumbers');
    if (!codeEditor || !lineNumbers) return;
    
    const STORAGE_KEY = 'heroCodeEditor_content';
    
    // Save content to localStorage
    function saveContent() {
        const content = codeEditor.innerHTML;
        localStorage.setItem(STORAGE_KEY, content);
    }
    
    // Load content from localStorage
    function loadContent() {
        const savedContent = localStorage.getItem(STORAGE_KEY);
        if (savedContent) {
            codeEditor.innerHTML = savedContent;
        }
    }
    
    // Update line numbers based on content
    function updateLineNumbers() {
        const text = codeEditor.innerText || codeEditor.textContent || '';
        const lines = text.split('\n');
        // Filter out empty trailing lines that browsers sometimes add
        let lineCount = lines.length;
        if (lines[lines.length - 1] === '') {
            lineCount = Math.max(1, lineCount - 1);
        }
        
        lineNumbers.innerHTML = '';
        for (let i = 1; i <= lineCount; i++) {
            const lineDiv = document.createElement('div');
            lineDiv.textContent = i;
            lineDiv.className = 'leading-relaxed';
            lineNumbers.appendChild(lineDiv);
        }
    }
    
    // Add cursor behavior
    codeEditor.addEventListener('focus', function() {
        // Remove any existing cursor elements
        const existingCursors = document.querySelectorAll('.code-cursor');
        existingCursors.forEach(cursor => cursor.remove());
    });
    
    codeEditor.addEventListener('blur', function() {
        // Add blinking cursor when not focused
        if (!document.querySelector('.code-cursor')) {
            const cursor = document.createElement('span');
            cursor.className = 'code-cursor animate-pulse bg-white w-2 h-4 ml-1 inline-block';
            cursor.style.animation = 'pulse 1s infinite';
            this.appendChild(cursor);
        }
    });
    
    // Handle input changes
    codeEditor.addEventListener('input', function() {
        setTimeout(() => {
            updateLineNumbers();
            saveContent();
        }, 10);
    });
    
    // Handle key events
    codeEditor.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            // Insert 4 spaces instead of tab
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const tabNode = document.createTextNode('    ');
            range.insertNode(tabNode);
            range.setStartAfter(tabNode);
            range.setEndAfter(tabNode);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });
    
    // Handle key up events for immediate updates
    codeEditor.addEventListener('keyup', function(e) {
        if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
            setTimeout(() => {
                updateLineNumbers();
                saveContent();
            }, 10);
        }
    });
    
    // Handle paste events
    codeEditor.addEventListener('paste', function() {
        setTimeout(() => {
            updateLineNumbers();
            saveContent();
        }, 50);
    });
    
    // Initial setup
    loadContent(); // Load saved content first
    updateLineNumbers();
    codeEditor.blur();
}

// Message character counter functionality
function initMessageCounter() {
    const messageTextarea = document.getElementById('message');
    const charCount = document.getElementById('char-count');
    const wordCount = document.getElementById('word-count');
    const charLimit = parseInt(document.getElementById('char-limit').textContent);
    
    if (!messageTextarea) return;
    
    // Update character and word counts
    function updateCounts() {
        const text = messageTextarea.value || '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        
        charCount.textContent = text.length;
        wordCount.textContent = words;
        
        // Update color based on limit
        const messageCountElement = document.getElementById('message-count');
        if (text.length > charLimit * 0.9) {
            messageCountElement.classList.add('text-red-500');
            messageCountElement.classList.remove('text-gray-500');
        } else {
            messageCountElement.classList.remove('text-red-500');
            messageCountElement.classList.add('text-gray-500');
        }
    }
    
    // Textarea event listeners
    messageTextarea.addEventListener('input', updateCounts);
    messageTextarea.addEventListener('paste', () => setTimeout(updateCounts, 0));
    
    // Initial setup
    updateCounts();
}

// Enhanced Contact Form with Three-Tier Fallback System
function initContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');
    
    if (!form || !submitBtn) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const messageContent = formData.get('message').trim();
        
        // Validation
        if (!name || !email || !messageContent) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            // Primary: EmailJS (serverless)
            await sendViaEmailJS(name, email, messageContent);
            
        } catch (emailJSError) {
            console.error('EmailJS failed:', emailJSError);
            showMessage('Failed to send message. Please try again or contact me directly.', 'error');
            setLoadingState(false);
        }
    });
    
    // Primary method: EmailJS
    async function sendViaEmailJS(name, email, messageContent) {
        const messagePlain = stripHTML(messageContent);
        const formData = new FormData(form);
        
        // Get all form field values
        const projectType = formData.get('project_type') || 'Not specified';
        const currentWebsite = formData.get('current_website') || 'Not provided';
        const altContact = formData.get('alt_contact') ? 'Yes' : 'No';
        const socialPlatform = formData.get('social_platform') || 'Not specified';
        const socialUsername = formData.get('social_username') || 'Not provided';
        const privacyConsent = formData.get('privacy_consent') ? 'Agreed' : 'Not agreed';
        
        const templateParams = {
            from_name: name,
            from_email: email,
            message: messagePlain,
            message_html: messageContent,
            project_type: projectType,
            current_website: currentWebsite,
            alt_contact: altContact,
            social_platform: socialPlatform,
            social_username: socialUsername,
            privacy_consent: privacyConsent
        };
        
        const response = await emailjs.send('service_2uq6kt8', 'template_fryqiz8', templateParams);
        
        showMessage('Thank you for contacting me, I will answer as soon as possible.', 'success');
        form.reset();
        updateCharacterCount();
        setLoadingState(false);
        
        return response;
    }
    
    // Secondary method: PHP handler
    async function sendViaPHP(name, email, messageContent) {
        const response = await fetch('send_email.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                email: email,
                message: stripHTML(messageContent),
                message_html: messageContent
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('✨ Message sent successfully! I\'ll get back to you soon.', 'success');
            form.reset();
            document.getElementById('richTextEditor').innerHTML = '';
            updateCharacterCount();
        } else {
            throw new Error(result.error || 'PHP handler failed');
        }
        
        setLoadingState(false);
        return result;
    }
    
    // Fallback method: mailto
    function sendViaMailto(name, email, messageContent) {
        const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
        const body = encodeURIComponent(`From: ${name} (${email})\\n\\nMessage:\\n${stripHTML(messageContent)}`);
        const mailtoLink = `mailto:david.cit1999@gmail.com?subject=${subject}&body=${body}`;
        
        window.location.href = mailtoLink;
        
        showMessage('Opening your email client... If it doesn\'t open automatically, please email me directly at david.cit1999@gmail.com', 'info');
        setLoadingState(false);
    }
    
    // Utility functions
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function stripHTML(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
    
    function setLoadingState(loading) {
        const submitText = submitBtn.querySelector('.submit-text');
        const loadingText = submitBtn.querySelector('.loading-text');
        const arrowIcon = submitBtn.querySelector('.arrow-icon');
        
        if (loading) {
            submitBtn.disabled = true;
            if (arrowIcon) {
                arrowIcon.textContent = '⟳';
                arrowIcon.classList.add('animate-spin');
            }
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
        } else {
            submitBtn.disabled = false;
            if (arrowIcon) {
                arrowIcon.textContent = '→';
                arrowIcon.classList.remove('animate-spin');
            }
            submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    }
    
    function showMessage(message, type) {
        statusMessage.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800');
        
        switch(type) {
            case 'success':
                statusMessage.classList.add('bg-green-100', 'text-green-800');
                break;
            case 'error':
                statusMessage.classList.add('bg-red-100', 'text-red-800');
                break;
            case 'info':
                statusMessage.classList.add('bg-blue-100', 'text-blue-800');
                break;
        }
        
        statusMessage.textContent = message;
        
        // Auto hide success messages
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.classList.add('hidden');
            }, 5000);
        }
    }
    
    function updateCharacterCount() {
        const charCount = document.getElementById('char-count');
        const wordCount = document.getElementById('word-count');
        if (charCount) charCount.textContent = '0';
        if (wordCount) wordCount.textContent = '0';
    }
}

// Intersection Observer for animations (optional enhancement)
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);
    
    // Observe sections for animations
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
}

// Initialize scroll animations on load
document.addEventListener('DOMContentLoaded', initScrollAnimations);

// Sticky navbar functionality
function initStickyNavbar() {
    const navbar = document.getElementById('navbar');
    const logoText = document.getElementById('logoText');
    let isScrolled = false;

    if (!navbar || !logoText) return;

    function updateNavbar() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const shouldBeScrolled = scrollTop > 50;

        if (shouldBeScrolled !== isScrolled) {
            isScrolled = shouldBeScrolled;
            
            if (isScrolled) {
                navbar.classList.add('navbar-scrolled');
                logoText.style.opacity = '0';
                logoText.style.transform = 'scale(0.8)';
            } else {
                navbar.classList.remove('navbar-scrolled');
                logoText.style.opacity = '1';
                logoText.style.transform = 'scale(1)';
            }
        }
    }

    // Add scroll listener
    window.addEventListener('scroll', updateNavbar, { passive: true });
    
    // Initial check
    updateNavbar();
}


// Back to top button functionality
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    const navbar = document.getElementById('navbar');
    
    if (!backToTopBtn || !navbar) return;
    
    let isVisible = false;
    let hasShownOnce = false;
    
    function toggleBackToTopBtn() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const shouldShow = scrollTop > 300; // Show after scrolling 300px
        
        if (shouldShow && !isVisible) {
            isVisible = true;
            backToTopBtn.classList.add('show');
            
            // Add pulse animation on first appearance
            if (!hasShownOnce) {
                backToTopBtn.classList.add('pulse');
                hasShownOnce = true;
                
                // Remove pulse class after animation
                setTimeout(() => {
                    backToTopBtn.classList.remove('pulse');
                }, 600);
            }
        } else if (!shouldShow && isVisible) {
            isVisible = false;
            backToTopBtn.classList.remove('show');
        }
    }
    
    // Scroll event listener
    window.addEventListener('scroll', toggleBackToTopBtn, { passive: true });
    
    // Click event listener
    backToTopBtn.addEventListener('click', function() {
        // Add a little bounce animation
        backToTopBtn.style.transform = 'translateY(2px) scale(0.9)';
        
        setTimeout(() => {
            backToTopBtn.style.transform = '';
        }, 150);
        
        // Smooth scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Initial check
    toggleBackToTopBtn();
}

// Local time functionality for Czech Republic
function initLocalTime() {
    const timeElement = document.getElementById('localTime');
    if (!timeElement) return;
    
    function updateTime() {
        const now = new Date();
        const options = {
            timeZone: 'Europe/Prague',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        const timeString = now.toLocaleTimeString('en-US', options);
        timeElement.textContent = timeString;
    }
    
    // Update immediately
    updateTime();
    
    // Update every minute
    setInterval(updateTime, 60000);
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

// Performance monitoring
window.addEventListener('load', function() {
    if ('performance' in window) {
        setTimeout(() => {
            const loadTime = performance.now();
            console.log(`🚀 Page loaded in ${loadTime.toFixed(2)}ms`);
        }, 10);
    }
});

// SEO Demo Section Functionality
function initSEODemo() {
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded, skipping SEO demo initialization');
        return;
    }

    const chartCanvas = document.getElementById('trafficChart');
    const caseStudyBtns = document.querySelectorAll('.case-study-btn');
    const growthPercentage = document.getElementById('growth-percentage');
    const monthlyVisitors = document.getElementById('monthly-visitors');
    const timeframe = document.getElementById('timeframe');

    if (!chartCanvas || !caseStudyBtns.length) return;

    let trafficChart = null;

    // Case study data
    const caseStudies = {
        ecommerce: {
            label: 'E-commerce Store',
            data: [2200, 2420, 2880, 3520, 4340, 5380, 6680, 7200, 7650, 8020, 8250, 8450],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            growth: '+284%',
            visitors: '8,450',
            months: '6'
        },
        local: {
            label: 'Local Services',
            data: [1600, 1780, 2080, 2520, 3120, 3880, 4350, 4420, 4480, 4530, 4580, 4620],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            growth: '+189%',
            visitors: '4,620',
            months: '6'
        },
        b2b: {
            label: 'B2B SaaS',
            data: [1800, 2000, 2400, 3000, 3800, 4800, 5850, 5950, 6020, 6080, 6130, 6180],
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            growth: '+243%',
            visitors: '6,180',
            months: '6'
        }
    };

    const chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize chart with e-commerce data
    function createChart(caseData) {
        const ctx = chartCanvas.getContext('2d');
        
        if (trafficChart) {
            trafficChart.destroy();
        }

        trafficChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: caseData.label,
                    data: caseData.data,
                    borderColor: caseData.borderColor,
                    backgroundColor: caseData.backgroundColor,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: caseData.borderColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: caseData.borderColor,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return `${context[0].label} 2024`;
                            },
                            label: function(context) {
                                return `Monthly Visitors: ${context.parsed.y.toLocaleString()}`;
                            },
                            afterLabel: function(context) {
                                if (context.dataIndex === 0) {
                                    return 'Starting baseline';
                                }
                                const startValue = caseData.data[0];
                                const currentValue = context.parsed.y;
                                const growth = Math.round(((currentValue - startValue) / startValue) * 100);
                                return `Growth: +${growth}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6B7280',
                            font: {
                                family: 'Inter',
                                size: 12
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(107, 114, 128, 0.1)'
                        },
                        ticks: {
                            color: '#6B7280',
                            font: {
                                family: 'Inter',
                                size: 12
                            },
                            callback: function(value) {
                                return value >= 1000 ? (value / 1000) + 'K' : value;
                            }
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutCubic'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Update metrics with animation
    function updateMetrics(caseData, animate = true) {
        if (animate) {
            // Animate counters
            animateCounter(growthPercentage, caseData.growth);
            animateCounter(monthlyVisitors, caseData.visitors);
            animateCounter(timeframe, caseData.months);
        } else {
            growthPercentage.textContent = caseData.growth;
            monthlyVisitors.textContent = caseData.visitors;
            timeframe.textContent = caseData.months;
        }
    }

    // Counter animation function
    function animateCounter(element, targetText) {
        const duration = 1500;
        const steps = 30;
        const stepDuration = duration / steps;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            
            if (progress >= 1) {
                element.textContent = targetText;
                clearInterval(interval);
            } else {
                // For percentage values, animate the number
                if (targetText.includes('%')) {
                    const targetNum = parseInt(targetText.replace(/[^\d]/g, ''));
                    const currentNum = Math.round(targetNum * progress);
                    element.textContent = `+${currentNum}%`;
                }
                // For visitor counts, animate the number
                else if (targetText.includes(',')) {
                    const targetNum = parseInt(targetText.replace(/,/g, ''));
                    const currentNum = Math.round(targetNum * progress);
                    element.textContent = currentNum.toLocaleString();
                }
                // For months, just show the target
                else {
                    element.textContent = targetText;
                }
            }
        }, stepDuration);
    }

    // Handle case study button clicks
    caseStudyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const caseType = this.getAttribute('data-case');
            const caseData = caseStudies[caseType];
            
            if (!caseData) return;

            // Update active button
            caseStudyBtns.forEach(b => {
                b.classList.remove('active', 'bg-blue-100', 'text-blue-800', 'bg-green-100', 'text-green-800', 'bg-purple-100', 'text-purple-800');
                b.classList.add('bg-gray-100', 'text-gray-700');
            });

            // Style active button based on case type
            this.classList.remove('bg-gray-100', 'text-gray-700');
            if (caseType === 'local') {
                this.classList.add('active', 'bg-green-100', 'text-green-800');
            } else if (caseType === 'ecommerce') {
                this.classList.add('active', 'bg-blue-100', 'text-blue-800');
            } else if (caseType === 'b2b') {
                this.classList.add('active', 'bg-purple-100', 'text-purple-800');
            }

            // Update chart and metrics
            createChart(caseData);
            updateMetrics(caseData, true);
        });
    });

    // Initialize with local services data
    createChart(caseStudies.local);
    updateMetrics(caseStudies.local, false);

    // Intersection Observer for chart animation
    const chartObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && trafficChart) {
                // Trigger chart animation when section comes into view
                trafficChart.update();
            }
        });
    }, {
        threshold: 0.3
    });

    const seoSection = document.getElementById('seo-demo');
    if (seoSection) {
        chartObserver.observe(seoSection);
    }

    // Initialize rich snippets switcher
    initRichSnippetsSwitcher();

    function initRichSnippetsSwitcher() {
        const snippetBtns = document.querySelectorAll('.snippet-btn');
        const snippetExamples = document.querySelectorAll('.snippet-example');

        if (!snippetBtns.length || !snippetExamples.length) return;

        // Handle snippet button clicks
        snippetBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const snippetType = this.getAttribute('data-snippet');
                
                // Update active button
                snippetBtns.forEach(b => {
                    b.classList.remove('active', 'bg-blue-100', 'text-blue-800', 'bg-green-100', 'text-green-800', 'bg-purple-100', 'text-purple-800');
                    b.classList.add('bg-gray-100', 'text-gray-700');
                });

                // Style active button
                this.classList.remove('bg-gray-100', 'text-gray-700');
                if (snippetType === 'plumber') {
                    this.classList.add('active', 'bg-blue-100', 'text-blue-800');
                } else if (snippetType === 'cleaning') {
                    this.classList.add('active', 'bg-green-100', 'text-green-800');
                } else if (snippetType === 'webdesign') {
                    this.classList.add('active', 'bg-purple-100', 'text-purple-800');
                }

                // Hide all snippets
                snippetExamples.forEach(example => {
                    example.classList.add('hidden');
                });

                // Show selected snippet with fade effect
                const targetSnippet = document.getElementById(`${snippetType}-snippet`);
                if (targetSnippet) {
                    targetSnippet.classList.remove('hidden');
                    // Add slight fade effect
                    targetSnippet.style.opacity = '0';
                    setTimeout(() => {
                        targetSnippet.style.opacity = '1';
                    }, 50);
                }
            });
        });
    }
}

// Rating widget with expandable quick rating functionality
function initRatingWidget() {
    try {
        // Initialize display from structured data
        updateRatingDisplay();
        
        // Initialize expandable quick rating functionality
        initQuickRating();
        
    } catch (error) {
        console.error('Error initializing rating widget:', error);
    }
}

function updateRatingDisplay() {
    // Find the structured data script containing LocalBusiness data
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    let aggregateRating = null;
    
    scripts.forEach(script => {
        try {
            const data = JSON.parse(script.textContent);
            // Handle both single object and array of objects
            const items = Array.isArray(data) ? data : [data];
            
            items.forEach(item => {
                if (item['@type'] === 'LocalBusiness' && item.aggregateRating) {
                    aggregateRating = item.aggregateRating;
                }
            });
        } catch (e) {
            console.warn('Could not parse structured data:', e);
        }
    });
    
    if (!aggregateRating) {
        console.warn('No aggregate rating found in structured data');
        return;
    }
    
    const ratingValue = parseFloat(aggregateRating.ratingValue);
    const reviewCount = parseInt(aggregateRating.reviewCount);
    
    // Update rating value display
    const ratingValueElement = document.getElementById('ratingValue');
    if (ratingValueElement) {
        ratingValueElement.textContent = ratingValue.toFixed(1);
    }
    
    // Update review count display
    const reviewCountElement = document.getElementById('reviewCount');
    if (reviewCountElement) {
        reviewCountElement.textContent = `${reviewCount} reviews`;
    }
    
    // Generate stars
    generateStars(ratingValue);
}

function generateStars(rating) {
    const starsContainer = document.getElementById('starsContainer');
    if (!starsContainer) return;
    
    starsContainer.innerHTML = '';
    
    for (let i = 1; i <= 5; i++) {
        const starWrapper = document.createElement('span');
        starWrapper.className = 'relative text-xs';
        
        if (i <= Math.floor(rating)) {
            // Full star
            starWrapper.innerHTML = '<span class="text-yellow-400">★</span>';
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            // Partial star
            const percentage = Math.round((rating % 1) * 100);
            starWrapper.innerHTML = `
                <span class="text-gray-300">★</span>
                <span class="absolute inset-0 overflow-hidden text-yellow-400" style="width: ${percentage}%;">★</span>
            `;
        } else {
            // Empty star
            starWrapper.innerHTML = '<span class="text-gray-300">★</span>';
        }
        
        starsContainer.appendChild(starWrapper);
    }
}

// Initialize quick rating functionality with one-rating-per-user limitation
function initQuickRating() {
    // Check if user has already rated
    if (hasUserAlreadyRated()) {
        showAlreadyRatedState();
        return;
    }

    const widgetCollapsed = document.getElementById('ratingWidgetCollapsed');
    const quickRatingForm = document.getElementById('quickRatingForm');
    const cancelBtn = document.getElementById('cancelQuickRating');
    const submitBtn = document.getElementById('submitQuickRating');
    const quickStars = document.querySelectorAll('.quick-star');
    const quickRatingText = document.getElementById('quickRatingText');
    
    let selectedRating = 0;
    let isSubmitting = false;

    // Widget click to expand
    if (widgetCollapsed) {
        widgetCollapsed.addEventListener('click', function(e) {
            e.preventDefault();
            expandRatingWidget();
        });
    }

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            collapseRatingWidget();
        });
    }

    // Star rating functionality
    quickStars.forEach(star => {
        const rating = parseInt(star.dataset.rating);
        
        star.addEventListener('click', function() {
            selectedRating = rating;
            updateQuickStars(rating);
            updateRatingText(rating);
            enableSubmitButton();
        });
        
        star.addEventListener('mouseenter', function() {
            updateQuickStars(rating, true);
        });
    });

    // Reset stars on mouse leave
    document.getElementById('quickRatingStars').addEventListener('mouseleave', function() {
        updateQuickStars(selectedRating);
    });

    // Submit rating
    if (submitBtn) {
        submitBtn.addEventListener('click', async function() {
            if (selectedRating > 0 && !isSubmitting) {
                await submitQuickRating();
            }
        });
    }

    function hasUserAlreadyRated() {
        // Check localStorage for previous rating from this browser/device
        const hasRated = localStorage.getItem('user_has_rated_quick');
        const lastRatingTime = localStorage.getItem('last_quick_rating_time');
        
        if (hasRated && lastRatingTime) {
            // Allow re-rating after 30 days
            const daysSince = (Date.now() - parseInt(lastRatingTime)) / (1000 * 60 * 60 * 24);
            return daysSince < 30;
        }
        return false;
    }

    function markUserAsRated() {
        localStorage.setItem('user_has_rated_quick', 'true');
        localStorage.setItem('last_quick_rating_time', Date.now().toString());
    }

    function showAlreadyRatedState() {
        const widgetCollapsed = document.getElementById('ratingWidgetCollapsed');
        if (widgetCollapsed) {
            // Update click hint to show already rated
            const clickHint = widgetCollapsed.querySelector('.text-xs.text-gray-500');
            if (clickHint) {
                clickHint.textContent = 'Already rated';
                clickHint.className = 'ml-2 text-xs text-green-600';
            }
            
            // Remove click functionality
            widgetCollapsed.style.cursor = 'default';
            widgetCollapsed.onclick = null;
        }
    }

    function expandRatingWidget() {
        quickRatingForm.classList.remove('hidden');
        widgetCollapsed.style.pointerEvents = 'none';
        widgetCollapsed.style.opacity = '0.7';
    }

    function collapseRatingWidget() {
        quickRatingForm.classList.add('hidden');
        widgetCollapsed.style.pointerEvents = 'auto';
        widgetCollapsed.style.opacity = '1';
        resetQuickRating();
    }

    function resetQuickRating() {
        selectedRating = 0;
        updateQuickStars(0);
        updateRatingText(0);
        document.getElementById('quickComment').value = '';
        disableSubmitButton();
        hideQuickStatus();
    }

    function updateQuickStars(rating, isHover = false) {
        quickStars.forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#fbbf24';
            } else {
                star.style.color = isHover ? '#fed7aa' : '#d1d5db';
            }
        });
    }

    function updateRatingText(rating) {
        const texts = {
            0: 'Click a star to rate',
            1: '1/5 - Very Poor',
            2: '2/5 - Poor', 
            3: '3/5 - Average',
            4: '4/5 - Good',
            5: '5/5 - Excellent'
        };
        quickRatingText.textContent = texts[rating];
        quickRatingText.style.color = rating >= 4 ? '#059669' : rating >= 3 ? '#d97706' : rating > 0 ? '#dc2626' : '#6b7280';
    }

    function enableSubmitButton() {
        submitBtn.disabled = false;
    }

    function disableSubmitButton() {
        submitBtn.disabled = true;
    }

    async function submitQuickRating() {
        if (isSubmitting) return;
        
        isSubmitting = true;
        setQuickLoadingState(true);

        try {
            const comment = document.getElementById('quickComment').value.trim();
            
            // Generate unique user identifier for duplicate prevention
            const userFingerprint = generateUserFingerprint();
            
            // Prepare feedback data in same format as full form
            const feedbackData = {
                customer_name: 'Anonymous User',
                customer_website: 'Quick Rating',
                customer_ref: 'QUICK_' + userFingerprint + '_' + Date.now(),
                process_rating: selectedRating,
                product_rating: selectedRating,
                recommendation_rating: selectedRating,
                overall_rating: selectedRating,
                average_rating: selectedRating.toFixed(1),
                comments: comment || 'Quick rating submission from main page',
                share_permission: 'No',
                submission_date: new Date().toLocaleDateString(),
                submission_time: new Date().toLocaleTimeString(),
                page_url: window.location.href
            };

            // Send to database if available
            await saveQuickRatingToDatabase(feedbackData);
            
            // Send via EmailJS
            await sendQuickRatingViaEmail(feedbackData);

            // Mark user as having rated (prevents duplicate ratings)
            markUserAsRated();

            // Show success message
            showQuickStatus('✅ Thank you for your rating!', 'success');
            
            // Auto-close after 3 seconds and refresh ratings
            setTimeout(() => {
                collapseRatingWidget();
                showAlreadyRatedState(); // Update widget to show already rated
                
                // Trigger Rich Snippets update
                if (window.RichSnippetsFeedback) {
                    window.RichSnippetsFeedback.update();
                }
                // Update local display
                setTimeout(updateRatingDisplay, 1000);
            }, 3000);

        } catch (error) {
            console.error('Quick rating submission error:', error);
            showQuickStatus('❌ Failed to submit rating. Please try again.', 'error');
        } finally {
            isSubmitting = false;
            setQuickLoadingState(false);
        }
    }

    function generateUserFingerprint() {
        // Create a semi-persistent user identifier (not perfect but good enough)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('User fingerprint', 2, 2);
        
        const fingerprint = canvas.toDataURL() + 
            navigator.userAgent + 
            navigator.language + 
            screen.width + 'x' + screen.height +
            new Date().getTimezoneOffset();
            
        // Create hash of fingerprint
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    async function saveQuickRatingToDatabase(feedbackData) {
        // Check if database is available
        console.log('🔍 Checking database availability...');
        console.log('DATABASE_CONFIG exists:', !!window.DATABASE_CONFIG);
        console.log('DATABASE_CONFIG.enabled:', window.DATABASE_CONFIG?.enabled);
        console.log('Supabase exists:', !!window.supabase);
        
        if (window.DATABASE_CONFIG && window.DATABASE_CONFIG.enabled && window.supabase) {
            try {
                console.log('🔗 Creating Supabase client...');
                const supabaseClient = window.supabase.createClient(
                    window.DATABASE_CONFIG.supabaseUrl,
                    window.DATABASE_CONFIG.supabaseKey
                );

                console.log('📤 Inserting data to database:', feedbackData);

                const { data, error } = await supabaseClient
                    .from('feedback_submissions')
                    .insert([{
                        customer_name: feedbackData.customer_name,
                        customer_website: feedbackData.customer_website,
                        customer_ref: feedbackData.customer_ref,
                        process_rating: parseInt(feedbackData.process_rating),
                        product_rating: parseInt(feedbackData.product_rating),
                        recommendation_rating: parseInt(feedbackData.recommendation_rating),
                        overall_rating: parseInt(feedbackData.overall_rating),
                        average_rating: parseFloat(feedbackData.average_rating),
                        comments: feedbackData.comments,
                        share_permission: false,
                        submission_date: feedbackData.submission_date,
                        submission_time: feedbackData.submission_time,
                        page_url: feedbackData.page_url,
                        user_agent: navigator.userAgent
                    }]);

                if (error) {
                    console.error('❌ Supabase error details:', error);
                    throw error;
                }
                console.log('✅ Quick rating saved to database successfully:', data);
                return data;
            } catch (error) {
                console.error('❌ Database save failed with error:', error);
                // Show error to user for debugging
                showQuickStatus(`Database error: ${error.message}`, 'error');
                // Don't throw - we still want to send email
            }
        } else {
            console.warn('⚠️ Database not available - missing requirements');
            showQuickStatus('⚠️ Database unavailable - only email will be sent', 'error');
        }
    }

    async function sendQuickRatingViaEmail(feedbackData) {
        if (window.emailjs) {
            try {
                const templateParams = {
                    from_name: 'Quick Rating System',
                    from_email: 'quickrating@system.generated',
                    message: `⭐ QUICK RATING SUBMISSION ⭐

🎯 Rating: ${feedbackData.average_rating}/5 stars
💬 Comment: ${feedbackData.comments}
📅 Date: ${feedbackData.submission_date}
⏰ Time: ${feedbackData.submission_time}
🌐 Page: ${feedbackData.page_url}
🔒 User ID: ${feedbackData.customer_ref}

---
This was a quick rating submission from the main page widget.`,
                    project_type: 'Quick Rating',
                    current_website: 'Main Page Widget',
                    alt_contact: 'No',
                    social_platform: 'Quick Rating Widget',
                    social_username: feedbackData.customer_ref,
                    privacy_consent: 'Widget Submission'
                };

                await emailjs.send('service_2uq6kt8', 'template_fryqiz8', templateParams);
                console.log('✅ Quick rating email sent');
            } catch (error) {
                console.error('Email send failed:', error);
                throw error;
            }
        }
    }

    function setQuickLoadingState(loading) {
        const submitText = submitBtn.querySelector('.submit-text');
        const loadingText = submitBtn.querySelector('.loading-text');
        
        if (loading) {
            submitBtn.disabled = true;
            submitText.classList.add('hidden');
            loadingText.classList.remove('hidden');
        } else {
            submitText.classList.remove('hidden');
            loadingText.classList.add('hidden');
            if (selectedRating > 0) {
                submitBtn.disabled = false;
            }
        }
    }

    function showQuickStatus(message, type) {
        const statusEl = document.getElementById('quickRatingStatus');
        const classes = {
            'success': 'bg-green-100 text-green-800 border border-green-200',
            'error': 'bg-red-100 text-red-800 border border-red-200'
        };
        
        statusEl.textContent = message;
        statusEl.className = `text-xs text-center p-2 rounded-lg ${classes[type]}`;
        statusEl.classList.remove('hidden');
    }

    function hideQuickStatus() {
        const statusEl = document.getElementById('quickRatingStatus');
        statusEl.classList.add('hidden');
    }
}

// Active navigation highlighting functionality
function initActiveNavHighlighting() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    const mobileNavLinks = document.querySelectorAll('.mobile-menu-link[href^="#"]');
    const sections = document.querySelectorAll('section[id], main[id]');
    
    if (!navLinks.length || !sections.length) return;
    
    let currentActiveSection = '';
    
    // Function to update active nav link
    function updateActiveNavLink(activeId) {
        if (activeId === currentActiveSection) return;
        currentActiveSection = activeId;
        
        // Update desktop nav links
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const isActive = href === `#${activeId}`;
            
            // Remove active classes
            link.classList.remove('text-black', 'bg-gray-100', 'font-semibold');
            
            if (isActive) {
                // Add active styling that matches the website's design
                link.classList.add('text-black', 'bg-gray-100', 'font-semibold');
            } else {
                // Reset to default styling
                link.classList.add('text-gray-700');
            }
        });
        
        // Update mobile nav links
        mobileNavLinks.forEach(link => {
            const href = link.getAttribute('href');
            const isActive = href === `#${activeId}`;
            
            // Remove active classes
            link.classList.remove('text-black', 'font-semibold');
            
            if (isActive) {
                // Add active styling for mobile
                link.classList.add('text-black', 'font-semibold');
            } else {
                // Reset to default styling
                link.classList.add('text-gray-700');
            }
        });
    }
    
    // Function to determine which section is currently in view
    function getCurrentSection() {
        const scrollPosition = window.scrollY + window.innerHeight / 3; // Offset for better UX
        let currentSection = 'hero'; // Default to hero section
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionBottom = sectionTop + sectionHeight;
            
            // Check if scroll position is within this section
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                currentSection = section.id;
            }
        });
        
        return currentSection;
    }
    
    // Throttled scroll handler for better performance
    let scrollTimeout;
    function handleScroll() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(() => {
            const activeSection = getCurrentSection();
            updateActiveNavLink(activeSection);
        }, 50); // 50ms throttle for smooth performance
    }
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial call to set the correct active state on page load
    const initialSection = getCurrentSection();
    updateActiveNavLink(initialSection);
    
    // Handle hash changes (for direct navigation)
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            updateActiveNavLink(hash);
        }
    });
    
    // Handle smooth scrolling completion
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const targetId = this.getAttribute('href').substring(1);
            // Small delay to ensure smooth scrolling completes
            setTimeout(() => {
                updateActiveNavLink(targetId);
            }, 500);
        });
    });
    
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            const targetId = this.getAttribute('href').substring(1);
            // Small delay to ensure smooth scrolling completes
            setTimeout(() => {
                updateActiveNavLink(targetId);
            }, 500);
        });
    });
}

// Info popup functionality for rating widget
function initInfoPopup() {
    const infoButton = document.getElementById('infoButton');
    const infoModal = document.getElementById('infoModal');
    const closeModalButton = document.getElementById('closeInfoModal');
    
    if (infoButton && infoModal && closeModalButton) {
        // Open modal when info button is clicked
        infoButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent the rating widget from expanding
            infoModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
        
        // Close modal when X button is clicked
        closeModalButton.addEventListener('click', function() {
            infoModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
        
        // Close modal when clicking outside the modal content
        infoModal.addEventListener('click', function(e) {
            if (e.target === infoModal) {
                infoModal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !infoModal.classList.contains('hidden')) {
                infoModal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        });
    }
}

// Animated heading functionality
function initAnimatedHeading() {
    const heading = document.querySelector('.animated-heading');
    if (!heading) return;

    const lines = heading.querySelectorAll('.line');
    let currentIndex = 0;

    function highlightNextLine() {
        // Remove highlight from all lines
        lines.forEach(line => line.classList.remove('highlighted'));
        
        // Highlight current line
        lines[currentIndex].classList.add('highlighted');
        
        // Move to next line, cycling back to start
        currentIndex = (currentIndex + 1) % lines.length;
    }

    // Start the animation cycle
    function startAnimation() {
        highlightNextLine(); // Highlight first line immediately
        
        // Continue cycling through lines
        setInterval(highlightNextLine, 2500); // Change line every 2.5 seconds
    }

    // Start animation after a short delay for better page load experience
    setTimeout(startAnimation, 1000);
}