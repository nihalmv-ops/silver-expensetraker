# Silver Catering Backend API

REST API backend for **Silver Catering — Event Income & Expense Calculator** built with **Node.js, Express, and MongoDB (Mongoose)**.

## Features

- **Event Management**: Create, Read, Update, Delete catering events with full itemized income and expense breakdowns.
- **Auto-Sync & Local Storage Preservation**: Safely migrates and synchronizes existing browser `localStorage` events with MongoDB cloud storage with zero data loss.
- **Custom Categories**: Synchronizes custom income and expense categories.
- **Graceful Offline Fallback**: The frontend continues functioning smoothly offline using `localStorage` even if the backend is temporarily unreachable.

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & MongoDB connection status |
| `GET` | `/api/events` | List all catering events |
| `GET` | `/api/events/:id` | Get single event details |
| `POST` | `/api/events` | Create or upsert event |
| `PUT` | `/api/events/:id` | Update event |
| `DELETE` | `/api/events/:id` | Delete event |
| `POST` | `/api/events/sync` | Safe bulk-sync & migration from `localStorage` |
| `GET` | `/api/categories` | Get custom income and expense categories |
| `POST` | `/api/categories` | Save categories |
| `POST` | `/api/categories/sync` | Merge and sync categories |

## How to Run Locally

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment (`.env`)**:
   Create a `.env` file or edit existing:
   ```env
   PORT=5050
   MONGODB_URI=mongodb://127.0.0.1:27017/silver_catering
   ```
   *(Or paste your MongoDB Atlas free cloud database connection string)*

4. **Start the server**:
   ```bash
   npm run dev
   # or
   npm start
   ```

5. The server will start on `http://localhost:5050`. Test via: `http://localhost:5050/api/health`.

## Free Cloud Deployment on Render.com

1. **Create Free MongoDB Cloud Database**:
   - Go to [mongodb.com](https://www.mongodb.com/) and create a free shared cluster.
   - Under Database Access, create a user and password.
   - Under Network Access, whitelist IP: `0.0.0.0/0` (allow access from anywhere).
   - Click **Connect** → **Drivers** and copy your connection string:
     `mongodb+srv://<username>:<password>@cluster0.mongodb.net/silver_catering?retryWrites=true&w=majority`

2. **Deploy on Render (render.com)**:
   - Log into [render.com](https://render.com) (sign in with your GitHub account).
   - Click **New +** → **Web Service**.
   - Select your GitHub repository: `nihalmv-ops/silver-expensetraker`.
   - Fill in the service configuration:
     - **Name**: `silver-catering-backend`
     - **Root Directory**: `backend`
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Instance Type**: `Free`
   - Scroll down to **Environment Variables** and click **Add Environment Variable**:
     - Key: `MONGODB_URI`
     - Value: `<your-mongodb-atlas-connection-string>`
   - Click **Deploy Web Service**!

3. **Connect Your Deployed Frontend**:
   - When deployment completes, Render will provide your public URL (e.g. `https://silver-catering-backend.onrender.com`).
   - Open your hosted frontend at [https://silverexpensetraker.vercel.app/](https://silverexpensetraker.vercel.app/).
   - Click the **Cloud Sync** (or **Local Storage**) button in the top header.
   - Paste your Render URL into **Backend API URL** and click **Test & Save**!
   - Your frontend will display 🟢 **Cloud Synced** and automatically upload and synchronize all your events to MongoDB with zero data loss!
