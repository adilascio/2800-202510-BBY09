const bcrypt = require('bcryptjs');

const password = 'yourpasswordhere'; // 👈 Replace with actual password

bcrypt.genSalt(12, (err, salt) => {
  if (err) throw err;
  bcrypt.hash(password, salt, (err, hash) => {
    if (err) throw err;
    console.log('✅ Hashed password:');
    console.log(hash);
  });
});
