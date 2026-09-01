# Tether 🔗 - Comprehensive Documentation

This document serves as the central, comprehensive documentation for the **Tether** application. It details the system architecture, database models, API controllers, and frontend structure.

---

## 1. System Architecture Overview

Tether is a private, shared digital space for couples. It operates on a standard MERN-stack architecture with a few special features tailored for media storage and private coupling:

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
|   |                       Axios                        |    |
|   +----------------------------------------------------+    |
+-------------------------------------------------------------+
           |                                  | (Direct Image Upload)
           | (JSON / REST API)                v
           |                        +-----------------------+
           v                        |    Cloudflare R2      |
+--------------------------+        |   (Media Storage)     |
|   Server (Express.js)    |        +-----------------------+
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

- **Frontend:** React 18, Vite, React Router, Tailwind CSS, Axios.
- **Backend:** Node.js, Express 4, MongoDB (Mongoose).
- **Authentication:** JWT Access Tokens (Header) + Refresh Tokens (HttpOnly Cookie).
- **File Storage:** Direct-to-Cloudflare R2 uploads via Presigned URLs. ImageKit used for profile avatars.

The core design principle is that **two users share a single `Couple` entity**. Every resource (Memories, Gallery, LetterPages, Reels) is tied to a `coupleId`, ensuring isolated and secure sharing between partners.

---

## 2. Backend Documentation (`server/src/`)

### 2.1 Database Models

The MongoDB schema uses Mongoose. Below are the primary entities and their fields. The core relationship pivots around the `Couple` entity, which bridges two `User` documents.

```text
                        +-------------------+
                        |      Couple       |
                        |-------------------|
                        | _id               |
                        | inviteCode        |
                        | coupleNickname    |
                        +---------+---------+
                                  |
               +------------------+------------------+
               |                                     |
               v                                     v
     +-------------------+                 +-------------------+
     |       User        |                 |       User        |
     |-------------------|                 |-------------------|
     | _id               |                 | _id               |
     | name              |                 | name              |
     | coupleId (Ref)----|-----------------| coupleId (Ref)----|
     | role: 'admin'     |                 | role: 'partner'   |
     +-------------------+                 +-------------------+
               
               | (Shared Resources tied to coupleId)
               v
     +-------------------+      +-------------------+      +-------------------+
     |      Memory       |      |    SavedReel      |      |   LetterPage      |
     |-------------------|      |-------------------|      |-------------------|
     | coupleId (Ref)    |      | coupleId (Ref)    |      | coupleId (Ref)    |
     | createdBy (User)  |      | savedBy (User)    |      | createdBy (User)  |
     | images (R2 URLs)  |      | url               |      | content           |
     +-------------------+      +-------------------+      +-------------------+
```

#### `User`
Represents an individual user.
- `name` (String): Full name.
- `email` (String): Unique email.
- `passwordHash` (String): bcrypt hashed password (select: false).
- `coupleId` (ObjectId): Refers to the Couple they belong to.
- `role` (Enum): `admin` (creator of the couple) or `partner`.
- `avatarUrl`, `avatarFileId`: ImageKit storage details for profile pictures.
- **Profile fields**: `nickname`, `gender`, `dateOfBirth`, `bio`, `favouriteColour`, `currentStatus`, `hugsSent`.
- `onboardingComplete` (Boolean): Tracks if the initial setup is finished.

#### `Couple`
The central binding entity for two users.
- `members` (Array of ObjectId): Exactly 2 User IDs.
- `inviteCode` (String): Unique atomic code used to join the couple.
- `coupleNickname`, `relationshipStatus`, `coupleBio`: Shared profile information.
- `anniversaryDate` (Date): Special date.
- `milestones` (Array): Notable events `{ title, date, description }`.
- `bucketList` (Array): Shared goals `{ title, isCompleted, addedBy }`.
- `interactions` (Object): Counters for `hugCount` and `kissCount`.
- `themeSong` (String): Shared background track.

