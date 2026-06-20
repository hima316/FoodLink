# 🌱 FoodLink — Smart Food Redistribution Platform

> Connecting surplus food from hotels & restaurants to NGOs and communities in need, with real-time logistics powered by volunteers.

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Workflow / Process Flow](#-workflow--process-flow)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Local Setup Instructions](#-local-setup-instructions)
- [Environment Variables](#-environment-variables)
- [Demo Accounts](#-demo-accounts)
- [Deployment Guide](#-deployment-guide)
- [API Overview](#-api-overview)
- [Future Improvements](#-future-improvements)

---

## 🎯 Problem Statement

Every day, hotels and restaurants discard large quantities of surplus, edible food due to overproduction, cancelled events, or buffet leftovers — while NGOs and shelters nearby struggle to source enough food to feed people in need.

The core issues are:
1. **No real-time visibility** — hotels don't know which NGOs need food right now
2. **No coordination layer** — even when a hotel wants to donate, there's no fast way to connect with an NGO and arrange pickup
3. **No logistics support** — NGOs often lack the manpower to physically collect food across a city
4. **Time-sensitive nature** — food spoils quickly, so delays mean wasted donations
5. **No accountability** — no way to track what was donated, picked up, delivered, or measure real impact

---

## 💡 Solution

**FoodLink** is a three-sided marketplace that closes this gap with a structured, role-based platform:

| Role | What they do |
|---|---|
| 🏨 **Hotels/Restaurants** | Post surplus food with quantity, expiry time, and pickup location |
| 🏛️ **NGOs/Charities** | Browse a live feed, claim donations, and assign volunteers |
| 🚗 **Volunteers** | Get assigned pickups, collect food, and deliver it to NGOs |
| 👑 **Admin** | Oversees the entire platform, manages users, and monitors activity |

The platform automates **notification, claiming, logistics assignment, and tracking** — so the only manual step left for a hotel is clicking "Post Donation," and for a volunteer is physically driving the food from A to B.

---

## 🛠 Tech Stack

### Frontend
- **Next.js 15** (App Router) — React framework
- **TypeScript** — type safety across the app
- **Tailwind CSS** — utility-first styling
- **Framer Motion** — animations and transitions
- **Leaflet.js + OpenStreetMap** — interactive maps (100% free, no API key)
- **Recharts** — analytics charts and graphs
- **Zustand** — lightweight global state management
- **Axios** — HTTP client
- **React Hot Toast** — notifications/toasts

### Backend
- **Node.js + Express.js** — REST API server
- **TypeScript** — type safety
- **MongoDB Atlas** — cloud NoSQL database (free tier)
- **Mongoose** — MongoDB ODM
- **JWT (jsonwebtoken)** — authentication (access + refresh tokens)
- **bcryptjs** — password hashing
- **express-rate-limit, helmet, express-mongo-sanitize** — security middleware
- **Nominatim (OpenStreetMap)** — free geocoding (address → coordinates)
- **Winston** — logging

### AI
- **Google Gemini 1.5 Flash** (optional, free tier) — powers the in-app chatbot, with a built-in fallback knowledge base if no API key is provided

### Hosting (all free tiers)
- **Vercel** — frontend hosting
- **Render** — backend hosting
- **MongoDB Atlas** — database hosting

---

## 🏗 System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Hotel Dashboard]
        B[NGO Dashboard]
        C[Volunteer Dashboard]
        D[Admin Dashboard]
    end

    subgraph "Frontend - Vercel"
        E[Next.js 15 App Router]
        F[Zustand Auth Store]
        G[Leaflet Maps]
    end

    subgraph "Backend - Render"
        H[Express REST API]
        I[JWT Auth Middleware]
        J[Rate Limiter]
        K[Controllers]
    end

    subgraph "Database - MongoDB Atlas"
        L[(Users Collection)]
        M[(Donations Collection)]
        N[(Notifications Collection)]
    end

    subgraph "External Services - Free"
        O[Nominatim Geocoding API]
        P[Google Gemini API - Optional]
    end

    A & B & C & D --> E
    E --> F
    E --> G
    E -->|HTTPS REST calls| H
    H --> I --> J --> K
    K --> L
    K --> M
    K --> N
    K -->|Geocode addresses| O
    E -->|Chatbot queries| P

    style E fill:#16a34a,color:#fff
    style H fill:#2563eb,color:#fff
    style L fill:#7c3aed,color:#fff
    style M fill:#7c3aed,color:#fff
    style N fill:#7c3aed,color:#fff
```

---

## 🔄 Workflow / Process Flow

### Full Donation Lifecycle

```mermaid
sequenceDiagram
    participant H as 🏨 Hotel
    participant API as Backend API
    participant DB as MongoDB
    participant N as 🏛️ NGO
    participant V as 🚗 Volunteer

    H->>API: POST /donations (food details + address)
    API->>API: Geocode address → lat/lng
    API->>DB: Save donation (status: available)
    API->>DB: Create notifications for all NGOs
    API-->>H: Donation posted ✅

    N->>API: GET /donations?status=available
    API->>DB: Query available, non-expired donations
    DB-->>N: Live feed of donations

    N->>API: PATCH /donations/:id/claim
    API->>DB: Update status → claimed, claimedBy = NGO
    API->>DB: Notify hotel
    API-->>N: Donation claimed ✅

    N->>API: GET /users/volunteers
    API-->>N: List of active volunteers

    N->>API: PATCH /donations/:id/assign-volunteer
    API->>DB: Update status → in_transit, volunteer = V
    API->>DB: Notify volunteer + hotel
    API-->>N: Volunteer assigned ✅

    V->>API: GET /donations?status=in_transit
    API-->>V: My active pickups

    Note over V: Physically picks up food<br/>from hotel and delivers to NGO

    V->>API: PATCH /donations/:id/deliver
    API->>DB: Update status → delivered
    API->>DB: Increment volunteer.totalPickups
    API-->>V: Marked delivered ✅

    N->>API: PATCH /donations/:id/rate-volunteer
    API->>DB: Save rating, recalculate volunteer average
    API-->>N: Rating submitted ⭐
```

### Donation Status State Machine

```mermaid
stateDiagram-v2
    [*] --> available: Hotel posts donation
    available --> claimed: NGO claims it
    available --> expired: Expiry time passes
    available --> cancelled: Hotel cancels
    claimed --> in_transit: NGO assigns volunteer
    claimed --> cancelled: Cancelled before pickup
    in_transit --> delivered: Volunteer marks delivered
    delivered --> [*]
    expired --> [*]
    cancelled --> [*]
```

### User Role Decision Flow

```mermaid
flowchart TD
    Start([User visits FoodLink]) --> Reg{Has account?}
    Reg -->|No| Role[Choose role at registration]
    Reg -->|Yes| Login[Login]

    Role --> Hotel[🏨 Hotel/Restaurant]
    Role --> NGO[🏛️ NGO/Charity]
    Role --> Vol[🚗 Volunteer]

    Hotel --> HD[Hotel Dashboard]
    NGO --> ND[NGO Dashboard]
    Vol --> VD[Volunteer Dashboard]
    Login --> Check{Check role}
    Check --> HD
    Check --> ND
    Check --> VD
    Check --> AD[👑 Admin Dashboard]

    HD --> Post[Post Donation]
    Post --> Notify1[NGOs notified instantly]

    ND --> Feed[Browse Live Feed]
    Feed --> Claim[Claim Donation]
    Claim --> Assign[Assign Volunteer]
    Assign --> Notify2[Volunteer notified]

    VD --> Pickup[View My Pickups]
    Pickup --> Deliver[Navigate & Deliver]
    Deliver --> Mark[Mark as Delivered]
    Mark --> Rate[NGO rates volunteer]

    style HD fill:#fbbf24
    style ND fill:#16a34a,color:#fff
    style VD fill:#3b82f6,color:#fff
    style AD fill:#a855f7,color:#fff
```

---

## ✨ Features

### 🏨 Hotel/Restaurant
- Post surplus food donations with category, quantity, expiry, temperature requirements, and allergens
- Pin exact pickup location on an interactive map (or auto-geocoded from address)
- Mark donations as Emergency for priority NGO visibility
- Track donation history (delivered, expired, cancelled)
- View nearby NGOs on a live map
- Personal impact analytics (meals saved, total donated)

### 🏛️ NGO/Charity
- Live feed of available donations, sorted by expiry urgency
- Search by city, filter by category or emergency status
- Claim donations with one click
- Assign volunteers from a ratings-sorted list via modal
- Dedicated Emergency Requests page
- Rate volunteers after delivery (1–5 stars + feedback)
- Live map showing donations and other NGOs

### 🚗 Volunteer
- Single unified "Active Pickups" page (simplified — no confusing sub-tabs)
- Navigate to pickup address with one click
- Mark deliveries complete (disabled automatically if food has expired)
- Delivery history with achievement badges
- Average rating displayed on profile

### 👑 Admin
- Full user management — activate, suspend, or verify any account
- View and cancel any donation platform-wide
- Dedicated emergency management page
- Platform-wide analytics and charts
- Live map of all activity across the platform

### 🤖 Shared Features
- **AI Chatbot** — built-in knowledge base + optional Google Gemini integration
- **Real-time notifications** — bell icon with unread count, triggered on every key action
- **Live interactive maps** — color-coded markers (green=available, red=emergency, amber=in-transit, blue=claimed, purple=delivered, sky-blue=NGO locations)
- **Expiry countdown** — color-changing timers on every donation card
- **Dark mode** support
- **Fully responsive** — works on mobile, tablet, desktop

---

## 📁 Project Structure

```
foodlink/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, logger
│   │   ├── controllers/     # Route handler logic
│   │   ├── middleware/      # Auth, rate limiting, error handling
│   │   ├── models/          # Mongoose schemas (User, Donation, Notification)
│   │   ├── routes/          # Express route definitions
│   │   ├── types/           # Shared TypeScript types
│   │   ├── utils/           # Geocoding, JWT helpers, response helpers
│   │   └── index.ts         # App entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── auth/             # Login, register pages
│   │   ├── dashboard/
│   │   │   ├── hotel/        # Hotel-specific pages
│   │   │   ├── ngo/          # NGO-specific pages
│   │   │   ├── volunteer/    # Volunteer-specific pages
│   │   │   ├── admin/        # Admin-specific pages
│   │   │   ├── chatbot/      # Shared AI assistant
│   │   │   ├── notifications/
│   │   │   └── settings/
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   ├── dashboard/        # DonationCard, StatCard, etc.
│   │   ├── layout/           # Sidebar, Header
│   │   └── shared/           # MapView, LocationPickerMap
│   ├── context/               # Zustand auth store
│   ├── lib/                   # API client, utils
│   ├── types/                 # Shared TypeScript types
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 💻 Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account
- [Git](https://git-scm.com/)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/foodlink.git
cd foodlink
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
```
Open `.env` and fill in your `MONGODB_URI` and JWT secrets (see [Environment Variables](#-environment-variables) below).

```bash
npm run seed   # Creates demo accounts and sample data
npm run dev    # Starts backend on http://localhost:5000
```

### 3. Frontend setup
Open a **new terminal**:
```bash
cd frontend
npm install
cp .env.example .env.local
```
Open `.env.local` and set `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`

```bash
npm run dev    # Starts frontend on http://localhost:3000
```

### 4. Open the app
Visit `http://localhost:3000` in your browser.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` / `production` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | Random 32+ char string |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | Different random string |
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime | `7d` |
| `FRONTEND_URL` | Deployed frontend URL (for CORS) | `https://your-app.vercel.app` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `200` |

### Frontend (`frontend/.env.local`)
| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://your-backend.onrender.com/api/v1` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | (Optional) Google Gemini key for live chatbot | Leave blank to use built-in fallback |

> ⚠️ **Never commit `.env` or `.env.local` files to GitHub.** They are already excluded via `.gitignore`.

---

## 👤 Demo Accounts

After running `npm run seed`, these accounts are available:

| Role | Email | Password |
|---|---|---|
| Admin | admin@foodlink.com | Admin@1234 |
| Hotel | hotel@grandpalace.com | Hotel@1234 |
| NGO | contact@feedthehungry.org | NGO@1234 |
| Volunteer | amit.volunteer@gmail.com | Vol@1234 |

---

## 🚀 Deployment Guide

> All services used below have a **free tier with no credit card required** for this project's scale.

### Overview of what goes where
| Component | Hosting platform | Cost |
|---|---|---|
| Database | MongoDB Atlas | Free (M0 cluster) |
| Backend API | Render | Free Web Service |
| Frontend | Vercel | Free Hobby plan |

---

### STEP 1 — Push your code to GitHub

#### 1.1 Create a GitHub repository
1. Go to [github.com/new](https://github.com/new)
2. Name it `foodlink` (or anything you like)
3. Leave it **Public** or **Private** — both work for free deployment
4. Do **NOT** initialize with a README (you already have one)
5. Click **Create repository**

#### 1.2 Initialize git locally and push
Open a terminal in your project's root folder (the one containing both `backend` and `frontend`):

```bash
git init
git add .
git status
```

Check the output of `git status` carefully — make sure **no `.env` files** appear in the list. If they do, your `.gitignore` isn't in the right place (it must be in the root folder, not inside `backend/` or `frontend/`).

```bash
git commit -m "Initial commit: FoodLink platform"
git branch -M main
git remote add origin https://github.com/<your-username>/foodlink.git
git push -u origin main
```

If prompted for credentials, use a [GitHub Personal Access Token](https://github.com/settings/tokens) instead of your password (GitHub no longer accepts plain passwords for git operations).

---

### STEP 2 — Prepare MongoDB Atlas for production

If you already created your MongoDB Atlas cluster during local setup, you only need to make **one change**:

#### 2.1 Allow access from anywhere
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Select your cluster → **Network Access** (left sidebar)
3. Click **Add IP Address**
4. Click **Allow Access From Anywhere** → this adds `0.0.0.0/0`
5. Click **Confirm**

> This is required because Render's servers use dynamic IPs that change on every deploy. Atlas needs to allow them. Your database is still protected by username/password authentication.

#### 2.2 Verify your database user has correct permissions
1. Go to **Database Access** (left sidebar)
2. Confirm your user has **Read and write to any database** role
3. Note down the username and password — you'll need them for the connection string

#### 2.3 Get your connection string
1. Go to **Database** → click **Connect** on your cluster
2. Choose **Drivers**
3. Copy the connection string — it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your actual credentials
5. Add `/foodlink` before the `?` to specify the database name:
   ```
   mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/foodlink?retryWrites=true&w=majority
   ```

Keep this connection string ready — you'll paste it into Render in Step 3.

---

### STEP 3 — Deploy the backend to Render

#### 3.1 Create a Render account
Go to [render.com](https://render.com) and sign up (you can use your GitHub account directly).

#### 3.2 Create a new Web Service
1. Click **New +** → **Web Service**
2. Click **Connect a repository** → authorize Render to access your GitHub
3. Select your `foodlink` repository

#### 3.3 Configure the service
| Setting | Value |
|---|---|
| **Name** | `foodlink-backend` (or any name) |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

> If your `backend/package.json` doesn't have a `build` script that compiles TypeScript, add this to `backend/package.json` scripts:
> ```json
> "build": "tsc",
> "start": "node dist/index.js"
> ```

#### 3.4 Add environment variables
Scroll to **Environment Variables** and add each one from your local `backend/.env` file:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | Your Atlas connection string from Step 2.3 |
| `JWT_ACCESS_SECRET` | Your secret (generate a new one for production) |
| `JWT_REFRESH_SECRET` | Your secret (generate a new one for production) |
| `JWT_ACCESS_EXPIRY` | `15m` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `FRONTEND_URL` | Leave blank for now — you'll update this after Step 4 |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `200` |

To generate fresh JWT secrets, run this locally:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Run it twice — once for each secret.

#### 3.5 Deploy
Click **Create Web Service**. Render will build and deploy automatically. Wait 2–5 minutes.

Once deployed, you'll get a URL like:
```
https://foodlink-backend.onrender.com
```

Copy this URL — you'll need it for the frontend.

> ⚠️ **Free tier note:** Render's free web services "sleep" after 15 minutes of inactivity. The first request after sleeping takes 30–60 seconds to wake up. This is normal and doesn't cost anything — just expect a delay on the first request after idle time.

#### 3.6 Seed the production database (optional but recommended)
To get demo accounts working on your live site, run the seed script once against your production database:

```bash
cd backend
# Temporarily point your local .env MONGODB_URI to the same Atlas cluster
npm run seed
```

This only needs to be done once.

---

### STEP 4 — Deploy the frontend to Vercel

#### 4.1 Create a Vercel account
Go to [vercel.com](https://vercel.com) and sign up using your GitHub account.

#### 4.2 Import your project
1. Click **Add New** → **Project**
2. Find and select your `foodlink` repository
3. Click **Import**

#### 4.3 Configure the project
| Setting | Value |
|---|---|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `frontend` ← **important, click "Edit" and set this** |
| **Build Command** | `next build` (default) |
| **Output Directory** | `.next` (default) |

#### 4.4 Add environment variables
In the **Environment Variables** section, add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://foodlink-backend.onrender.com/api/v1` (your Render URL + `/api/v1`) |
| `NEXT_PUBLIC_GEMINI_API_KEY` | (Optional) your Gemini key, or leave blank |

#### 4.5 Deploy
Click **Deploy**. Vercel builds and deploys automatically — takes about 2 minutes.

You'll get a URL like:
```
https://foodlink-yourname.vercel.app
```

---

### STEP 5 — Connect backend and frontend (final step)

Now that both are deployed, go back and link them:

#### 5.1 Update Render with your real frontend URL
1. Go to your Render dashboard → your backend service → **Environment**
2. Edit `FRONTEND_URL` → set it to your actual Vercel URL:
   ```
   https://foodlink-yourname.vercel.app
   ```
3. Save — Render will automatically redeploy

This step is critical because your backend's CORS settings only allow requests from `FRONTEND_URL`. Without this, your frontend will get CORS errors when calling the API.

#### 5.2 Verify everything works
1. Visit your Vercel URL
2. Try registering a new account
3. Try logging in with a demo account (if you seeded production data)
4. Test posting a donation, claiming it, checking the map

---

### Troubleshooting Deployment

| Problem | Likely cause | Fix |
|---|---|---|
| Frontend shows "Network Error" | `NEXT_PUBLIC_API_URL` wrong or missing `/api/v1` | Double check the env var in Vercel settings, redeploy |
| Backend shows CORS error in browser console | `FRONTEND_URL` not set or wrong in Render | Update it to match your exact Vercel URL (no trailing slash) |
| "Cannot connect to MongoDB" | IP not whitelisted | Re-check Atlas Network Access → Allow from Anywhere |
| First request after idle is very slow | Render free tier sleep | Normal — free tier behavior, wakes up in ~30-60 sec |
| Login works but page redirects to login again | Cookies/tokens not persisting | Make sure both URLs use `https://` (not mixed http/https) |
| Build fails on Render with TypeScript errors | Missing build script | Ensure `backend/package.json` has `"build": "tsc"` and `tsconfig.json` has `"outDir": "./dist"` |

---

## 📡 API Overview

Base URL: `https://your-backend.onrender.com/api/v1`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Create new account | No |
| POST | `/auth/login` | Login | No |
| POST | `/auth/refresh` | Refresh access token | No |
| GET | `/auth/me` | Get current user | Yes |
| GET | `/donations` | List donations (filtered by role) | Yes |
| POST | `/donations` | Create donation | Hotel only |
| PATCH | `/donations/:id/claim` | Claim a donation | NGO only |
| PATCH | `/donations/:id/assign-volunteer` | Assign volunteer | NGO only |
| PATCH | `/donations/:id/deliver` | Mark delivered | Volunteer |
| PATCH | `/donations/:id/rate-volunteer` | Rate volunteer | NGO only |
| GET | `/users/volunteers` | List active volunteers | NGO/Admin |
| GET | `/users/ngos` | List NGOs with locations | All |
| PATCH | `/users/profile` | Update own profile | Yes |
| PATCH | `/users/:id/verify` | Verify a user | Admin only |
| GET | `/analytics/my-stats` | Personal impact stats | Yes |
| GET | `/notifications` | Get notifications | Yes |

---

## 🔮 Future Improvements

- [ ] SMS/WhatsApp notifications via Twilio (free tier)
- [ ] Email notifications via Resend or SendGrid (free tier)
- [ ] Photo upload for donations (Cloudinary free tier)
- [ ] Push notifications (PWA)
- [ ] Donation impact certificates (PDF generation)
- [ ] Multi-language support
- [ ] Volunteer route optimization for multiple pickups

---

## 📄 License

This project is open source and available for educational and humanitarian use.

---

## 🙏 Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) & [Nominatim](https://nominatim.org/) for free mapping and geocoding
- [MongoDB Atlas](https://www.mongodb.com/atlas) for free database hosting
- [Vercel](https://vercel.com/) and [Render](https://render.com/) for free hosting tiers
