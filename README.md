# 🌾 Bakery Manager — Production Operations & AI Floor Copilot

A modern, full-stack Progressive Web App (PWA) designed for commercial and artisan bakery operations. It unifies Kanban production scheduling, recipe and batch tracking, wholesale B2B client contracts, deck & convection oven telemetry, and Gemini 3.8 Flash AI assistants.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion
- **Progressive Web App (PWA):** `vite-plugin-pwa`, Workbox caching, offline fallbacks, standalone mode, maskable and Apple touch icons
- **Backend Server:** Express.js, TypeScript (Node.js 22 native execution), REST APIs
- **Database:** Supabase PostgreSQL with high-availability client, automated initial seeding, and zero-downtime offline cache fallback
- **AI Intelligence:** `@google/genai` (Google Gemini 3.8 Flash) for natural language record search, shift handover intelligence, dough schedule generation, and live floor operations copilot

---

## 🏗️ Architecture Overview

```text
┌────────────────────────────────────────────────────────┐
│                   Client Browser / PWA                 │
│         (React 19 SPA + PWA Service Worker Cache)      │
└───────────────────────────┬────────────────────────────┘
                            │ /api/* requests & static assets
┌───────────────────────────▼────────────────────────────┐
│                  Express Backend Server                │
│             (Node.js 22 Native TypeScript)             │
│                                                        │
│  ├─ /api/health          -> Server & AI health checks │
│  ├─ /api/tasks           -> Task CRUD & scheduling     │
│  ├─ /api/projects        -> Wholesale orders & stats   │
│  ├─ /api/ovens           -> Deck oven telemetry        │
│  ├─ /api/ai/chat         -> Chef Brioche Floor Copilot │
│  ├─ /api/ai/natural-search -> Natural language search   │
│  ├─ /api/ai/shift-summary -> Automated handover logs   │
│  └─ /api/db/*            -> Supabase sync & health     │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
┌─────────────▼────────────┐ ┌─────────────▼────────────┐
│   Supabase PostgreSQL    │ │    Google Gemini 3.8     │
│ (Production Persistence) │ │    (AI Assistant SDK)    │
└──────────────────────────┘ └──────────────────────────┘
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20+ (v22 recommended)
- **npm** or **bun**

### 2. Installation
```bash
git clone <your-repository-url>
cd bakery-manager
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your variables in `.env`:
```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY="your-gemini-api-key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
# Optional: SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

> **Note:** If `SUPABASE_URL` is omitted, Bakery Manager automatically operates in safe in-memory cache mode with full local storage persistence, ensuring zero setup friction.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build & Deployment

### Build the Application
```bash
npm run build
```
This produces:
- Optimized client bundle in `dist/` with PWA service worker (`dist/sw.js`) and Web App Manifest (`dist/manifest.webmanifest`).
- Server bundling and static asset mapping ready for production execution.

### Start Production Server
```bash
npm start
```
Starts the full-stack server on `http://0.0.0.0:3000` (or `process.env.PORT`).

---

## ☁️ Deployment Guides

### Option A: Google Cloud Run / Docker Container

A production `Dockerfile` is supported:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

Deploy directly via Cloud Run:
```bash
gcloud run deploy bakery-manager \
  --source . \
  --port 3000 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,GEMINI_API_KEY=YOUR_KEY
```

### Option B: Render / Railway / Fly.io

1. **Build Command:** `npm ci && npm run build`
2. **Start Command:** `npm start`
3. **Environment Variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `3000` (or auto-assigned by host)
   - `GEMINI_API_KEY` = `<your_key>`
   - `SUPABASE_URL` = `<your_url>`
   - `SUPABASE_ANON_KEY` = `<your_key>`

---

## 🔐 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | Optional | Port for the Express server (default: `3000`) |
| `NODE_ENV` | Optional | Set to `production` in live environments |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI copilot & natural search |
| `SUPABASE_URL` | Optional | Supabase PostgreSQL project URL |
| `SUPABASE_ANON_KEY` | Optional | Supabase public anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase server-side service role key |
| `APP_URL` | Optional | Public application base URL for OAuth/PWA references |

---

## 📱 Progressive Web App (PWA) Capabilities

Bakery Manager is fully installable on mobile and desktop:
- **Desktop (Chrome/Edge):** Click **Install App** in the header or address bar.
- **Android:** Tap the header **Install App** button or Chrome menu → **Add to Home screen**.
- **iOS Safari:** Tap the **Share** button in Safari → **Add to Home Screen**.
- **Offline Mode:** The service worker caches production tasks, recipes, orders, and UI assets for continuous kitchen and floor operations during internet interruptions.

---

## 🧪 Verification & Testing

Run static linting and type checking:
```bash
npm run lint
```

Verify production build:
```bash
npm run build
```

Health check verification:
```bash
curl http://localhost:3000/api/health
```
