# Tether 🔗

> A private, secure, and shared digital space exclusively designed for couples.

---

## 📖 Overview

Tether is an open-source, full-stack application built to give couples a dedicated, private space to document their relationship. Unlike social media platforms, Tether is strictly a two-player experience. Two users create an account, pair using a secure atomic invite code, and instantly share an isolated digital environment. 

This repository contains the complete MERN-stack source code, featuring a visually stunning, animation-rich frontend and a robust, secure Express API.

## ✨ Features

- **Isolated Couple Environments:** Atomic joining via invite code ensures every resource is scoped strictly to two users via `coupleId`.
- **Memories & Gallery:** Direct-to-Cloudflare R2/ImageKit media uploads for high-resolution photo sharing and a unified masonry gallery view.
- **Interactive Map (Journey):** Memories and photos tagged with coordinates are automatically plotted on an interactive Leaflet map.
- **Daily Prompts (Reflections):** Both partners answer daily questions; answers remain locked until both users submit.
- **Ideas Jar (Adventures):** A physics-inspired interactive jar to store, shuffle, and randomly pick future date ideas.
- **Scrapbook Letters:** Rich-text templates (classic, elegant, minimal, vintage, scrapbook) to write long-form letters.
- **Shared Audio (Radyo):** A globally persistent background music player that continues across route transitions, complete with custom track uploads.
- **Real-Time Partner Status:** Select your mood (happy/sad) and see your partner's status update instantly via WebSockets (`Socket.IO`).
- **Saved Reels:** Save and categorize short-form video links to watch together later.
- **Comprehensive Security:** CSRF protection (`csrf-csrf`), Helmet security headers, rate limiting, and HTTP Parameter Pollution protection.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Tailwind CSS, Framer Motion, React Query, Leaflet |
| **Backend** | Node.js, Express 4, MongoDB, Mongoose, Socket.IO |
| **Authentication** | bcrypt, JWT (Header Access Token + HttpOnly Refresh Cookie) |
| **Storage & CDN** | Cloudflare R2 (via AWS SDK v3 Presigned URLs), ImageKit |
| **Security** | Helmet, express-rate-limit, csrf-csrf, xss-clean, express-mongo-sanitize |

---

## ⚡ Quick Start — Local Development

Run the entire application locally. The system defaults to development settings (`AUTH_MODE=bypass`, `STORAGE_MODE=local`), making it easy to test without configuring external services.

### 1. Configure the server

```bash
cd server
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

Edit `server/.env` and set your MongoDB URI:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/tether
```

### 2. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Start both servers

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

### 4. Open the app

Navigate to `http://localhost:5173`. In development mode (`AUTH_MODE=bypass`), you will land directly on the Dashboard as a pre-seeded development user (`dev@tether.local`).

---

## 🚀 Switching to Production Configuration

When you are ready to deploy, update `server/.env` to secure the application and enable cloud storage:

```env
NODE_ENV=production
AUTH_MODE=jwt
STORAGE_MODE=r2

# Authentication Secrets
JWT_ACCESS_SECRET=<64+ char random string>
JWT_REFRESH_SECRET=<64+ char random string>
CSRF_SECRET=<32+ char random string>

# Cloudflare R2 Config
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=tether-media
R2_PUBLIC_URL=https://pub-xxxx.r2.dev

# ImageKit Config (For Avatars)
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

No code changes are required. The storage abstraction layer (`src/services/storage`) and authentication middleware handle the transition seamlessly.

---

## 🏗 Directory Structure

```
Tether/
├── server/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/         # DB, R2, ImageKit, Socket.IO clients
│   │   ├── controllers/    # API Route handlers
│   │   ├── middleware/     # Auth, Couple isolation, Validation, Security
│   │   ├── models/         # Mongoose schemas (User, Couple, Memory, etc.)
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Storage abstraction (Local vs R2)
│   │   ├── utils/          # Token generation, Env validation
│   │   ├── app.js          # Express app configuration
│   │   └── server.js       # Entry point & keepalive
│   └── package.json
│
├── client/                  # React + Vite Frontend
│   ├── src/
│   │   ├── api/            # Axios instance and interceptors
│   │   ├── components/     # UI widgets, cards, map, jar
│   │   ├── context/        # Auth, Theme, Radio, Socket contexts
│   │   ├── pages/          # Full page views (Dashboard, Memories, Letters)
│   │   ├── App.jsx         # React Router configuration
│   │   └── main.jsx        # DOM Entry
│   └── package.json
```

---

## 🔐 Security Architecture

- **Strict Data Isolation:** Every database query for shared resources uses `coupleId` strictly derived from the verified JWT payload (`req.user.coupleId`). Client-provided IDs are ignored.
- **R2 Presigned Uploads:** Files are never proxied through Node.js. The client requests a short-lived presigned URL and `PUT`s the binary directly to Cloudflare R2. The server then confirms the upload via prefix validation.
- **Cross-Site Request Forgery (CSRF):** The `double-csrf` implementation uses a secure, HttpOnly token cookie tied to the user's session, requiring a matching `X-CSRF-Token` header for state-mutating requests.
- **WebSocket Auth:** Socket connections require the JWT access token and map the socket directly to the authenticated user's `coupleId` room.
