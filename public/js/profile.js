// function getCoords() {
//   return new Promise((resolve) => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         pos => resolve(pos.coords),
//         () => {
//           fetch("https://ipapi.co/json/")
//             .then(r => r.json())
//             .then(data => resolve({ latitude: data.latitude, longitude: data.longitude }))
//             .catch(() => resolve({ latitude: 0, longitude: 0 }));
//         }
//       );
//     } else {
//       resolve({ latitude: 0, longitude: 0 });
//     }
//   });
// }

// function getCountry(lat, lon) {
//   return fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
//     .then(r => r.json())
//     .then(data => data.address.country_code.toUpperCase());
// }

// function getLanguages(code) {
//   return fetch(`https://restcountries.com/v3.1/alpha/${code}`)
//     .then(r => r.json())
//     .then(data => Object.values(data[0].languages || {}));
// }

// function flagFromCode(code) {
//   return code.split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
// }

// // document.addEventListener("DOMContentLoaded", () => {
// //   const nativeSelect = document.querySelector('select[name="nativeLanguage"]');

// //   getCoords().then(coords => {
// //     const { latitude, longitude } = coords;

// //     // Set hidden fields
// //     document.getElementById("lat").value = latitude;
// //     document.getElementById("lng").value = longitude;

// //     // Show map if element exists
// //     const mapEl = document.getElementById("map");
// //     if (mapEl && mapEl.dataset.lat && mapEl.dataset.lng) {
// //       const lat = parseFloat(mapEl.dataset.lat);
// //       const lng = parseFloat(mapEl.dataset.lng);
// //       const map = L.map('map').setView([lat, lng], 10);
// //       L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
// //         attribution: '© OpenStreetMap contributors'
// //       }).addTo(map);
// //       L.marker([lat, lng]).addTo(map).bindPopup("You are here").openPopup();
// //     }

// //     // Country and language
// //     getCountry(latitude, longitude)
// //       .then(code => {
// //         const flag = flagFromCode(code);
// //         document.getElementById("flag-emoji").textContent = flag;
// //         document.getElementById("location").textContent = `Country: ${code} ${flag}`;
// //         return getLanguages(code);
// //       })
// //       .then(langs => {
// //         const lang = langs[0];
// //         if (lang && nativeSelect && nativeSelect.selectedIndex === 0) {
// //           const match = Array.from(nativeSelect.options).find(o => o.value === lang);
// //           if (match) nativeSelect.value = lang;
// //         }
// //       })
// //       .catch(() => {
// //         document.getElementById("location").textContent = "Could not detect country.";
// //       });
// //   });

// //   // Flatpickr
// //   flatpickr("#birthdateInput", {
// //     dateFormat: "Y-m-d",
// //     maxDate: "today"
// //   });

// //   // SweetAlert on update
// //   const params = new URLSearchParams(window.location.search);
// //   if (params.get("updated") === "true") {
// //     Swal.fire({
// //       title: "Do you want to save the changes?",
// //       showDenyButton: true,
// //       showCancelButton: true,
// //       confirmButtonText: "Save",
// //       denyButtonText: "Don't save"
// //     }).then(result => {
// //       if (result.isConfirmed) {
// //         Swal.fire("Saved!", "", "success");
// //       } else if (result.isDenied) {
// //         Swal.fire("Changes are not saved", "", "info");
// //       }
// //     });
// //   }
// // });

// document.addEventListener("DOMContentLoaded", () => {
//   const latInput = document.getElementById("lat");
//   const lngInput = document.getElementById("lng");
//   const mapEl = document.getElementById("map");
//   const flagSpan = document.getElementById("flag-emoji");
//   const locText = document.getElementById("location");

//   // Ask for location via SweetAlert
//   Swal.fire({
//     title: 'Enable Location?',
//     text: 'Allow LingoLink to use your current location for the map.',
//     icon: 'question',
//     showCancelButton: true,
//     confirmButtonText: 'Yes, enable',
//     cancelButtonText: 'No'
//   }).then(result => {
//     if (result.isConfirmed && navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(async pos => {
//         const lat = pos.coords.latitude;
//         const lng = pos.coords.longitude;

//         // Fill hidden form inputs
//         latInput.value = lat;
//         lngInput.value = lng;

//         // Render map
//         if (mapEl) {
//           const map = L.map(mapEl).setView([lat, lng], 10);
//           L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//             attribution: '© OpenStreetMap contributors'
//           }).addTo(map);
//           L.marker([lat, lng]).addTo(map).bindPopup("You are here").openPopup();
//         }

//         // Get country + emoji
//         const countryRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
//         const countryData = await countryRes.json();
//         const code = (countryData.address.country_code || 'US').toUpperCase();
//         const emoji = code.split('').map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
//         if (flagSpan) flagSpan.textContent = emoji;
//         if (locText) locText.textContent = `Country: ${code} ${emoji}`;

//       }, err => {
//         Swal.fire("Location access denied", "We couldn't fetch your location.", "warning");
//       });
//     } else {
//       Swal.fire("Location disabled", "Map may be blank unless a location is saved.", "info");
//     }
//   });

