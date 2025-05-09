const { body } = require('express-validator');

exports.validateAddFriend = [
  body('currentUserId').isMongoId().withMessage('Invalid user ID'),
  body('friendTag').notEmpty().withMessage('Friend tag is required')
];