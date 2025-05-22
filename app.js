// app.js (login + signup + EJS rendering + validation + Tutor AI chat)
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const MongoStore = require('connect-mongo');
const {
	connectToDatabase
} = require('./database');
const {
	DateTime
} = require('luxon');
const multer = require('multer');
const fs = require('fs');
const uploadDir = path.join(__dirname, 'public', 'uploads');
const {
	describeForDiceBear
} = require('./aiAvatar');

const languages = require('./public/js/languages');

const app = express();
const PORT = process.env.PORT || 8000;

let db, usersCollection, locationsCollection, languagesCollection, friendshipsCollection, gameResultsCollection, messagesCollection, media;


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
const {
	InferenceClient
} = require('@huggingface/inference');
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
		media = db.collection('media');
		usersCollection = dbResult.users;
		messagesCollection = db.collection('messages');
		locationsCollection = dbResult.locations;
		languagesCollection = dbResult.languages;
		friendshipsCollection = dbResult.friendships;
		gameResultsCollection = dbResult.gameResults;
		dailyStatsCollection = dbResult.dailyStats;

		app.listen(PORT, () =>
			console.log(`Server running on http://localhost:${PORT}`)
		);
	} catch (err) {
		console.error('Failed to connect to MongoDB:', err);
		process.exit(1);
	}
})();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({
	extended: true
}));
app.use(express.json());

app.use(session({
	secret: process.env.SESSION_SECRET || 'temp-secret',
	resave: false,
	saveUninitialized: false
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

function formatFullName(user) {
	return `${user.firstName} ${user.lastName}`;
}

function requireLogin(req, res, next) {
	if (!req.session.user) return res.redirect('/login');
	next();
}

// Auth routes
app.get('/', (req, res) => {
	if (req.session.user) return res.redirect('/home');
	res.render('index', {
		pageTitle: 'Welcome'
	});
});

app.get('/login', (req, res) => {
	res.render('login', {
		pageTitle: 'Log In',
		errorMessage: null
	});
});

app.post('/login', async (req, res) => {
	const schema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().required()
	});

	const {
		error
	} = schema.validate(req.body);
	if (error) {
		return res.status(400).json({
			errorMessage: 'Invalid email or password format.'
		});
	}

	const user = await usersCollection.findOne({
		email: req.body.email
	});
	if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
		return res.status(401).json({
			errorMessage: 'Incorrect email or password.'
		});
	}

	req.session.user = {
		_id: user._id,
		name: formatFullName(user),
		email: user.email,
		username: user.username
	};

	req.session.showAnimation = true;
	res.status(200).json({
		success: true
	});
});

app.get('/signup', (req, res) => {
  res.render('signup', {
    pageTitle: 'Sign Up',
    errorMessage: null,
    languages // ✅ add this!
  });
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
	const todayPST = DateTime.now()
		.setZone('America/Los_Angeles')
		.toFormat('yyyy-MM-dd');

	const currentUser = await usersCollection.findOne({
		email: req.session.user.email
	});
	const {
		language,
		result
	} = req.body;

	if (!language || !result) {
		return res.status(400).send("Missing language or result data");
	}

	await gameResultsCollection.updateOne({
		userId: currentUser._id,
		date: todayPST,
		language
	}, {
		$set: {
			wordsFound: result,
			score: result.length,
			updatedAt: new Date()
		}
	}, {
		upsert: true
	});


	res.sendStatus(200);
});

