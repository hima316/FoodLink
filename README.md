# FoodLink — Smart Food Redistribution Platform

> Connecting surplus food from hotels & restaurants to NGOs and communities in need, with real-time delivery handled by volunteers.

🔗 **Deployed Link:** https://food-link-t.vercel.app

---

## Problem Statement

Every day, hotels and restaurants discard large quantities of surplus, edible food due to overproduction, cancelled events, or buffet leftovers — while NGOs and shelters nearby struggle to source enough food to feed people in need.

The core issues are:
- Lack of real-time coordination
- Limited logistics support
- Time-sensitive food expiry
- Lack of volunteer support 
- Poor visibility into donation impact

---

## Solution

**FoodLink** is a platform that closes this gap with a structured, role-based system:

| Role | What they do |
|---|---|
|  **Hotels/Restaurants** | Post surplus food with quantity, expiry time, and pickup location |
|  **NGOs/Charities** | Browse a live feed, claim donations, and assign volunteers |
|  **Volunteers** | Get assigned pickups, collect food, and deliver it to NGOs |
|  **Admin** | Oversees the entire platform, manages users, and monitors activity |

By combining real-time notifications, automated donation workflows, volunteer coordination, interactive maps, and end-to-end status tracking, FoodLink enables surplus food to be identified, claimed, transported, and delivered efficiently before it expires, while providing transparency and measurable impact for all stakeholders.
---

## Tech Stack

### Frontend
- Next.js 15
- React + TypeScript
- Tailwind CSS
- Leaflet Maps
- Recharts
- Zustand

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Winston

### AI & Deployment
- Google Gemini
- Vercel
- Render

---

## System Architecture

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

## Workflow / Process Flow

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
    API-->>N: Rating submitted 
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

## Features

### Hotel/Restaurant
- Create and manage surplus food donations
- Mark donations as Emergency for priority NGO visibility
- Track donation history 
- View nearby NGOs on map
- Personal impact analytics 

### NGO/Charity
- Live feed of available donations, sorted by expiry urgency
- Claim donations
- Assign volunteers from a ratings-sorted list 
- Map showing donations and other NGOs
- Personal impact analytics 

### Volunteer
- Navigate between pickup and delivery locations
- Mark deliveries complete
- Track pickup history
- Personal impact analytics 

### Admin
- Full user management — activate, suspend, or verify any account
- Platform-wide analytics and charts
- Live map of all activity across the platform

### Shared Features
- AI-powered FAQ assistant
- Real-time notifications
- Live Interactive maps
- Overall Analytics Page

---
## Local Setup Instructions

# Clone repository
```bash
git clone <repo-url>
```

# Backend
```bash
cd backend
npm install
p .env.example .env
```
Open `.env` and fill in your `MONGODB_URI` and JWT secrets.

```bash
npm run seed   # Creates demo accounts and sample data
npm run dev  
``` 

# Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
```
Open `.env.local` and set `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`

```bash
npm run dev

Open `http://localhost:3000` in your browser.

```

