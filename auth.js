const bcrypt = require('bcrypt');
const Joi = require('joi');
const { connectToDatabase } = require('./database');

let usersCollection;

// Immediately connect to DB and cache the collection
(async () => {
  try {
    const { users } = await connectToDatabase();
    usersCollection = users;
  } catch (err) {
    console.error("Failed to init DB in auth.js:", err);
  }
})();

const saltRounds = 12;

// Register new user
async function registerUser(email, password) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(20).required()
  });

  const { error } = schema.validate({ email, password });
  if (error) return { success: false, message: error.details[0].message };

  const existing = await usersCollection.findOne({ email });
  if (existing) return { success: false, message: "Email already registered." };

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  await usersCollection.insertOne({ email, password: hashedPassword });

  return { success: true, message: "Registration successful." };
}

// Login existing user
async function loginUser(email, password) {
  const user = await usersCollection.findOne({ email });
  if (!user) return { success: false, message: "Email not found." };

  const match = await bcrypt.compare(password, user.password);
  if (!match) return { success: false, message: "Incorrect password." };

  return { success: true, user };
}

module.exports = { registerUser, loginUser };
