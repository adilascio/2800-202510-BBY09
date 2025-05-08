require('dotenv').config();
const { MongoClient } = require('mongodb');

// Create MongoDB client using the URI from .env
const client = new MongoClient(process.env.MONGODB_URI);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("🌐 URI:", process.env.MONGODB_URI);
    console.log("🗄️  DB Name:", process.env.DB_NAME);

    console.log("MongoDB connected");

    // Use DB name from .env (required)
    const db = client.db(process.env.DB_NAME);

    // Return the DB and a collection (adjust as needed)
    return {
      db,
      users: db.collection('users')
    };
  } catch (err) {
    console.error("Connection failed:", err.message);
    throw err;
  }
}

module.exports = { connectToDatabase };
