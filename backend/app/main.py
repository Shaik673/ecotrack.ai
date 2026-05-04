import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Optional

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
UPLOAD_DIR = ROOT / "uploads"
DB_PATH = DATA_DIR / "ecotrack.db"
ENV_PATH = ROOT / ".env"

if ENV_PATH.exists():
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="EcoTrack API")
default_origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5174",
    "http://localhost:5174",
]
configured_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ecotrack-ai-tau.vercel.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS profiles (
                user_id INTEGER PRIMARY KEY,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL,
                age INTEGER NOT NULL,
                country TEXT NOT NULL,
                state TEXT NOT NULL,
                gender TEXT NOT NULL,
                profile_pic TEXT,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS footprints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                transport REAL NOT NULL,
                electricity REAL NOT NULL,
                diet REAL NOT NULL,
                shopping REAL NOT NULL,
                total REAL NOT NULL,
                category TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                answer TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            """
        )


init_db()


def now():
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def hash_password(password: str, salt: Optional[str] = None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return base64.b64encode(digest).decode(), salt


def verify_password(password: str, password_hash: str, salt: str):
    digest, _ = hash_password(password, salt)
    return hmac.compare_digest(digest, password_hash)


def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(400, "Password must include an uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise HTTPException(400, "Password must include a lowercase letter.")
    if not re.search(r"\d", password):
        raise HTTPException(400, "Password must include a number.")


def user_response(row):
    profile = None
    with db() as conn:
        profile_row = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (row["id"],)).fetchone()
        if profile_row:
            profile = dict(profile_row)
    return {"id": row["id"], "email": row["email"], "profileComplete": bool(profile), "profile": profile}


class AuthPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class FootprintPayload(BaseModel):
    user_id: int
    car_km: float = Field(ge=0)
    flights: float = Field(ge=0)
    electricity_kwh: float = Field(ge=0)
    meat_meals: float = Field(ge=0)
    shopping_spend: float = Field(ge=0)
    household: int = Field(ge=1, le=20)


class ChatPayload(BaseModel):
    user_id: int
    message: str = Field(min_length=2, max_length=1000)


@app.get("/health")
def health():
    return {"ok": True, "service": "EcoTrack API"}


@app.post("/auth/signup")
def signup(payload: AuthPayload):
    validate_password(payload.password)
    email = payload.email.lower()
    password_hash, salt = hash_password(payload.password)
    try:
        with db() as conn:
            conn.execute(
                "INSERT INTO users (email, password_hash, salt, created_at) VALUES (?, ?, ?, ?)",
                (email, password_hash, salt, now()),
            )
            row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    except sqlite3.IntegrityError:
        raise HTTPException(409, "This email is already registered. Kindly Signin!")
    return user_response(row)


@app.post("/auth/signin")
def signin(payload: AuthPayload):
    email = payload.email.lower()
    with db() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not row:
        raise HTTPException(404, "This Account is not Registered. Kindly Signup!")
    if not verify_password(payload.password, row["password_hash"], row["salt"]):
        raise HTTPException(401, "Invalid email or password.")
    return user_response(row)


@app.post("/profile")
async def save_profile(
    user_id: int = Form(...),
    full_name: str = Form(...),
    email: EmailStr = Form(...),
    age: int = Form(...),
    country: str = Form(...),
    state: str = Form(...),
    gender: str = Form(...),
    profile_pic: UploadFile | None = File(None),
):
    if len(full_name.strip()) < 2:
        raise HTTPException(400, "Full name must be at least 2 characters.")
    if age < 13 or age > 110:
        raise HTTPException(400, "Age must be between 13 and 110.")
    if gender not in ["Female", "Male", "Non-binary", "Prefer not to say"]:
        raise HTTPException(400, "Please select a valid gender.")

    pic_path = None
    if profile_pic and profile_pic.filename:
        if not profile_pic.content_type.startswith("image/"):
            raise HTTPException(400, "Profile picture must be an image.")
        ext = Path(profile_pic.filename).suffix.lower() or ".png"
        filename = f"user_{user_id}_{secrets.token_hex(6)}{ext}"
        target = UPLOAD_DIR / filename
        target.write_bytes(await profile_pic.read())
        pic_path = f"/uploads/{filename}"

    with db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(404, "User not found.")
        existing = conn.execute("SELECT profile_pic FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
        pic_path = pic_path or (existing["profile_pic"] if existing else None)
        conn.execute(
            """
            INSERT INTO profiles (user_id, full_name, email, age, country, state, gender, profile_pic, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              full_name=excluded.full_name, email=excluded.email, age=excluded.age,
              country=excluded.country, state=excluded.state, gender=excluded.gender,
              profile_pic=excluded.profile_pic, updated_at=excluded.updated_at
            """,
            (user_id, full_name.strip(), str(email).lower(), age, country, state, gender, pic_path, now()),
        )
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return user_response(row)


@app.post("/footprints")
def save_footprint(payload: FootprintPayload):
    transport = payload.car_km * 0.171 + payload.flights * 250
    electricity = payload.electricity_kwh * 0.42 / payload.household
    diet = payload.meat_meals * 7.2
    shopping = payload.shopping_spend * 0.38
    total = round(transport + electricity + diet + shopping, 2)
    category = "Low" if total < 500 else "Moderate" if total < 1200 else "High"
    saved = {
        "transport": round(transport, 2),
        "electricity": round(electricity, 2),
        "diet": round(diet, 2),
        "shopping": round(shopping, 2),
        "total": total,
        "category": category,
        "inputs": payload.model_dump(),
    }
    with db() as conn:
        conn.execute(
            """
            INSERT INTO footprints (user_id, transport, electricity, diet, shopping, total, category, payload, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (payload.user_id, saved["transport"], saved["electricity"], saved["diet"], saved["shopping"], total, category, json.dumps(saved), now()),
        )
        item = conn.execute("SELECT * FROM footprints WHERE id = last_insert_rowid()").fetchone()
    return {**dict(item), "payload": saved}


@app.get("/dashboard/{user_id}")
def dashboard(user_id: int):
    with db() as conn:
        rows = conn.execute("SELECT * FROM footprints WHERE user_id = ? ORDER BY id DESC LIMIT 20", (user_id,)).fetchall()
    items = [{**dict(row), "payload": json.loads(row["payload"])} for row in rows]
    latest = items[0] if items else None
    totals = list(reversed([{"date": item["created_at"][5:10], "total": item["total"]} for item in items]))
    breakdown = []
    if latest:
        breakdown = [
            {"name": "Transport", "value": latest["transport"]},
            {"name": "Electricity", "value": latest["electricity"]},
            {"name": "Diet", "value": latest["diet"]},
            {"name": "Shopping", "value": latest["shopping"]},
        ]
    return {"latest": latest, "history": items, "trend": totals, "breakdown": breakdown}


def fallback_answer(message: str):
    text = message.lower()
    words_in_message = set(re.findall(r"[a-z0-9]+", text))
    themes = {
        "transport": ["car", "commute", "travel", "flight", "bus", "bike", "transport"],
        "energy": ["electric", "energy", "power", "ac", "appliance", "solar", "grid"],
        "food": ["food", "eat", "diet", "meal", "meat", "plant", "nutrition", "calorie"],
        "waste": ["waste", "plastic", "recycle", "shopping", "packaging", "buy"],
        "community": ["community", "challenge", "team", "friend", "group", "share"],
    }
    detected = next((name for name, words in themes.items() if words_in_message.intersection(words)), "general")
    variants = {
        "transport": [
            "Replace two short solo trips with walking, cycling, transit, or carpooling, then track the avoided kilometers in EcoTrack.",
            "Bundle errands into one route and set one no-car day this week; transport reductions show up quickly in your footprint.",
        ],
        "energy": [
            "Move laundry, charging, and cooling to off-peak hours, then compare your next electricity input against this baseline.",
            "Start with standby power: unplug idle devices and use smart schedules for high-load appliances.",
        ],
        "food": [
            "Try two plant-forward meals and plan leftovers before shopping; diet and waste often improve together.",
            "Swap the highest-impact meal first rather than changing everything at once, then repeat what feels easy.",
        ],
        "waste": [
            "Use a 48-hour pause before non-essential purchases and choose refillable or repairable items when possible.",
            "Consolidate orders, avoid packaging-heavy buys, and log shopping spend again to see the reduction.",
        ],
        "community": [
            "Post one measurable goal in Community Hub and invite replies; public progress makes the habit easier to repeat.",
            "Join one weekly challenge and comment on another user's progress to create accountability.",
        ],
        "general": [
            "Pick the category you can change this week, make one measurable promise, and run the calculator again after seven days.",
            "Look for the smallest repeatable action: one commute swap, one energy shift, one meal change, or one lower-waste purchase.",
        ],
    }
    choice = variants[detected][sum(ord(ch) for ch in message) % len(variants[detected])]
    return f"Based on your question, EcoTrack would focus on {detected}: {choice} Your prompt was: {message[:160]}"


def groq_answer(message: str, system: str):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return ""
    safe_message = message.strip()
    request = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps({
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": safe_message},
            ],
            "temperature": 0.8,
            "top_p": 0.92,
            "max_completion_tokens": 700,
        }).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "EcoTrack/1.0 FastAPI Groq Client",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=18) as response:
        return json.loads(response.read().decode("utf-8"))["choices"][0]["message"]["content"]


