require('dotenv').config(); // Load .env first

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const { registerUser, loginUser } = require('./auth');
const { connectToDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 8000;

require('dotenv').config();
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
  secret: process.env.NODE_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Setup EJS + public
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./auth.js');
app.use('/', authRoutes);

// Middleware: Parse form data
app.use(express.urlencoded({ extended: true }));

// Middleware: Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Session middleware (secure session using MongoDB)
app.use(session({
  secret: process.env.NODE_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}` +
              `@${process.env.MONGODB_CLUSTER}/?retryWrites=true&w=majority&appName=${process.env.MONGODB_APPNAME}`,
    collectionName: 'sessions'
  })
}));

// Route: Home
app.get('/', (req, res) => res.render('index', { pageTitle: 'Welcome' }));

// Route: Sign Up page
app.get('/signup', (req, res) => res.render('signup', { pageTitle: 'Sign Up' }));

// Route: Login page
app.get('/login', (req, res) => res.render('login', { pageTitle: 'Log In' }));

// Route: Sign Up handler
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const result = await registerUser(email, password);
  res.send(result.message);
});

// Route: Login handler
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await loginUser(email, password);

  if (result.success) {
    req.session.user = result.user;
    res.send("Logged in successfully");
  } else {
    res.send(result.message);
  }
});

// Route: Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.send("Logged out");
  });
});

// Protected route: Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('dashboard', { pageTitle: 'Dashboard', user: req.session.user });
});

// Protected route: Messages
app.get('/messages', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('messages', { pageTitle: 'Messages', user: req.session.user });
});

// 404 Page
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found' });
});

// Connect to DB and start server
(async () => {
  try {
    const dbResult = await connectToDatabase();
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
})();
