import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import Message from './models/Message.js';
import { onlineUsers } from './socketState.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
    cors({
        origin: CLIENT_URL,
        credentials: true,
    })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
    },
});

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Unauthorized'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        return next();
    } catch {
        return next(new Error('Unauthorized'));
    }
});

function broadcastOnlineUsers() {
    io.emit('online-users', Array.from(onlineUsers.keys()));
}

io.on('connection', (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    broadcastOnlineUsers();

    socket.on('private-message', async ({ to, text }, callback) => {
        try {
            if (!to || !text || !text.trim()) {
                callback?.({ error: 'Invalid message payload' });
                return;
            }

            const message = await Message.create({
                senderId: socket.userId,
                receiverId: to,
                text: text.trim(),
            });

            const recipientSocketId = onlineUsers.get(to);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('new-message', message);
            }

            callback?.({ message });
        } catch {
            callback?.({ error: 'Failed to send message' });
        }
    });

    socket.on('disconnect', () => {
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
    console.error('Startup failed:', error.message);
    process.exit(1);
}