// Suggested language and flag based on user location

// 1) Try browser geolocation (more accurate if user allows it)
function fetchCoords() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => resolve(pos.coords),
        err => {
          console.warn("Geolocation failed:", err);
          fallbackIP().then(resolve).catch(reject);
        }
      );
    } else {
      fallbackIP().then(resolve).catch(reject);
    }
  });
}

// 2) IP‐based fallback (less accurate)
async function fallbackIP() {
  const res = await fetch("https://ipapi.co/json/");
  const data = await res.json();
  return { latitude: data.latitude, longitude: data.longitude };
}

// 3) Use the coordinates to get the country code through Nominatim engine
async function getCountryCode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const r = await fetch(url).then(r => r.json());
  // Nominatim puts country code in address.country_code (ISO 3166‑1 alpha‑2)
  return r.address.country_code.toUpperCase();
}

// 4) Use the country code to get the native languages from REST Countries API
async function getNativeLanguages(countryCode) {
  const url = `https://restcountries.com/v3.1/alpha/${countryCode}`;
  const r = await fetch(url).then(r => r.json());
  const langsObj = r[0].languages || {};
  return Object.values(langsObj);
}

// 5) Helper: convert ISO country code to emoji flag
function countryCodeToEmojiFlag(code) {
  return code
    .toUpperCase()
    .split("")
    .map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
    .map(cp => String.fromCodePoint(cp))
    .join("");
}

// 6) Main logic
document.addEventListener("DOMContentLoaded", async () => {
  // Select dropdown element
  const nativeSelect = document.querySelector('select[name="nativeLanguage"]');
  let primaryLang = null;

  try {
    // a) detect country via geolocation/IP
    const { latitude, longitude } = await fetchCoords();
    const countryCode = await getCountryCode(latitude, longitude);

    // b) display country with emoji flag
    const flagEmoji = countryCodeToEmojiFlag(countryCode);
    const flagSpan = document.getElementById("flag-emoji");
    if (flagSpan) {
      flagSpan.innerText = flagEmoji;
    }
    const locEl = document.getElementById("location");
    if (locEl) {
      locEl.textContent = `Country: ${countryCode} ${flagEmoji}`;
    }

    // c) fetch native languages, pick the first
    const langs = await getNativeLanguages(countryCode);
    primaryLang = langs[0] || null;

    // d) display primary language suggestion
    const displayEl = document.getElementById("language");
    if (displayEl) {
      displayEl.textContent = primaryLang
        ? `${primaryLang}`
        : "No language data found.";
    }
  } catch (err) {
    console.error(err);
    const displayEl = document.getElementById("language");
    if (displayEl) {
      displayEl.textContent = "Sorry—couldn’t determine your language.";
    }
  }

  // e) auto‑select only if nothing already chosen (placeholder at index 0)
  if (primaryLang && nativeSelect && nativeSelect.selectedIndex === 0) {
    const match = Array.from(nativeSelect.options)
      .find(o => o.value === primaryLang);
    if (match) nativeSelect.value = primaryLang;
  }
});
