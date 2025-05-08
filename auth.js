const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { connectToDatabase } = require('./database.js');

const router = express.Router();

let users;
(async () => {
  const db = await connectToDatabase();
  users = db.users;
})();


// Signup route
router.post('/signup', async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(20).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.send(error.message);

  const existingUser = await users.findOne({ email: req.body.email });
  if (existingUser) return res.send("Email already registered.");

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  await users.insertOne({
    email: req.body.email,
    password: hashedPassword,
  });

  res.redirect('/login');
});

// Login route
router.post('/login', async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.send(error.message);

  const user = await users.findOne({ email: req.body.email });
  if (!user) return res.send("Invalid email or password.");

  const passwordMatch = await bcrypt.compare(req.body.password, user.password);
  if (!passwordMatch) return res.send("Invalid email or password.");

  req.session.user = {
    email: user.email
  };

  res.redirect('/messages');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect('/');
  });
});

module.exports = router;
