
document.addEventListener("DOMContentLoaded", () => {
    const languages = [
        "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Bengali", "Bosnian",
        "Bulgarian", "Burmese", "Catalan", "Chinese", "Croatian", "Czech", "Danish",
        "Dutch", "English", "Estonian", "Filipino", "Finnish", "French", "German", 
        "Greek", "Gujarati", "Hebrew", "Hindi", "Hungarian", "Icelandic", "Indonesian",
        "Italian", "Japanese", "Kannada", "Kazakh", "Khmer", "Korean", "Lao", "Latvian", 
        "Lithuanian", "Macedonian", "Malay", "Malayalam", "Marathi", "Mongolian", 
        "Nepali", "Norwegian", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", 
        "Romanian", "Russian", "Serbian", "Sinhala", "Slovak", "Slovenian", "Spanish", 
        "Swahili", "Swedish", "Tamil", "Telugu", "Thai", "Turkish", "Ukrainian", "Urdu", 
        "Uzbek", "Vietnamese", "Zulu"
    ];

    const select = document.getElementById('autoSizingSelect');
    if (!select) return; // Make sure element exists

    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        select.appendChild(option);
    });
});
