const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://Kairoe:Kevin@bby09database.m5tmqti.mongodb.net/?retryWrites=true&w=majority&appName=BBY09DataBase';
const client = new MongoClient(uri);

const media = [
  {
    userId: new ObjectId("68269c639391e7b27bf14d55"), // Kevin
    url: "/uploads/kevin-pfp.jpg",
    type: "profilePic",
    contentType: "image/jpeg",
    uploadedAt: new Date()
  },
  {
    userId: new ObjectId("68269c639391e7b27bf14d56"), // Sehaj
    url: "/uploads/sehaj-pfp.jpg",
    type: "profilePic",
    contentType: "image/jpeg",
    uploadedAt: new Date()
  }
];

async function run() {
  try {
    await client.connect();
    const db = client.db('BBY09DataBase');
    await db.collection('media').deleteMany({});
    await db.collection('media').insertMany(media);
    console.log("✅ Media inserted");
  } finally {
    await client.close();
  }
}

run();
