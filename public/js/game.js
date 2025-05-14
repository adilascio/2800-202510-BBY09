// const letterBank = [];
// const usedWords = new Set();

// const alphabets = {
//   en: {
//     vowels: "AEIOU",
//     consonants: "BCDFGHJKLMNPQRSTVWXYZ"
//   },
//   fr: {
//     vowels: "AEIOUY",
//     consonants: "BCDFGHJKLMNPQRSTVWXZ"
//   },
//   es: {
//     vowels: "AEIOU",
//     consonants: "BCDFGHJKLMNÑPQRSTVWXYZ"
//   },
//   de: {
//     vowels: "AEIOU", // optionally add ÄÖÜ
//     consonants: "BCDFGHJKLMNPQRSTVWXYZ" // optionally add ß
//   },
//   it: {
//     vowels: "AEIOU",
//     consonants: "BCDFGHJKLMNPQRSTVZ"
//   },
//   ja: {
//     vowels: "AIUEO", // use Romaji set
//     consonants: "KSTNHMYRW" // simple subset of Japanese sounds in Romaji
//   }
// };


// // Random number of vowels (2–4)
// const numVowels = Math.floor(Math.random() * 3) + 2;

// // Random number of consonants (4–7)
// const numConsonants = Math.floor(Math.random() * 4) + 4;

// // Add vowels
// for (let i = 0; i < numVowels; i++) {
//   const vowel = VOWELS[Math.floor(Math.random() * VOWELS.length)];
//   letterBank.push(vowel);
// }

// // Add consonants
// for (let i = 0; i < numConsonants; i++) {
//   const consonant = CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
//   letterBank.push(consonant);
// }

// // Shuffle letters (optional but nice)
// letterBank.sort(() => 0.5 - Math.random());

// // Display on screen
// document.getElementById("letter-bank").innerText = letterBank.join(" ");

// // Validate and submit word
// document.getElementById("submit-word").addEventListener("click", async () => {
//   const inputField = document.getElementById("word-input");
//   const input = inputField.value.toUpperCase();
//   const feedback = document.getElementById("feedback");

//   if (!input) {
//     feedback.innerText = "Enter a word!";
//     return;
//   }

//     if (input.length <= 3) {
//         feedback.innerText = "Word must be at least 3 letters.";
//         return;
//     }

//   const isValid = isWordValid(input, letterBank);
//   if (!isValid) {
//     feedback.innerText = "Invalid word! Use only available letters once.";
//     return;
//   }

//   const selectedLang = document.getElementById("language-select").value;
//   const exists = await isRealWord(input.toLowerCase(), selectedLang);
//   if (!exists) {
//     feedback.innerText = "Not in dictionary!";
//     inputField.classList.add("input-error");
//     setTimeout(() => {
//       inputField.classList.remove("input-error");
//     }, 1000);
//     return;
//   }

//   if (usedWords.has(input)) {
//     feedback.innerText = "You already used this word!";
//     return;
//   }

//   usedWords.add(input);
//   document.getElementById("word-list").innerHTML += `<li class="text-success">${input}</li>`;
//   feedback.innerText = "✅ Good job!";
//   setTimeout(() => {
//     feedback.innerText = "";
//   }, 2000);
//   inputField.value = "";
// });

// // Check if word exists in dictionary API
// async function isRealWord(word, lang = "en") {
//   const url = `https://${lang}.wiktionary.org/w/api.php?action=query&titles=${word}&format=json&origin=*`;

//   try {
//     const res = await fetch(url);
//     const data = await res.json();
    
//     const pages = data.query.pages;
//     const exists = Object.keys(pages)[0] !== "-1"; // -1 means "not found"
//     return exists;
//   } catch (err) {
//     console.error("Wiktionary check failed:", err);
//     return false;
//   }
// }

// // Check if word uses only available letters once
// function isWordValid(word, bank) {
//   const bankCopy = [...bank];
//   for (const letter of word) {
//     const index = bankCopy.indexOf(letter);
//     if (index === -1) return false;
//     bankCopy.splice(index, 1);
//   }
//   return true;
// }

// document.getElementById("language-select").addEventListener("change", () => {
//   resetGame();
// });

// function resetGame() {
//   // Clear existing data
//   usedWords.clear();
//   document.getElementById("word-list").innerHTML = "";
//   document.getElementById("feedback").innerText = "";
//   document.getElementById("word-input").value = "";

//   // Rebuild new letter bank
//   letterBank.length = 0;

//   const numVowels = Math.floor(Math.random() * 3) + 2;
//   const numConsonants = Math.floor(Math.random() * 4) + 4;

//   for (let i = 0; i < numVowels; i++) {
//     const vowel = VOWELS[Math.floor(Math.random() * VOWELS.length)];
//     letterBank.push(vowel);
//   }

//   for (let i = 0; i < numConsonants; i++) {
//     const consonant = CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
//     letterBank.push(consonant);
//   }

//   letterBank.sort(() => 0.5 - Math.random());
//   document.getElementById("letter-bank").innerText = letterBank.join(" ");
// }

const letterBank = [];
const usedWords = new Set();

const alphabets = {
  en: {
    vowels: "AEIOU",
    consonants: "BCDFGHJKLMNPQRSTVWXYZ"
  },
  fr: {
    vowels: "AEIOUY",
    consonants: "BCDFGHJKLMNPQRSTVWXZ"
  },
  es: {
    vowels: "AEIOU",
    consonants: "BCDFGHJKLMNÑPQRSTVWXYZ"
  },
  de: {
    vowels: "AEIOU", // optionally add ÄÖÜ
    consonants: "BCDFGHJKLMNPQRSTVWXYZ" // optionally add ß
  },
  it: {
    vowels: "AEIOU",
    consonants: "BCDFGHJKLMNPQRSTVZ"
  },
  ja: {
    vowels: "AIUEO", // Romaji form
    consonants: "KSTNHMYRW"
  }
};

letterBank.push(...generateLetters());
document.getElementById("letter-bank").innerText = letterBank.join(" ");

function generateLetters() {
  const selectedLang = document.getElementById("language-select").value;
  const { vowels, consonants } = alphabets[selectedLang] || alphabets.en;

  const numVowels = Math.floor(Math.random() * 3) + 2;
  const numConsonants = Math.floor(Math.random() * 4) + 4;

  const newLetters = [];

  for (let i = 0; i < numVowels; i++) {
    newLetters.push(vowels[Math.floor(Math.random() * vowels.length)]);
  }

  for (let i = 0; i < numConsonants; i++) {
    newLetters.push(consonants[Math.floor(Math.random() * consonants.length)]);
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

