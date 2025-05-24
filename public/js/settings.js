document.addEventListener("DOMContentLoaded", () => {
    const deleteButton = document.getElementById('deleteAccountBtn');
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        Swal.fire({
          title: 'Are you absolutely sure?',
          text: 'This action will permanently delete your account. This cannot be undone!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Yes, delete it!',
          cancelButtonText: 'Cancel',
          customClass: {
            popup: 'swal2-glow-popup'
          }
        }).then(result => {
          if (result.isConfirmed) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/delete-account';
            document.body.appendChild(form);
            form.submit();
          }
        });
      });
    }
  });
  