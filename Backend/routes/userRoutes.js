import express from "express";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";
import { onlineUsers } from "../socketState.js";

const router = express.Router();

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get("/search", protect, async (req, res) => {
  try {
    const rawQuery = String(req.query.query || req.query.username || "")
      .trim()
      .toLowerCase();

    if (!rawQuery) {
      return res.status(400).json({ message: "Search query is required" });
    }

    if (rawQuery.length < 2) {
      return res
        .status(400)
        .json({ message: "Enter at least 2 characters to search" });
    }

    const normalizedPublicId = rawQuery
      .replace(/[^a-z0-9-]/g, "")
      .toUpperCase();

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        {
          publicId: {
            $regex: `^${escapeRegex(normalizedPublicId)}`,
            $options: "i",
          },
        },
        { username: { $regex: `^${escapeRegex(rawQuery)}`, $options: "i" } },
        { name: { $regex: `^${escapeRegex(rawQuery)}`, $options: "i" } },
      ],
    })
      .limit(20)
      .select("-password");

    const usersWithStatus = users.map((user) => ({
      ...user.toObject(),
      isOnline: onlineUsers.has(user._id.toString()),
    }));

    return res.json({ users: usersWithStatus });
  } catch {
    return res.status(500).json({ message: "Failed to search users" });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password",
    );

    const usersWithStatus = users.map((user) => ({
      ...user.toObject(),
      isOnline: onlineUsers.has(user._id.toString()),
    }));

    return res.json({ users: usersWithStatus });
  } catch {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

export default router;
