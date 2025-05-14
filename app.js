// app.js (login + signup + EJS rendering + validation + Tutor AI chat)
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const MongoStore = require('connect-mongo');
const { connectToDatabase } = require('./database');

const app = express();

// Serve static and parse bodies
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session store (Mongo-backed)
app.use(session({
  secret: process.env.SESSION_SECRET || 'temp-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    dbName:   process.env.DB_NAME   || 'BBY09Database',
    collectionName: 'sessions'
  }),
  // cookie settings default to session; will override on login
}));

// Make user available in all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 8000;
let db, usersCollection;

// DB connect and HF client setup
const { InferenceClient } = require('@huggingface/inference');
const HF_API_TOKEN = process.env.HF_API_TOKEN;
if (!HF_API_TOKEN) {
  console.error('Missing HF_API_TOKEN in .env');
  process.exit(1);
}
const hf = new InferenceClient(HF_API_TOKEN);

(async () => {
  try {
    const dbResult = await connectToDatabase();
    db = dbResult.db;
    usersCollection = dbResult.users;
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
})();

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// --- Login route with cookie expires at midnight ---
app.post('/login', async (req, res) => {
  // ... validation logic ...
  const user = await usersCollection.findOne({ email: req.body.email });
  // ... auth logic ...
  req.session.user = { name: user.name, email: user.email };

  // Calculate milliseconds until next midnight
  const now = new Date();
  const midnight = new Date();
  midnight.setDate(now.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - now.getTime();

  // Set session cookie to expire at midnight
  req.session.cookie.maxAge = msUntilMidnight;
  req.session.cookie.expires = midnight;

  res.redirect('/home');
});

// --- Logout route clears only user, preserves session and chatHistory ---
app.get('/logout', (req, res) => {
  // remove user but keep session data (e.g., chatHistory)
  delete req.session.user;
  res.redirect('/login');
});

// AI chat endpoint uses req.session.chatHistory as before
app.post('/api/chat', requireLogin, async (req, res) => {
  try {
    const userMsg = req.body.message.trim();
    if (!userMsg) return res.status(400).json({ error: 'No message provided' });

    // Initialize or retrieve today's history
    req.session.chatHistory = req.session.chatHistory || [];

    // Build full context, call HF, append to session, respond as before
    const messages = [
      { role: 'system', content: 'You are a helpful language tutor.' },
      ...req.session.chatHistory,
      { role: 'user', content: userMsg }
    ];
    const completion = await hf.chatCompletion({ model: 'microsoft/phi-4', messages });
    const reply = completion.choices[0]?.message?.content || 'Sorry, no reply.';

    // Append both user and assistant to session
    req.session.chatHistory.push(
      { role: 'user', content: userMsg },
      { role: 'assistant', content: reply }
    );

    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});


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
    return res.render('login', {
      pageTitle: 'Log In',
      errorMessage: 'Invalid email or password format.'
    });
  }

  const user = await usersCollection.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.render('login', {
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
    return res.render('signup', {
      pageTitle: 'Sign Up',
      errorMessage: 'Invalid input. Password must be 6-30 characters.'
    });
  }

  const existingUser = await usersCollection.findOne({ username: req.body.username });
  if (existingUser) {
    return res.render('signup', {
      pageTitle: 'Sign Up',
      errorMessage: 'Username already taken. Please choose another.'
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

app.get('/home', requireLogin, (req, res) => {
  const showProfilePrompt = req.session.showProfilePrompt;
  req.session.showProfilePrompt = false;
  res.render('home', {
    pageTitle: 'LingoLink Home',
    user: req.session.user,
    activeTab: 'home',
    showProfilePrompt
  });
});

// Messages Page
app.get('/messages', requireLogin, (req, res) => {
  const showProfilePrompt = req.session.showProfilePrompt;
  req.session.showProfilePrompt = false;
  res.render('messages', {
    pageTitle: 'Friends List',
    user: req.session.user,
    activeTab: 'messages',
    showProfilePrompt
  });
});

// Friends Page
app.get('/friends', requireLogin, async (req, res) => {
  const currentUser = await usersCollection.findOne({ email: req.session.user.email });
  const search = req.query.search?.trim();

  let query = { email: { $ne: currentUser.email } };
  if (search) {
    query.$or = [
      { name: { $regex: new RegExp(search, 'i') } },
      { username: { $regex: new RegExp(search, 'i') } }
    ];
  } else if (currentUser.nativeLanguage && currentUser.targetLanguage) {
    query.nativeLanguage = currentUser.targetLanguage;
    query.targetLanguage = currentUser.nativeLanguage;
  }

  const matches = await usersCollection.find(query).toArray();
  const friends = matches.map(user => ({
    name: user.name,
    username: user.username,
    avatar: '/img/user1.png',
    description: `Learning ${user.targetLanguage}, Good at ${user.nativeLanguage}`
  }));

  res.render('friends', {
    friends,
    searchQuery: search || '',
    showSuggested: !search
  });
});

// Profile
const languages = [
  "Afrikaans","Albanian","Amharic","Arabic","Armenian","Bengali","Bosnian","Bulgarian",
  "Burmese","Catalan","Chinese","Croatian","Czech","Danish","Dutch","English","Estonian",
  "Filipino","Finnish","French","German","Greek","Gujarati","Hebrew","Hindi","Hungarian",
  "Icelandic","Indonesian","Italian","Japanese","Kannada","Kazakh","Khmer","Korean","Lao",
  "Latvian","Lithuanian","Macedonian","Malay","Malayalam","Marathi","Mongolian","Nepali",
  "Norwegian","Pashto","Persian","Polish","Portuguese","Punjabi","Romanian","Russian",
  "Serbian","Sinhala","Slovak","Slovenian","Spanish","Swahili","Swedish","Tamil","Telugu",
  "Thai","Turkish","Ukrainian","Urdu","Uzbek","Vietnamese","Zulu"
];
app.get('/profile', requireLogin, async (req, res) => {
  const user = await usersCollection.findOne({ email: req.session.user.email });
  res.render('profile', { user, languages });
});
app.post('/profile', requireLogin, async (req, res) => {
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

// Tutor Page
app.get('/tutor', requireLogin, (req, res) => {
  const history = req.session.chatHistory || [];
  res.render('tutor', {
    pageTitle: 'Tutor AI',
    user: req.session.user,
    activeTab: 'tutor',
    history
  });
});

// AI Chat endpoint
app.post('/api/chat', requireLogin, async (req, res) => {
  try {
    const userMsg = req.body.message.trim();
    if (!userMsg) return res.status(400).json({ error: 'No message provided' });

    // storing the message in the session
    req.session.chatHistory = req.session.chatHistory || [];

    const messages = [
        { role: 'system',  content: 'You are a helpful language tutor.' },
        ...req.session.chatHistory,
        { role: 'user',    content: userMsg }
      ];

    // tell HF which model to use
    const completion = await hf.chatCompletion({
      model: 'microsoft/phi-4',
      messages
    });


    // receive reply 
    const reply = completion.choices?.[0]?.message?.content
      || 'Sorry, the tutor had no reply.';
    //send reply and chat history
    res.json({ reply , history: req.session.chatHistory });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Not Found' });
});