#### `Category`
Customizable tags/folders for memories and reels.
- `coupleId` (ObjectId)
- `name` (String, max: 50)
- `icon` (String): Emoji identifier.

#### `Memory`
A timestamped post containing photos and text.
- `coupleId`, `createdBy` (ObjectId)
- `title`, `description`, `location`
- `dateTaken` (Date)
- `images` (Array): `{ url, key, order }` representing R2 objects.
- `categoryId` (ObjectId)

#### `GalleryPhoto`
Standalone photos uploaded directly to the gallery feed.
- `coupleId`, `uploadedBy` (ObjectId)
- `url`, `key`: R2 storage locations.
- `title`, `caption`, `dateTaken`, `location`

#### `SavedReel`
Short video formats saved by the couple.
- `coupleId`, `savedBy` (ObjectId)
- `url`, `thumbnailUrl`, `caption`, `duration`
- `categoryId` (ObjectId)

#### `LetterPage`
Rich-text scrapbook letters between partners.
- `coupleId`, `createdBy` (ObjectId)
- `slug` (String): Unique URL-friendly identifier.
- `title`, `templateId` (Enum: classic, minimal, etc.), `palette`.
- `content`: `{ greeting, body, closing }`.
- `images` (Array): Photos attached to the letter from memories.

### 2.2 Controllers & API Routes

The backend controllers handle the business logic and interact with the Mongoose models.

#### `authController.js`
- `signup`: Creates the Couple and both Users (admin + partner placeholder) inside an atomic MongoDB transaction.
- `login`: Verifies credentials and sets cookies.
- `refresh`: Rotates the HttpOnly refresh token.
- `logout`: Clears auth cookies.
- `me`, `updateMe`, `updatePartner`: Profile management.
- `changePassword`, `completeOnboarding`, `uploadAvatar` (via multer & ImageKit).

#### `couplesController.js`
- `joinCouple`: Allows a new user to pair with an existing user via the 6-digit `inviteCode`. Updates the `Couple.members` array atomically.
- `getCouple`: Fetches couple data and populates member details.
- `updateCouple`: Edits shared properties (bio, nickname, themeSong).
- `addMilestone`, `addBucketListItem`, `toggleBucketList`, `sendHug`.

#### `categoriesController.js`
- `getAllCategories`: Returns all categories for the authenticated `coupleId`.
- `createCategory`, `updateCategory`, `deleteCategory`.

#### `memoriesController.js` & `galleryController.js`
- `getMemories`: Paginated feed of memories.
- `createMemory`: Initializes a memory document.
- `getPresignedUrls`: Generates Cloudflare R2 AWS SDK v3 presigned `PUT` URLs.
- `confirmUploads`: Validates the uploaded files in R2 and attaches the final URLs to the Memory document.
- `deleteMemory`: Removes the memory and orchestrates deletion of R2 objects.

#### `letterController.js`
- `getLetters`, `getLetterBySlug`, `createLetter`, `updateLetter`, `deleteLetter`.
- Manages the templated scrapbook data format.

### 2.3 Middleware

- `auth.js`: Verifies the `Authorization: Bearer <token>` header. If expired, it handles silent refresh token rotation and retries.
- `couple.js`: Ensures the authenticated user has a valid `coupleId` attached, preventing unauthorized cross-couple data access.
- `validate.js`: Generic Express-validator middleware for request schemas.
- `errorHandler.js`: Global error catcher mapping Mongoose/JWT errors to standard HTTP responses.

---

## 3. Frontend Documentation (`client/src/`)

The React application is built for maximum visual appeal and fluid transitions, heavily utilizing Context for state.

### 3.1 Contexts (Global State)

- **`AuthContext.jsx`**: Centralized authentication state. Exposes `user`, `login()`, `logout()`, `updateUser()`, and `signup()`. Intercepts Axios 401s to manage global unauthenticated states.
- **`ThemeContext.jsx`**: Manages visual themes, specifically handling the dynamic switching between "classic", "elegant", "scrapbook", etc., and passing CSS variables down the DOM tree.
- **`RadioContext.jsx`**: Manages the global audio player (`RadyoPlayer.jsx`). Exposes `currentTrack`, `isPlaying`, `play()`, `pause()`, ensuring continuous music playback across route transitions.

