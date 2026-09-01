# Tether 🔗

> A private shared digital space for couples.

---

## ⚡ Quick Start — Local Development

Run the entire application with **no external services required** — no Cloudflare R2, no JWT setup, no signup/login flow.

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

All other values default to dev-friendly settings (`AUTH_MODE=bypass`, `STORAGE_MODE=local`).

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

```
http://localhost:5173
```

You will land directly on the **Dashboard** as the development user — no login required.

---

## Development Modes

### `AUTH_MODE=bypass` (default in development)

- No JWT tokens required
- On startup, the server automatically creates two deterministic users:
  - `dev@tether.local` (primary — this is you)
  - `dev2@tether.local` (partner — makes `isPaired=true` so all couple-scoped UI works)
- Every API request is automatically authenticated as `dev@tether.local`
- Opening the app takes you directly to the dashboard

> ⚠️ **`AUTH_MODE=bypass` must never be used in production.** The server will refuse to start if `AUTH_MODE=bypass` and `NODE_ENV=production` are both set.

### `STORAGE_MODE=local` (default in development)

- Uploaded images are saved to `server/uploads/memories/{memoryId}/`
- Images are served by Express at `http://localhost:5000/uploads/...`
- No Cloudflare account or R2 bucket required

Uploaded files live at:
```
server/
└── uploads/
    └── memories/
        └── {memoryId}/
            ├── abc123.jpg
            └── ...
```

> ⚠️ **`STORAGE_MODE=local` is for development/testing only.** Production should use `STORAGE_MODE=r2`.

---

## Switching to Production Configuration

When ready for production, update `server/.env`:

```env
AUTH_MODE=jwt
STORAGE_MODE=r2

JWT_ACCESS_SECRET=<64+ char random string>
JWT_REFRESH_SECRET=<64+ char random string>
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=tether-media
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

No code changes required — the storage abstraction and auth middleware handle both modes.

---

Two people create individual accounts, pair via invite code, and from that point share one connected space — memories with photos, saved reels to recreate together, and custom categories.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + React Router + Axios + Tailwind CSS |
| Backend | Node.js + Express 4 + MongoDB + Mongoose |
| Auth | bcrypt + JWT (access token) + HttpOnly refresh token cookie |
| File Storage | Cloudflare R2 (via AWS SDK v3 presigned URLs) |

---

## Folder Structure

```
Tether/
├── server/                  # Express API
│   ├── src/
│   │   ├── config/         # DB + R2 clients
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # auth, couple, validate, errorHandler
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers
│   │   ├── utils/          # tokens, generateInviteCode, validateEnv
│   │   └── app.js          # Express app (no listen)
│   ├── tests/              # Jest + Supertest tests
│   ├── .env.example
│   └── package.json
│
├── client/                  # Vite React app
│   ├── src/
│   │   ├── api/            # Axios modules per resource
│   │   ├── components/     # Navbar, cards, ProtectedRoute, etc.
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Login, Signup, Pair, Dashboard, ...
│   │   └── App.jsx         # Router
│   └── package.json
│
└── README.md
```

---

## Full Production Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB 6+)
- Cloudflare R2 bucket with public access enabled

---

## MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write permissions
3. Add your IP to the allowlist (or use `0.0.0.0/0` for development)
4. Copy the connection string — it looks like:
   `mongodb+srv://user:password@cluster.mongodb.net/tether`

---

## Cloudflare R2 Setup

1. Go to Cloudflare Dashboard → R2
2. Create a bucket (e.g. `tether-media`)
3. Enable **Public Access** on the bucket and note the public URL
4. Create an **API Token** with Object Read & Write permissions
5. Note your **Account ID**, **Access Key ID**, and **Secret Access Key**
6. In R2 bucket settings, add a CORS rule:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in all values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://...

