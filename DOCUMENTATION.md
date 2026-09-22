# Tether 🔗 - Comprehensive Documentation

This document serves as the central, comprehensive documentation for the **Tether** application. It details the system architecture, database models, API controllers, frontend structure, and the complete set of features designed to bring couples closer, despite the distances.

---

## 1. System Architecture Overview

Tether operates on a modern MERN-stack architecture, highly customized to provide real-time interactions and seamless media handling between two users.

```text
+-------------------------------------------------------------+
|                        Client (Browser)                     |
|                                                             |
|   +-------------+   +--------------+   +---------------+    |
|   |   React UI  |<->| React Router |<->| Auth & Context|    |
|   +-------------+   +--------------+   +---------------+    |
|          |                 |                  |             |
|          v                 v                  v             |
|   +----------------------------------------------------+    |
|   |                  Axios & Socket.IO                 |    |
|   +----------------------------------------------------+    |
+-------------------------------------------------------------+
           |                 |                 | (Direct Image/Audio Upload)
           | (JSON / REST)   | (WebSockets)    v
           |                 |      +-----------------------+
           v                 |      |    Cloudflare R2 /    |
+--------------------------+ |      |      ImageKit         |
|   Server (Express.js)    |<+      +-----------------------+
|                          |                  ^
|  +--------------------+  |                  | (Presigned URLs)
|  |     Middleware     |  |                  |
|  | (Auth, Validation) |  |------------------+
|  +--------------------+  |
|          |               |
|          v               |
|  +--------------------+  |
|  |    Controllers     |  |
|  +--------------------+  |
|          |               |
|          v               |
|  +--------------------+  |
|  | Models (Mongoose)  |  |
|  +--------------------+  |
+--------------------------+
           |
           v
+--------------------------+
|       Database           |
|  (MongoDB / Atlas)       |
+--------------------------+
```

- **Frontend:** React 18, Vite, React Router, Tailwind CSS, Framer Motion, Leaflet (Maps).
- **Backend:** Node.js, Express 4, Socket.IO, MongoDB (Mongoose).
- **Authentication:** JWT Access Tokens (Header) + Refresh Tokens (HttpOnly Cookie) + CSRF Tokens.
- **Real-time:** WebSockets mapped to `coupleId` rooms for instant status syncs.
- **File Storage:** Direct-to-Cloudflare R2 uploads for Memories and Radyo via Presigned URLs. ImageKit for profile avatars.

The core design principle is that **two users share a single `Couple` entity**. Every resource is tied to a `coupleId`, ensuring isolated and secure sharing.

---

## 2. Backend Documentation (`server/src/`)

### 2.1 Database Models

The MongoDB schema uses Mongoose. Below are all primary entities and their fields.

#### `User`
Represents an individual user.
- `name`, `email`, `passwordHash` (bcrypt).
- `coupleId` (ObjectId): Refers to the Couple they belong to.
- `role` (Enum): `admin` (creator of the couple) or `partner`.
- **Profile fields**: `nickname`, `gender`, `dateOfBirth`, `bio`, `favouriteColour`, `currentStatus` (mood tracking), `hugsSent`.
- `avatarUrl`, `avatarFileId`: ImageKit details.

#### `Couple`
The central binding entity for two users.
- `members` (Array of ObjectId): Exactly 2 User IDs.
- `inviteCode` (String): Unique atomic code used to join the couple.
- **Shared Details**: `coupleNickname`, `relationshipStatus`, `coupleBio`, `anniversaryDate`, `themeSong`.
- **Collections**: 
  - `milestones` `{ title, date, description }`
  - `bucketList` `{ title, isCompleted, addedBy }`
  - `dateIdeas` (Ideas Jar) `{ title, description, addedBy, createdAt }`
  - `interactions` `{ hugCount, kissCount }`

#### `Category`
Tags/folders for organizing content.
- `coupleId`, `name`, `icon` (emoji).

#### `Memory`
A timestamped post containing photos, text, and optionally location data.
- `coupleId`, `createdBy`, `categoryId`.
- `title`, `description`, `dateTaken`.
- `location` (String) and `coordinates` `{ lat, lng }` (powers the Journey Map).
- `images` `{ url, key, order }` representing R2 objects.

#### `PromptAnswer`
Data model for the Daily Reflections (Prompts) feature.
- `coupleId`, `promptId`, `dateString` (YYYY-MM-DD).
- `answers` (Array): `{ user, text, createdAt }`.

#### `GalleryPhoto`
Standalone photos uploaded directly to the gallery feed.
- `coupleId`, `uploadedBy`, `url`, `key`, `title`, `caption`, `location`.

#### `SavedReel`
Short video formats saved to watch together.
- `coupleId`, `savedBy`, `url`, `thumbnailUrl`, `caption`, `categoryId`.

