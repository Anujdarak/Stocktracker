# Proximity MarketPulse - Full-Stack MERN Stock Tracker

Live Production Deployment:
- **Deployment link:** [https://stocktracker-self.vercel.app](https://stocktracker-self.vercel.app/?_vercel_share=qBwwfUOJFzY7JXaxlo0lXsKw43XAeaUG)

- ** google drive link**:https://drive.google.com/drive/folders/1C-mulr6owdEuv7yjUUj41BqCrQh9rrtB

- 

---

## Architecture Overview

```
┌─────────────────────────────────┐
│     Vercel (React + Vite)       │
│  - SPA Routing & Dashboard UI   │
│  - Environment: VITE_API_URL    │
└───────────────┬─────────────────┘
                │ HTTPS JSON API requests
                ▼
┌─────────────────────────────────┐
│    Render.com (Express/Node)    │
│  - Port 10000 / Dynamic host    │
│  - Express CORS Origin Reflector│
│  - Health checks & Auth (JWT)   │
└───────────────┬─────────────────┘
                │ TLS (Mongoose)
                ▼
┌─────────────────────────────────┐
│      MongoDB Atlas Cluster      │
│  - Network Access: 0.0.0.0/0    │
│  - Collections: users, watchlists│
│    userpreferences, history     │
└─────────────────────────────────┘
```

---

## 1. MongoDB Atlas Configuration (Crucial for Render)

Render uses dynamic cloud IP addresses that change on every deploy and restart. MongoDB Atlas requires allowing external connections:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. In the left navigation, select **Network Access** (under *Security*).
3. Click **+ Add IP Address**.
4. Click **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Confirm** (takes ~1 minute to become active).
6. Under **Database Access**, verify your database user credentials.
   > **Note:** If your password contains special characters (`@`, `:`, `#`, `%`, `/`), make sure they are URL-encoded in your URI string.
7. Click **Database** -> **Connect** -> **Drivers** (Node.js) and copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 2. Deploying Backend to Render

### Option A: Using Blueprint (Automatic via `render.yaml`)
1. In the [Render Dashboard](https://dashboard.render.com/), click **New** -> **Blueprint**.
2. Select this repository.
3. Render reads `render.yaml` and preconfigures:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/health`
4. Enter your `MONGODB_URI` and `GROQ_API_KEY` when prompted and click **Apply**.

### Option B: Manual Web Service Setup
1. In [Render Dashboard](https://dashboard.render.com/), click **New** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name:** `proximity-marketpulse-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default, Render sets this)
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
   - `MONGODB_DB_NAME`: `stocktracker`
   - `JWT_SECRET`: `your_random_secure_jwt_secret_key`
   - `GROQ_API_KEY`: `your_groq_api_key_here` (optional for AI chart/news analysis)
   - `GROQ_VISION_MODEL`: `qwen/qwen3.8-27b`
   - `GROQ_TEXT_MODEL`: `llama-3.3-70b-versatile`
5. Click **Deploy Web Service**.
6. When deployment finishes, copy your Render service URL (e.g., `https://your-backend.onrender.com`).
7. Verify by opening `https://your-backend.onrender.com/health` in your browser. You should see:
   ```json
   {
     "status": "healthy",
     "service": "Proximity MarketPulse API",
     "database": {
       "connected": true,
       "mode": "mongodb",
       "readyState": 1
     }
   }
   ```

---

## 3. Deploying Frontend to Vercel

1. In [Vercel Dashboard](https://vercel.com/dashboard), click **Add New** -> **Project**.
2. Select your repository.
3. In Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` (or `frontend` — both are supported out of the box with the included `vercel.json` files!)
4. Expand **Environment Variables** and add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://<your-backend-name>.onrender.com/api` (replace with your live Render backend URL)
   > **Note:** The frontend automatically cleans trailing slashes and ensures `/api` is appended, so either `https://your-backend.onrender.com` or `https://your-backend.onrender.com/api` works!
5. Click **Deploy**.

---

## 4. Local Development

Run both frontend and backend locally with:

```bash
# Install dependencies
npm --prefix backend install
npm --prefix frontend install

# Start backend (http://127.0.0.1:8000)
npm run backend

# Start frontend (http://localhost:5173)
npm run frontend

# Run integration tests
npm test
```