JWT_ACCESS_SECRET=<long random string, 64+ chars>
JWT_REFRESH_SECRET=<different long random string, 64+ chars>

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=tether-media
R2_PUBLIC_URL=https://pub-xxxx.r2.dev

CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> **Tip**: Generate strong JWT secrets with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

---

## Local Development

### Server

```bash
cd server
npm install
cp .env.example .env   # then fill in values
npm run dev            # starts on http://localhost:5000
```

### Client

```bash
cd client
npm install
npm run dev            # starts on http://localhost:5173
```

Both must run simultaneously. Open `http://localhost:5173` in your browser.

---

## API Overview

### Auth
```
POST /api/auth/signup     Create account + couple
POST /api/auth/login      Login
POST /api/auth/refresh    Rotate refresh token
POST /api/auth/logout     Clear cookie
GET  /api/auth/me         Current user info
```

### Couples
```
POST /api/couples/join    Join using invite code (atomic)
GET  /api/couples/me      Couple + partner info
```

### Categories
```
GET    /api/categories
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id   (nullifies refs, doesn't cascade)
```

### Memories
```
GET    /api/memories?page=1&limit=20&categoryId=<id>
POST   /api/memories
PATCH  /api/memories/:id
DELETE /api/memories/:id   (also cleans up R2 objects)
POST   /api/memories/:id/images/presign
POST   /api/memories/:id/images/confirm
```

### Reels
```
GET    /api/reels?page=1&limit=20&categoryId=<id>&isDone=true
POST   /api/reels
PATCH  /api/reels/:id
DELETE /api/reels/:id
```

---

## Authentication Architecture

- **Signup/Login** → issue short-lived **access token** (15m) + long-lived **refresh token** (7d)
- Access token sent as `Authorization: Bearer <token>` header
- Refresh token stored in **HttpOnly cookie** (`path=/api/auth`) — never accessible to JS
- On 401, the Axios interceptor automatically calls `/api/auth/refresh`, rotates the token, and retries the original request once
- On refresh failure, fires `auth:logout` event → clears state → redirects to login

---

## R2 Upload Architecture

Images are never proxied through the Express server:

```
1. Client requests presigned PUT URL from Express
2. Express validates memory ownership + file type + size
3. Express generates server-side object key:
     couples/{coupleId}/memories/{memoryId}/{uuid}-{safeFilename}
4. Express returns presigned URL (expires in 5 minutes)
5. Client uploads directly to R2 with PUT
6. Client calls /confirm — Express validates the key prefix
7. Image URL is stored in the Memory document
```

---

## Security Model

- `coupleId` is **always** derived from `req.user.coupleId` — never trusted from client
- Every shared-resource query: `findOne({ _id, coupleId: req.user.coupleId })`
- Couple join is **atomic** via `findOneAndUpdate({ 'members.1': { $exists: false } })`
- R2 object key validated server-side by prefix before confirming
- Passwords: bcrypt with cost factor 12, `select: false` on schema
- Helmet, CORS, rate limiting (20 req/15min on auth), body size limit (1MB)

---

## Running Tests

```bash
cd server
npm test
```

Requires a local MongoDB instance or set `TEST_MONGODB_URI` in your environment. Tests run in `tether_test` database and drop it after each suite.

---

## Implementation Assumptions

1. **Invite codes don't expire** in MVP. Architecture supports future regeneration — just update `Couple.inviteCode`.
2. **MongoDB transactions** are used for signup and pairing. If your Atlas tier doesn't support transactions (Free tier does on replica sets), catch the error and fall back to sequential writes.
3. **R2 cleanup** on memory delete is best-effort — DB deletion succeeds even if R2 cleanup fails (storage errors shouldn't fail user operations).
4. **No real-time sync** — both partners see the same data but must refresh to see the other's changes. Real-time can be added with WebSockets in a future phase.
5. **LetterPage** schema is fully defined and indexed, but the UI shows a "Coming soon" placeholder. The architecture is ready for `GET /api/public/letters/:slug` without auth.
