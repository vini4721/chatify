import express from "express";
import { protect } from "../middleware/auth.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const router = express.Router();

router.use(protect);

router.get("/contacts", async (req, res) => {
  try {
    const contacts = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password",
    );
    return res.json({ users: contacts });
  } catch {
    return res.status(500).json({ message: "Failed to fetch contacts" });
  }
});

router.get("/chats", async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
    }).select("senderId receiverId");

    const partnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === req.user._id.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString(),
        ),
      ),
    ];

    const chats = await User.find({ _id: { $in: partnerIds } }).select(
      "-password",
    );
    return res.json({ users: chats });
  } catch {
    return res.status(500).json({ message: "Failed to fetch chats" });
  }
});

router.get("/:userId", async (req, res) => {
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
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
});

async function sendMessageHandler(req, res) {
  try {
    const { userId } = req.params;
    const { text = "", image = "" } = req.body;

    if (!text.trim() && !image) {
      return res.status(400).json({ message: "Text or image is required" });
    }

    if (userId === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot send message to yourself" });
    }

    const receiverExists = await User.exists({ _id: userId });
    if (!receiverExists) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const message = await Message.create({
      senderId: req.user._id,
      receiverId: userId,
      text: text.trim(),
      image,
    });

    return res.status(201).json({ message });
  } catch {
    return res.status(500).json({ message: "Failed to send message" });
  }
}

router.post("/:userId", sendMessageHandler);
router.post("/send/:userId", sendMessageHandler);

export default router;
