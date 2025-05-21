// insertUsers.js
const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://Kairoe:Kevin@bby09database.m5tmqti.mongodb.net/?retryWrites=true&w=majority&appName=BBY09DataBase';
const client = new MongoClient(uri);

const users = [
  {
    name: "Kevin Tran",
    email: "Ktran@gmail.com",
    password: "$2b$12$66VqRTprUxCAt3dsflgq4OUjCG2D8xXjxqc1pd4iGUUlpCPWmszV6",
    username: "Ktran",
    nativeLanguage: "lang_en",
    targetLanguage: "lang_pa",
    birthdate: new Date("2006-08-16"),
    profilePic: "/uploads/kevin-pfp.jpg",
    shareLocation: true,
    location: { lat: 49.1182, lng: -122.8664 }
  },
  {
    name: "Sehaj Gill",
    email: "gillsehaj63@gmail.com",
    password: "$2b$12$66VqRTprUxCAt3dsflgq4OUjCG2D8xXjxqc1pd4iGUUlpCPWmszV6",
    username: "gillxsehaj",
    nativeLanguage: "lang_pa",
    targetLanguage: "lang_en",
    birthdate: new Date("2006-08-16"),
    profilePic: "/uploads/sehaj.jpg",
    shareLocation: true,
    location: { lat: 49.1183, lng: -122.8665 }
  }
];

async function run() {
  try {
    await client.connect();
    const db = client.db('BBY09DataBase');
    await db.collection('users').deleteMany({});
    await db.collection('users').insertMany(users);
    console.log('✅ Users inserted');
  } finally {
    await client.close();
  }
}

run();
