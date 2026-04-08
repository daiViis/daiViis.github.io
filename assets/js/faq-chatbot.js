// FAQ Chatbot with Google Gemini AI Integration
class FAQChatbot {
    constructor() {
        // API configuration now handled by ApiHelper
        // Remove hardcoded keys - they are now in api-config.js for fallback
        this.conversationHistory = [];
        this.isTyping = false;
        this.currentLanguage = 'en'; // Default to English
        this.storageKey = 'faq_chatbot_conversation';
        this.connectionStatus = 'checking'; // checking, online, offline
        
        // Initialize chatbot analytics
        this.analytics = null;
        this.initializeChatbotAnalytics();
        this.projectContext = '';
        this.projectContextPromise = null;
        
        // FAQ Bot System Prompt
        this.baseSystemPrompt = `# Web Design Services FAQ Bot

## Identity and Role

You are an intelligent FAQ assistant for David Cit's Web Design and Development Services. Your primary role is to answer user questions about web design services, pricing, project processes, technical capabilities, and the live portfolio projects currently shown on the website.

## Communication Guidelines  

- Respond in the language requested by the user
- If user asks to switch language or writes in another language, switch to that language
- Use a friendly and professional tone
- KEEP RESPONSES SHORT AND DIRECT - maximum 2-3 sentences
- Be concise and to the point
- If unsure about specific details, acknowledge uncertainty and suggest contacting David only when conversation seems to be ending or for complex inquiries
- Focus on being helpful and solution-oriented
- When users ask about current projects or portfolio work, rely on the live project context appended below
- Always clarify when discussing costs that ongoing hosting, domains, and third-party services are paid separately by client

## Core Business Information

**Service Provider:** David Cit - Web Developer & Digital Creator
**Location:** Ostrava, Czech Republic (serves clients globally)
**Specializations:** Modern web development, SEO optimization, responsive design, AI-powered development tools
**Contact:** david.cit1999@gmail.com

## Service Packages and Pricing

### Website Development Services

**Landing Page Package - Starting at $585**
- Professional single-page design
- Responsive for all devices  
- Contact form integration
- Basic SEO optimization
- 60-day bug guarantee
- 5 days delivery
*Note: Pricing can be adjusted based on project complexity - simpler projects may cost less*

**Presentation Website - $1,170-$1,755** (Most Popular)
- 2-4 pages presentation
- Multiple sections & navigation
- Image gallery capabilities
- Advanced SEO optimization
- Contact forms & business info
- Max 20 days delivery
*Fully customized to meet your specific business needs and requirements*

**Corporate Website - $1,950-$3,510**
- 5-10 pages enterprise solution
- Complete business presentation
- About, services, products pages
- Blog/news capabilities (optional)
- Advanced SEO & social media integration
- Custom timeline
*Completely tailored solution designed around your business goals and requirements*

**Specialized Packages:**
- **Blog Package - Starting at $685:** Landing page + CMS system with article management, categories/tags, RSS feed
- **Portfolio Package - Starting at $655:** Landing page + CMS with project management, gallery system, lightbox viewing
*All packages are fully customized - final pricing depends on specific features and complexity needed*

### What's Included in Every Package
- Initial consultation and planning
- Professional custom design tailored to your brand
- Responsive development (mobile-optimized)
- Complete hosting setup (hosting costs paid separately by client)
- SEO optimization and search engine friendly code
- Security configuration
- Performance optimization
- 60-day post-launch guarantee for bug fixes
*Every project is fully customized to match your specific requirements and business goals*

### Pricing Philosophy
All listed prices are starting points. David believes in fair, transparent pricing that reflects the actual work required. For extremely simple projects or specific requirements that need less complexity, prices can be adjusted accordingly. Each project receives a custom quote based on your exact needs and specifications.

### Important Cost Clarifications
- Hosting setup is included, but ongoing hosting costs are paid separately by the client
- Domain registration fees are separate if needed
- Third-party service fees (payment processors, email services, etc.) are client responsibility
- Package prices cover development and setup only

### Development Approach & Technology
- Modern AI-powered development tools (Claude AI, Cursor, GitHub)
- Advanced technology stack: HTML5, React, TypeScript, Tailwind CSS
- Backend capabilities: Node.js, Python, PHP
- Database integration: MySQL, MongoDB, PostgreSQL
- DevOps: Git, Docker, AWS
- AI & ML integration capabilities

### SEO & Performance Optimization
- Research-backed SEO strategies showing average 172% organic traffic growth
- Rich snippets implementation for enhanced search visibility
- Local business optimization with structured data
- Performance monitoring and optimization
- Advanced schema markup for better search results

## Common FAQ Responses

### Project Process & Timeline
**Q: How long does a typical project take?**
A: Simple websites: 1-2 weeks. Complex platforms: 4-8 weeks. Enterprise solutions: 8-16 weeks.

**Q: What makes your development approach different?**  
A: Modern AI-powered development tools combined with proven expertise for faster, higher quality results.

**Q: Do you provide ongoing support?**
A: Yes, comprehensive post-launch support including maintenance, security updates, and performance monitoring.

### SEO & Results
**Q: How long does it take to see SEO results?**
A: SEO results typically become visible within 6-12 months. Average organic traffic growth is 172% within 12 months.

**Q: Do you work with businesses outside Czech Republic?**
A: Yes, I provide services globally with remote delivery and full project management.

### Technical Capabilities  
**Q: What technologies do you use?**
A: Modern stack: HTML5, React, TypeScript, Tailwind CSS, Node.js, Python, PHP, and databases like MySQL, MongoDB, PostgreSQL.

**Q: Can you integrate with existing systems?**
A: Yes, I can integrate with existing CRM systems, databases, and business tools plus custom API connections.

### Portfolio & Work Examples
**Q: Can I see your portfolio or previous work?**
A: Yes. Use the live project context appended below to summarize the current public projects, their descriptions, tags, and available links.

## Live Project Rules

- A live project list from the same API as the Projects section will be appended below this prompt
- Treat that live project list as the source of truth for all currently featured projects
- If a user asks about a specific listed project, answer from that live data
- If a project is not present in the live project list, say it is not currently listed on the site instead of inventing details

## When You Don't Know the Answer

If a user asks something outside your knowledge scope:
1. ALWAYS answer in a way that demonstrates David's professional expertise and capabilities
2. Connect the unknown topic to David's services when possible
3. Frame responses to show how David's professional approach would handle such questions
4. Only suggest contacting David directly for complex inquiries or when the conversation seems to be concluding: "David's professional experience in web development means he can provide detailed insights on this."
5. Never simply say "I don't know" - always position David as the expert who can help
6. Avoid mentioning email contact unless it's a complex inquiry or conversation is ending

Examples of professional responses to unknown questions:
- "That's a great technical question that requires David's specific expertise. His experience with modern development stacks and AI-powered tools means he can provide the most accurate guidance."
- "While I don't have those specific details, David's comprehensive approach to web development typically covers all aspects of [topic]."
- "That's exactly the type of strategic question David excels at answering through his professional consultation process."

## Response Limitations

- Only answer questions related to David Cit's web design and development services
- Don't provide technical support beyond general FAQ information  
- Don't promise features or services not explicitly mentioned
- For complex technical issues, redirect to direct contact with David
- Stay focused on the services, pricing, and processes

Keep responses conversational and helpful. Focus on the user's specific needs while providing relevant information from the context above.

## Language Adaptation
When user requests to switch language or writes in any language, adapt and respond in that language. You can communicate in multiple languages including but not limited to:
- English
- Czech (Čeština)
- Spanish (Español)
- French (Français)
- German (Deutsch)
- Italian (Italiano)
- Polish (Polski)
- Slovak (Slovenčina)
- Russian (Русский)
And others as needed

Always maintain professionalism and accuracy regardless of the language used.`;

        this.init();
        this.projectContextPromise = this.loadProjectContext();
        this.testConnection();
    }

