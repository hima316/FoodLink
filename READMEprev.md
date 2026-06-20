# 🌱 FoodLink — Smart Food Redistribution Platform

> Connecting hotels & restaurants with NGOs and volunteers to reduce food waste and fight hunger.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat&logo=typescript)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat&logo=mongodb)](https://mongodb.com/atlas)
[![Express](https://img.shields.io/badge/Express-4.18-gray?style=flat&logo=express)](https://expressjs.com)

---

## 📁 Project Structure

```
foodlink/
├── backend/                   # Express.js + TypeScript API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts    # MongoDB Atlas connection
│   │   │   ├── env.ts         # Validated env config
│   │   │   └── logger.ts      # Winston logger
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── donationController.ts
│   │   │   ├── userController.ts
│   │   │   ├── analyticsController.ts
│   │   │   └── notificationController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts        # JWT verify + RBAC
│   │   │   └── errorHandler.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Donation.ts
│   │   │   └── Notification.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── donations.ts
│   │   │   ├── users.ts
│   │   │   ├── analytics.ts
│   │   │   ├── notifications.ts
│   │   │   └── index.ts
│   │   ├── types/index.ts     # All TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── response.ts
│   │   │   └── seed.ts
│   │   └── index.ts           # App entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── frontend/                  # Next.js 15 + TypeScript
    ├── app/
    │   ├── layout.tsx          # Root layout + providers
    │   ├── page.tsx            # Landing page
    │   ├── auth/
    │   │   ├── layout.tsx      # Split-screen auth layout
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   └── dashboard/
    │       ├── layout.tsx      # Protected dashboard wrapper
    │       ├── page.tsx        # Role redirect
    │       ├── hotel/
    │       │   ├── page.tsx            # Hotel overview
    │       │   ├── donations/page.tsx  # Manage donations
    │       │   ├── new-donation/page.tsx
    │       │   ├── map/page.tsx
    │       │   └── analytics/page.tsx
    │       ├── ngo/
    │       │   ├── page.tsx            # NGO overview + live feed
    │       │   ├── feed/page.tsx       # Full donation feed
    │       │   ├── map/page.tsx
    │       │   └── analytics/page.tsx
    │       ├── volunteer/
    │       │   ├── page.tsx            # Volunteer overview
    │       │   └── map/page.tsx
    │       ├── admin/
    │       │   ├── page.tsx            # Admin overview
    │       │   └── users/page.tsx      # User management
    │       ├── analytics/page.tsx      # Full analytics
    │       ├── notifications/page.tsx
    │       ├── chatbot/page.tsx        # Gemini AI chatbot
    │       └── settings/page.tsx
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── DashboardHeader.tsx
    │   ├── dashboard/
    │   │   ├── StatCard.tsx
    │   │   └── DonationCard.tsx
    │   ├── landing/
    │   │   └── LandingClient.tsx
    │   └── shared/
    │       └── MapView.tsx        # Leaflet map component
    ├── context/
    │   └── authStore.ts           # Zustand auth state
    ├── lib/
    │   ├── api.ts                 # Axios + token interceptors
    │   ├── auth.ts                # Auth API service
    │   ├── donations.ts           # Donation API service
    │   └── utils.ts               # Helpers & formatters
    ├── types/index.ts
    ├── styles/globals.css
    ├── tailwind.config.ts
    └── next.config.ts
```

---

## 🚀 Phase 1 — Quick Start

### Prerequisites
- Node.js v18+ and npm v9+
- MongoDB Atlas account (free tier works)
- Git

---

### 1. Clone & Install

```bash
# Clone the repo
git clone https://github.com/your-username/foodlink.git
cd foodlink

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/foodlink?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_very_long_random_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=another_very_long_random_secret_key_min_32_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:3000
```

> **Get MongoDB URI:** Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free cluster → Connect → Copy connection string

---

### 3. Frontend Configuration

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key  # Optional for chatbot
```

> **Get Gemini API key:** Go to [aistudio.google.com](https://aistudio.google.com/app/apikey) → Create API key (free)

---

### 4. Seed the Database

```bash
cd backend
npm run seed
```

This creates sample users, donations, and data.

**Demo Login Credentials:**
| Role       | Email                              | Password     |
|------------|------------------------------------|--------------|
| 👑 Admin   | admin@foodlink.com                 | Admin@1234   |
| 🏨 Hotel   | hotel@grandpalace.com              | Hotel@1234   |
| 🏨 Hotel 2 | info@spicegardenrestaurant.com     | Hotel@1234   |
| 🏛 NGO     | contact@feedthehungry.org         | NGO@1234     |
| 🏛 NGO 2   | info@annapoornaseva.org            | NGO@1234     |
| 🚗 Volunteer | amit.volunteer@gmail.com         | Vol@1234     |

---

### 5. Start Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → Server running at http://localhost:5000
# → API docs: http://localhost:5000/api/v1/health
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → App running at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔌 REST API Reference

Base URL: `http://localhost:5000/api/v1`

### Auth
| Method | Endpoint              | Description              | Auth |
|--------|-----------------------|--------------------------|------|
| POST   | `/auth/register`      | Create new account       | ❌   |
| POST   | `/auth/login`         | Login, get tokens        | ❌   |
| POST   | `/auth/refresh`       | Refresh access token     | ❌   |
| POST   | `/auth/logout`        | Logout, clear token      | ✅   |
| GET    | `/auth/me`            | Get current user         | ✅   |

### Donations
| Method | Endpoint                           | Description           | Role          |
|--------|------------------------------------|-----------------------|---------------|
| GET    | `/donations`                       | List with filters     | All           |
| GET    | `/donations/:id`                   | Single donation       | All           |
| POST   | `/donations`                       | Create donation       | Hotel, Admin  |
| PATCH  | `/donations/:id/claim`             | Claim donation        | NGO           |
| PATCH  | `/donations/:id/assign-volunteer`  | Assign volunteer      | NGO, Admin    |
| PATCH  | `/donations/:id/deliver`           | Mark delivered        | Volunteer     |
| DELETE | `/donations/:id`                   | Cancel donation       | Hotel, Admin  |

### Users
| Method | Endpoint                 | Description        | Role  |
|--------|--------------------------|--------------------|-------|
| GET    | `/users/profile`         | My profile         | All   |
| PATCH  | `/users/profile`         | Update profile     | All   |
| GET    | `/users/volunteers`      | List volunteers    | All   |
| GET    | `/users/ngos`            | List NGOs          | All   |
| GET    | `/users`                 | All users          | Admin |
| PATCH  | `/users/:id/status`      | Update status      | Admin |

### Analytics
| Method | Endpoint                  | Description         | Auth |
|--------|---------------------------|---------------------|------|
| GET    | `/analytics/overview`     | Platform stats      | ✅   |
| GET    | `/analytics/monthly`      | Monthly chart data  | ✅   |
| GET    | `/analytics/my-stats`     | Role-based stats    | ✅   |

### Notifications
| Method | Endpoint                        | Description     | Auth |
|--------|---------------------------------|-----------------|------|
| GET    | `/notifications`                | My notifications| ✅   |
| PATCH  | `/notifications/read-all`       | Mark all read   | ✅   |
| PATCH  | `/notifications/:id/read`       | Mark one read   | ✅   |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                  │
│  Landing  →  Auth  →  Dashboard (role-based)              │
│  Zustand (auth state) + Axios (API client)                │
│  Tailwind CSS + Framer Motion + Leaflet Maps              │
│  Recharts (analytics) + Gemini AI (chatbot)               │
└─────────────────────────────────────────────────────────┘
                            │ HTTPS / REST
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Express.js + TS)                │
│  Rate Limiter → JWT Auth → RBAC → Controllers            │
│  Helmet + CORS + Compression + MongoSanitize             │
│  Winston Logger + Error Handler                          │
└─────────────────────────────────────────────────────────┘
                            │ Mongoose
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  MONGODB ATLAS                            │
│  Users  |  Donations  |  Notifications                   │
│  Geospatial 2dsphere indexes for map queries             │
│  TTL index on notifications (30 days auto-delete)        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Auth Flow

1. User registers/logs in → server returns `{ accessToken, refreshToken }`
2. Tokens stored in **cookies** (httpOnly-safe via js-cookie)
3. Every API request attaches `Authorization: Bearer <accessToken>`
4. On **401** → Axios interceptor auto-refreshes using `refreshToken`
5. On failed refresh → clears cookies, redirects to `/auth/login`
6. Logout → invalidates `refreshToken` in database

---

## 🎨 Design System

| Category    | Value                                      |
|-------------|--------------------------------------------|
| Font (body) | Plus Jakarta Sans                          |
| Font (heading)| Syne                                     |
| Primary     | Forest Green `#166534`                     |
| Accent      | Fresh Green `#22c55e`                      |
| Earth       | Warm Amber `#d97706`                       |
| Ocean       | Deep Blue `#1d4ed8`                        |
| Dark BG     | `hsl(150, 15%, 6%)`                        |
| Radius      | `0.75rem` (cards), `1.5rem` (modals)       |

---

## 🌍 Deployment

### Backend → Render

1. Create account at [render.com](https://render.com)
2. New Web Service → Connect your GitHub repo
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && npm start`
5. Add all environment variables from `.env.example`
6. Deploy → Copy the service URL (e.g. `https://foodlink-api.onrender.com`)

### Frontend → Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. From `frontend/` directory: `vercel`
3. Or push to GitHub and connect at [vercel.com](https://vercel.com)
4. Add env variables:
   - `NEXT_PUBLIC_API_URL` = your Render URL + `/api/v1`
   - `NEXT_PUBLIC_GEMINI_API_KEY` = your Gemini key

### MongoDB Atlas

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free M0 cluster
3. Network Access → Add IP `0.0.0.0/0` (allow all, or use specific IPs)
4. Database Access → Create user
5. Connect → Copy connection string to backend `MONGODB_URI`

---

## 📦 Key Dependencies

### Backend
| Package              | Purpose                        |
|----------------------|--------------------------------|
| express              | Web framework                  |
| mongoose             | MongoDB ODM                    |
| jsonwebtoken         | JWT auth                       |
| bcryptjs             | Password hashing               |
| helmet               | Security HTTP headers          |
| express-rate-limit   | API rate limiting              |
| express-mongo-sanitize | NoSQL injection prevention   |
| express-validator    | Request validation             |
| winston              | Structured logging             |
| compression          | Response compression           |

### Frontend
| Package          | Purpose                          |
|------------------|----------------------------------|
| next             | React framework (App Router)     |
| typescript       | Type safety                      |
| tailwindcss      | Utility CSS                      |
| framer-motion    | Animations                       |
| zustand          | Global state (auth)              |
| axios            | HTTP client + interceptors       |
| leaflet          | Interactive maps                 |
| react-leaflet    | React wrapper for Leaflet        |
| recharts         | Charts & graphs                  |
| next-themes      | Dark/light mode                  |
| react-hot-toast  | Toast notifications              |
| date-fns         | Date formatting                  |
| js-cookie        | Cookie management                |

---

## 🔮 Development Phases

| Phase | Status | Features |
|-------|--------|----------|
| ✅ Phase 1 | Complete | Auth, DB, RBAC, landing page, dashboards skeleton |
| ✅ Phase 2 | Complete | Role dashboards, donation CRUD, NGO feed, filters |
| ✅ Phase 3 | Complete | Leaflet maps, notifications, countdown timers |
| ✅ Phase 4 | Complete | Analytics charts, Gemini AI chatbot |
| 🔄 Phase 5 | Ready | Deploy to Vercel + Render |

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License. Built for social impact — use freely to fight food waste and hunger.

---

<p align="center">
  Built with ♻️ by the FoodLink Team · Reducing food waste, one meal at a time 🌱
</p>
