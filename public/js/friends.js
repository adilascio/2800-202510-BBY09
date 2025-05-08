function filterFriends() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.friend-card-wrapper');

    cards.forEach(card => {
      const name = card.querySelector('.friend-name').textContent.toLowerCase();
      card.style.display = name.includes(input) ? '' : 'none';
    });
  }