
  let debounceTimeout;
  const searchInput = document.getElementById('searchInput');
  const form = searchInput.closest('form');

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      form.submit();
    }, 300); // adjust delay as needed
  });

