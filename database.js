require('dotenv').config();
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("🌐 URI:", process.env.MONGODB_URI);
    console.log("🗄️  DB Name:", process.env.DB_NAME);
    console.log("✅ MongoDB connected");

  const db = client.db(process.env.DB_NAME);

  return {
    db,
    users: db.collection('users'),
    languages: db.collection('languages'),
    friendships: db.collection('friendships'),
    gameResults: db.collection('gameResults'),
    media: db.collection('media'),
    locations: db.collection('locations')
  };

  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    throw err;
  }
}

module.exports = { connectToDatabase };
