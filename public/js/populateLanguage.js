// populateLanguages.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://Kairoe:Kevin@bby09database.m5tmqti.mongodb.net/?retryWrites=true&w=majority&appName=BBY09DataBase';
const client = new MongoClient(uri);

const languages = [
  { _id: 'lang_en', name: 'English' },
  { _id: 'lang_pa', name: 'Punjabi' },
  { _id: 'lang_fr', name: 'French' },
  { _id: 'lang_es', name: 'Spanish' },
  { _id: 'lang_de', name: 'German' },
  { _id: 'lang_it', name: 'Italian' },
  { _id: 'lang_ja', name: 'Japanese' },
  { _id: 'lang_zh', name: 'Chinese' },
  { _id: 'lang_hi', name: 'Hindi' },
  { _id: 'lang_ar', name: 'Arabic' },
  { _id: 'lang_af', name: 'Afrikaans' },
  { _id: 'lang_ru', name: 'Russian' },
  { _id: 'lang_my', name: 'Burmese' },
  { _id: 'lang_hy', name: 'Armenian' },
  { _id: 'lang_sv', name: 'Swedish' },
  { _id: 'lang_sq', name: 'Albanian' },
  { _id: 'lang_vi', name: 'Vietnamese' },
  { _id: 'lang_hr', name: 'Croatian' },
  { _id: 'lang_pt', name: 'Portuguese' }
];

async function run() {
  try {
    await client.connect();
    const db = client.db('BBY09DataBase');
    await db.collection('languages').deleteMany({});
    await db.collection('languages').insertMany(languages);
    console.log('✅ Language data populated');
  } finally {
    await client.close();
  }
}

run();
