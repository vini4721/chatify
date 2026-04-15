import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "../emails/handlers.js";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

async function buildUniquePublicId() {
  let attempt = 0;

  while (attempt < 40) {
    const candidate = `CHAT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ publicId: candidate });
    if (!exists) {
      return candidate;
    }
    attempt += 1;
  }

  return `CHAT-${Date.now().toString().slice(-8)}`;
}

function normalizeUsername(value = "") {
  const next = value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^_+|_+$/g, "");

  if (next.length < 3) return "";
  return next.slice(0, 24);
}

async function buildUniqueUsername(base) {
  const fallback =
    normalizeUsername(base) || `user${Math.random().toString(36).slice(2, 8)}`;

  let candidate = fallback;
  let attempt = 0;

  while (attempt < 30) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ username: candidate });
    if (!exists) {
      return candidate;
    }

    attempt += 1;
    const suffix = Math.random().toString(36).slice(2, 6);
    candidate = `${fallback.slice(0, Math.max(3, 24 - suffix.length))}${suffix}`;
  }

  return `${fallback.slice(0, 18)}${Date.now().toString().slice(-6)}`;
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

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

    const normalizedRequestedUsername = normalizeUsername(username || "");
    if (username && !normalizedRequestedUsername) {
      return res.status(400).json({
        message:
          "Username must be 3-24 chars and use letters, numbers, or underscore",
      });
    }

    if (normalizedRequestedUsername) {
      const existingUsername = await User.exists({
        username: normalizedRequestedUsername,
      });
      if (existingUsername) {
        return res.status(409).json({ message: "Username already taken" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalUsername =
      normalizedRequestedUsername ||
      (await buildUniqueUsername(name || email.split("@")[0]));
    const publicId = await buildUniquePublicId();

    const user = await User.create({
      name,
      username: finalUsername,
      publicId,
      email,
      password: hashedPassword,
    });

    const token = createToken(user._id.toString());

    sendWelcomeEmail({
      email: user.email,
      name: user.name,
      clientURL: process.env.CLIENT_URL || "http://localhost:5173",
    }).catch(() => {
      // keep signup successful even if email provider is unavailable
    });

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        publicId: user.publicId,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);
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

    if (!user.username) {
      user.username = await buildUniqueUsername(
        user.name || user.email.split("@")[0],
      );
    }

    if (!user.publicId) {
      user.publicId = await buildUniquePublicId();
    }

    if (user.isModified("username") || user.isModified("publicId")) {
      await user.save();
    }

    const token = createToken(user._id.toString());

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        publicId: user.publicId,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to login" });
  }
});

router.post("/logout", (_req, res) => {
  return res.json({ message: "Logged out successfully" });
});

router.get("/me", protect, async (req, res) => {
  let changed = false;

  if (!req.user.username) {
    req.user.username = await buildUniqueUsername(
      req.user.name || req.user.email.split("@")[0],
    );
    changed = true;
  }

  if (!req.user.publicId) {
    req.user.publicId = await buildUniquePublicId();
    changed = true;
  }

  if (changed) {
    await req.user.save();
  }

  return res.json({ user: req.user });
});

router.get("/check", protect, async (req, res) => {
  return res.json(req.user);
});

router.put("/update-profile", protect, async (req, res) => {
  try {
    const { profilePic } = req.body;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic },
      { new: true },
    ).select("-password");

    return res.json(updatedUser);
  } catch {
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;