@app.post("/assistant")
def assistant(payload: ChatPayload):
    answer = ""
    source = "groq"
    try:
        answer = groq_answer(
            payload.message,
            "You are EcoTrack, a concise sustainability assistant powered by Groq. Give dynamic, practical, personalized carbon reduction advice for any user input. Do not reuse a generic template; respond to the user's exact topic with specific next actions.",
        )
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, TimeoutError, json.JSONDecodeError):
        source = "fallback"
        answer = fallback_answer(payload.message)
    if not answer:
        source = "fallback"
        answer = fallback_answer(payload.message)

    with db() as conn:
        conn.execute(
            "INSERT INTO chats (user_id, message, answer, created_at) VALUES (?, ?, ?, ?)",
            (payload.user_id, payload.message, answer, now()),
        )
    return {"answer": answer, "source": source}


@app.get("/recommendations/{user_id}")
def recommendations(user_id: int):
    data = dashboard(user_id)
    latest = data["latest"]
    if not latest:
        return {"items": ["Run your first carbon calculation to unlock personalized recommendations."]}
    top = max(
        [("transport", latest["transport"]), ("electricity", latest["electricity"]), ("diet", latest["diet"]), ("shopping", latest["shopping"])],
        key=lambda item: item[1],
    )[0]
    recs = {
        "transport": ["Replace two short car trips with transit or cycling this week.", "Batch errands into one route to reduce idle kilometers.", "Try one remote meeting instead of a commute-heavy trip."],
        "electricity": ["Shift heavy appliance use away from peak hours.", "Switch five bulbs to LEDs or smart low-power schedules.", "Compare renewable electricity plans in your area."],
        "diet": ["Make two meals plant-forward this week.", "Choose seasonal produce to reduce cold-chain impact.", "Plan leftovers before shopping to cut food waste."],
        "shopping": ["Use a 48-hour pause before non-essential purchases.", "Buy durable/refillable versions of repeat-use items.", "Track packaging-heavy orders and consolidate them."],
    }
    try:
        prompt = (
            f"Latest EcoTrack monthly footprint: total {latest['total']} kg CO2e, "
            f"transport {latest['transport']}, electricity {latest['electricity']}, "
            f"diet {latest['diet']}, shopping {latest['shopping']}. "
            "Return exactly 3 short, distinct, personalized recommendations as a JSON array of strings. Make them specific to the numbers and highest category."
        )
        answer = groq_answer(prompt, "You generate concise EcoTrack sustainability recommendations. Return only valid JSON.")
        parsed = json.loads(answer)
        if isinstance(parsed, list) and parsed:
            return {"items": [str(item) for item in parsed[:3]], "priority": top}
    except Exception:
        pass
    total = latest["total"]
    tailored = [f"{item} Current {top} footprint is {latest[top]:.1f} kg out of {total:.1f} kg total." for item in recs[top]]
    return {"items": tailored, "priority": top}


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8006"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True, app_dir=str(Path(__file__).parent))
