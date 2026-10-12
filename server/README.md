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

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment (`.env`)**:
   Create a `.env` file or edit existing:
   ```env
   PORT=5000
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

## Free Cloud Deployment (e.g. Render / Railway)

1. Create a free MongoDB Atlas database at [mongodb.com](https://www.mongodb.com/).
2. Push your repo to GitHub.
3. On Render.com or Railway.app, create a new Web Service pointing to the `server/` directory.
4. Set Environment Variable: `MONGODB_URI` = your MongoDB Atlas connection string.
5. In the Silver Catering web application, click the **Cloud Sync** button in the header, paste your deployed backend URL, and click **Sync Now**!
