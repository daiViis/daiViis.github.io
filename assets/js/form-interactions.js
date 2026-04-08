// Form Interactions and Contact Functionality

// Alternative contact fields toggle
document.getElementById('alt-contact').addEventListener('change', function() {
    const altContactFields = document.getElementById('alt-contact-fields');
    const socialPlatform = document.getElementById('social_platform');
    const socialUsername = document.getElementById('social_username');
    
    if (this.checked) {
        altContactFields.classList.remove('hidden');
        socialPlatform.required = true;
        socialUsername.required = true;
    } else {
        altContactFields.classList.add('hidden');
        socialPlatform.required = false;
        socialUsername.required = false;
        socialPlatform.value = '';
        socialUsername.value = '';
    }
});

// Preselect project type function
function preselectProject(projectType) {
    // Scroll to contact form
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    
    // Wait for scroll to complete, then select the project type and update heading
    setTimeout(() => {
        const projectTypeSelect = document.getElementById('project_type');
        const formHeading = document.getElementById('form-heading');
        
        // Update project type selection
        projectTypeSelect.value = projectType;
        
        // Update form heading based on project type
        updateFormHeading(projectType);
        
        // Add a slight highlight effect to show it was selected
        projectTypeSelect.style.borderColor = '#3b82f6';
        projectTypeSelect.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
            projectTypeSelect.style.borderColor = '';
            projectTypeSelect.style.boxShadow = '';
        }, 2000);
    }, 800);
}

// Update form heading based on project type
function updateFormHeading(projectType) {
    const formHeading = document.getElementById('form-heading');
    
    switch(projectType) {
        case 'Landing Page':
            formHeading.textContent = "Let's discuss your Landing Page";
            break;
        case 'Presentation Website':
            formHeading.textContent = "Let's discuss your Presentation Website";
            break;
        case 'Corporate Website':
            formHeading.textContent = "Let's discuss your Corporate Website";
            break;
        case 'Blog Package':
            formHeading.textContent = "Let's discuss your Blog Package";
            break;
        case 'Portfolio Package':
            formHeading.textContent = "Let's discuss your Portfolio Package";
            break;
        case 'Full Stack Application':
            formHeading.textContent = "Let's discuss your Full Stack Application";
            break;
        case 'Other':
            formHeading.textContent = "Let's discuss your project";
            break;
        default:
            formHeading.textContent = "Let's discuss your project";
    }
}

// Add event listener to project type dropdown for manual changes
document.addEventListener('DOMContentLoaded', function() {
    const projectTypeSelect = document.getElementById('project_type');
    projectTypeSelect.addEventListener('change', function() {
        updateFormHeading(this.value);
    });
});

// Copy email to clipboard function
function copyEmail() {
    const email = 'david.cit1999@gmail.com';
    navigator.clipboard.writeText(email).then(function() {
        // Show success feedback
        const successMsg = document.getElementById('copySuccess');
        successMsg.style.opacity = '1';
        
        // Hide after 2 seconds
        setTimeout(function() {
            successMsg.style.opacity = '0';
        }, 2000);
    }).catch(function(err) {
        console.error('Failed to copy email: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = email;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const successMsg = document.getElementById('copySuccess');
            successMsg.style.opacity = '1';
            setTimeout(function() {
                successMsg.style.opacity = '0';
            }, 2000);
        } catch (err) {
            console.error('Fallback copy failed: ', err);
        }
        document.body.removeChild(textArea);
    });
}

// FAQ Toggle Function
function toggleFaq(faqNumber) {
    const content = document.getElementById(`faq-content-${faqNumber}`);
    const icon = document.getElementById(`faq-icon-${faqNumber}`);
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.textContent = '−';
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('hidden');
        icon.textContent = '+';
        icon.style.transform = 'rotate(0deg)';
    }
}

// Chat Functionality
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatPlaceholder = document.getElementById('chatPlaceholder');

    function addMessage(message, isUser = false) {
        if (chatPlaceholder && chatPlaceholder.style.display !== 'none') {
            chatPlaceholder.style.display = 'none';
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `mb-3 ${isUser ? 'text-right' : 'text-left'}`;
        
        const messageBubble = document.createElement('div');
        messageBubble.className = `inline-block max-w-[80%] px-4 py-2 rounded-lg ${
            isUser 
                ? 'bg-black text-white' 
                : 'bg-white border border-gray-200 text-gray-900'
        }`;
        messageBubble.textContent = message;
        
        messageDiv.appendChild(messageBubble);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, true);
        chatInput.value = '';

        // Simulate typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'text-left mb-3';
        typingDiv.innerHTML = '<div class="inline-block bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-500"><em>David is typing...</em></div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Simulate response after 2 seconds
        setTimeout(() => {
            typingDiv.remove();
            addMessage("Thanks for your question! I'll get back to you within 24 hours with a detailed response. In the meantime, feel free to check out the contact form above for urgent inquiries.", false);
        }, 2000);
    }

    sendChatBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});