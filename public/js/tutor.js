// public/js/tutor.js
// Front‑end logic for Tutor AI chat (moved from inline EJS script)

document.addEventListener('DOMContentLoaded', () => {
  // 1) Welcome messages per tutor
  const welcomeMsgs = {
    english: 'Hello! I’m your English tutor. Let’s practice!',
    spanish: '¡Hola! I’m your Spanish tutor. ¡Empecemos!',
    french:  'Bonjour ! I’m your French tutor. Allons‑y !'
  };

  // 2) UI elements
  const chatWindow   = document.getElementById('chatWindow');
  const userInput    = document.getElementById('userInput');
  const sendBtn      = document.getElementById('sendBtn');
  const tutorSelect  = document.getElementById('tutorSelect');

  // 3) Handle tutor switching: persist and reload to fetch new history
  tutorSelect.addEventListener('change', async () => {
    const newTutor = tutorSelect.value;
    await fetch('/api/tutor/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tutor: newTutor })
    });
    // reload page to get the new history and welcome
    window.location.reload();
  });

  // 4) Replay existing chat history or show initial welcome
  if (Array.isArray(window.CHAT_HISTORY) && window.CHAT_HISTORY.length > 0) {
    window.CHAT_HISTORY.forEach(turn => {
      appendMessage(
        turn.content,
        turn.role === 'assistant' ? 'bot' : 'user'
      );
    });
  } else {
    // No prior history => show welcome message
    const selected = tutorSelect.value;
    appendMessage(welcomeMsgs[selected], 'bot');
  }

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
    const msg = userInput.value.trim();
    if (!msg) return;
    userInput.value = '';

    appendMessage(msg, 'user');
    appendMessage('<em>Typing...</em>', 'bot');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Status ${res.status}`);
      const reply = json.reply || 'Sorry, I didn’t get a response.';

      // remove typing indicator
      const last = chatWindow.lastChild;
      if (last && last.innerHTML.includes('Typing')) last.remove();

      appendMessage(reply, 'bot');
    } catch (err) {
      const last = chatWindow.lastChild;
      if (last && last.innerHTML.includes('Typing')) last.remove();
      appendMessage('⚠️ ' + err.message, 'bot');
      console.error('API error details:', err);
    }
  }

  // 5) Bind events
  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
});
