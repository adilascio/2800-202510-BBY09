// app.js (updated with login + signup + EJS rendering + validation)
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('./database');

const PORT = process.env.PORT || 8000;
const app = express();

let db, usersCollection;

// MongoDB connection
(async () => {
  try {
    const dbResult = await connectToDatabase();
    db = dbResult.db;
    usersCollection = dbResult.users;

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
})();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'temp-secret',
  resave: false,
  saveUninitialized: false
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Routes
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/home');
  res.render('index', { pageTitle: 'Welcome' });
});

app.get('/login', (req, res) => {
  res.render('login', { pageTitle: 'Log In', errorMessage: null });
});

app.post('/login', async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).render('login', {
      pageTitle: 'Log In',
      errorMessage: 'Invalid input format.'
    });
  }

  const user = await usersCollection.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).render('login', {
      pageTitle: 'Log In',
      errorMessage: 'Incorrect email or password.'
    });
  }

  req.session.user = { name: user.name, email: user.email };
  res.redirect('/home');
});

app.get('/signup', (req, res) => {
  res.render('signup', { pageTitle: 'Sign Up', errorMessage: null });
});

app.post('/signup', async (req, res) => {
  console.log('Form submitted:', req.body);

  const schema = Joi.object({
    firstName: Joi.string().max(30).required(),
    lastName: Joi.string().max(30).required(),
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(30).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).render('signup', {
      pageTitle: 'Sign Up',
      errorMessage: 'Invalid input. Please try again.'
    });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 12);
  await usersCollection.insertOne({
    name: `${req.body.firstName} ${req.body.lastName}`,
    email: req.body.email,
    password: hashedPassword,
    username: req.body.username
  });

  req.session.user = {
    name: `${req.body.firstName} ${req.body.lastName}`,
    email: req.body.email,
    username: req.body.username
  };

  req.session.showProfilePrompt = true;
  res.redirect('/home');
});


app.get('/home', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const showProfilePrompt = req.session.showProfilePrompt;
  req.session.showProfilePrompt = false;

  res.render('home', {
    pageTitle: 'LingoLink Home',
    user: req.session.user,
    activeTab: 'home',
    showProfilePrompt
  });
});


// Friends Page
app.get('/friends', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const currentUser = await usersCollection.findOne({ email: req.session.user.email });

  if (!currentUser || !currentUser.nativeLanguage || !currentUser.targetLanguage) {
    return res.render('friends', { friends: [], activeTab: 'none' });
  }

  const matches = await usersCollection.find({
    email: { $ne: currentUser.email },
    nativeLanguage: currentUser.targetLanguage,
    targetLanguage: currentUser.nativeLanguage
  }).toArray();

  const friends = matches.map(user => ({
    name: user.name,
    username: user.username,
    avatar: '/img/user1.png', // static or dynamic later
    description: `Learning ${user.targetLanguage}, Good at ${user.nativeLanguage}`
  }));

  res.render('friends', { friends, activeTab: 'none' });
});


const languages = ["Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Bengali", "Bosnian",
      "Bulgarian", "Burmese", "Catalan", "Chinese", "Croatian", "Czech", "Danish",
      "Dutch", "English", "Estonian", "Filipino", "Finnish", "French", "German", 
      "Greek", "Gujarati", "Hebrew", "Hindi", "Hungarian", "Icelandic", "Indonesian",
      "Italian", "Japanese", "Kannada", "Kazakh", "Khmer", "Korean", "Lao", "Latvian", 
      "Lithuanian", "Macedonian", "Malay", "Malayalam", "Marathi", "Mongolian", 
      "Nepali", "Norwegian", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", 
      "Romanian", "Russian", "Serbian", "Sinhala", "Slovak", "Slovenian", "Spanish", 
      "Swahili", "Swedish", "Tamil", "Telugu", "Thai", "Turkish", "Ukrainian", "Urdu", 
      "Uzbek", "Vietnamese", "Zulu"];

app.get('/profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const user = await usersCollection.findOne({ email: req.session.user.email });

  res.render('profile', { user, languages });
});


app.post('/profile', async (req, res) => {
  await usersCollection.updateOne(
    { email: req.session.user.email },
    {
      $set: {
        nativeLanguage: req.body.nativeLanguage,
        targetLanguage: req.body.targetLanguage,
        username: req.body.username
      }
    }
  );
  res.redirect('/profile?updated=true');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// 404
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Not Found' });
});
``

