# ReLoop

**Give products another life.** A circular marketplace where people buy, sell, exchange, donate and repair products instead of throwing them away.

---

## Description

ReLoop is a full-stack marketplace application centered on the circular economy. Instead of a conventional "buy new" e-commerce flow, every listing on ReLoop can be **sold, exchanged, donated, or repaired**, and every completed transaction contributes to a user's personal **Impact Dashboard**, which estimates the waste and CO₂ avoided by choosing reuse over new production.

## Problem

Traditional online marketplaces optimize purely for transactions — list an item, sell an item, repeat. They don't:

- Make **exchange** (swapping goods instead of paying) a first-class transaction type.
- Support **donation** as a distinct, trackable workflow with pickup/acceptance logic.
- Connect items in poor condition to **repair providers** instead of the trash.
- Give users any feedback on the **environmental impact** of choosing reuse.

Rwanda (and most growing markets) generate a large amount of usable secondhand goods — electronics, furniture, clothing, appliances — that end up discarded simply because there's no dedicated, trustworthy channel to resell, swap, donate, or repair them locally.

## Solution

ReLoop is a **Django REST + React** marketplace purpose-built around five transaction types (`FOR_SALE`, `FOR_EXCHANGE`, `FREE_DONATION`, `SALE_OR_EXCHANGE`) and full workflows for each:

- A **rule-based exchange recommendation engine** ("You might exchange this for...") that explains *why* two products are a good swap (same category, similar value, similar condition, same location) — deliberately explainable, no black-box ML.
- A **donation request/accept/complete** flow that takes an item off the market once a donor accepts a recipient.
- A **repair marketplace** connecting `NEEDS_REPAIR` listings to real repair providers by specialization and location.
- An **Impact Calculation Service** that estimates kg of waste and kg of CO₂ avoided per completed sale/donation/exchange, based on admin-configurable per-category weights and a condition factor — clearly labeled as an *estimate*, not a scientific measurement.

## Features

- JWT authentication (access + refresh, auto-refresh on the frontend) with a custom email-based `User` model
- Role-based access: **Customer**, **Seller** (`is_seller` flag, any user can enable it), **Admin** (`is_staff`)
- Product catalog with categories, 5 condition levels, 4 transaction types, multi-image upload (Cloudinary), view counters, featured listings
- Marketplace search, filtering (category, price range, condition, transaction type, location), sorting, and server-side pagination
- Multi-step "Sell an item" wizard (basic info → condition → transaction type → price → location → images → preview → publish)
- Real shopping cart (server-persisted) and checkout → Order → seller-managed order status tracking
- Smart exchange offers with a rule-based recommendation engine
- Donation requests with single-acceptance logic
- Repair provider directory + repair request submission and admin status tracking
- Wishlist, buyer↔seller messaging (conversations + messages), ratings & reviews, in-app notifications
- Report system for flagging bad listings/users, with an admin moderation queue
- Personal Impact Dashboard + Seller Dashboard + Admin analytics dashboard
- drf-spectacular OpenAPI schema, Swagger UI (`/api/docs/`) and ReDoc (`/api/redoc/`)
- Seed command generating realistic Rwandan-context demo data (30+ products, users, orders, exchanges, donations, repair providers)
- 34 backend tests covering auth, products, cart/checkout, exchanges, donations, and impact calculation

## Technology Stack

**Frontend:** React 19, Vite, JavaScript, React Router, Axios, Tailwind CSS v4, lucide-react
**Backend:** Python, Django 5, Django REST Framework, Simple JWT, django-filter, drf-spectacular
**Database:** PostgreSQL (Neon in production; SQLite fallback for a zero-config local look)
**Images:** Cloudinary (`django-cloudinary-storage`)
**Deployment:** Vercel (frontend), Render (backend, Gunicorn, no Docker), Neon (Postgres)

## Architecture

```
React/Vite  ──HTTP/JSON──►  Django REST API  ──ORM──►  PostgreSQL (Neon)
    │                              │
    └─── image files ──────────────┴──► Cloudinary (returns hosted URLs)
```

No microservices, no Docker, no message queues — one Django project, one React app, one Postgres database. Business logic that doesn't belong in a view (impact calculation, exchange matching, checkout) lives in `services.py` modules per app, not in views or serializers.

### Backend app layout

```
backend/
├── manage.py
├── config/                # settings, root urls, wsgi/asgi
└── apps/
    ├── accounts/           # custom User model, auth, profiles, admin analytics
    ├── products/           # Category, Product, ProductImage, Wishlist, recommendation service, seed_data command
    ├── orders/             # Cart, CartItem, Order, OrderItem, checkout + status transition services
    ├── exchanges/          # ExchangeRequest + accept/reject/cancel/complete flow
    ├── donations/          # DonationRequest + accept/reject/complete flow
    ├── repairs/            # RepairProvider, RepairRequest
    ├── messaging/           # Conversation, Message
    ├── reviews/            # Review (1 per completed order)
    ├── notifications/      # Notification + notify() helper used across apps
    ├── impact/             # ImpactCategoryConfig, ImpactRecord, ImpactCalculationService
    └── reports/             # Report (product/user moderation)
```