function canPlayToday(req, res, next) {
	usersCollection.findOne({
		email: req.session.user.email
	}).then(user => {
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
		password: Joi.string().min(6).max(30).required().trim(),
		birthdate: Joi.date().iso().less('now').required(),
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

	// Insert user
	const userInsertResult = await usersCollection.insertOne({
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		password: hashedPassword,
		username: req.body.username,
		birthdate: new Date(req.body.birthdate)
	});

	// Fetch the inserted user
	const user = await usersCollection.findOne({ _id: userInsertResult.insertedId });

	// Set session
	req.session.user = {
		_id: user._id,
		name: formatFullName(user),
		email: user.email,
		username: user.username
	};

	req.session.showAnimation = true;
	req.session.showProfilePrompt = true;

	res.redirect('/home');
});

app.get('/home', requireLogin, async (req, res) => {
	const user = await usersCollection.findOne({
		email: req.session.user.email
	});
	const requests = await friendshipsCollection.find({
		friendId: user._id,
		status: 'received'
	}).toArray();

	const requestCount = requests.length;
	const showAnimation = req.session.showAnimation;
	req.session.showAnimation = false;


	const today = DateTime.now().setZone('Canada/Vancouver').toFormat('yyyy-MM-dd');
	const hasPlayedToday = user.lastPlayed === today;

	const showProfilePrompt = req.session.showProfilePrompt;
	req.session.showProfilePrompt = false;
	res.render('home', {
		pageTitle: 'LingoLink Home',
		user: req.session.user,
		user,
		activeTab: 'home',
		showProfilePrompt,
		requestCount,
		showAnimation,
		hasPlayedToday
	});
});

// Friends Page
app.get('/friends', requireLogin, async (req, res) => {
	const currentUser = await usersCollection.findOne({
		email: req.session.user.email
	});
	if (!currentUser) {
		console.error('User not found for session email:', req.session.user.email);
		return res.redirect('/login');
	}

	const userLang = await languagesCollection.findOne({
		userId: currentUser._id
	});

	const search = req.query.search?.trim();

	// Get received friend requests
	const received = await friendshipsCollection.find({
		userId: currentUser._id,
		status: 'received'
	}).toArray();

	const senderIds = received.map(r => r.friendId);
	const receivedRequests = await usersCollection.find({
		_id: {
			$in: senderIds
		}
	}).toArray();

	const requests = receivedRequests.map(user => ({
		name: formatFullName(user),
		username: user.username,
		profilePic: user.profilePic || '/svgs/person.svg',
		description: 'Sent you a friend request'
	}));

	// Build query for suggested friends
	let query = {
		email: {
			$ne: currentUser.email
		}
	};

	if (search) {
		query.$or = [{
				firstName: {
					$regex: new RegExp(search, 'i')
				}
			},
			{
				lastName: {
					$regex: new RegExp(search, 'i')
				}
			},
			{
				username: {
					$regex: new RegExp(search, 'i')
				}
			}
		];
	} else if (userLang) {
		// Match native <-> target logic
		const targetMatch = await languagesCollection.find({
			nativeLanguage: userLang.targetLanguage,
			targetLanguage: userLang.nativeLanguage,
			userId: {
				$ne: currentUser._id
			}
		}).toArray();

		const matchedUserIds = targetMatch.map(l => l.userId);
		query._id = {
			$in: matchedUserIds
		};
	}

	const results = await usersCollection.find(query).toArray();

	// Get already sent & accepted friendships
	const sentRequests = await friendshipsCollection.find({
		userId: currentUser._id,
		status: 'sent'
	}).toArray();

	const acceptedFriends = await friendshipsCollection.find({
		userId: currentUser._id,
		status: 'accepted'
	}).toArray();

	const sentUserIds = sentRequests.map(r => r.friendId.toString());
	const acceptedUserIds = acceptedFriends.map(r => r.friendId.toString());

	const suggestedFriends = results.map(user => {
		const userIdStr = user._id.toString();
		const isPending = sentUserIds.includes(userIdStr);
		const isFriend = acceptedUserIds.includes(userIdStr);

		return {
			name: formatFullName(user),
			username: user.username,
			avatar: user.profilePic || '/svgs/person.svg',
			profilePic: user.profilePic || '/svgs/person.svg',
			description: `Language learner`,
			status: isFriend ? 'added' : isPending ? 'added' : ''
		};
	});

	res.render('friends', {
		pageTitle: 'Find Friends',
		friends: suggestedFriends,
		receivedRequests: requests,
		requestCount: requests.length,
		searchQuery: search || '',
		showSuggested: !search
	});
});

app.post('/send-request', requireLogin, async (req, res) => {
	const {
		targetUsername
	} = req.body;
	const currentUser = await usersCollection.findOne({
		email: req.session.user.email
	});

	if (!currentUser) {
		console.error('User not found for session email:', req.session.user.email);
		return res.status(401).json({
			error: 'Unauthorized'
		});
	}

	if (!targetUsername || targetUsername === currentUser.username) {
		console.warn('Invalid target username:', targetUsername);
		return res.status(400).json({
			error: 'Invalid request'
		});
	}

	const targetUser = await usersCollection.findOne({
		username: targetUsername
	});
	if (!targetUser) {
		console.warn('Target user not found:', targetUsername);
		return res.status(404).json({
			error: 'User not found'
		});
	}

	try {
		// prevent duplicates
		const existing = await friendshipsCollection.findOne({
			userId: currentUser._id,
			friendId: targetUser._id,
			status: {
				$in: ['sent', 'received', 'accepted']
			}
		});

		if (existing) {
			console.log('Friend request or relation already exists');
			return res.status(409).json({
				error: 'Request already exists'
			});
		}

		await friendshipsCollection.insertMany([{
				userId: currentUser._id,
				friendId: targetUser._id,
				status: 'sent'
			},
			{
				userId: targetUser._id,
				friendId: currentUser._id,
				status: 'received'
			}
		]);

		console.log(`Friend request sent from ${currentUser.username} to ${targetUsername}`);
		res.sendStatus(200);

	} catch (err) {
		console.error('Error sending friend request:', err);
		res.status(500).json({
			error: 'Server error'
		});
	}
});

app.post('/accept-request', requireLogin, async (req, res) => {
  const { fromUsername } = req.body;
  const currentUser = await usersCollection.findOne({ email: req.session.user.email });
  const fromUser = await usersCollection.findOne({ username: fromUsername });

  if (!fromUser) return res.status(404).send("User not found");

  // ✅ Check if there’s a received request from this user
  const receivedRequest = await friendshipsCollection.findOne({
    userId: currentUser._id,
    friendId: fromUser._id,
    status: 'received'
  });

  if (!receivedRequest) {
    return res.status(403).send("No incoming friend request from this user.");
  }

  // ✅ Update both entries to accepted
  await friendshipsCollection.updateMany(
    {
      $or: [
        { userId: currentUser._id, friendId: fromUser._id },
        { userId: fromUser._id, friendId: currentUser._id }
      ]
    },
    { $set: { status: 'accepted' } }
  );

  // Optional: store chatId
  const chatId = [currentUser.username, fromUsername].sort().join('_');
  await usersCollection.updateOne({ username: currentUser.username }, { $addToSet: { chats: chatId } });
  await usersCollection.updateOne({ username: fromUsername }, { $addToSet: { chats: chatId } });

  res.redirect('/friends');
});


app.post('/cancel-request', requireLogin, async (req, res) => {
	const targetUser = await usersCollection.findOne({
		username: targetUsername
	});
	if (!targetUser) return res.status(404).send("User not found");

	const currentUser = await usersCollection.findOne({
		email: req.session.user.email
	});

	if (!currentUser) {
		console.error('User not found for session email:', req.session.user.email);
		return res.redirect('/login');
	}


	if (!currentUser) {
		console.error('User not found for session email:', req.session.user.email);
		return res.redirect('/login');
	}


	await friendshipsCollection.deleteMany({
		$or: [{
				userId: currentUser._id,
				friendId: targetUser._id
			},
			{
				userId: targetUser._id,
				friendId: currentUser._id
			}
		],
		status: {
			$in: ['sent', 'received']
		}
	});


	res.sendStatus(200);
});

app.get('/profile', requireLogin, async (req, res) => {
  const user = await usersCollection.findOne({ email: req.session.user.email });
  if (!user) return res.redirect('/login');

  // Profile picture
  const profilePic = await media.findOne({
    userId: user._id,
    type: "profilePic"
  });

  // Language info
  const langData = await languagesCollection.findOne({ userId: user._id });
  user.nativeLanguage = langData?.nativeLanguage || '';
  user.targetLanguage = langData?.targetLanguage || '';

  // Location prompt flag
  const showLocationPrompt = !req.session.locationConfirmed;

  res.render('profile', {
    user,
    languages,
    profilePicUrl: profilePic?.url || '/uploads/default.jpg',
    showLocationPrompt
  });
});


app.post('/profile', requireLogin, upload.single('profilePic'), async (req, res) => {
  const currentUser = await usersCollection.findOne({ email: req.session.user.email });

  // Step 1: Build the user document update
  const userUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    birthdate: req.body.birthdate ? new Date(req.body.birthdate) : null
  };

  // Step 2: Add profile picture if uploaded
	if (req.file) {
	// Remove old profilePic from media (optional)
	await media.deleteMany({ userId: currentUser._id, type: 'profilePic' });

	// Insert new profilePic
	await media.insertOne({
		userId: currentUser._id,
		type: 'profilePic',
		url: `/uploads/${req.file.filename}`,
		uploadedAt: new Date()
	});
	}


  // Step 3: Update users collection
  await usersCollection.updateOne(
    { _id: currentUser._id },
    { $set: userUpdate }
  );

  // Step 4: Update languages collection
  await languagesCollection.updateOne(
    { userId: currentUser._id },
    {
      $set: {
        nativeLanguage: req.body.nativeLanguage,
        targetLanguage: req.body.targetLanguage
      }
    },
    { upsert: true }
  );

  // Step 5: Move location and shareLocation into locations collection
  const shareLocation = req.body.shareLocation === 'on';
  const locationData = {
    userId: currentUser._id,
    shareLocation
  };

  if (req.body.lat && req.body.lng) {
    locationData.lat = parseFloat(req.body.lat);
    locationData.lng = parseFloat(req.body.lng);
  }

  await locationsCollection.updateOne(
    { userId: currentUser._id },
    { $set: locationData },
    { upsert: true }
  );

  // Step 6: Update session data
  req.session.user.name = `${req.body.firstName} ${req.body.lastName}`;
  req.session.user.username = req.body.username;

  res.redirect('/profile?updated=true');
});


