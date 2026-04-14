import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { onlineUsers } from '../socketState.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');

    const usersWithStatus = users.map((user) => ({
      ...user.toObject(),
      isOnline: onlineUsers.has(user._id.toString()),
    }));

    return res.json({ users: usersWithStatus });
  } catch {
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
});

export default router;