### Frontend app layout

```
frontend/src/
├── components/    # ui/ (Button, Input, Modal, Badge, Pagination...), products/, layout/, home/
├── pages/         # one file per route (Home, Marketplace, ProductDetail, SellItem, Cart, ...)
├── layouts/       # MainLayout, DashboardLayout
├── services/      # one module per API resource, all built on a shared axios instance
├── context/       # AuthContext (JWT session), CartContext (server-backed cart)
├── hooks/         # useDebounce
├── utils/         # constants (choice lists mirrored from backend), formatting helpers
└── App.jsx        # route table
```

## Database Design

Key relationships (see each app's `models.py` for full field lists):

- `Product.seller → User`, `Product.category → Category`, `ProductImage.product → Product` (1 product : many images)
- `Order.buyer → User`; `OrderItem.order/product/seller` — an order can span multiple sellers, each `OrderItem` tracks its own seller and price snapshot
- `ExchangeRequest.sender/receiver → User`, `.offered_product/.requested_product → Product`
- `DonationRequest.product → Product`, `.requester → User` — accepting one request auto-rejects the other pending ones for that product
- `Review.order → Order` (`OneToOneField` — exactly one review per completed order)
- `ImpactRecord.user/product` — created by `ImpactCalculationService.record()` whenever a sale/donation/exchange completes
- Indexes on `Product(status, transaction_type)`, `Product(category)`, `Product(-created_at)`, `Product(-views_count)`, `Notification(user, is_read)`

All models use `created_at`/`updated_at` where meaningful, and Django migrations (`apps/*/migrations/`) are the source of truth for schema.

## API

Full interactive documentation once the backend is running:

- Swagger UI: `GET /api/docs/`
- ReDoc: `GET /api/redoc/`
- Raw OpenAPI schema: `GET /api/schema/`

Representative endpoints (see `apps/*/urls.py` for the complete list):

```
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/token/refresh/
GET    /api/auth/me/
GET    /api/categories/
GET    /api/products/                       (search, filter, sort, paginate)
GET    /api/products/{id}/exchange-recommendations/
POST   /api/products/{id}/images/
GET    /api/cart/            POST /api/cart/items/
GET    /api/orders/          POST /api/orders/         PATCH /api/orders/{id}/status/
GET    /api/exchanges/       PATCH /api/exchanges/{id}/respond/
GET    /api/donations/       PATCH /api/donations/{id}/respond/
GET    /api/repair-providers/  POST /api/repair-requests/
GET    /api/wishlist/
GET    /api/conversations/   POST /api/messages/
GET    /api/notifications/   PATCH /api/notifications/{id}/read/
GET    /api/impact/
POST   /api/reviews/
POST   /api/reports/
GET    /api/auth/admin/analytics/   (admin only)
```

## Installation

Requires Python 3.11+ and Node 18+. Commands below are for **Windows** (development was done on Windows / PowerShell).

### Backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_data
python manage.py runserver
```

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

The frontend expects the API at `http://localhost:8000/api` by default (see `frontend/.env`).

## Environment Variables

**backend/.env** (see `backend/.env.example`):

```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
CORS_ALLOWED_ORIGINS=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ACCESS_TOKEN_LIFETIME_MIN=60
REFRESH_TOKEN_LIFETIME_DAYS=7
```

If `DATABASE_URL` is left empty, the backend automatically falls back to local SQLite — handy for a first look, but **PostgreSQL should be used for anything beyond a quick spin-up**, and is required in production.

**frontend/.env** (see `frontend/.env.example`):

```
VITE_API_URL=http://localhost:8000/api
```

## Running Locally

1. Start Postgres (or skip and let the backend fall back to SQLite for a quick look).
2. `python manage.py migrate && python manage.py seed_data` (backend).
3. `python manage.py runserver` (backend, port 8000).
4. `npm run dev` (frontend, port 5173).
5. Open `http://localhost:5173`.

## Testing

```powershell
cd backend
venv\Scripts\activate
python manage.py test apps
```

34 tests across `accounts`, `products`, `orders`, `exchanges`, `donations`, and `impact` cover registration/login, product CRUD + permissions + filtering, cart/checkout/order status transitions, the exchange accept/reject/complete flow, the donation single-acceptance flow, and the impact calculation formula (including admin-configured category overrides).

Run the frontend production build as a compile-time smoke test:

```powershell
cd frontend
npm run build
```

## Deployment

### 1. Neon PostgreSQL (production database)

1. Create a free account at Neon and a new project.
2. Copy the connection string Neon gives you (starts with `postgresql://...?sslmode=require`).
3. You will paste this into Render's `DATABASE_URL` environment variable (below) — never commit it to Git.
4. Migrations run automatically as part of the Render build command.

### 2. Django backend → Render (no Docker)

1. Push this repo to GitHub.
2. On Render: **New → Web Service**, connect the repo, set **Root Directory = `backend`**.
3. Build command:
   ```
   pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
   ```
4. Start command:
   ```
   gunicorn config.wsgi:application
   ```
   Render provides `$PORT` automatically; Gunicorn binds to it by default when no `--bind` is passed via the platform's injected `PORT` env var — Render sets this for you, no extra config needed.
5. Environment variables (Render dashboard → Environment):
   - `SECRET_KEY` — generate a long random string
   - `DEBUG=False`
   - `ALLOWED_HOSTS` — your `*.onrender.com` domain
   - `DATABASE_URL` — the Neon connection string
   - `CORS_ALLOWED_ORIGINS` — your Vercel frontend URL (added after step 3)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
6. Deploy. Visit `https://your-backend.onrender.com/api/docs/` to confirm the API is live.

### 3. Vite frontend → Vercel

1. On Vercel: **Add New → Project**, import the same GitHub repo.
2. Set **Root Directory = `frontend`** (framework preset: Vite).
3. Build command: `npm run build` — Output directory: `dist`.
4. Environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`.
5. Deploy. Vercel gives you `https://your-frontend.vercel.app`.

### 4. Connect the two (CORS)

Go back to Render → your backend service → Environment → update `CORS_ALLOWED_ORIGINS` to your real Vercel URL, then redeploy the backend. Never set `CORS_ALLOW_ALL_ORIGINS = True` in production.

### 5. Cloudinary (image storage)

1. Create a free Cloudinary account.
2. Copy the Cloud Name, API Key, and API Secret from the Cloudinary dashboard.
3. Add them as Render environment variables (step 2.5 above). Product/avatar/repair-provider images are uploaded straight to Cloudinary and only the returned URL is stored in Postgres — the database never stores binary image data.

## Production Testing Checklist

- [ ] `https://your-backend.onrender.com/api/docs/` loads Swagger UI
- [ ] Register + login works from the deployed frontend
- [ ] JWT refresh works after the access token expires (stay logged in)
- [ ] Creating a product with images stores a real Cloudinary URL
- [ ] Search, filters, sorting and pagination all work on `/marketplace`
- [ ] Cart → checkout creates a real `Order` visible to the seller
- [ ] Exchange offer → accept → complete transitions both products to `EXCHANGED`
- [ ] Donation request → accept → complete transitions the product to `DONATED`
- [ ] `/impact` shows non-zero numbers after a completed transaction
- [ ] Django admin (`/admin/`) loads with styling (static files served correctly)
- [ ] No console CORS errors on the deployed frontend

## Troubleshooting

| Symptom | Check |
|---|---|
| CORS error in browser console | `CORS_ALLOWED_ORIGINS` on Render matches your exact Vercel URL (no trailing slash) |
| 500 error in production | Render service logs (`DEBUG=False` hides tracebacks from the response on purpose) |
| Database connection error | `DATABASE_URL` is the full Neon string including `?sslmode=require` |
| Static files / Django admin unstyled | Re-run `python manage.py collectstatic --noinput`; confirm Whitenoise is in `MIDDLEWARE` |
| Images not appearing | `CLOUDINARY_*` env vars are set on Render, not just locally |
| Vercel shows 404 | Root Directory = `frontend`, Output Directory = `dist` |
| Gunicorn won't start | Start command references `config.wsgi:application` — matches the actual settings module name |
| Stuck logged out / 401 loops | Confirm `VITE_API_URL` points at the Render backend, and that the browser network tab shows a successful `/api/auth/token/refresh/` call |

## Demo Accounts

Created by `python manage.py seed_data` (password for all: `DemoPass123!`). **For local/demo use only — never reuse these credentials in a real deployment.**

| Role | Email |
|---|---|
| Administrator | `admin@example.com` |
| Seller | `seller@example.com` |
| Customer | `customer@example.com` |

Additional seeded sellers/customers: `seller2-4@example.com`, `customer2-3@example.com`.

## Future Improvements

- Real payment integration (Mobile Money / card) behind the existing `payment_method` abstraction
- WebSocket-based live messaging and notifications (currently REST polling)
- Map-based "Near You" browsing using the existing `latitude`/`longitude` fields
- Image moderation / automatic content flagging
- A proper recommendation model informed by user behavior, layered on top of the current explainable rule-based engine

## Author

Built as a full stack software  covering full-stack architecture, REST API design, relational database modeling, authentication/authorization, cloud image storage, and a two-service cloud deployment (Render + Vercel + Neon).
