function filterFriends() {
  const input = document.getElementById('searchInput').value.toLowerCase();
  const cards = document.querySelectorAll('.friend-card-wrapper');

  cards.forEach(card => {
    const name = card.querySelector('h6').textContent.toLowerCase();
    const username = card.querySelector('small').textContent.toLowerCase();
    card.style.display = name.includes(input) || username.includes(input) ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Hook up live search
  document.getElementById('searchInput')?.addEventListener('input', filterFriends);

  // Handle Add/Cancel request toggle
  document.querySelectorAll('.send-request-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = form.getAttribute('data-username');
      const button = form.querySelector('button');

      const isRequested = button.classList.contains('requested');
      const endpoint = isRequested ? '/cancel-request' : '/send-request';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ targetUsername: username })
        });

        if (res.ok) {
          if (isRequested) {
            // If cancelling request
            button.classList.remove('btn-secondary', 'requested');
            button.classList.add('btn-outline-dark');
            button.innerHTML = '<i class="bi bi-person-plus-fill me-1"></i>Add';
          } else {
            // If sending request
            Swal.fire({
              icon: 'success',
              title: 'Request Sent',
              text: `You sent a request to ${username}`,
              timer: 1500,
              showConfirmButton: false
            });

            button.classList.remove('btn-outline-dark');
            button.classList.add('btn-secondary', 'requested');
            button.innerHTML = '<i class="bi bi-clock me-1"></i>Requested';
          }
        } else {
          Swal.fire('Error', 'Action failed', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        Swal.fire('Error', 'Network error', 'error');
      }
    });
  });
});
