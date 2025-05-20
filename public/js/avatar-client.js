document.addEventListener('DOMContentLoaded', () => {
  const showBtn    = document.getElementById('generateIconBtn');
  const avatarImg  = document.getElementById('avatarDisplay');
  const previewImg = document.getElementById('profilePreview');

  showBtn.addEventListener('click', async () => {
    const { value: prompt } = await Swal.fire({
      title: 'Describe Your Avatar',
      input: 'text',
      inputPlaceholder: 'e.g. smiling cartoon fox with glasses',
      background: '#fff url(/images/trees.png)',
      backdrop: `
        rgba(0,0,123,0.4)
        url("/images/nyan-cat.gif")
        left top
        no-repeat
      `,
      confirmButtonText: 'Generate Icon',
      showCancelButton: true,
      inputAttributes: {
        autocapitalize: 'off'
      }
    });

    if (!prompt) return;

    Swal.fire({
      title: 'Generating...',
      text: 'Your icon is being generated. Please wait!',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const res = await fetch('/api/avatar/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const { seed, backgroundColor, hairColor, accessoriesProbability } = await res.json();

      const params = new URLSearchParams({
        seed,
        backgroundColor,
        hairColor,
        accessoriesProbability: String(accessoriesProbability)
      });

      const url = `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;

      // Update both profile preview and avatar display
      avatarImg.src = url;
      previewImg.src = url;

      Swal.fire({
        title: 'Avatar Created!',
        imageUrl: url,
        imageAlt: 'Your generated avatar',
        confirmButtonText: 'Use This'
      });
    } catch (err) {
      console.error('Avatar generation failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong generating your avatar!'
      });
    }
  });
});