app.get('/messages', requireLogin, async (req, res) => {
	console.log('Session user:', req.session.user);

	const currentUser = await usersCollection.findOne({
		email: req.session.user.email
	});

	if (!currentUser) {
		console.error('User not found for session email:', req.session.user.email);
		return res.redirect('/login');
	}

	if (!currentUser) {
		console.error('User not found for session email:', req.session.user.email);
		return res.redirect('/login');
	}

	const accepted = await friendshipsCollection.find({
		userId: currentUser._id,
		status: 'accepted'
	}).toArray();

	const friendIds = accepted.map(r => r.friendId);

	const friends = await usersCollection.find({
		_id: {
			$in: friendIds
		}
	}).toArray();

	const friendData = friends.map(friend => {
		const chatId = [currentUser.username, friend.username].sort().join('_');
		return {
			name: formatFullName(friend),
			username: friend.username,
			avatar: '/img/user1.png',
			chatId,
			profilePic: friend.profilePic || '/svgs/person.svg'
		};
	});

	res.render('messages', {
		pageTitle: 'Messages',
		user: req.session.user,
		friends: friendData,
		activeTab: 'messages'
	});
});

app.get('/settings', requireLogin, async (req, res) => {
	const user = await usersCollection.findOne({
		email: req.session.user.email
	});
	res.render('settings', {
		user
	});
});

