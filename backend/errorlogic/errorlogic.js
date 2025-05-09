const User = require('../models/User');

exports.addFriend = async (req, res) => {
  const { currentUserId, friendTag } = req.body;
  try {
    const friend = await User.findOne({
      $or: [{ email: friendTag }, { username: friendTag }, { uniqueId: friendTag }]
    });
    if (!friend) return res.status(404).json({ error: 'User not found' });
    if (friend._id.toString() === currentUserId)
      return res.status(400).json({ error: 'Cannot add yourself as a friend' });

    const currentUser = await User.findById(currentUserId);
    if (currentUser.friends.includes(friend._id))
      return res.status(400).json({ error: 'User is already a friend' });

    currentUser.friends.push(friend._id);
    await currentUser.save();
    friend.friends.push(currentUser._id);
    await friend.save();

    res.status(200).json({ message: 'Friend added successfully', friend });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};