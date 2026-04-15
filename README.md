# Chatify

A full-stack real-time chat app inspired by Chatify. This repo contains a Node.js/Express backend with Socket.IO and a React/Vite frontend.

## Features

- JWT signup/login/logout flow
- Real-time private messaging
- Online/offline presence
- Typing indicators
- Unread message badges
- Profile picture updates
- Image messages
- Welcome email support
- Cloudinary image uploads
- Production static serving from the backend

## Project Structure

- `Backend/` - Express API, MongoDB, Socket.IO, email and upload integrations
- `Frontend/` - React UI, routing, stores, chat views

## Requirements

- Node.js 18+
- MongoDB
- Optional: Cloudinary, Resend

## Setup

### 1. Backend environment

Create `Backend/.env` from `Backend/.env.example` and fill in the values.

Minimum required values:

```bash
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/chat_app
JWT_SECRET=your_secure_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Optional integrations:

```bash
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_verified_email@example.com
EMAIL_FROM_NAME=Chatify

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Install dependencies

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

### 3. Run in development

Start the backend:

```bash
cd Backend
npm run dev
```

Start the frontend:

```bash
cd Frontend
npm run dev
```

Frontend runs on `http://localhost:5173` and backend on `http://localhost:3000`.

## Production

Build the frontend:

```bash
cd Frontend
npm run build
```

Then start the backend with production env values:

```bash
cd Backend
npm start
```

In production, the backend serves the built frontend from `Frontend/dist`.

## Notes

- If Cloudinary keys are not configured, image upload features will not persist to Cloudinary.
- If Resend is not configured, signup still works and email sending is skipped safely.
- The app uses token-based auth stored locally in the browser for development convenience.

## Scripts

### Backend

- `npm run dev` - start the API with nodemon
- `npm start` - start the API with node

### Frontend

- `npm run dev` - start Vite dev server
- `npm run build` - build production assets
- `npm run lint` - run ESLint

## License

For personal and educational use unless you add a license.