    parseMarkdown(text) {
        // Simple markdown parser for common formatting
        let html = text
            // Handle code blocks first (prevent interference with other formatting)
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Handle bold and italic
            .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
            .replace(/__(.+?)__/g, '<strong>$1</strong>')
            .replace(/_(.+?)_/g, '<em>$1</em>')
            // Handle strikethrough
            .replace(/~~(.+?)~~/g, '<del>$1</del>')
            // Handle links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
            // Handle line breaks
            .replace(/\n/g, '<br>');

        return html;
    }

    initializeChatbotAnalytics() {
        try {
            if (window.ChatbotAnalytics) {
                this.analytics = new window.ChatbotAnalytics();
                this.analytics.setupPageUnloadTracking();
                console.log('Chatbot analytics initialized');
            }
        } catch (error) {
            console.warn('Failed to initialize chatbot analytics:', error);
        }
    }

    init() {
        this.loadConversationHistory();
        this.attachEventListeners();
        this.addMarkdownStyles();
    }

    async loadProjectContext() {
        if (!window.ProjectDataAPI) {
            return '';
        }

        try {
            const projects = await window.ProjectDataAPI.fetchProjects();
            this.projectContext = window.ProjectDataAPI.buildPromptContext(projects);
            return this.projectContext;
        } catch (error) {
            console.warn('Failed to load live project context for chatbot:', error);
            this.projectContext = '## Live Portfolio Projects\nLive project data could not be loaded from the shared projects API.';
            return this.projectContext;
        }
    }

