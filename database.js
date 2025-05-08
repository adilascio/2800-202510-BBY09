require('dotenv').config();
const { MongoClient } = require('mongodb');

// Construct the URI securely from environment variables
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}` +
            `@${process.env.MONGODB_CLUSTER}/?retryWrites=true&w=majority&appName=${process.env.MONGODB_APPNAME}`;

const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("✅ MongoDB connected");
    console.log("Using DB:", process.env.MONGODB_DBNAME);

    const db = client.db(process.env.MONGODB_DBNAME);

    return {
      db,
      users: db.collection('users')
    };
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    throw err;
  }
}

module.exports = { connectToDatabase };
