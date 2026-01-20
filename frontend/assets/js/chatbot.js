/**
 * Chatbot Frontend Module
 * Handles AI-powered chat interactions for tour suggestions
 */

class Chatbot {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.conversationHistory = [];
    this.init();
  }

  init() {
    this.createChatbotHTML();
    this.bindEvents();
    this.addWelcomeMessage();
  }

  createChatbotHTML() {
    const chatbotHTML = `
      <!-- Chatbot Toggle Button -->
      <button class="chatbot-toggle" id="chatbotToggle" aria-label="Open chat">
        <i class="bi bi-chat-dots-fill icon-chat"></i>
        <i class="bi bi-x-lg icon-close"></i>
      </button>

      <!-- Chatbot Container -->
      <div class="chatbot-container" id="chatbotContainer">
        <div class="chatbot-header">
          <div class="chatbot-header-avatar">
            <i class="bi bi-robot"></i>
          </div>
          <div class="chatbot-header-info">
            <h4>TourBooking Assistant</h4>
            <p>AI-powered travel guide</p>
          </div>
        </div>

        <div class="chatbot-messages" id="chatbotMessages">
          <!-- Messages will be inserted here -->
        </div>

        <div class="quick-actions" id="quickActions">
          <button class="quick-action-btn" data-message="I want a beach vacation">🏖️ Beach</button>
          <button class="quick-action-btn" data-message="Show me adventure tours">🏔️ Adventure</button>
          <button class="quick-action-btn" data-message="Family-friendly tours">👨‍👩‍👧‍👦 Family</button>
          <button class="quick-action-btn" data-message="Cultural experiences">🏛️ Culture</button>
        </div>

        <div class="chatbot-input-area">
          <input 
            type="text" 
            class="chatbot-input" 
            id="chatbotInput" 
            placeholder="Ask me about tours..."
            autocomplete="off"
          />
          <button class="chatbot-send-btn" id="chatbotSend" aria-label="Send message">
            <i class="bi bi-send-fill"></i>
          </button>
        </div>
      </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // Cache DOM elements
    this.toggleBtn = document.getElementById('chatbotToggle');
    this.container = document.getElementById('chatbotContainer');
    this.messagesContainer = document.getElementById('chatbotMessages');
    this.input = document.getElementById('chatbotInput');
    this.sendBtn = document.getElementById('chatbotSend');
    this.quickActions = document.getElementById('quickActions');
  }

  bindEvents() {
    // Toggle chat
    this.toggleBtn.addEventListener('click', () => this.toggle());

    // Send message
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Quick actions
    this.quickActions.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-action-btn')) {
        const message = e.target.dataset.message;
        if (message) {
          this.input.value = message;
          this.sendMessage();
        }
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.toggle();
      }
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.toggleBtn.classList.toggle('active', this.isOpen);
    this.container.classList.toggle('open', this.isOpen);

    if (this.isOpen) {
      this.input.focus();
    }
  }

  addWelcomeMessage() {
    const welcomeHTML = `
      <div class="welcome-message">
        <h5>👋 Welcome to TourBooking!</h5>
        <p>I'm your AI travel assistant. Ask me anything about tours, destinations, or travel recommendations!</p>
      </div>
    `;
    this.messagesContainer.innerHTML = welcomeHTML;
  }

  addMessage(content, isUser = false) {
    // Remove welcome message if present
    const welcome = this.messagesContainer.querySelector('.welcome-message');
    if (welcome) {
      welcome.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    
    // Parse markdown-like formatting for bot messages
    if (!isUser) {
      content = this.formatMessage(content);
      messageDiv.innerHTML = content;
    } else {
      messageDiv.textContent = content;
    }

    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();

    return messageDiv;
  }

  formatMessage(text) {
    // Bold: **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text*
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Line breaks
    text = text.replace(/\n/g, '<br>');
    
    // Lists: - item or * item
    text = text.replace(/^[-*]\s+(.*)$/gm, '• $1');
    
    return text;
  }

  addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    this.messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) {
      typing.remove();
    }
  }

  addSuggestionCards(suggestions) {
    if (!suggestions || (!suggestions.tours?.length && !suggestions.destinations?.length)) {
      return;
    }

    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'tour-suggestions';

    // Add tour suggestions
    if (suggestions.tours?.length) {
      suggestions.tours.forEach(tour => {
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        card.innerHTML = `
          <h5><i class="bi bi-compass"></i> ${tour.name}</h5>
          <p>${tour.reason || 'Recommended for you'}</p>
        `;
        card.addEventListener('click', () => {
          if (tour.slug) {
            window.location.href = `/tour/details/?slug=${tour.slug}`;
          } else if (tour.id) {
            window.location.href = `/tour/details/?slug=${tour.id}`;
          }
        });
        suggestionsDiv.appendChild(card);
      });
    }

    // Add destination suggestions
    if (suggestions.destinations?.length) {
      suggestions.destinations.forEach(dest => {
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        card.innerHTML = `
          <h5><i class="bi bi-geo-alt"></i> ${dest.name}</h5>
          <p>${dest.reason || 'Popular destination'}</p>
        `;
        card.addEventListener('click', () => {
          if (dest.slug) {
            window.location.href = `/destination/details/?slug=${dest.slug}`;
          } else if (dest.id) {
            window.location.href = `/destination/details/?slug=${dest.id}`;
          }
        });
        suggestionsDiv.appendChild(card);
      });
    }

    this.messagesContainer.appendChild(suggestionsDiv);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  async sendMessage() {
    const message = this.input.value.trim();
    if (!message || this.isLoading) return;

    // Clear input
    this.input.value = '';

    // Add user message
    this.addMessage(message, true);

    // Add to history
    this.conversationHistory.push({
      role: 'user',
      content: message
    });

    // Show typing indicator
    this.isLoading = true;
    this.sendBtn.disabled = true;
    this.addTypingIndicator();

    try {
      const response = await this.callChatAPI(message);

      this.removeTypingIndicator();

      if (response.success) {
        // Add bot message
        this.addMessage(response.data.message, false);

        // Add to history
        this.conversationHistory.push({
          role: 'assistant',
          content: response.data.message
        });

        // Add suggestion cards if available
        if (response.data.suggestions) {
          this.addSuggestionCards(response.data.suggestions);
        }
      } else {
        this.addMessage('Sorry, I encountered an error. Please try again.', false);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      this.removeTypingIndicator();
      this.addMessage('Sorry, something went wrong. Please try again later.', false);
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = false;
      this.input.focus();
    }
  }

  async callChatAPI(message) {
    const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        conversationHistory: this.conversationHistory.slice(-10) // Last 10 messages
      })
    });

    return response.json();
  }

  // Clear conversation
  clearConversation() {
    this.conversationHistory = [];
    this.addWelcomeMessage();
  }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.chatbot = new Chatbot();
});
