const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://Kairoe:Kevin@bby09database.m5tmqti.mongodb.net/?retryWrites=true&w=majority&appName=BBY09DataBase';
const client = new MongoClient(uri);

const results = [
  {
    userId: new ObjectId("68269c639391e7b27bf14d55"), // Kevin
    language: "lang_en",
    date: new Date("2025-05-15"),
    words: ["CANE", "HIVE", "WILD"]
  },
  {
    userId: new ObjectId("68269c639391e7b27bf14d56"), // Sehaj
    language: "lang_pa",
    date: new Date("2025-05-15"),
    words: ["TIGER", "LEAF", "RIVER"]
  }
];

async function run() {
  try {
    await client.connect();
    const db = client.db('BBY09DataBase');
    await db.collection('gameResults').deleteMany({});
    await db.collection('gameResults').insertMany(results);
    console.log("✅ Game results inserted");
  } finally {
    await client.close();
  }
}

run();