    async getSystemPrompt() {
        if (this.projectContextPromise) {
            await this.projectContextPromise;
        }

        return [this.baseSystemPrompt, this.projectContext]
            .filter(Boolean)
            .join('\n\n');
    }

    getWelcomeMessage() {
        return "Hi! I'm here to help with David's web design and development services, pricing, timelines, and the current projects listed on this page.";
    }

    addMarkdownStyles() {
        // Add CSS styles for markdown elements in chat messages
        const style = document.createElement('style');
        style.textContent = `
            .message-content code {
                background: #f3f4f6;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
                color: #374151;
                border: 1px solid #e5e7eb;
            }
            .message-content pre {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 12px;
                margin: 8px 0;
                overflow-x: auto;
                font-family: 'Courier New', monospace;
            }
            .message-content pre code {
                background: transparent;
                border: none;
                padding: 0;
                font-size: 0.875em;
                color: #1f2937;
            }
            .message-content strong {
                font-weight: 600;
                color: #1f2937;
            }
            .message-content em {
                font-style: italic;
                color: #4b5563;
            }
            .message-content del {
                text-decoration: line-through;
                color: #6b7280;
            }
            .message-content a {
                color: #2563eb;
                text-decoration: underline;
            }
            .message-content a:hover {
                color: #1d4ed8;
                text-decoration: none;
            }
        `;
        document.head.appendChild(style);
    }

