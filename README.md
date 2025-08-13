# Ride-Walk-WEB

Ride & Walk Planner
====================

MERN app for planning realistic bike and trek routes. Generates paths on real roads/trails, enforces daily distance limits, shows a 3-day weather forecast (from tomorrow), and displays a single Unsplash image with proper credit. Save, view, edit, and delete routes per user.

Features
- JWT auth (register, login, logout); protected API & pages
- Planner: Bike (2 days ≤ 60 km/day) or Trek (5–15 km loops)
- Realistic polylines with distance & duration per day
- Weather: 3-day forecast starting tomorrow (Open-Meteo)
- Media: one Unsplash image + credit and photo location; “About …” text via Groq (saved with the route)
- Saved routes: expanding list, edit title/description, delete

Tech stack
- Client: React + Vite + TypeScript, Tailwind, Leaflet, Framer Motion
- Server: Node.js + Express + TypeScript
- DB: MongoDB Atlas (Mongoose)
- APIs: Groq (place description), Unsplash (image), Open-Meteo (weather)

Project structure
server/   Express API, auth, planning, media, weather
client/   React app (Planner, Saved, Auth), Tailwind UI

Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas cluster + DB user
- API keys: GROQ_API_KEY, UNSPLASH_ACCESS_KEY

Environment (server/.env)
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority"
JWT_SECRET="a-long-random-secret"
JWT_EXPIRES_IN="7d"
GROQ_API_KEY="your_groq_key"
UNSPLASH_ACCESS_KEY="your_unsplash_key"
PORT=4000
CORS_ORIGIN="http://localhost:5173"

Run (development)
# Terminal A
cd server
npm ci
npm run dev

# Terminal B
cd client
npm ci
npm run dev

Open the Vite URL (usually http://localhost:5173), register, log in, and plan routes.

Build (production)
# Server
cd server && npm ci && npm run build && npm run start

# Client
cd client && npm ci && npm run build
# serve client/dist via your server or a static host

Notes
- Client requests must send credentials (see client/src/api/http.ts).
- “About …” HTML and image URL are stored with each saved route.

License
For course and educational use.