app.post('/settings', requireLogin, async (req, res) => {
	const shareLocation = req.body.shareLocation === 'on';
	const passportAnimation = req.body.passportAnimation === 'on'; // ← new toggle value

	const update = {
		shareLocation,
		passportAnimation // ← add to update object
	};

	if (shareLocation && req.body.lat && req.body.lng) {
		update.location = {
			lat: parseFloat(req.body.lat),
			lng: parseFloat(req.body.lng)
		};
	} else {
		update.location = null;
	}

	await usersCollection.updateOne({
		email: req.session.user.email
	}, {
		$set: update
	});

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
		pageTitle: 'Tutor AI',
		user: req.session.user,
		activeTab: 'tutor',
		history,
		selectedTutor: tutor
	});
});

app.get('/profile/:username', requireLogin, async (req, res) => {
	const username = req.params.username;
	const currentUser = req.session.user.username;
	const from = req.query.from || '';

	// Prevent viewing your own profile
	if (username === currentUser) {
		return res.redirect('/profile');
	}

	const user = await usersCollection.findOne({
		username
	});
	if (!user) return res.status(404).render('404');

	const lang = await languagesCollection.findOne({
		userId: user._id
	});

	res.render('public-profile', {
		user2: {
			...user,
			fullName: formatFullName(user)
		},
		languageInfo: lang || {},
		isOwnProfile: false,
		from
	});
});