    attachEventListeners() {
        const sendBtn = document.getElementById('chat-send-btn');
        const chatInput = document.getElementById('chat-input');
        const resetBtn = document.getElementById('chat-reset-btn');
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleSendMessage());
        }
        
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.handleChatReset());
        }
    }

    async handleSendMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        
        if (!message || this.isTyping) return;
        
        // Track user message
        if (this.analytics) {
            await this.analytics.trackMessage('user', message, message.length);
        }
        
        // Clear input and add user message
        chatInput.value = '';
        this.addMessageToChat('user', message);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await this.sendToGemini(message);
            this.hideTypingIndicator();
            
            // Connection successful - update status if it was offline
            if (this.connectionStatus === 'offline') {
                this.connectionStatus = 'online';
                this.updateConnectionStatus('online');
                console.log('✅ Chatbot connection restored');
            }
            
            // Track assistant response
            if (this.analytics) {
                await this.analytics.trackMessage('assistant', response, response.length);
            }
            
            this.addMessageToChat('assistant', response);
        } catch (error) {
            console.error('Chatbot API Error:', error);
            this.hideTypingIndicator();
            
            // Update connection status to offline on error
            this.connectionStatus = 'offline';
            this.updateConnectionStatus('offline');
            
            const errorMessage = "I'm sorry, I'm having trouble connecting right now. Please try again later or contact David directly at david.cit1999@gmail.com for immediate assistance.";
            
            // Track specific error type
            if (this.analytics) {
                // Determine error type based on the error
                let errorType = 'api_error';
                let errorCode = null;
                
                if (error.message?.includes('fetch') || error.name === 'TypeError') {
                    errorType = 'network_error';
                } else if (error.message?.includes('API key') || error.message?.includes('403')) {
                    errorType = 'auth_error';
                } else if (error.message?.includes('quota') || error.message?.includes('limit') || error.message?.includes('429')) {
                    errorType = 'quota_error';
                } else if (error.message?.includes('timeout')) {
                    errorType = 'timeout_error';
                } else if (error.status) {
                    errorType = 'http_error';
                    errorCode = error.status.toString();
                }
                
                // Track the error event
                await this.analytics.trackError(errorType, error.message || 'Unknown API error', errorCode);
                
                // Track the error response message with error info
                const errorInfo = {
                    type: errorType,
                    message: error.message || 'API request failed',
                    code: errorCode
                };
                await this.analytics.trackMessage('assistant', errorMessage, errorMessage.length, errorInfo);
            }
            
            this.addMessageToChat('assistant', errorMessage);
        }
    }

    async sendToGemini(userMessage) {
        // Use the secure ApiHelper instead of direct API calls
        const systemPrompt = await this.getSystemPrompt();
        const fullMessage = `${systemPrompt}\n\nUser: ${userMessage}\nAssistant:`;
        
        try {
            const data = await ApiHelper.callChatbot(fullMessage, this.conversationHistory);
            
            // Validate response structure more thoroughly
            if (data && data.candidates && 
                data.candidates[0] && 
                data.candidates[0].content && 
                data.candidates[0].content.parts && 
                data.candidates[0].content.parts[0] && 
                typeof data.candidates[0].content.parts[0].text === 'string') {
                return data.candidates[0].content.parts[0].text;
            } else {
                console.error('Invalid API response structure:', data);
                throw new Error('Invalid API response structure - missing text content');
            }
        } catch (error) {
            console.error('Secure API call failed:', error);
            
            // Mark connection as offline when API calls fail
            if (this.connectionStatus === 'online') {
                this.connectionStatus = 'offline';
                this.updateConnectionStatus('offline');
                console.log('❌ Connection status updated to offline due to API failure');
            }
            
            throw error;
        }
    }

    // Test connection to API endpoints with proper validation
    async testConnection() {
        try {
            this.updateConnectionStatus('checking');
            
            // Test with the actual system prompt to simulate real usage
            const systemPrompt = await this.getSystemPrompt();
            const testMessage = `${systemPrompt}\n\nUser: test\nAssistant:`;
            const response = await ApiHelper.callChatbot(testMessage, []);
            
            // Validate the response structure to ensure it's working properly
            if (response && response.candidates && 
                response.candidates[0] && 
                response.candidates[0].content && 
                response.candidates[0].content.parts && 
                response.candidates[0].content.parts[0] && 
                response.candidates[0].content.parts[0].text) {
                
                this.connectionStatus = 'online';
                this.updateConnectionStatus('online');
                console.log('✅ Chatbot connection: Online - Response validated successfully');
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error) {
            this.connectionStatus = 'offline';
            this.updateConnectionStatus('offline');
            console.error('❌ Chatbot connection test failed:', error.message);
            console.error('Full error details:', error);
        }
    }

    // Update the visual connection status indicator
    updateConnectionStatus(status) {
        const statusDot = document.querySelector('.w-2.h-2.rounded-full');
        const statusText = document.querySelector('.text-xs.md\\:text-sm.text-gray-600, .text-sm.text-gray-600');
        const statusContainer = statusDot?.parentElement;
        
        if (!statusDot || !statusText || !statusContainer) return;

        // Remove existing click handlers
        statusContainer.replaceWith(statusContainer.cloneNode(true));
        const newStatusContainer = document.querySelector('.flex.items-center.space-x-2');
        const newStatusDot = newStatusContainer?.querySelector('.w-2.h-2.rounded-full');
        const newStatusText = newStatusContainer?.querySelector('.text-xs, .text-sm');

        if (!newStatusDot || !newStatusText) return;

        switch (status) {
            case 'checking':
                newStatusDot.className = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
                newStatusText.textContent = 'AI Assistant Connecting...';
                newStatusText.className = newStatusText.className.replace(/text-\w+-600/, 'text-yellow-600');
                newStatusContainer.className = 'flex items-center space-x-2';
                newStatusContainer.style.cursor = 'default';
                break;
            case 'online':
                newStatusDot.className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
                newStatusText.textContent = 'AI Assistant Online';
                newStatusText.className = newStatusText.className.replace(/text-\w+-600/, 'text-gray-600');
                newStatusContainer.className = 'flex items-center space-x-2';
                newStatusContainer.style.cursor = 'default';
                break;
            case 'offline':
                newStatusDot.className = 'w-2 h-2 bg-red-500 rounded-full';
                newStatusText.textContent = 'AI Assistant Offline (Click to retry)';
                newStatusText.className = newStatusText.className.replace(/text-\w+-600/, 'text-red-600');
                newStatusContainer.className = 'flex items-center space-x-2 cursor-pointer hover:opacity-75';
                newStatusContainer.style.cursor = 'pointer';
                
                // Add click handler for retry
                newStatusContainer.addEventListener('click', () => {
                    this.retryConnection();
                });
                break;
        }
    }

    // Retry connection (can be called manually)
    async retryConnection() {
        console.log('🔄 Retrying connection...');
        await this.testConnection();
    }

    addMessageToChat(sender, message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = this.parseMarkdown(message);
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.innerHTML = `
            <svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;
        copyButton.title = 'Copy message';
        copyButton.onclick = () => this.copyToClipboard(message, copyButton);
        
        messageWrapper.appendChild(messageContent);
        messageWrapper.appendChild(copyButton);
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageDiv.appendChild(messageWrapper);
        messageDiv.appendChild(timestamp);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Store in conversation history
        this.conversationHistory.push({sender, message, timestamp: new Date()});
        this.saveConversationHistory();
    }

    showTypingIndicator() {
        this.isTyping = true;
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message assistant-message typing';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            // Show copied feedback
            const originalHTML = button.innerHTML;
            button.innerHTML = `
                <svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
            `;
            button.style.color = '#10b981';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    }

    saveConversationHistory() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.error('Failed to save conversation history:', error);
        }
    }

    loadConversationHistory() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.conversationHistory = JSON.parse(stored);
                this.displayStoredMessages();
            }
        } catch (error) {
            console.error('Failed to load conversation history:', error);
        }
    }

    displayStoredMessages() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages || this.conversationHistory.length === 0) return;

        this.conversationHistory.forEach(msg => {
            this.displayMessage(msg.sender, msg.message, new Date(msg.timestamp));
        });

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    displayMessage(sender, message, timestamp) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = this.parseMarkdown(message);
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.innerHTML = `
            <svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;
        copyButton.title = 'Copy message';
        copyButton.onclick = () => this.copyToClipboard(message, copyButton);
        
        messageWrapper.appendChild(messageContent);
        messageWrapper.appendChild(copyButton);
        
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'message-timestamp';
        timestampDiv.textContent = timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageDiv.appendChild(messageWrapper);
        messageDiv.appendChild(timestampDiv);
        chatMessages.appendChild(messageDiv);
    }

    async handleChatReset() {
        // Track chat reset
        if (this.analytics) {
            await this.analytics.trackChatReset();
        }
        
        this.clearConversationHistory();
        this.showResetConfirmation();
        // Show welcome message after reset
        setTimeout(() => {
            this.addMessageToChat('assistant', this.getWelcomeMessage());
        }, 1500);
    }

    showResetConfirmation() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const resetDiv = document.createElement('div');
        resetDiv.className = 'reset-notification';
        resetDiv.innerHTML = `
            <div class="flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 rounded-lg text-sm text-gray-600 border border-gray-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="1,4 1,10 7,10"></polyline>
                    <path d="M3.51,15a9,9 0 1,0,2.13-9.36L1,10"></path>
                </svg>
                <span>Chat conversation has been reset</span>
            </div>
        `;
        
        chatMessages.appendChild(resetDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    clearConversationHistory() {
        try {
            localStorage.removeItem(this.storageKey);
            this.conversationHistory = [];
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = '';
            }
        } catch (error) {
            console.error('Failed to clear conversation history:', error);
        }
    }

    // Initialize welcome message
    showWelcomeMessage() {
        // Only show welcome if no previous conversation exists
        if (this.conversationHistory.length === 0) {
            setTimeout(() => {
                this.addMessageToChat('assistant', this.getWelcomeMessage());
            }, 1000);
        }
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if chat elements exist
    if (document.getElementById('chat-messages')) {
        const chatbot = new FAQChatbot();
        chatbot.showWelcomeMessage();
    }
});

// Utility functions for backward compatibility
function toggleFaq(faqNumber) {
    // Fallback function if static FAQ is still present
    const content = document.getElementById(`faq-content-${faqNumber}`);
    const icon = document.getElementById(`faq-icon-${faqNumber}`);
    
    if (content && icon) {
        if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
            icon.textContent = '-';
        } else {
            content.style.display = 'none';
            icon.textContent = '+';
        }
    }
}