//   // Flatpickr
//   if (window.flatpickr) {
//     flatpickr("#birthdateInput", {
//       dateFormat: "Y-m-d",
//       maxDate: "today"
//     });
//   }

//   // SweetAlert after profile update
//   const params = new URLSearchParams(window.location.search);
//   if (params.get("updated") === "true") {
//     Swal.fire({
//       title: "Profile saved",
//       text: "Your profile was successfully updated.",
//       icon: "success"
//     });
//   }
// });

// async function getCoords() {
//   return new Promise((resolve) => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         pos => resolve(pos.coords),
//         () => {
//           fetch("https://ipapi.co/json/")
//             .then(r => r.json())
//             .then(data => resolve({ latitude: data.latitude, longitude: data.longitude }))
//             .catch(() => resolve({ latitude: 0, longitude: 0 }));
//         }
//       );
//     } else {
//       resolve({ latitude: 0, longitude: 0 });
//     }
//   });
// }

// function getCountry(lat, lon) {
//   return fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
//     .then(r => r.json())
//     .then(data => data.address.country_code.toUpperCase());
// }

// function getLanguages(code) {
//   return fetch(`https://restcountries.com/v3.1/alpha/${code}`)
//     .then(r => r.json())
//     .then(data => Object.values(data[0].languages || {}));
// }

// function flagFromCode(code) {
//   return code.split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
// }

// document.addEventListener("DOMContentLoaded", () => {
//   const nativeSelect = document.querySelector('select[name="nativeLanguage"]');

//   getCoords().then(async coords => {
//     const { latitude, longitude } = coords;

//     // Set hidden fields for form submission
//     document.getElementById("lat").value = latitude;
//     document.getElementById("lng").value = longitude;

//     // Map rendering (live on location detect)
//     const mapEl = document.getElementById("map");
//     if (mapEl) {
//       const map = L.map("map").setView([latitude, longitude], 10);
//       L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         attribution: '© OpenStreetMap contributors'
//       }).addTo(map);
//       L.marker([latitude, longitude]).addTo(map).bindPopup("You are here").openPopup();
//     }

//     // Flag and location label
//     const code = await getCountry(latitude, longitude);
//     const flag = flagFromCode(code);
//     document.getElementById("flag-emoji").textContent = flag;
//     document.getElementById("location").textContent = `Country: ${code} ${flag}`;

//     // Suggest native language
//     const langs = await getLanguages(code);
//     const primaryLang = langs[0];
//     if (primaryLang && nativeSelect && nativeSelect.selectedIndex === 0) {
//       const match = Array.from(nativeSelect.options).find(o => o.value === primaryLang);
//       if (match) nativeSelect.value = primaryLang;
//     }
//   });

//   flatpickr("#birthdateInput", {
//     dateFormat: "Y-m-d",
//     maxDate: "today"
//   });

//   const params = new URLSearchParams(window.location.search);
//   if (params.get("updated") === "true") {
//     Swal.fire({
//       title: "Do you want to save the changes?",
//       showDenyButton: true,
//       showCancelButton: true,
//       confirmButtonText: "Save",
//       denyButtonText: "Don't save"
//     }).then(result => {
//       if (result.isConfirmed) {
//         Swal.fire("Saved!", "", "success");
//       } else if (result.isDenied) {
//         Swal.fire("Changes are not saved", "", "info");
//       }
//     });
//   }
// });


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

document.getElementById("avatarPromptInput").addEventListener("change", async function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    Swal.fire({
      title: "Your uploaded picture",
      imageUrl: e.target.result,
      imageAlt: "The uploaded picture",
      confirmButtonText: "Looks good!"
    });
  };
  reader.readAsDataURL(file);
});

function previewImage(event) {
  const reader = new FileReader();
  reader.onload = function () {
    document.getElementById('profilePreview').src = reader.result;
  };
  reader.readAsDataURL(event.target.files[0]);
}

// Show the prompt field when "Generate Icon" is clicked
  document.getElementById('generateIconBtn')
    .addEventListener('click', () => {
      document
        .getElementById('generatePromptContainer')
        .style.display = 'block';
    });

// Send the prompt → get seed → render DiceBear
  createBtn.addEventListener('click', async () => {
    const userPrompt = promptInput.value.trim();
    if (!userPrompt) {
      return alert('Please describe your avatar.');
    }

    createBtn.disabled   = true;
    createBtn.textContent = 'Generating…';

    try {
      const res = await fetch('/api/avatar/describe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt: userPrompt })
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);

      const { seed } = await res.json();
      // Build a DiceBear URL (using avataaars as an example)
      avatarImg.src = `https://api.dicebear.com/9.x/avataaars/${encodeURIComponent(seed)}.svg`;
    } catch (err) {
      console.error('Avatar error:', err);
      alert('Failed to generate avatar. Check console for details.');
    } finally {
      createBtn.disabled   = false;
      createBtn.textContent = 'Create Icon';
    }
  });