// AI Chat endpoint
app.post('/api/chat', requireLogin, async (req, res) => {
	try {
		const userMsg = req.body.message.trim();
		if (!userMsg) return res.status(400).json({
			error: 'No message provided'
		});

		// storing the message in the session
		req.session.chatHistory = req.session.chatHistory || [];

		const messages = [{
				role: 'system',
				content: 'You are a helpful language tutor.'
			},
			...req.session.chatHistory,
			{
				role: 'user',
				content: userMsg
			}
		];

		// tell HF which model to use
		const completion = await hf.chatCompletion({
			model: 'microsoft/phi-4',
			messages
		});


		// receive reply 
		const reply = completion.choices?.[0]?.message?.content ||
			'Sorry, the tutor had no reply.';
		//send reply and chat history
		res.json({
			reply,
			history: req.session.chatHistory
		});

	} catch (err) {
		console.error('Chat error:', err);
		res.status(500).json({
			error: err.message
		});
	}
});

app.get('/chat/:chatId', requireLogin, async (req, res) => {
	const chatId = req.params.chatId;
	const currentUser = req.session.user.username;

	try {
		const messages = await messagesCollection
			.find({
				chatId
			})
			.sort({
				timestamp: 1
			})
			.toArray();

		res.render('chat', {
			pageTitle: `Chat with ${chatId.replace(currentUser, '').replace('_', '')}`,
			user: req.session.user,
			currentUser,
			messages,
			chatId
		});
	} catch (err) {
		console.error('Error fetching chat:', err);
		res.status(500).send('Error loading chat');
	}
});

app.get('/chat/:chatId/messages', requireLogin, async (req, res) => {
	const chatId = req.params.chatId;

	try {
		const messages = await messagesCollection
			.find({
				chatId
			})
			.sort({
				timestamp: 1
			})
			.toArray();

		res.json(messages); // return JSON for AJAX polling
	} catch (err) {
		console.error('Error fetching messages:', err);
		res.status(500).json({
			error: 'Failed to load messages.'
		});
	}
});

app.post('/send-message', requireLogin, async (req, res) => {
	const {
		message,
		chatId
	} = req.body;
	const sender = req.session.user.username;

	if (!message || !chatId) {
		return res.status(400).json({
			error: "Missing chatId or message."
		});
	}

	try {
		await messagesCollection.insertOne({
			chatId,
			user: sender,
			text: message.trim(),
			timestamp: new Date()
		});

		res.sendStatus(200); 
	} catch (err) {
		console.error('Error saving message:', err);
		res.status(500).json({
			error: 'Failed to send message.'
		});
	}
});

// AI avatar endpoint
app.post('/api/avatar/describe', async (req, res) => {
	const {
		prompt
	} = req.body;
	if (!prompt?.trim()) return res.status(400).json({
		error: 'Missing prompt.'
	});

	try {
		const opts = await describeForDiceBear(prompt);
		res.json(opts);
	} catch (err) {
		console.error('Seed gen error:', err);
		res.status(500).json({
			error: err.message
		});
	}
});

app.post('/api/location/confirm', requireLogin, (req, res) => {
  req.session.locationConfirmed = true;
  res.sendStatus(200);
});

// 404 handler
app.use((req, res) => {
	res.status(404).render('404', {
		pageTitle: 'Not Found'
	});
});