#### `LetterPage`
Rich-text scrapbook letters written for partners.
- `coupleId`, `createdBy`, `slug`.
- `title`, `templateId` (Enum: classic, minimal, scrapbook, etc.), `palette`.
- `content`: `{ greeting, body, closing }`, `images`.

#### `Track`
Audio files for the shared Radyo feature.
- `coupleId`, `uploadedBy`, `name`, `audioData`, `url`, `contentType`.

### 2.2 Controllers & API Routes

- **`authController.js`**: Signup (atomic Couple creation), login, token rotation, and profile management (avatars, statuses).
- **`couplesController.js`**: Joining via invite code, relationship status, milestones, bucket lists, and the Ideas Jar (`dateIdeas`).
- **`categoriesController.js`**: CRUD for Categories.
- **`memoriesController.js`**: CRUD for Memories, plus endpoints for generating R2 presigned URLs and confirming uploads.
- **`galleryController.js`**: Standalone photo feed management.
- **`letterController.js`**: Management of templated scrapbook letters.
- **`promptsController.js`**: Fetches the daily prompt and handles user answers, ensuring partner answers are obscured until both answer.
- **`radyoController.js`**: Uploading and fetching audio tracks.
- **`reelsController.js`**: Management of saved social media video links.

### 2.3 Middleware & Security

- **`auth.js`**: JWT verification.
- **`couple.js`**: Enforces that requests belong to the authenticated user's `coupleId`.
- **`validate.js`**: Express-validator wrappers.
- **WebSockets (`config/socket.js`)**: Assigns socket connections to isolated rooms based on `coupleId` for secure, real-time broadcasts.

---

## 3. Frontend Documentation (`client/src/`)

### 3.1 Contexts (Global State)

- **`AuthContext.jsx`**: User state, token interception.
- **`ThemeContext.jsx`**: Manages global UI themes, injecting CSS variables.
- **`RadioContext.jsx`**: Manages global audio playback (`RadyoPlayer`), allowing music to persist across navigation.
- **`SocketContext.jsx`**: Manages the Socket.IO connection and handles real-time events like `partner_status_changed`.

### 3.2 Key Pages

- `Dashboard.jsx`: The central hub featuring the PartnerStatusWidget, recent memories, and the Ideas Jar integration.
- `Gallery.jsx`: Masonry grid feed for photos.
- `Memories.jsx` / `NewMemory.jsx`: Full-feed and multi-image upload forms.
- `Letters.jsx` / `LetterEditor.jsx`: Template-based long-form writing.
- `Radyo.jsx`: Shared music player and track manager.
- `Reels.jsx`: Saved video link manager.
- `Profile.jsx`: Couple and individual profile settings.

### 3.3 Core UI Components & Features

The app is highly modularized, with features cleanly separated:

- **`PromptTab.jsx`**: UI for "Daily Reflections". Displays today's prompt, takes input, and reveals the partner's answer only if the user has also answered.
- **`MapTab.jsx`**: UI for "Our Places". Renders a Leaflet map plotting custom Ethereal markers for every Memory and Gallery photo that contains `coordinates`.
- **`IdeasJar.jsx`**: An interactive, physics-inspired UI element for storing and randomly picking date ideas (`dateIdeas`).
- **`PartnerStatusWidget.jsx`**: A dashboard widget allowing the user to set their mood (Happy/Sad) which is instantly broadcasted to the partner via `SocketContext`.
- **`RadyoPlayer.jsx` & `GlobalRadioWidget.jsx`**: A floating audio player that lets couples listen to the same tracks.
- **`LetterRenderer.jsx`**: Dynamically switches CSS layouts to render a letter as a Minimalist, Vintage, or Scrapbook design based on the `templateId`.

### 3.4 API Integration

Axios is heavily utilized with interceptors:
- Attaches JWT tokens and CSRF headers to outgoing requests.
- Catches `401 Unauthorized` responses and automatically triggers silent `refresh` token rotation, instantly retrying the failed request without disrupting the user experience.

---

## 4. R2 Upload Architecture (Zero-Blocking Flow)

Files bypass the Express server to ensure performance:

1. Client requests `POST /api/memories/:id/images/presign`.
2. Server validates ownership and generates short-lived signed PUT URLs.
3. Client executes `axios.put(presignedUrl, binaryData)` directly to Cloudflare.
4. Client calls `/confirm`. Server verifies objects exist and commits URLs to MongoDB.

---

## 5. Summary of New Features

Tether is consistently updated. The recent architectural additions include:
- **Map / Geolocation Integration**: MongoDB coordinates tracking + Leaflet maps.
- **Daily Prompts Engine**: Specialized schemas and controllers to manage staggered, locked daily Q&A.
- **WebSockets / Real-time Sync**: `Socket.IO` implementation for instant presence and mood tracking.
- **Ideas Jar**: Custom frontend physics/animation component backed by the extended `Couple` schema.
