# 🌿 FoodLink – Food Redistribution System

A full-stack web application connecting **food donors** with **NGOs** to reduce food waste. Built with React.js, Node.js/Express, and MySQL with proper 3NF database design, concurrency control, and role-based access.

---

## 🏗️ Architecture Overview

```
foodlink/
├── backend/                   # Node.js + Express API
│   ├── db/
│   │   └── database.js        # MySQL pool + auto schema init (3NF)
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js            # /api/auth — signup, login
│   │   ├── food.js            # /api/food — CRUD for listings
│   │   ├── requests.js        # /api/requests — NGO requests w/ locking
│   │   ├── transactions.js    # /api/transactions — history & stats
│   │   └── cities.js          # /api/cities — city list
│   └── server.js              # Express entry point
│
└── frontend/                  # React.js + Tailwind CSS
    └── src/
        ├── context/
        │   └── AuthContext.jsx  # Global auth state + axios instance
        ├── components/
        │   ├── Navbar.jsx       # Responsive top navigation
        │   ├── FoodCard.jsx     # Priority-aware food listing card
        │   ├── RequestModal.jsx # Quantity request dialog
        │   └── StatCard.jsx     # Dashboard statistics card
        ├── pages/
        │   ├── Login.jsx        # Authentication
        │   ├── Signup.jsx       # Role-based registration
        │   ├── Dashboard.jsx    # Role-aware dashboard with stats
        │   ├── AddFood.jsx      # Donor: create food listing
        │   ├── MyListings.jsx   # Donor: manage listings + view requests
        │   ├── BrowseFood.jsx   # NGO: priority-sorted food browse
        │   ├── MyRequests.jsx   # NGO: manage their requests
        │   └── Transactions.jsx # Transaction history (both roles)
        └── utils/
            └── helpers.js       # Date, quantity, status formatters
```

---

## 🗃️ Database Schema (3NF)

```sql
Cities(city_id PK, city_name UNIQUE)

Users(user_id PK, name, email UNIQUE, password, role ENUM('donor','ngo'),
      city_id FK→Cities, state, pincode, contact, created_at)

Food_Listings(food_id PK, donor_id FK→Users, food_name, food_type,
              is_veg BOOL, total_quantity, remaining_quantity, unit,
              expiry_time, city_id FK→Cities, state, pincode,
              status ENUM('available','partially_allocated','fully_allocated','expired'),
              description, created_at)

Requests(request_id PK, food_id FK→Food_Listings, ngo_id FK→Users,
         requested_quantity, allocated_quantity, 
         status ENUM('pending','approved','partially_approved','rejected','cancelled'),
         request_time, updated_at)

Transactions(transaction_id PK, food_id FK→Food_Listings,
             donor_id FK→Users, ngo_id FK→Users,
             allocated_quantity, completed_at)
```

---

## 🔒 Concurrency Control

The request endpoint (`POST /api/requests`) uses:
1. **`BEGIN TRANSACTION`** — wraps the entire allocation logic atomically
2. **`SELECT ... FOR UPDATE`** — row-level lock on `Food_Listings` prevents race conditions when multiple NGOs request simultaneously
3. **Partial allocation** — if requested qty > available, only available qty is allocated and status set to `partially_approved`
4. **Automatic status update** — listing transitions: `available → partially_allocated → fully_allocated`

```
NGO-A requests 30kg ──┐
NGO-B requests 20kg ──┤──► Only one gets lock at a time (FOR UPDATE)
                       │    Remaining is atomically decremented
NGO-C requests 15kg ──┘    No double-allocation possible
```

---

## 📊 Priority Algorithm (NGO Browse)

Results are ordered by a computed `priority_score`:

| Score | Condition | Label |
|-------|-----------|-------|
| 4 | Expiry within 5 hours | 🔴 Expiring Soon |
| 3 | Same pincode as NGO | 📍 Near You |
| 2 | Same city as NGO | 🏙️ Same City |
| 1 | Same state as NGO | 🗺️ Same State |
| 0 | Other | — |

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** v18+
- **MySQL** 8.0+
- **npm** v9+

---

### 1. Clone & Navigate

```bash
cd foodlink
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your MySQL credentials
nano .env   # or use any text editor

# Install dependencies
npm install

# Start the server (auto-creates DB + tables)
npm start
```

> The server auto-initializes the `foodlink` database and all tables on first run. No manual SQL import needed.

**Backend runs at:** `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs at:** `http://localhost:3000`

---

### 4. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | MySQL host |
| `DB_USER` | `root` | MySQL username |
| `DB_PASSWORD` | *(empty)* | MySQL password |
| `DB_NAME` | `foodlink` | Database name |
| `JWT_SECRET` | `foodlink_secret_key_2024` | JWT signing secret |
| `PORT` | `5000` | Backend port |

---

## 🧪 Test the Application

### Register as Donor
1. Go to `http://localhost:3000/signup`
2. Click **Food Donor** → fill form → Create Account
3. Add food: Dashboard → **Add Food**

### Register as NGO
1. Open new browser/incognito → `http://localhost:3000/signup`
2. Click **NGO / Charity** → fill same city/pincode as donor → Create Account
3. Browse: **Browse Food** → click **Request Food**

### Test Concurrency
Open two NGO sessions simultaneously and request the same food listing — the row lock ensures only one is processed at a time without double allocation.

---

## 📡 API Reference

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/signup` | — | — | Register user |
| POST | `/api/auth/login` | — | — | Login |
| GET | `/api/food` | ✓ | any | List food (priority sorted) |
| POST | `/api/food` | ✓ | donor | Create food listing |
| GET | `/api/food/my` | ✓ | donor | My listings |
| GET | `/api/food/:id` | ✓ | any | Single listing |
| POST | `/api/requests` | ✓ | ngo | Submit request (with locking) |
| GET | `/api/requests/my` | ✓ | ngo | NGO's requests |
| GET | `/api/requests/food/:id` | ✓ | donor | Requests for listing |
| GET | `/api/requests/donor-requests` | ✓ | donor | All requests on donor's food |
| PATCH | `/api/requests/:id/cancel` | ✓ | ngo | Cancel request |
| GET | `/api/transactions` | ✓ | any | Transaction history |
| GET | `/api/transactions/stats` | ✓ | any | Dashboard statistics |
| GET | `/api/cities` | — | — | Cities list |

---

## 🎨 Design Highlights

- **Typography:** Playfair Display (display) + DM Sans (body)
- **Color System:** Green-forward brand palette with semantic status colors
- **Responsive:** Mobile-first with collapsible navigation
- **Animations:** Fade-in on page load, slide-up on cards, pulse on urgent items
- **Accessibility:** Focus rings, proper contrast, semantic HTML

---

## 🔧 Production Notes

For production deployment:
1. Set a strong `JWT_SECRET` in `.env`
2. Build frontend: `cd frontend && npm run build`
3. Serve `frontend/dist/` via nginx or Express static middleware
4. Use PM2 or similar for backend process management
5. Enable MySQL SSL for production databases

---

*Built with ❤️ to reduce food waste and connect communities.*
