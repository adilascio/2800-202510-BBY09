const chatId = chatBox.dataset.chatid;
const currentUser = chatBox.dataset.user;

let lastMessageCount = 0;

function fetchMessages() {

  fetch(`/chat/${chatId}/messages`)
    .then(res => res.json())
    .then(messages => {

      if (messages.length !== lastMessageCount) {
        lastMessageCount = messages.length;
        chatBox.innerHTML = '';

        messages.forEach(msg => {
          const div = document.createElement('div');
          div.className = 'chat-message ' + (msg.user === currentUser ? 'user' : 'friend');
          div.innerHTML = `
            <div class="msg">${msg.text}</div>
            <div class="meta">${msg.user}</div>
          `;
          chatBox.appendChild(div);
        });

        chatBox.scrollTop = chatBox.scrollHeight;
      }
    })
    .catch(err => console.error('Message fetch error:', err));
}

setInterval(fetchMessages, 2000);