# GupShup

GupShup is a React + Vite social media app that now includes a Node.js + Express backend with MongoDB Atlas, JWT auth, Socket.IO chat foundations, and Cloudinary-ready media handling.

The UI and routes were preserved as much as possible while replacing the main mock/localStorage-driven product flows with backend APIs.

## Stack

- Frontend: React, Vite, React Router
- Backend: Node.js, Express
- Database: MongoDB Atlas with Mongoose
- Auth: JWT access/refresh tokens
- Realtime: Socket.IO
- Validation: Zod
- Media: Cloudinary-ready upload helper

## Structure

```text
GupShup/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      utils/
      validators/
  src/
    lib/
    pages/
```

## Environment

Create `GupShup/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Create `GupShup/backend/.env`

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_ACCESS_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_NAME=GS Admin
ADMIN_EMAIL=gsadmin@gmail.com
ADMIN_PASSWORD=Gs@#6969
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Notes:

- `MONGODB_URI` is required.
- Cloudinary is optional. If not configured, media URLs still work in their current form.
- The backend bootstraps the admin account from env if those values are present.

## Install

Frontend:

```bash
cd GupShup
npm install
```

Backend:

```bash
cd GupShup/backend
npm install
```

## Run

Backend:

```bash
cd GupShup/backend
npm run dev
```

Frontend:

```bash
cd GupShup
npm run dev
```

## Implemented Features

- Signup
- Login with email or username
- Logout
- Current user restore
- Password hashing with bcrypt
- Profile completion with username and DOB validation
- Profile editing
- Change password
- Feed fetch
- Create post
- Edit post
- Delete post
- Like/unlike
- Bookmark/unbookmark
- Repost/unrepost
- Comment/reply
- Hide post
- Follow/unfollow suggested users
- Follow/unfollow feed handles
- Block/unblock handles
- Notifications persistence
- Bug report submission
- Admin bug report resolve/delete
- Chat conversations and messages persistence
- Socket.IO message delivery foundation
- Report post

## Verified

- Frontend production build passes with `npm run build`
- Backend app imports successfully when required env vars are present

## Practical Remaining Requirement

You still need to provide real MongoDB Atlas credentials, and optionally real Cloudinary credentials, to run the full project end-to-end against real services.
