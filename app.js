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
    nativeLanguage: Joi.string().required(),
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
    nativeLanguage: req.body.nativeLanguage
  });

  req.session.user = { name: `${req.body.firstName} ${req.body.lastName}`, email: req.body.email };
  res.redirect('/home');
});

app.get('/home', requireLogin, (req, res) => {
  res.render('home', {
    pageTitle: 'LingoLink Home',
    user: req.session.user
  });
});

// Authenticated Home Page
app.get('/home', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('home', { user: req.session.user, activeTab: 'home' });
});

// Friends Page
app.get('/friends', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  // Dummy data for now
  const friends = [
    { name: 'Alice', username: 'alice123', avatar: '/img/user1.png' },
    { name: 'Bob', username: 'bob456', avatar: '/img/user2.png' }
  ];
  res.render('friends', { friends, activeTab: 'none' });
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

