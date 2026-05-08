# BNI Sigmaconnect — Architecture & Planning Document

---

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Database Schema](#database-schema)
5. [Backend Logic (FastAPI)](#backend-logic-fastapi)
6. [Frontend Logic (Next.js)](#frontend-logic-nextjs)
7. [Authentication Flow](#authentication-flow)
8. [Swipe & Match Logic](#swipe--match-logic)
9. [WhatsApp Notification Flow](#whatsapp-notification-flow)
10. [Admin Panel Logic](#admin-panel-logic)
11. [Caching Strategy](#caching-strategy)
12. [Deployment on VPS](#deployment-on-vps)

---

## Overview

**BNI Sigmaconnect** is a mobile-first Tinder-style networking web app for BNI members. Users swipe right to express interest and left to pass. A match is formed only when both users swipe right on each other. Authentication is OTP-based via WhatsApp. The admin has full control over member management and can reset the swipe state at any time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| ORM | SQLAlchemy + Alembic (migrations) |
| Cache | Redis (in-memory, on VPS) |
| WhatsApp API | WhatsApp Business Cloud API (Meta) |
| Auth Tokens | JWT (access + refresh tokens) |
| File Storage | Local VPS storage or MinIO (self-hosted S3) |
| Reverse Proxy | Nginx |
| Process Manager | Docker + Docker Compose (preferred) or PM2 |
| Migrations | Alembic (auto-run on container start) |

---

## Folder Structure

```
sigmaconnect/
│
├── frontend/                        # Next.js App
│   ├── public/
│   │   └── fonts/                   # Poppins font files
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Root layout (Poppins font, global styles)
│   │   │   ├── page.tsx             # Redirect logic → /login or /explore
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # Phone number + OTP entry screen
│   │   │   ├── explore/
│   │   │   │   └── page.tsx         # Main swipe screen (protected route)
│   │   │   ├── likes/
│   │   │   │   └── page.tsx         # Likes screen with Sent / Matched tabs
│   │   │   └── admin/
│   │   │       ├── layout.tsx       # Admin layout with sidebar
│   │   │       ├── page.tsx         # Admin dashboard / member list
│   │   │       ├── members/
│   │   │       │   ├── page.tsx     # List all members
│   │   │       │   ├── add/
│   │   │       │   │   └── page.tsx # Add new member form
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx # Edit / delete member
│   │   │       └── reset/
│   │   │           └── page.tsx     # Reset all swipe data
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── TopBar.tsx       # "Sigmaconnect" header
│   │   │   │   ├── BottomNav.tsx    # Explore | Likes bottom tabs
│   │   │   │   ├── Button.tsx       # Reusable button (red/white theme)
│   │   │   │   └── OtpInput.tsx     # 6-digit OTP input UI
│   │   │   ├── swipe/
│   │   │   │   ├── SwipeCard.tsx    # Single member card (image, name, biz)
│   │   │   │   ├── SwipeDeck.tsx    # Stack of SwipeCards with gesture logic
│   │   │   │   ├── SwipeButtons.tsx # Like / Reject action buttons
│   │   │   │   ├── EndOfStack.tsx   # "End of stack" message component
│   │   │   │   └── MatchAnimation.tsx # Full-screen match celebration animation
│   │   │   ├── likes/
│   │   │   │   ├── SentList.tsx     # List of users liked by me
│   │   │   │   └── MatchedList.tsx  # List of mutual matches
│   │   │   └── admin/
│   │   │       ├── MemberTable.tsx  # Table with edit/delete actions
│   │   │       └── MemberForm.tsx   # Add/Edit member form
│   │   ├── hooks/
│   │   │   ├── useSwipe.ts          # Touch/mouse gesture detection logic
│   │   │   ├── useSwipeDeck.ts      # Deck state management (stack, current card)
│   │   │   ├── useAuth.ts           # Auth state, token management
│   │   │   └── useMatches.ts        # Fetch and cache match/likes data
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios instance with base URL + JWT headers
│   │   │   ├── auth.ts              # Token storage, decode, refresh logic
│   │   │   └── cache.ts             # In-memory client-side cache (who liked me)
│   │   ├── store/
│   │   │   └── swipeStore.ts        # Zustand store for swipe deck state
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces (Member, Swipe, Match)
│   │   └── styles/
│   │       └── globals.css          # Tailwind base + Poppins import + CSS vars
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                         # FastAPI App
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point, CORS, router mounts
│   │   ├── config.py                # Settings (DB URL, JWT secret, WhatsApp creds)
│   │   ├── database.py              # SQLAlchemy engine + session + Base
│   │   ├── models/
│   │   │   ├── user.py              # User model
│   │   │   ├── swipe.py             # Swipe model
│   │   │   └── otp.py               # OTP model
│   │   ├── schemas/
│   │   │   ├── user.py              # Pydantic schemas for User
│   │   │   ├── swipe.py             # Pydantic schemas for Swipe/Match
│   │   │   └── auth.py              # Pydantic schemas for OTP/login
│   │   ├── routers/
│   │   │   ├── auth.py              # POST /auth/send-otp, POST /auth/verify-otp
│   │   │   ├── users.py             # GET /users/stack, GET /users/me
│   │   │   ├── swipes.py            # POST /swipes, GET /swipes/sent, GET /swipes/matches
│   │   │   └── admin.py             # CRUD /admin/members, POST /admin/reset
│   │   ├── services/
│   │   │   ├── auth_service.py      # OTP generation, JWT creation/verification
│   │   │   ├── swipe_service.py     # Swipe logic, match detection
│   │   │   ├── stack_service.py     # Shuffle + filter unseen users for a user
│   │   │   ├── whatsapp_service.py  # WhatsApp API calls (OTP + match notify)
│   │   │   └── cache_service.py     # Redis get/set helpers
│   │   ├── middleware/
│   │   │   └── auth_middleware.py   # JWT decode + current_user dependency
│   │   └── utils/
│   │       └── helpers.py           # Utility functions
│   ├── alembic/                     # Database migrations
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   └── requirements.txt
│
├── nginx/
│   └── sigmaconnect.conf            # Nginx reverse proxy config
│
├── docker-compose.yml               # Orchestrates Frontend, Backend, DB, Redis
├── Dockerfile.frontend              # Next.js Dockerfile
├── Dockerfile.backend               # FastAPI Dockerfile
├── scripts/
│   └── run-migrations.sh            # Script to run migrations on container start
└── .env                             # Root env for Docker Compose
```

---

## Database Schema

### `users` table
```
id              UUID (PK)
phone           VARCHAR(15) UNIQUE NOT NULL
name            VARCHAR(100) NOT NULL
business_name   VARCHAR(150)
profile_image   VARCHAR(300)        -- path or URL to image
is_admin        BOOLEAN DEFAULT false
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### `otps` table
```
id              UUID (PK)
phone           VARCHAR(15) NOT NULL
otp_code        VARCHAR(6) NOT NULL
expires_at      TIMESTAMP NOT NULL
is_used         BOOLEAN DEFAULT false
created_at      TIMESTAMP
```

### `swipes` table
```
id              UUID (PK)
swiper_id       UUID (FK → users.id)
swiped_id       UUID (FK → users.id)
direction       ENUM ('like', 'reject')
created_at      TIMESTAMP

UNIQUE(swiper_id, swiped_id)
```

### `matches` table
```
id              UUID (PK)
user_a_id       UUID (FK → users.id)
user_b_id       UUID (FK → users.id)
matched_at      TIMESTAMP

UNIQUE(user_a_id, user_b_id)
-- Always store with user_a_id < user_b_id to prevent duplicates
```

---

## Backend Logic (FastAPI)

### Authentication Routes — `/auth`

#### `POST /auth/send-otp`
- Accept `{ phone: string }`
- Validate phone format
- Generate a 6-digit OTP
- Store hashed OTP + expiry (5 min) in `otps` table
- Call `whatsapp_service.send_otp(phone, otp)` via WhatsApp Cloud API
- Return `{ message: "OTP sent" }`

#### `POST /auth/verify-otp`
- Accept `{ phone: string, otp: string }`
- Look up latest unused, unexpired OTP for that phone
- If valid: mark as used, find or create user.
- **Admin Check**: Compare user's phone number with `ADMIN_NUMBER` from environment.
- If matches → set `is_admin = true` (or issue JWT with admin role).
- Return `{ access_token, refresh_token, user: { id, name, phone, is_admin } }`

---

### Users Routes — `/users`

#### `GET /users/stack`
- Auth required
- Calls `stack_service.get_stack(user_id)`
  - Fetch all active users excluding: self, already-swiped users (from `swipes` table)
  - Shuffle using a seed based on `user_id` + today's date (so order is consistent within a day but random across days — or fully random per login, stored in Redis)
  - Return ordered list of user cards `[{ id, name, business_name, profile_image }]`
- The full shuffled stack is stored in Redis keyed by `stack:{user_id}` with a TTL of 24 hours

#### `GET /users/me`
- Return current user's profile

---

### Swipes Routes — `/swipes`

#### `POST /swipes`
- Auth required
- Accept `{ swiped_id: UUID, direction: "like" | "reject" }`
- Insert into `swipes` table
- If `direction == "like"`:
  - Check if `swiped_id` has already liked `swiper_id` (i.e., reverse swipe exists as "like")
  - If yes → **MATCH DETECTED**:
    - Insert into `matches` table (with `min(a,b)`, `max(a,b)` ordering)
    - Look up Redis cache: `liked_me:{swiper_id}` — the first user was cached, so match response is instant
    - Trigger `whatsapp_service.send_match_notification(swiped_id, swiper_name)` in background
  - Return `{ matched: true, matched_user: {...} }` or `{ matched: false }`
- Remove `swiped_id` from Redis stack `stack:{user_id}`

#### `GET /swipes/sent`
- Return all users that the current user has liked (direction = "like")

#### `GET /swipes/matches`
- Return all users that the current user has mutually matched with (lookup `matches` table)

---

### Admin Routes — `/admin` (is_admin required)

#### `GET /admin/members` — List all members
#### `POST /admin/members` — Add new member (name, phone, business_name, upload image)
#### `PUT /admin/members/{id}` — Edit member details
#### `DELETE /admin/members/{id}` — Soft delete (set is_active = false)
#### `POST /admin/reset` — **Hard reset**:
  - Truncate `swipes` table
  - Truncate `matches` table
  - Flush all `stack:*` and `liked_me:*` keys from Redis
  - Return `{ message: "All swipe data has been reset" }`

---

## Frontend Logic (Next.js)

### Route Protection
- `middleware.ts` at the root checks for a valid JWT in cookies
- If no token → redirect to `/login`
- If token + `is_admin` → allow access to `/admin/*`
- If token + not admin → redirect away from `/admin/*`

---

### Login Page `/login`

**Step 1 — Phone Entry**
- Input field for phone number (with country code selector, default +91)
- "Send OTP" button → calls `POST /auth/send-otp`
- On success → transition to Step 2 with a slide-up animation

**Step 2 — OTP Entry**
- 6 individual digit inputs (auto-focus next on type)
- Auto-submit when all 6 digits filled
- Calls `POST /auth/verify-otp`
- On success → store tokens in `httpOnly` cookies (set via API route in Next.js) → redirect to `/explore`

---

### Explore Page `/explore`

**On Mount:**
1. Call `GET /users/stack` — receive ordered array of user cards
2. Store stack in Zustand `swipeStore`: `{ stack: User[], currentIndex: 0 }`
3. Call `GET /swipes/cached-likes-me` (see Caching Strategy) and store in `cache.ts`

**SwipeDeck Component:**
- Renders top 3 cards from the stack (only top card is interactive, cards below are slightly scaled down and offset for depth effect)
- Uses `useSwipe.ts` hook that listens to `touchstart`, `touchmove`, `touchend` (and mouse equivalents)
- As card is dragged:
  - Translate X and rotate slightly (CSS transform)
  - Show green heart overlay if dragging right, red X overlay if dragging left
  - Threshold: if released past 40% of screen width → confirm swipe; else snap back with spring animation
- On confirm swipe:
  - Call `POST /swipes` with direction
  - Remove top card from Zustand stack
  - If matched → trigger `MatchAnimation.tsx` fullscreen overlay
  - If stack becomes empty → show `EndOfStack.tsx`

**SwipeButtons Component:**
- Two circular buttons (❌ Reject | ❤️ Like) at the bottom
- Tapping them triggers the same swipe logic as gesture swipes
- Animate the button on tap (scale pulse)

**MatchAnimation Component:**
- Full-screen overlay with confetti particles and "It's a Match!" text
- Shows both profile pictures (current user + matched user)
- Auto-dismiss after 3 seconds or on tap
- Uses CSS keyframe animations (no heavy libraries needed)

---

### Likes Page `/likes`

**Two tabs: Sent | Matched**

**Sent Tab:**
- Calls `GET /swipes/sent`
- Grid of member cards (image, name, business)
- Cards that are also in `Matched` have a subtle "Matched ✓" badge

**Matched Tab:**
- Calls `GET /swipes/matches`
- Same grid layout, but with a distinct green/gold accent for matched state

---

### Admin Panel `/admin`

- Sidebar navigation: Members | Reset
- **Members page**: Table with columns — Photo, Name, Phone, Business, Status, Actions (Edit / Deactivate)
- **Add/Edit modal**: Form with image upload preview, name, business name, phone
- **Reset page**: A single prominent button with a confirmation dialog before triggering `POST /admin/reset`
- Admin logs in via the same phone OTP flow as regular users.
- **Redirection Logic**:
  - Frontend receives the user object on successful login.
  - If `user.is_admin` is `true`, the app redirects to `/admin` instead of `/explore`.
  - This ensures a unified login interface while keeping the admin dashboard separate.
- The `ADMIN_NUMBER` is stored in the backend `.env` to prevent unauthorized admin access.

---

## Authentication Flow

```
User enters phone
       ↓
Frontend → POST /auth/send-otp
       ↓
Backend generates OTP → saves to DB → calls WhatsApp API
       ↓
User receives WhatsApp message: "Your Sigmaconnect OTP is 4 9 2 1 8 3"
       ↓
User enters OTP
       ↓
Frontend → POST /auth/verify-otp
       ↓
Backend validates → issues JWT access_token + refresh_token
       ↓
Frontend stores tokens in httpOnly cookies via Next.js API route
       ↓
Redirect to /explore
```

**JWT Strategy:**
- Access token: 7-day expiry
- Refresh token: 30-day expiry, stored in DB for invalidation
- Next.js API route `/api/refresh` handles silent refresh
- All API calls go through `lib/api.ts` Axios instance which auto-attaches the access token

---

## Swipe & Match Logic

```
User swipes RIGHT on Person B
           ↓
POST /swipes { swiped_id: B, direction: "like" }
           ↓
Backend checks: has B already liked A?
  ┌── NO ──→ Save swipe. Return { matched: false }
  │
  └── YES ──→ Save swipe + Insert match row
              Check Redis: liked_me:{A} contains B? (cached, no DB hit)
              Return { matched: true, matched_user: B's profile }
              → Background task: send WhatsApp notification to B
                "You have matched with [A's name]!"
```

**Stack Consistency:**
- The shuffled stack for each user is stored as an ordered list of user IDs in Redis: `stack:{user_id}`
- On each swipe, that user ID is `LREM`'d from the Redis list
- If Redis key expires (24h TTL), a fresh shuffle is generated on next `GET /users/stack`
- Users who join after your stack was generated appear in your next refresh cycle

---

## WhatsApp Notification Flow

**Service used:** WhatsApp Business Cloud API (Meta for Developers)

**Two message types:**

### 1. OTP Message
```
Template name: otp_message
Body: "Your Sigmaconnect OTP is {{1}}. Valid for 5 minutes. Do not share."
```
Called from `whatsapp_service.send_otp(phone, otp_code)`

### 2. Match Notification
```
Template name: match_notification
Body: "🎉 You have matched with {{1}} on Sigmaconnect! Open the app to connect."
```
Called as a **FastAPI BackgroundTask** after match is detected — so it does not block the swipe response

**`whatsapp_service.py` responsibilities:**
- Build the correct payload for Meta's `POST /messages` endpoint
- Include `phone_number_id`, `to` (recipient phone), `template name + language + components`
- Handle API errors gracefully (log failures, don't crash the swipe flow)

---

## Caching Strategy

### Problem solved:
When User A swipes right on User B, we need to instantly know if B had already liked A — without a slow DB query blocking the animation.

### Solution: Redis `liked_me` set

**On every like received:**
```
When B likes A → SADD liked_me:{A} {B's user_id}
```

**On login / app load:**
```
GET /users/liked-me-cache → returns all user IDs that have liked the current user
Frontend stores this in lib/cache.ts as a Set in memory
```

**On swipe right by A:**
```
Frontend checks: cache.likedMeSet.has(B_id)
  → YES: pre-emptively show MatchAnimation (optimistic)
         Then confirm with backend response
  → NO: wait for backend response normally
```

**Cache invalidation:**
- Admin reset → `DEL liked_me:*` (all keys flushed via Redis `SCAN + DEL`)
- User deactivated → `SREM` their ID from all `liked_me:*` sets

---

## Deployment on VPS (Dockerized)

To avoid interference with other services and ensure clean environment isolation, the app is deployed using **Docker Compose**.

### 1. Database Migrations
On every `git pull` and backend restart, the system must automatically apply database changes.
- A `run-migrations.sh` script is used as the `ENTRYPOINT` for the backend container.
- It runs `alembic upgrade head` before starting the FastAPI server.

### 2. Docker Compose Configuration
The `docker-compose.yml` manages:
- **Backend**: FastAPI app (Python 3.11+)
- **Frontend**: Next.js app (Node.js 20+)
- **Database**: PostgreSQL
- **Cache**: Redis

### 3. Nginx Reverse Proxy
Nginx on the host VPS acts as a gateway, forwarding traffic to the Docker containers.

---

### Nginx Config (sigmaconnect.conf)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Backend API
    location /api/v1/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static file uploads
    location /uploads/ {
        alias /var/www/sigmaconnect/uploads/;
    }
}
```

### Environment Variables

**Backend `.env`**
```
DATABASE_URL=postgresql://user:pass@db:5432/sigmaconnect
REDIS_URL=redis://redis:6379/0
JWT_SECRET=your_super_secret_key
JWT_ALGORITHM=HS256
ADMIN_NUMBER=+919876543210        # The phone number that gets Admin access
WHATSAPP_API_TOKEN=your_meta_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_OTP_TEMPLATE=otp_message
WHATSAPP_MATCH_TEMPLATE=match_notification
```

**Frontend `.env.local`**
```
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
NEXTAUTH_SECRET=your_nextauth_secret
```

---

## Key Design Decisions Summary

| Decision | Reasoning |
|---|---|
| Redis for stack + liked_me cache | Instant match detection without DB round-trip |
| Ordered stack in Redis | Consistent user experience; no repeat cards within session |
| BackgroundTask for WhatsApp notify | Match response is instant; notification is fire-and-forget |
| Optimistic match animation | Frontend pre-checks cache → zero latency match celebration |
| httpOnly cookies for JWT | Secure against XSS; tokens not accessible via JavaScript |
| min/max ordering in matches table | Prevents duplicate match rows for the same pair |
| Soft delete for admin | Preserves data integrity; deactivated users disappear from stacks |
| Admin reset flushes Redis + DB | Clean slate; no orphan cache entries after reset |
| Phone-only auth | Frictionless for BNI members; no passwords to forget |
```