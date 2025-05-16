// app.js (login + signup + EJS rendering + validation + Tutor AI chat)
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const MongoStore = require('connect-mongo');
const { connectToDatabase } = require('./database');
const { DateTime } = require('luxon');
const multer = require('multer');
const fs = require('fs');
const uploadDir = path.join(__dirname, 'public', 'uploads');
const { describeForDiceBear } = require('./aiAvatar');



const app = express();
const PORT = process.env.PORT || 8000;

let db, usersCollection;


if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only .png or .jpeg images allowed.'));
  }
});

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
    console.error("MongoDB Connection Failed:", err);
  }
})();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

// Auth routes
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
  if (error) return res.render('login', { pageTitle: 'Log In', errorMessage: 'Invalid email or password format.' });

  const user = await usersCollection.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.render('login', { pageTitle: 'Log In', errorMessage: 'Incorrect email or password.' });
  }

  req.session.user = { name: user.name, email: user.email, username: user.username };
  res.redirect('/home');
});

app.get('/signup', (req, res) => {
  res.render('signup', { pageTitle: 'Sign Up', errorMessage: null });
});

app.get("/game", requireLogin, canPlayToday, (req, res) => {
  res.render("game", {
    user: req.session.user,
    activeTab: "puzzles",
    message: req.playMessage || null,
    result: req.gameResult || []
  });
});

app.post('/played-today', requireLogin, async (req, res) => {
  const { result } = req.body;

  const todayPST = DateTime.now()
    .setZone('America/Los_Angeles')
    .toFormat('yyyy-MM-dd');

  await usersCollection.updateOne(
    { email: req.session.user.email },
    {
      $set: {
        lastPlayed: todayPST,
        lastGameResult: result || []
      }
    }
  );

  res.sendStatus(200);
});

function canPlayToday(req, res, next) {
  usersCollection.findOne({ email: req.session.user.email }).then(user => {
    const nowPST = DateTime.now().setZone('America/Los_Angeles');
    const todayPST = nowPST.toFormat('yyyy-MM-dd');

    if (user.lastPlayed === todayPST) {
      req.alreadyPlayed = true;
      req.gameResult = user.lastGameResult || [];
      req.playMessage = "You've already played today. Come back tomorrow!";
    } else {
      req.gameResult = [];       
      req.playMessage = null;
    }
    next();
  });
}

app.post('/signup', async (req, res) => {
  const schema = Joi.object({
    firstName: Joi.string().max(30).required(),
    lastName: Joi.string().max(30).required(),
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(30).required(),
    birthdate: Joi.date().iso().less('now').required()
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
    username: req.body.username,
    birthdate: new Date(req.body.birthdate), 
    nativeLanguage: null,
    targetLanguage: null,
    friends: [],
    friendRequestsSent: [],
    friendRequestsReceived: []
  });

  req.session.user = {
    name: `${req.body.firstName} ${req.body.lastName}`,
    email: req.body.email,
    username: req.body.username
  };
  req.session.showProfilePrompt = true;
  res.redirect('/home');
});

app.get('/home', requireLogin, async (req, res) => {
  const user = await usersCollection.findOne({ email: req.session.user.email });
  const requestCount = user.friendRequestsReceived?.length || 0;

  const showProfilePrompt = req.session.showProfilePrompt;
  req.session.showProfilePrompt = false;
  res.render('home', {
    pageTitle: 'LingoLink Home',
    user: req.session.user,
    activeTab: 'home',
    showProfilePrompt,
    requestCount
  });
});

// Friends Page
app.get('/friends', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const currentUser = await usersCollection.findOne({ email: req.session.user.email });
  const search = req.query.search?.trim();

  const receivedRequests = await usersCollection.find({
    username: { $in: currentUser.friendRequestsReceived || [] }
  }).toArray();

  const requests = receivedRequests.map(user => ({
    name: user.name,
    username: user.username,
    avatar: '/img/user1.png',
    description: 'Sent you a friend request'
  }));

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

  const results = await usersCollection.find(query).toArray();

  const suggestedFriends = results.map(user => {
    const isPending = (currentUser.friendRequestsSent || []).includes(user.username);
    const isFriend = (currentUser.friends || []).includes(user.username);
    return {
      name: user.name,
      username: user.username,
      avatar: user.profilePic || '/svgs/person.svg',
      profilePic: user.profilePic || '/svgs/person.svg',
      description: `Learning ${user.targetLanguage}, Good at ${user.nativeLanguage}`,
      status: isFriend ? 'added' : isPending ? 'added' : ''
    };
  });

  res.render('friends', {
    pageTitle: 'Find Friends',
    friends: suggestedFriends,
    receivedRequests: requests,
    requestCount: currentUser.friendRequestsReceived?.length || 0,
    searchQuery: search || '',
    showSuggested: !search
  });
});