### 3.2 Pages & Routing (`App.jsx`)

Routing is managed via React Router v6. Notable wrappers include:
- `<ProtectedRoute>`: Redirects to `/login` if `!user`.
- `<PairedRoute>`: Redirects to `/pair` if `!user.isPaired`. Ensures only fully paired couples can access Dashboard/Gallery.

#### Key Pages:
- `Dashboard.jsx`: The central hub showing partner status, recent memories, and the bucket list.
- `Gallery.jsx`: A Masonry-grid layout combining `GalleryPhotos` and `Memory` images into one seamless visual feed.
- `Memories.jsx` / `NewMemory.jsx`: Form-heavy pages for uploading multi-image posts via the R2 presigned URL flow.
- `Letters.jsx` / `LetterEditor.jsx`: A rich-text templated editor for writing long-form notes.
- `Pair.jsx`: The onboarding step where a user inputs their partner's invite code.

### 3.3 Core Components

- **`BottomNav.jsx` & `Navbar.jsx`**: Responsive navigation that switches context based on mobile/desktop views.
- **`GlobalRadioWidget.jsx`**: A floating, persistent UI element tied to `RadioContext` to control music anywhere in the app.
- **`MemoryCard.jsx` / `ReelCard.jsx`**: Reusable display components with intersection observers for fade-in animations and lazy loading.
- **`GalleryLightbox.jsx`**: A modal component taking high-res image arrays and providing swipeable/clickable full-screen image viewing.

### 3.4 API Integrations (`api/`)

Axios is configured in `api/index.js` with interceptors:
- **Request Interceptor**: Automatically attaches the JWT `Authorization` header.
- **Response Interceptor**: Catches `401 Unauthorized`. If a request fails due to an expired token, it automatically triggers `POST /api/auth/refresh`, updates the header, and replays the failed request seamlessly.

Individual domains are separated into modules: `auth.api.js`, `memories.api.js`, `couples.api.js`, etc.

---

## 4. Security & Storage Flow

### Cloudflare R2 Upload Flow

The following diagram illustrates how media files are securely uploaded directly to Cloudflare without blocking the Node.js event loop:

```text
[ Client ]                            [ Express Server ]                        [ Cloudflare R2 ]
    |                                         |                                         |
    | 1. POST /api/memories/:id/images/presign|                                         |
    |---------------------------------------->|                                         |
    |                                         | 2. Validates user, memory, limits       |
    |                                         | 3. Generates signed PUT URLs (AWS SDK)  |
    | 4. Returns Array of Presigned URLs      |                                         |
    |<----------------------------------------|                                         |
    |                                         |                                         |
    | 5. PUT <presigned-url> (Binary Image)   |                                         |
    |-----------------------------------------|---------------------------------------->|
    |                                         |                                         |
    |                                         |                           6. Image Saved|
    | 7. HTTP 200 OK                          |                                         |<-- (Internal)
    |<----------------------------------------|-----------------------------------------|
    |                                         |                                         |
    | 8. POST /api/memories/:id/images/confirm|                                         |
    |---------------------------------------->|                                         |
    |                                         | 9. Verifies R2 Object Key Prefix        |
    |                                         | 10. Updates MongoDB Memory Doc          |
    | 11. Returns updated Memory (URLs)       |                                         |
    |<----------------------------------------|                                         |
```

1. Client selects images in `<GalleryUploadModal />` or `<NewMemory />`.
2. Client requests `POST /api/memories/:id/images/presign` with filenames and types.
3. Server validates types and returns short-lived (5 min) `PUT` URLs.
4. Client executes `axios.put(presignedUrl, file)`. The file goes **directly to Cloudflare**, completely bypassing the Node server.
5. Client requests `POST /api/memories/:id/images/confirm`. Server verifies the objects exist in R2 and saves the URLs to MongoDB.

