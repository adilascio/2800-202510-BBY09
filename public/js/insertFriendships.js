const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://Kairoe:Kevin@bby09database.m5tmqti.mongodb.net/?retryWrites=true&w=majority&appName=BBY09DataBase';
const client = new MongoClient(uri);

const friendships = [
  {
    requesterId: new ObjectId("68269c639391e7b27bf14d55"), // e.g. Kevin
    recipientId: new ObjectId("68269c639391e7b27bf14d56"), // e.g. Sehaj
    status: "accepted",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    requesterId: new ObjectId("68269c639391e7b27bf14d55"),
    recipientId: new ObjectId("68269c639391e7b27bf14d56"),
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function run() {
  try {
    await client.connect();
    const db = client.db('BBY09DataBase');
    await db.collection('friendships').deleteMany({});
    await db.collection('friendships').insertMany(friendships);
    console.log("✅ Friendships inserted");
  } finally {
    await client.close();
  }
}

run();
