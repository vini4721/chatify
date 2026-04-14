import cors from "cors";
import "dotenv/config";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import path from 'path';
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import { apiRateLimit, authRateLimit } from './middleware/rateLimit.js';
import Message from "./models/Message.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { onlineUsers } from "./socketState.js";

const app = express();
const server = http.createServer(app);
const __dirname = path.resolve();

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: '6mb' }));
app.use('/api', apiRateLimit);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRateLimit, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../Frontend/dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/dist/index.html'));
  });
}

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

function broadcastOnlineUsers() {
  io.emit("online-users", Array.from(onlineUsers.keys()));
}

io.on("connection", (socket) => {
  onlineUsers.set(socket.userId, socket.id);
  broadcastOnlineUsers();

  socket.on('typing-start', ({ to }) => {
    if (!to) return;
    const recipientSocketId = onlineUsers.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing-start', { from: socket.userId });
    }
  });

  socket.on('typing-stop', ({ to }) => {
    if (!to) return;
    const recipientSocketId = onlineUsers.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing-stop', { from: socket.userId });
    }
  });

  socket.on(
    "private-message",
    async ({ to, text = "", image = "" }, callback) => {
      try {
        if (!to || (!text.trim() && !image)) {
          callback?.({ error: "Invalid message payload" });
          return;
        }

        const message = await Message.create({
          senderId: socket.userId,
          receiverId: to,
          text: text.trim(),
          image,
        });

        const recipientSocketId = onlineUsers.get(to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("new-message", message);
        }

        callback?.({ message });
      } catch {
        callback?.({ error: "Failed to send message" });
      }
    },
  );

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.userId);
    broadcastOnlineUsers();
  });
});

try {
  await connectDB(process.env.MONGO_URI);
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Startup failed:", error.message);
  process.exit(1);
}
