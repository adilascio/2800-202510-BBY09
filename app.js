const PORT = process.env.PORT || 8000;
const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const {MongoClient} = require('mongodb');


//Public folders statically served.
app.use(express.static(path.join(__dirname, 'public')));

// Serve on process.env.PORT or port 8000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Using express to view ejs files
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
  
// Public routes
app.get('/',         (req, res) => res.render('index',   { pageTitle: 'Welcome' }));
app.get('/login',    (req, res) => res.render('login',   { pageTitle: 'Log In'  }));
app.get('/signup',   (req, res) => res.render('signup',  { pageTitle: 'Sign Up' }));

// Private routes (NEEDS AUTH GUARD after db setup)
app.get('/messages', (req, res) => res.render('messages', { pageTitle: 'Messages' }));
app.get('/dashboard', (req, res) => res.render('dashboard', { pageTitle: 'Dashboard' }));


// 404 handler (optional)
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found' });
});