app.post('/send-request', requireLogin, async (req, res) => {
  const { targetUsername } = req.body;
  const currentUser = await usersCollection.findOne({ email: req.session.user.email });

  if (!targetUsername || targetUsername === currentUser.username) {
    return res.status(400).send('Invalid request');
  }

  const targetUser = await usersCollection.findOne({ username: targetUsername });
  if (!targetUser) return res.status(404).send('User not found');

  await usersCollection.updateOne(
    { username: targetUsername },
    { $addToSet: { friendRequestsReceived: currentUser.username } }
  );

  await usersCollection.updateOne(
    { username: currentUser.username },
    { $addToSet: { friendRequestsSent: targetUsername } }
  );

  res.sendStatus(200);
});

app.post('/accept-request', requireLogin, async (req, res) => {
  const { fromUsername } = req.body;
  const currentUser = await usersCollection.findOne({ email: req.session.user.email });

  await usersCollection.updateOne(
    { username: currentUser.username },
    {
      $pull: { friendRequestsReceived: fromUsername },
      $addToSet: { friends: fromUsername }
    }
  );

  await usersCollection.updateOne(
    { username: fromUsername },
    {
      $addToSet: { friends: currentUser.username }
    }
  );

  res.redirect('/friends');
});

app.post('/cancel-request', requireLogin, async (req, res) => {
  const { targetUsername } = req.body;
  const currentUser = await usersCollection.findOne({ email: req.session.user.email });

  await usersCollection.updateOne(
    { username: targetUsername },
    { $pull: { friendRequestsReceived: currentUser.username } }
  );

  res.sendStatus(200);
});

app.get('/profile', requireLogin, async (req, res) => {
  const user = await usersCollection.findOne({ email: req.session.user.email });
  res.render('profile', { user, languages });
});

app.post('/profile', requireLogin, upload.single('profilePic'), async (req, res) => {
  const update = {
    nativeLanguage: req.body.nativeLanguage,
    targetLanguage: req.body.targetLanguage,
    username: req.body.username,
    birthdate: req.body.birthdate ? new Date(req.body.birthdate) : null,
    shareLocation: true
  };

  // Location handling
  if (req.body.lat && req.body.lng) {
    update.location = {
      lat: parseFloat(req.body.lat),
      lng: parseFloat(req.body.lng)
    };
  }

  // Profile picture path
  if (req.file) {
    update.profilePic = `/uploads/${req.file.filename}`;
  }

  await usersCollection.updateOne(
    { email: req.session.user.email },
    { $set: update }
  );

  // Update session
  req.session.user.username = req.body.username;

  res.redirect('/profile?updated=true');
});



app.get('/messages', requireLogin, async (req, res) => {
  const currentUser = await usersCollection.findOne({ email: req.session.user.email });

  const friendUsernames = currentUser.friends || [];

  const friends = await usersCollection.find({
    username: { $in: friendUsernames }
  }).toArray();

  const friendData = friends.map(friend => ({
    name: friend.name,
    username: friend.username,
     profilePic: friend.profilePic || '/svgs/person.svg'
  }));

  res.render('messages', {
    pageTitle: 'Messages',
    user: req.session.user,
    friends: friendData,
    activeTab: 'messages'
  });
});

app.get('/settings', requireLogin, async (req, res) => {
  const user = await usersCollection.findOne({ email: req.session.user.email });
  res.render('settings', { user });
});

app.post('/settings', requireLogin, async (req, res) => {
  const shareLocation = req.body.shareLocation === 'on';

  const update = { shareLocation };

  if (shareLocation && req.body.lat && req.body.lng) {
    update.location = {
      lat: parseFloat(req.body.lat),
      lng: parseFloat(req.body.lng)
    };
  } else {
    update.location = null;
  }

  await usersCollection.updateOne(
    { email: req.session.user.email },
    { $set: update }
  );

  res.redirect('/profile?updated=true');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Tutor Page
app.get('/tutor', requireLogin, (req, res) => {
  const tutor = req.session.selectedTutor || 'english';
  const history = req.session.chatHistory?.[tutor] || [];
  res.render('tutor', {
    pageTitle:'Tutor AI',
    user:req.session.user,
    activeTab:'tutor',
    history,
    selectedTutor: tutor
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

// AI avatar endpoint
app.post('/api/avatar/describe', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: 'Missing prompt.' });

  try {
    const opts = await describeForDiceBear(prompt);
    res.json(opts);
  } catch (err) {
    console.error('Seed gen error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Not Found' });
});

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
