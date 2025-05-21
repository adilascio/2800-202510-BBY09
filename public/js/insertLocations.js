const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://Kairoe:Kevin@bby09database.m5tmqti.mongodb.net/?retryWrites=true&w=majority&appName=BBY09DataBase';
const client = new MongoClient(uri);

const locations = [
  {
    _id: new ObjectId("6655aab1aa11aa11aa11aa11"),
    name: "BCIT Burnaby",
    lat: 49.2494,
    lng: -123.0010,
    region: "Metro Vancouver"
  },
  {
    _id: new ObjectId("6655aab2bb22bb22bb22bb22"),
    name: "Surrey Central",
    lat: 49.1182,
    lng: -122.8664,
    region: "Surrey"
  }
];

async function run() {
  try {
    await client.connect();
    const db = client.db('BBY09DataBase');
    await db.collection('locations').deleteMany({});
    await db.collection('locations').insertMany(locations);
    console.log("✅ Locations inserted");
  } finally {
    await client.close();
  }
}

run();
