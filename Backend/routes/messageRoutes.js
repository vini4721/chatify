import express from 'express';
import Message from '../models/Message.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id },
      ],
    }).sort({ createdAt: 1 });

    return res.json({ messages });
  } catch {
    return res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

router.post('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = await Message.create({
      senderId: req.user._id,
      receiverId: userId,
      text: text.trim(),
    });

    return res.status(201).json({ message });
  } catch {
    return res.status(500).json({ message: 'Failed to send message' });
  }
});

export default router;
