require('dotenv').config(); // Load .env first

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const { registerUser, loginUser } = require('./auth');
const { connectToDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 8000;

// ✅ Middleware: Parse form data
app.use(express.urlencoded({ extended: true }));

// ✅ Middleware: Static files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ✅ Session middleware (once only)
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

// ✅ Routes
app.get('/', (req, res) => res.render('index', { pageTitle: 'Welcome' }));
app.get('/signup', (req, res) => res.render('signup', { pageTitle: 'Sign Up' }));
app.get('/login', (req, res) => res.render('login', { pageTitle: 'Log In' }));

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const result = await registerUser(email, password);
  res.send(result.message); // You can also redirect to /login if successful
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await loginUser(email, password);

  if (result.success) {
    req.session.user = result.user;
    res.redirect('/messages');
  } else {
    res.send(result.message);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('dashboard', { pageTitle: 'Dashboard', user: req.session.user });
});

app.get('/messages', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('messages', { pageTitle: 'Messages', user: req.session.user });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found' });
});

// ✅ Connect to MongoDB and start server
(async () => {
  try {
    await connectToDatabase();
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
})();
