# Mon-Songlap (মন-সংলাপ)

**তোমার মনের সাথে একটা নিরাপদ সংলাপ** — A bilingual mental wellness web app for students, built for Bangladesh and beyond.

Mon-Songlap helps users reflect on stress, mood, and everyday challenges through guided chat, mood tracking, self-assessments, recovery plans, and **Mind Gym** — an AI-powered reflective scenario practice space. The app supports **Bangla** and **English**.

> **Important:** Mon-Songlap is a self-reflection and wellness support tool. It is **not** a substitute for professional diagnosis, therapy, or emergency care. If you or someone else is in crisis, use local emergency resources immediately.

---

## Features

| Module | Description |
|--------|-------------|
| **AI Chat** | Empathic conversational support with crisis keyword detection and safety routing |
| **Mind Gym** | Immersive campus scenarios (exam, presentation, conflict, social, interview, academic stress) with AI-generated reflective questions — unique per session |
| **Mood Journal & Calendar** | Daily mood logging, emotions, sleep/hydration notes |
| **Assessments** | PHQ-style screening tools with gentle result framing |
| **Recovery Plan** | Personalized activity plan based on assessment level |
| **Dashboard & Reports** | Weekly/monthly wellness summaries |
| **Achievements** | Gentle milestone tracking (non-competitive) |
| **Emergency Resources** | Bangladesh helplines (1098, Kaan Pete Roi, Alapon, etc.) |
| **Safety Plan & Trusted Contacts** | User-managed crisis preparedness |
| **Auth** | Email/password, OTP, Google sign-in (Firebase) |
| **i18n** | Full Bangla + English UI |

---

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, React Router, i18next, Three.js (Mind Gym 3D) |
| **Backend** | Laravel 13, PHP 8.3+, Laravel Sanctum |
| **Database** | MySQL |
| **AI** | Groq (Llama 3.3 70B) for Mind Gym; Gemini optional for chat/feedback |
| **Auth** | Firebase Authentication (Google) |

---

## Project Structure

```
Mon-Songlap/
├── src/                    # React frontend (pages, components, i18n, API client)
├── public/                 # Static assets (Mind Gym images & 3D models)
├── backend/                # Laravel API, models, services, migrations
├── Dataset/                # Training data, Mind Gym CSV scenarios, Colab notebooks
├── scripts/                # Dataset validation, asset download, AI config helpers
├── mon_songlap_trained_outputs/  # Generated AI prompts & safety keywords
├── .env.example            # Frontend environment template
└── backend/.env.example    # Backend environment template
```

---

## Prerequisites

- **Node.js** 20+ and npm
- **PHP** 8.3+
- **Composer**
- **MySQL** 8+
- (Optional) **Groq API key** for live Mind Gym AI questions
- (Optional) **Gemini API key** for enhanced chat feedback
- (Optional) **Firebase project** for Google sign-in

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Mon-Songlap.git
cd Mon-Songlap
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
```

Edit `backend/.env` — at minimum set your database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mon_songlap
DB_USERNAME=root
DB_PASSWORD=your_password

# AI (recommended for Mind Gym)
GROQ_API_KEYS=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Optional
GEMINI_API_KEY=your_gemini_key
```

Create the database, then migrate and seed:

```bash
php artisan migrate
php artisan db:seed
```

This creates demo users, emergency resources, chat templates, achievements, and **10 Mind Gym scenarios**.

### 3. Frontend setup

From the project root:

```bash
cp .env.example .env
npm install
```

The frontend proxies API calls to `http://localhost:8000` via Vite (see `vite.config.ts`).

### 4. Run locally (two terminals)

**Terminal 1 — Backend:**

```bash
cd backend
php artisan serve --port=8000
```

**Terminal 2 — Frontend:**

```bash
npm run dev
```

Open **http://127.0.0.1:5173**

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Demo user | `ayesha@example.com` | `password123` |
| Admin | `admin@monsonglap.com` | `admin12345` |

After login, open **Mind Gym** from the sidebar (`/app/mind-gym`).

---

## Environment Variables

### Frontend (`.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | API base path (default: `/api/v1`) |
| `VITE_FIREBASE_*` | Firebase web config for Google auth |

### Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `APP_URL` | Backend URL (default: `http://localhost:8000`) |
| `FRONTEND_URL` | Frontend URL for CORS/Sanctum |
| `DB_*` | MySQL connection |
| `GROQ_API_KEYS` | Groq API key(s) for Mind Gym AI turns |
| `GEMINI_API_KEY` | Optional Gemini for chat feedback |
| `FIREBASE_WEB_API_KEY` | Verify Google ID tokens server-side |
| `FIREBASE_PROJECT_ID` | Firebase project ID |

> Never commit real `.env` files. Only `.env.example` should be in the repository.

---

## Mind Gym

Mind Gym runs **reflective interview sessions** — not grading or diagnosis:

- Sessions start with an immersive scenario (Bangla or English)
- **6–10 turns** of open-ended questions, one at a time
- Questions are **AI-generated** (Groq) with quality gates: non-leading, non-diagnostic, language-locked
- **Duplicate detection** prevents repeating the same question in one session
- Ends with a reflective summary (optional closing note from the user)
- Optional **3D scene** assets in `public/models/mind-gym/`

### Scenario categories

`exam` · `presentation` · `conflict` · `social` · `academic_stress` · `interview`

### Dataset & clinical review

Scenario templates and branching data live in `Dataset/MindGym/`. See:

- `Dataset/MindGym/README.md` — CSV structure
- `Dataset/MindGym/SCENARIOS_FOR_EXPERT_REVIEW.md`
- `Dataset/MindGym/CRISIS_PROTOCOL_DRAFT.md`
- `CLINICAL_AND_3D_ROADMAP.md` — expert review & 3D roadmap

### Test Groq connection

```bash
php backend/scripts/test-groq.php
```

### Optional pilot analytics data

```bash
php backend/artisan db:seed --class=MindGymPilotSeeder
php backend/artisan mind-gym:beta-report
```

---

## API Overview

Base path: `/api/v1`

| Area | Examples |
|------|----------|
| Auth | `POST /auth/login`, `POST /auth/register`, `POST /auth/google` |
| Chat | `GET /conversations`, `POST /conversations/{id}/messages` |
| Mood | `GET /mood-entries`, `POST /mood-entries` |
| Wellness | `GET /recovery-plan`, `GET /safety-plan`, `GET /achievements` |
| Mind Gym | `GET /mind-gym/scenarios`, `POST /mind-gym/sessions`, `POST /mind-gym/sessions/{id}/story` |

Full routes: `backend/routes/api.php`

---

## Build & Test

```bash
# Frontend production build
npm run build

# Frontend lint
npm run lint

# Backend tests
cd backend
php artisan test
```

---

## GitHub Upload Checklist

Before pushing to GitHub:

- [ ] Do **not** commit `backend/.env` or root `.env` (secrets)
- [ ] Do **not** commit `node_modules/`, `vendor/`, or `dist/`
- [ ] Replace placeholder Firebase/Groq keys in your local `.env` only
- [ ] Run `npm run build` once to verify the frontend compiles
- [ ] Add a license file if you plan to open-source (e.g. MIT)
- [ ] Update the clone URL in this README to your GitHub repo

```bash
git add .
git commit -m "Add Mon-Songlap mental wellness platform"
git remote add origin https://github.com/YOUR_USERNAME/Mon-Songlap.git
git push -u origin main
```

---

## Windows Notes

If `php` is not on PATH, use the full path (example):

```powershell
C:\php-8.3.12\php.exe backend\artisan serve --port=8000
C:\php-8.3.12\php.exe backend\artisan migrate
```

Run frontend and backend in **separate PowerShell windows**.

---

## Roadmap

- [ ] Clinical expert sign-off on Mind Gym scenarios
- [ ] Real beta session logs replacing synthetic analytics data
- [ ] Expanded 3D Mind Gym environments
- [ ] Mobile-responsive polish and PWA
- [ ] Production deployment guide (VPS / cloud)

See `USER_MANUAL_NEEDS.md` and `CLINICAL_AND_3D_ROADMAP.md` for contributor tasks.

---

## Safety & Ethics

- Crisis keywords trigger safety messaging and helpline resources
- No diagnostic labels or clinical scores are shown to end users in Mind Gym
- User data export and deletion endpoints are available under account settings
- Guardian consent flow for younger age bands

---

## License

This project is intended for educational and wellness research use. Add your chosen license before public release.

---

## Acknowledgments

Built for Bangladeshi university students. Dataset sources include public mental-health counseling corpora (see `Dataset/MindGym/README.md`). Emergency resource numbers are for Bangladesh; verify locally before production use.

---

**Questions or contributions?** Open an issue or pull request on GitHub.
