function getCoords() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => resolve(pos.coords),
        () => {
          fetch("https://ipapi.co/json/")
            .then(r => r.json())
            .then(data => resolve({ latitude: data.latitude, longitude: data.longitude }))
            .catch(() => resolve({ latitude: 0, longitude: 0 }));
        }
      );
    } else {
      resolve({ latitude: 0, longitude: 0 });
    }
  });
}

function getCountry(lat, lon) {
  return fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
    .then(r => r.json())
    .then(data => data.address.country_code.toUpperCase());
}

function getLanguages(code) {
  return fetch(`https://restcountries.com/v3.1/alpha/${code}`)
    .then(r => r.json())
    .then(data => Object.values(data[0].languages || {}));
}

function flagFromCode(code) {
  return code.split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}

document.addEventListener("DOMContentLoaded", () => {
  const latInput = document.getElementById("lat");
  const lngInput = document.getElementById("lng");
  const mapEl = document.getElementById("map");
  const flagSpan = document.getElementById("flag-emoji");
  const locText = document.getElementById("location");
  const nativeSelect = document.querySelector('select[name="nativeLanguage"]');

  const alreadyHasCoords = latInput?.value && lngInput?.value;

  if (!alreadyHasCoords) {
    Swal.fire({
      title: 'Enable Location?',
      text: 'Allow LingoLink to access your current location for the map and country/language suggestions.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, enable',
      cancelButtonText: 'No'
    }).then(async result => {

      if (result.isConfirmed) {
        const { latitude, longitude } = await getCoords();

        // Fill hidden inputs
        if (latInput) latInput.value = latitude;
        if (lngInput) lngInput.value = longitude;

        // Render map
        if (mapEl) {
          const map = L.map(mapEl).setView([latitude, longitude], 10);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          L.marker([latitude, longitude]).addTo(map).bindPopup("You are here").openPopup();
        }

        // Get country and language
        try {
          const countryCode = await getCountry(latitude, longitude);
          const flag = flagFromCode(countryCode);

          if (flagSpan) flagSpan.textContent = flag;
          if (locText) locText.textContent = `Country: ${countryCode} ${flag}`;

          const langs = await getLanguages(countryCode);
          const suggested = langs[0];
          if (suggested && nativeSelect && nativeSelect.selectedIndex === 0) {
            const match = Array.from(nativeSelect.options).find(o => o.value === suggested);
            if (match) nativeSelect.value = suggested;
          }

        } catch (e) {
          console.warn("Could not detect country/language:", e);
        }
      }})
      
  } if (alreadyHasCoords && mapEl) {
    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);

    const map = L.map(mapEl).setView([lat, lng], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    L.marker([lat, lng]).addTo(map).bindPopup("You are here").openPopup();

    getCountry(lat, lng).then(code => {
      const flag = flagFromCode(code);
      if (flagSpan) flagSpan.textContent = flag;
      if (locText) locText.textContent = `Country: ${code} ${flag}`;
    }).catch(() => {
      console.warn("Flag/country fallback failed");
    });
  }

  // Flatpickr always
  if (window.flatpickr) {
    flatpickr("#birthdateInput", {
      dateFormat: "Y-m-d",
      maxDate: "today"
    });
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("updated") === "true") {
    Swal.fire({
      title: "Do you want to save the changes?",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Save",
      denyButtonText: "Don't save"
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire("Saved!", "", "success");
      } else if (result.isDenied) {
        Swal.fire("Changes are not saved", "", "info");
      }
    });
  }
});