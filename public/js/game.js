const letterBank = [];
const usedWords = new Set();

const alphabets = {
  en: {
    vowels: "AEIOU",
    consonants: "BCDFGHJKLMNPQRSTVWXYZ"
  },
  fr: {
    vowels: "AÀÂÄÆEÈÉÊËIÎÏOÔŒUÙÛÜYŸ",
    consonants: "BCDFGHJKLMNPQRSTVWXZ"
  },
  es: {
    vowels: "AÁEÉIÍOÓUÚÜ",
    consonants: "BCDFGHJKLMNÑPQRSTVWXYZ"
  },
  de: {
    vowels: "AÄEËIÏOÖUÜ",
    consonants: "BCDFGHJKLMNPQRSTVWXYZß"
  },
  it: {
    vowels: "AÀÈÉIÌÍOÒÓUÙÚ",
    consonants: "BCDFGHJKLMNPQRSTVZ"
  },
  ja: {
    vowels: "AIUEO", 
    consonants: "KSTNHMYRW"
  }
};

const frequencies = {
  en: {
    vowels: { A: 8, E: 13, I: 7, O: 8, U: 3 },
    consonants: {
      B: 2, C: 3, D: 4, F: 2, G: 2, H: 6, J: 1,
      K: 1, L: 4, M: 2, N: 7, P: 2, Q: 1, R: 6,
      S: 6, T: 9, V: 1, W: 2, X: 1, Y: 2, Z: 1
    }
  },

  fr: {
    vowels: { A: 7, Â: 1, Ä: 1, Æ: 1, E: 14, È: 2, É: 3, Ê: 2, Ë: 1, I: 7, Î: 1, Ï: 1, O: 5, Ô: 1, Œ: 1, U: 6, Ù: 1, Û: 1, Ü: 1, Y: 1, Ÿ: 1 },
    consonants: {
      B: 1, C: 3, D: 3, F: 1, G: 1, H: 1, J: 1, K: 0.5, L: 5, M: 3, N: 7, P: 3,
      Q: 1, R: 7, S: 7, T: 6, V: 2, W: 0.5, X: 0.5, Z: 1
    }
  },

  es: {
    vowels: { A: 12, Á: 2, E: 13, É: 2, I: 7, Í: 1, O: 9, Ó: 1, U: 6, Ú: 1, Ü: 0.5 },
    consonants: {
      B: 2, C: 4, D: 5, F: 1, G: 2, H: 1, J: 1, K: 0.5, L: 4, M: 3, N: 7, Ñ: 1.5,
      P: 2, Q: 1, R: 7, S: 8, T: 5, V: 1, W: 0.5, X: 0.5, Y: 1.5, Z: 1
    }
  },

  de: {
    vowels: { A: 6, Ä: 2, E: 17, I: 8, O: 3, Ö: 1, U: 4, Ü: 1 },
    consonants: {
      B: 2, C: 2, D: 5, F: 2, G: 3, H: 5, J: 1, K: 1.5, L: 3, M: 2.5, N: 10,
      P: 1, Q: 0.5, R: 7, S: 7, T: 6, V: 1, W: 2, X: 0.5, Y: 0.5, Z: 2, ß: 1
    }
  },

  it: {
    vowels: { A: 12, E: 11, È: 1, É: 1, I: 10, Ì: 0.5, Í: 0.5, O: 10, Ò: 0.5, Ó: 0.5, U: 4, Ù: 0.5, Ú: 0.5 },
    consonants: {
      B: 1, C: 4, D: 3, F: 1, G: 2, H: 0.5, L: 4, M: 2.5, N: 7, P: 3,
      Q: 1, R: 6, S: 7, T: 6, V: 2, Z: 1
    }
  },

  ja: {
    vowels: { A: 5, I: 5, U: 5, E: 5, O: 5 },
    consonants: {
      K: 4, S: 4, T: 4, N: 5, H: 3, M: 3, Y: 3, R: 4, W: 2
    }
  }
};

function weightedRandom(freqMap) {
  const pool = [];

  for (const [char, weight] of Object.entries(freqMap)) {
    pool.push(...Array(Math.round(weight * 10)).fill(char));
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// Restore previously played words (if user already played today)
if (window.usedWordsFromServer && Array.isArray(window.usedWordsFromServer)) {
  window.usedWordsFromServer.forEach(word => {
    if (!usedWords.has(word)) {
      usedWords.add(word);
      const wordList = document.getElementById("word-list");
      if (wordList) {
        wordList.innerHTML += `<li class="text-success">${word}</li>`;
      }
    }
  });
}

letterBank.push(...generateLetters());
document.getElementById("letter-bank").innerText = letterBank.join(" ");

function generateLetters() {
  const selectedLang = document.getElementById("language-select").value;
  const langFreq = frequencies[selectedLang] || frequencies.en;

  const numVowels = Math.floor(Math.random() * 3) + 2;
  const numConsonants = Math.floor(Math.random() * 4) + 4;

  const newLetters = [];

  for (let i = 0; i < numVowels; i++) {
    newLetters.push(weightedRandom(langFreq.vowels));
  }

  for (let i = 0; i < numConsonants; i++) {
    newLetters.push(weightedRandom(langFreq.consonants));
  }

  return newLetters.sort(() => 0.5 - Math.random());
}


// Validate and submit word
document.getElementById("submit-word").addEventListener("click", async () => {
  const inputField = document.getElementById("word-input");
  const input = inputField.value.toUpperCase();
  const feedback = document.getElementById("feedback");

  if (!input) {
    feedback.innerText = "Enter a word!";
    return;
  }

  if (input.length <= 3) {
    feedback.innerText = "Word must be at least 4 letters.";
    return;
  }

  const isValid = isWordValid(input, letterBank);
  if (!isValid) {
    feedback.innerText = "Invalid word! Use only available letters once.";
    return;
  }

  const selectedLang = document.getElementById("language-select").value;
  const exists = await isRealWord(input.toLowerCase(), selectedLang);
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

  // Save result to server (persist the day's game progress)
  fetch('/played-today', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
    result: Array.from(usedWords)
  })
});
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
    return Object.keys(pages)[0] !== "-1"; // -1 means "not found"
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


// Trigger reset on language change
document.getElementById("language-select").addEventListener("change", () => {
  resetGame();
});

// Reset game and regenerate letter bank
function resetGame() {
  usedWords.clear();
  document.getElementById("word-list").innerHTML = "";
  document.getElementById("feedback").innerText = "";
  document.getElementById("word-input").value = "";

  letterBank.length = 0;
  letterBank.push(...generateLetters());
  document.getElementById("letter-bank").innerText = letterBank.join(" ");
}

