// public/js/tutor.js
// Front‑end logic for Tutor AI chat (moved from inline EJS script)

document.addEventListener('DOMContentLoaded', () => {
  const chatWindow = document.getElementById('chatWindow');
  const userInput  = document.getElementById('userInput');
  const sendBtn    = document.getElementById('sendBtn');

  /**
   * Append a message bubble to the chat window.
   * @param {string} text - The HTML/text content to show.
   * @param {'user'|'bot'} sender - Who sent the message.
   */
  function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('my-2', 'p-2', 'rounded');
    if (sender === 'user') {
      msgDiv.classList.add('bg-primary', 'text-white', 'ms-auto');
    } else {
      msgDiv.classList.add('bg-light', 'text-dark', 'me-auto');
    }
    msgDiv.innerHTML = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  /**
   * Send the user message to the AI endpoint and display the reply.
   */
  async function sendMessage() {
    // Capture and clear user input
    const msg = userInput.value.trim();
    if (!msg) return;
    userInput.value = '';

    // Show user bubble
    appendMessage(msg, 'user');
    // Show temporary typing indicator
    appendMessage('<em>Typing...</em>', 'bot');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || `Status ${res.status}`);
      }
      const reply = json.reply || 'Sorry, I didn’t get a response.';

      // Remove typing indicator
      const last = chatWindow.lastChild;
      if (last && last.innerHTML.includes('Typing')) last.remove();
      // Append bot reply
      appendMessage(reply, 'bot');
    } catch (err) {
      // Remove typing indicator
      const last = chatWindow.lastChild;
      if (last && last.innerHTML.includes('Typing')) last.remove();
      appendMessage('⚠️ ' + err.message, 'bot');
      console.error('API error details:', err);
    }
  }

  // Bind events
  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
});