### Data Isolation
Every Mongoose query for shared resources explicitly enforces the couple boundary:
```javascript
const memories = await Memory.find({ coupleId: req.user.coupleId });
```
Client inputs for `coupleId` are strictly ignored; the system entirely derives ownership from the JWT payload payload -> `req.user.coupleId`.

---

## 5. Exhaustive File Directory Index

Below is a complete, file-by-file breakdown of the entire codebase for reference:

### 5.1 Server (`server/`)
- `package.json` / `package-lock.json`: Node.js dependencies and run scripts.
- `.env` / `.env.example`: Environment variables and secrets configuration.
- `src/app.js`: Express application setup, global middleware, and route mounting (without starting the server).
- `src/server.js`: The entry point that connects to MongoDB and starts the Express server listening on the port.
- **`src/config/`**
  - `db.js`: MongoDB connection initialization logic.
  - `r2.js`: Cloudflare R2 / AWS S3 Client configuration.
- **`src/controllers/`**
  - `authController.js`: Handles signup, login, token refresh, and user profile management.
  - `categoriesController.js`: CRUD operations for memory/reel categories.
  - `couplesController.js`: Manages joining couples, relationship status, milestones, and bucket lists.
  - `galleryController.js`: Handles standalone gallery photo uploads and fetching.
  - `letterController.js`: CRUD operations for scrapbook-style letter pages.
  - `memoriesController.js`: Handles creating memories, fetching feeds, and coordinating R2 image uploads.
  - `reelsController.js`: Manages saving and fetching external video links (reels).
- **`src/middleware/`**
  - `auth.js`: Verifies JWT tokens and rotates refresh tokens automatically.
  - `couple.js`: Ensures the authenticated user belongs to a valid couple.
  - `errorHandler.js`: Centralized error catching and response formatting.
  - `logger.js`: Custom request logging middleware.
  - `requestId.js`: Assigns a unique trace ID to each incoming request.
  - `validate.js`: Request payload validation helper using Express Validator.
- **`src/models/`**
  - `Category.js`: Mongoose schema for user-defined tags/categories.
  - `Couple.js`: Mongoose schema for the core couple entity (members, bucket lists, milestones).
  - `GalleryPhoto.js`: Mongoose schema for standalone photos in the gallery.
  - `LetterPage.js`: Mongoose schema for rich-text scrapbook letters.
  - `Memory.js`: Mongoose schema for date-tied photo collections.
  - `SavedReel.js`: Mongoose schema for saved short-form video links.
  - `User.js`: Mongoose schema for individual user accounts and profiles.
- **`src/routes/`**
  - `auth.js`, `categories.js`, `couples.js`, `gallery.js`, `letters.js`, `memories.js`, `reels.js`: Express routers mapping HTTP endpoints to their respective controllers.
- **`src/services/`**
  - `imagekit.js`: Service for uploading and deleting profile avatars via ImageKit.
  - `storage/index.js`: Dynamic storage abstraction routing to either Local or R2 storage based on environment.
  - `storage/localProvider.js`: Development storage provider saving files to local disk.
  - `storage/r2Provider.js`: Production storage provider interacting with Cloudflare R2 via presigned URLs.
  - `storage/imagekitProvider.js`: Wrapper for ImageKit operations.
- **`src/utils/`**
  - `generateInviteCode.js`: Helper to generate 6-character alphanumeric couple invite codes.
  - `seedDevUser.js`: Development utility to seed the initial `dev@tether.local` mock users.
  - `tokens.js`: Helper for generating JWT access and refresh tokens, and setting HttpOnly cookies.
  - `validateEnv.js`: Ensures all required environment variables are present on startup.

