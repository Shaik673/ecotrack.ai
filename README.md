# EcoTrack

EcoTrack is a React + FastAPI sustainability app for carbon footprint tracking, AI recommendations, planet intelligence, challenges, and community interaction.

## Tech Stack

- Frontend: React, Vite, Recharts, Three.js/WebGL, Lucide React, custom CSS animations
- Backend: FastAPI, Uvicorn
- Database: SQLite
- AI: Groq API via server-side `GROQ_API_KEY`
- Storage: Local uploads folder for profile pictures

## Run Locally

Install frontend dependencies:

```bash
cd frontend
npm install
npm run dev -- --port 5174
```

Install backend dependencies and run:

```bash
pip install -r backend/requirements.txt
python backend/app/main.py
```

Create `backend/.env` from `backend/.env.example` and add your Groq API key.

Frontend runs at `http://127.0.0.1:5174`.
Backend runs at `http://127.0.0.1:8006`.

## Deployment

### Render Backend

This repo includes `render.yaml` for a Render web service.

Set these Render environment variables:

- `GROQ_API_KEY`: your Groq API key
- `ALLOWED_ORIGINS`: your Vercel frontend URL, for example `https://your-project.vercel.app`

Render start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Vercel Frontend

Deploy the `frontend` directory as the Vercel project root.

Set this Vercel environment variable:

- `VITE_API_URL`: your Render backend URL, for example `https://ecotrack-api.onrender.com`
