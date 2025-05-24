```markdown
# 🌍 LingoLink – Real Conversations for Real Fluency

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white&style=flat)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white&style=flat)
![EJS](https://img.shields.io/badge/EJS-232F3E?logoColor=white&style=flat)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black&style=flat)

---

## 📚 Table of Contents

1. [Project Description](#project-description)  
2. [Technologies Used](#technologies-used)  
3. [File Structure](#file-structure)  
4. [Installation Instructions](#installation-instructions)  
5. [How to Use the Product](#how-to-use-the-product)  
6. [Testing and Development](#testing-and-development)  
7. [AI and API Usage](#ai-and-api-usage)  
8. [Contributors](#contributors)  
9. [References & Acknowledgments](#references--acknowledgments)  
10. [Future Work](#future-work)  
11. [License](#license)  
12. [Contact](#contact)

---

## 🧠 Project Description

**LingoLink** is a web app that connects language learners with native speakers using real-time messaging, mini-games, and an AI tutor. Designed for fun and fluency, it’s like a modern-day pen pal — but smarter and immersive.

Built with Node.js, MongoDB, and EJS, LingoLink makes language learning social, visual, and culturally rich.

---

## 🛠️ Technologies Used

**Frontend:**
- HTML5 / CSS3
- JavaScript
- EJS Templates

**Backend:**
- Node.js
- Express.js

**Database:**
- MongoDB

**Other Tools:**
- dotenv
- AJAX
- ffmpeg (for animations)
- DiceBear API (avatar rendering)
- Microsoft Phi-4 (AI Tutor)
- Trello, GitHub
- Sweet Alerts (for alert messages)

---

## 📁 File Structure

```

2800-202510-BBY09/
├── public/
│   ├── css/
│   ├── img/
│   ├── js/
│   └── svgs/
├── uploads/
│   └── vid/
├── views/
│   └── templates/
├── .env
├── app.js
├── aiAvatar.js
├── database.js
├── ProjectDataBaseERD.drawio
└── README.md

````

---

## ⚙️ Installation Instructions

### Requirements
- Node.js (v16+)
- MongoDB
- Code editor (e.g., VS Code)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/adilascio/2800-202510-BBY09.git
   cd lingolink
````

2. **Install dependencies**

   ```bash
   npm install
   npm install sweetalert2
   ```

3. **Create a `.env` file**

   ```env
   MONGO_URI=your_mongodb_connection_string
   DB_NAME=your_databse_key
   HF_API_TOKEN=your_huggingface_api_token_here
   PORT=8000
   ```

4. **Start the app**

   ```bash
   node app.js
   ```

5. **Visit in browser**

   ```
   http://localhost:8000
   ```

> ⚠️ Admin credentials are in `passwords.txt` (submitted via D2L, not in repo).

---

## 🚀 How to Use the Product

### 👤 User Experience

* Sign up and build a passport-style profile
* Upload a photo and set your language goals
* Match with other learners or locals
* Chat in real-time with translation prompts
* Play daily games to earn streaks and points

### 🤖 AI Tutor

* Ask grammar or vocabulary questions
* Practice safe one-on-one AI conversation
* Get quick explanations and translations

---

## 🧪 Testing and Development

* Agile sprints planned in Trello
* GitHub project boards for workflow
* Git tags and SMART commit messages
* Testing plan uploaded separately

---

## 🤖 AI and API Usage

* **Microsoft Phi-4 API**: AI tutor for conversation help
* **DiceBear API**: Avatar rendering
* **AJAX & ffmpeg**: Async content & video animation
* (Future) Optional OpenAI integration

---

## 👥 Contributors

* **Kevin Tran** – Backend & Games
* **Sehaj Gill** –  user profiles & user flows
* **Jaden Zhang** – UX & frontend
* **Asher Drybrough** – Chat feature & testing
* **Andre Di Lascio** – Visual assets & AI features

---

## 🙌 References & Acknowledgments

* [freeCodeCamp - How to Write a Good README](https://www.freecodecamp.org/news/how-to-write-a-good-readme-file/)
* [Awesome README Gallery](https://github.com/matiassingers/awesome-readme)
* BCIT CST 2800 – User-Centered Design

---

## 🚧 Future Work

- Add support for voice and video chat for deeper conversation practice.
- Expand AI Tutor capabilities using larger LLMs like GPT-4 for more natural dialogue.
- Introduce more gamification (badges, challenges, leaderboard).
- **Improve matching system** by connecting users not just by language, but also by **dialect** and **accent preferences** (e.g., Canadian French vs. Parisian French, or Southern US English vs. British English).
- **Refine pairing algorithm** to go beyond "target/native language" matching by considering cultural familiarity, regional slang, and pronunciation goals.
- Add more mobile-first layouts and offline caching for global use on limited networks.

---

## 📄 License

This project is licensed under the **MIT License**.
See the `LICENSE` file for full details.

---

## 📬 Contact

**Team BBY09 – BCIT 2025**
Email: [lingolinkbby09@gmail.com](mailto:lingolinkbby09@gmail.com)
GitHub: [github.com/adilascio](https://github.com/adilascio)

---

```