### 5.2 Client (`client/`)
- `package.json` / `package-lock.json`: Frontend dependencies (React, Vite, Tailwind).
- `index.html`: The root HTML template.
- `vite.config.js`: Vite bundler configuration.
- `src/main.jsx`: React DOM rendering entry point.
- `src/App.jsx`: Main routing configuration using React Router.
- `src/index.css` / `src/App.css`: Global Tailwind CSS imports and custom base styles.
- **`src/api/`**
  - Handles Axios configuration, JWT interceptors, and API wrappers for specific domains (auth, memories, couples, etc.).
- **`src/context/`**
  - `AuthContext.jsx`: Provides global user state and authentication methods.
  - `RadioContext.jsx`: Manages background audio playback state.
  - `ThemeContext.jsx`: Manages global visual themes (e.g., swapping CSS variables for different letter templates).
- **`src/components/`**
  - `BackgroundTheme.jsx`: Handles dynamic background styling based on context/theme.
  - `BottomNav.jsx`: Mobile-focused bottom navigation bar.
  - `ConfirmationModal.jsx`: Reusable modal for destructive actions (e.g., delete).
  - `CustomAudioPlayer.jsx`: Reusable UI for playing audio files.
  - `CustomColorPicker.jsx`: Reusable color selection input.
  - `CustomDatePicker.jsx`: Reusable date selection input.
  - `CustomDropdown.jsx`: Reusable dropdown menu UI.
  - `EmptyState.jsx`: UI to display when lists (memories, letters) are empty.
  - `FallingLeaves.jsx`: Animated visual effect overlay.
  - `GlobalRadioWidget.jsx`: Floating mini-player connected to `RadioContext`.
  - `LoadingSpinner.jsx`: Global loading state indicator.
  - `MemoryCard.jsx`: UI component to display a single Memory in the feed.
  - `MemoryViewer.jsx`: Expanded view for a single Memory.
  - `Navbar.jsx`: Desktop top navigation bar.
  - `PairedRoute.jsx`: Route wrapper enforcing couple status.
  - `PartnerStatusWidget.jsx`: Dashboard widget showing partner's current status (e.g., "Sleeping", "Working").
  - `ProtectedRoute.jsx`: Route wrapper enforcing authentication.
  - `RadyoPlayer.jsx`: Main audio player interface.
  - `ReelCard.jsx`: UI component to display a single Saved Reel.
  - `Sidebar.jsx`: Desktop side navigation panel.
  - `ThemeToggle.jsx`: Button to toggle between light/dark or specific app themes.
  - **`gallery/`**: `GalleryGrid.jsx` (Masonry layout), `GalleryLightbox.jsx` (Full-screen image viewer), `GalleryPicker.jsx`, `GalleryUploadModal.jsx`.
  - **`letters/`**: `LetterRenderer.jsx`, and template variations (`ClassicTemplate.jsx`, `ElegantTemplate.jsx`, `MinimalTemplate.jsx`, `ScrapbookTemplate.jsx`, `VintageTemplate.jsx`).
  - **`ui/`**: Base UI elements (like buttons, inputs).
- **`src/pages/`**
  - `Dashboard.jsx`: Central hub (partner status, bucket list, recent memories).
  - `EditMemory.jsx`: Page to modify an existing memory.
  - `Gallery.jsx`: Continuous masonry feed of photos.
  - `LetterDetail.jsx`: Read-only view of a scrapbook letter.
  - `LetterEditor.jsx`: Rich-text editor for creating a new letter.
  - `Letters.jsx`: Grid view of all written letters.
  - `Login.jsx` / `Signup.jsx`: Authentication entry pages.
  - `Memories.jsx`: List view of all memories.
  - `NewMemory.jsx`: Multi-step form for creating a new memory and uploading images.
  - `NewReel.jsx`: Form for saving a new reel.
  - `Onboarding.jsx`: Post-signup profile setup.
  - `Pair.jsx`: Input screen for the partner invite code.
  - `Profile.jsx`: User profile editing and couple settings.
  - `Radyo.jsx`: Dedicated page for the shared audio player.
  - `Reels.jsx`: Grid view of all saved reels.
- **`src/utils/`**
  - `db.js`: IndexedDB integration for offline data caching.
