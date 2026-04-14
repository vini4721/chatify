import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = createToken(user._id.toString());

    sendWelcomeEmail({
      email: user.email,
      name: user.name,
      clientURL: process.env.CLIENT_URL || 'http://localhost:5173',
    }).catch(() => {
      // keep signup successful even if email provider is unavailable
    });

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to sign up" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(user._id.toString());

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to login" });
  }
});

router.post('/logout', (_req, res) => {
  return res.json({ message: 'Logged out successfully' });
});

router.get("/me", protect, async (req, res) => {
  return res.json({ user: req.user });
});

router.get('/check', protect, async (req, res) => {
  return res.json(req.user);
});

router.put('/update-profile', protect, async (req, res) => {
  try {
    const { profilePic } = req.body;

    if (!profilePic) {
      return res.status(400).json({ message: 'Profile picture is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic },
      { new: true }
    ).select('-password');

    return res.json(updatedUser);
  } catch {
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

export default router;
