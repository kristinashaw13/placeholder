console.log('chatbot.js loaded');

const BACKEND_URL = 'http://localhost:5000/chat';

document.addEventListener('DOMContentLoaded', () => {
  const chatbotContainer = document.getElementById('chatbot-container');
  const chatbox = document.getElementById('chatbox');
  const messageInput = document.getElementById('message');
  const sendButton = document.getElementById('send-chatbot-message');
  const toggleButton = document.getElementById('chatbot-toggle');

  if (!chatbotContainer || !chatbox || !messageInput || !sendButton || !toggleButton) {
    console.error('Missing chatbot DOM elements:', {
      chatbotContainer: !!chatbotContainer,
      chatbox: !!chatbox,
      messageInput: !!messageInput,
      sendButton: !!sendButton,
      toggleButton: !!toggleButton
    });
    return;
  }

  toggleButton.addEventListener('click', () => {
    const isVisible = chatbotContainer.style.display === 'block';
    chatbotContainer.style.display = isVisible ? 'none' : 'block';
    toggleButton.textContent = isVisible ? '💬 Chat' : '❌ Close';
  });

  async function sendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    appendMessage('You', userMessage);
    messageInput.value = '';

    try {
      console.log('Sending request to backend:', { userMessage, url: BACKEND_URL });
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage })
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Backend response data:', data);
      const botResponse = data.reply || 'Sorry, I couldn’t process that.';
      appendMessage('Bot', botResponse);
    } catch (error) {
      console.error('Chatbot error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      appendMessage('Bot', `Oops! Something went wrong: ${error.message}. Try again later.`);
    }
  }

  function appendMessage(sender, text) {
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
});
