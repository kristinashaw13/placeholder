async function sendMessage() {
    const input = document.getElementById('message');
    const chatbox = document.getElementById('chatbox');
    const message = input.value.trim();
    if (!message) return;
  
    // Display user message
    chatbox.innerHTML += `<p><b>You:</b> ${message}</p>`;
    input.value = '';
  
    // Call backend
    try {
      const response = await fetch('http://PLACEHOLDER', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
      chatbox.innerHTML += `<p><b>Bot:</b> ${data.reply}</p>`;
    } catch (error) {
      chatbox.innerHTML += `<p><b>Bot:</b> Oops, something went wrong!</p>`;
    }
    chatbox.scrollTop = chatbox.scrollHeight; 
  }

  document.getElementById('message').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
