const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const letterBank = [];
const usedWords = new Set();

// Generate random letters (6 to 8)
const numLetters = Math.floor(Math.random() * 3) + 6;
for (let i = 0; i < numLetters; i++) {
  letterBank.push(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
}

document.getElementById("letter-bank").innerText = letterBank.join(" ");

// Validate and submit word
document.getElementById("submit-word").addEventListener("click", async () => {
  const inputField = document.getElementById("word-input");
  const input = inputField.value.toUpperCase();
  const feedback = document.getElementById("feedback");

  if (!input) {
    feedback.innerText = "Enter a word!";
    return;
  }

  const isValid = isWordValid(input, letterBank);
  if (!isValid) {
    feedback.innerText = "Invalid word! Use only available letters once.";
    return;
  }

  const exists = await isRealWord(input.toLowerCase());
  if (!exists) {
    feedback.innerText = "Not in dictionary!";
    inputField.classList.add("input-error");
    setTimeout(() => {
      inputField.classList.remove("input-error");
    }, 1000);
    return;
  }

  if (usedWords.has(input)) {
    feedback.innerText = "You already used this word!";
    return;
  }

  usedWords.add(input);
  document.getElementById("word-list").innerHTML += `<li class="text-success">${input}</li>`;
  feedback.innerText = "✅ Good job!";
  setTimeout(() => {
    feedback.innerText = "";
  }, 2000);
  inputField.value = "";
});

// Check if word exists in dictionary API
async function isRealWord(word, lang = "en") {
  const url = `https://${lang}.wiktionary.org/w/api.php?action=query&titles=${word}&format=json&origin=*`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    const pages = data.query.pages;
    const exists = Object.keys(pages)[0] !== "-1"; // -1 means "not found"
    return exists;
  } catch (err) {
    console.error("Wiktionary check failed:", err);
    return false;
  }
}

// Check if word uses only available letters once
function isWordValid(word, bank) {
  const bankCopy = [...bank];
  for (const letter of word) {
    const index = bankCopy.indexOf(letter);
    if (index === -1) return false;
    bankCopy.splice(index, 1);
  }
  return true;
}
