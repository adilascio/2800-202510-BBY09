document.addEventListener('DOMContentLoaded', () => {
  const showBtn          = document.getElementById('generateIconBtn');
  const promptContainer  = document.getElementById('generatePromptContainer');
  const promptInput      = document.getElementById('avatarPromptInput');
  const createBtn        = document.getElementById('createIconBtn');
  const avatarImg        = document.getElementById('avatarDisplay');

  // show the input when “Generate Icon” is clicked
  showBtn.addEventListener('click', () => {
    promptContainer.style.display = 'block';
    promptInput.focus();
  });

  
  createBtn.addEventListener('click', async () => {
    const userPrompt = promptInput.value.trim();
    if (!userPrompt) return alert('Please describe your avatar.');

    createBtn.disabled    = true;
    createBtn.textContent = 'Generating…';

    try {
      // 1) Get the JSON seed+options from your describe endpoint
      const res = await fetch('/api/avatar/describe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt: userPrompt })
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const { seed, backgroundColor, hairColor, accessoriesProbability } = await res.json();

      // 2) Build the DiceBear URL with all those parameters
      const params = new URLSearchParams({
        seed,
        backgroundColor,
        hairColor,
        accessoriesProbability: String(accessoriesProbability)
      });
      const url = `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;

      // 3) Swap in the new avatar
      avatarImg.src = url;
    } catch (err) {
      console.error('Avatar error:', err);
      alert('Could not generate avatar. See console.');
    } finally {
      createBtn.disabled    = false;
      createBtn.textContent = 'Create Icon';
    }
  });
});

