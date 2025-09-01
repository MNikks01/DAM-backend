# Digital Asset Management

## Features

1. User Authentication (signup, login, logout)
2. Profile Management (View and update the personal information)
3. Upload multiple large files efficiently
4. Process assets in the background (e.g., generate thumbnails, compress videos, extract metadata)
5. Tag, categorize, and search assets based on content
6. Allow teams to preview, download, and share assets securely
7. Scale processing and storage as the volume grows

## Tech Stack

- Node.JS
- Express.JS
- Typescript
- MongoDB (mongoose)
- MinIO
- ioredis
- bullmq
- JWT
- zod
- Bcrypt.JS (password hashing)

## How to Run the App

1. Clone the repo:
   ```bash
   git clone https://github.com/NikhilMeshram01/Fitness-Tracking-App-Backend.git
   cd Fitness-Tracking-App-Backend
   ```
2. ```
   npm install

   ```

3. ```
   npm run build

   ```

4. ```
   npm start

   ```

## APIs

- POST /api/auth/register → Register new user
  POST /api/auth/login → Login
  POST /api/auth/logout → Logout
  GET /api/auth/me → Get current user

Upload Multiple Large Files Efficiently
1.Get Presigned PUT URL - POST /api/assets/presign
2.Confirm Upload & Create Asset- POST /api/assets/confirm

Background Asset Processing

- GET /api/jobs/:assetId → Get processing status for asset
  GET /api/jobs → (Admin/dev) List all jobs

Tag, Categorize, Search Assets

- GET /api/tags → Get all tags
  POST /api/tags → Create tag
  DELETE /api/tags/:id → Delete tag
  GET /api/categories → Get all categories
  POST /api/categories → Create category
  DELETE /api/categories/:id → Delete category

## MongoDB Collections

Installed

1. LibreOffice on Windows -> https://www.libreoffice.org/download/download/
2. ffmpeg + ffprobe on Windows -> https://www.gyan.dev/ffmpeg/builds/
