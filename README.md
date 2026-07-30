<div align="center">

<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
<img src="https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot">
<img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
<img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
<img src="https://img.shields.io/badge/Gemini_AI-Powered-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI">
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">

<br /><br />

<h1>🌿 Serenity AI</h1>
<h3>Your Daily Mental Wellness Companion</h3>

<p>
  A compassionate full-stack web application for mood tracking, AI-powered journaling, guided mindfulness, habit building, and emotional support — designed to help you build a healthier relationship with your mind, one day at a time.
</p>

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎭 **Mood Tracker** | Log your daily mood, energy level, emotions, sleep, exercise, and water intake |
| 📔 **AI Journal** | Write freely — Gemini AI analyzes your entry and returns sentiment scores, themes, coping strategies, and reflection questions |
| 📊 **Wellness Analytics** | Visual charts tracking your mood trends, sleep patterns, and habit streaks over time |
| 🌿 **Life Timeline** | A unified day-by-day timeline of your moods, journals, habit completions, and life milestones |
| 🧘 **Mindfulness Library** | Guided breathing exercises (4-7-8, box breathing), 5-4-3-2-1 grounding, and ambient soundscapes |
| 💬 **Serenity Chatbot** | A compassionate AI companion for non-judgmental conversation and emotional support |
| 👥 **Trusted Circle** | Manage your personal support network of trusted contacts |
| 🏠 **Dashboard** | Daily affirmations, habit tracker, today's check-in summary, and quick access to all features |
| 🔐 **Secure Auth** | JWT-based authentication with session persistence and auto-expiry handling |

---

## 📸 Screenshots

> _Screenshots coming soon. Run the project locally to explore the full interface._

| Dashboard | Mood Tracker | AI Journal |
|---|---|---|
| _(screenshot)_ | _(screenshot)_ | _(screenshot)_ |

| Mindfulness | Chatbot | Life Timeline |
|---|---|---|
| _(screenshot)_ | _(screenshot)_ | _(screenshot)_ |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite 8
- **Tailwind CSS 4** for utility-first styling
- **Lucide React** for icons
- **Chart.js + react-chartjs-2** for data visualizations
- **Axios** for API communication

### Backend
- **Spring Boot 3** (Java 21)
- **Spring Security** with stateless JWT authentication
- **Spring Data JPA + Hibernate** for ORM
- **PostgreSQL 16** as the primary database
- **HikariCP** for connection pooling
- **Google Gemini AI API** for journal analysis and chatbot responses

---

## 🏗️ Project Architecture

```
AI Mental Wellness/
├── frontend/                    # React + Vite application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Layout.jsx       # App shell (sidebar, mobile nav)
│   │   │   └── CustomSlider.jsx # Accessible range slider
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global auth state + session handling
│   │   ├── pages/               # Feature pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MoodTracker.jsx
│   │   │   ├── Journal.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── LifeTimeline.jsx
│   │   │   ├── Mindfulness.jsx
│   │   │   ├── TrustedCircle.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── services/
│   │   │   └── api.js           # Axios instance with JWT interceptors
│   │   ├── App.jsx              # Root app router
│   │   └── main.jsx             # Entry point
│   ├── .env.example             # Environment variable template
│   └── package.json
│
└── backend/                     # Spring Boot application
    └── src/main/java/com/example/demo/
        ├── controller/          # REST API endpoints
        │   ├── AuthController.java
        │   ├── MoodController.java
        │   ├── JournalController.java
        │   ├── ChatController.java
        │   ├── HabitController.java
        │   ├── CircleController.java
        │   ├── LifeEventController.java
        │   └── TimelineController.java
        ├── service/
        │   ├── GeminiService.java   # Gemini AI integration + smart fallbacks
        │   └── TimelineService.java # Cross-domain timeline + insight generation
        ├── security/
        │   ├── JwtUtils.java
        │   ├── AuthTokenFilter.java
        │   ├── WebSecurityConfig.java
        │   └── UserDetailsServiceImpl.java
        ├── model/               # JPA entities
        ├── repository/          # Spring Data repositories
        ├── dto/                 # Data transfer objects
        └── DemoApplication.java # Application entry point + seed data
```

---

## 🚀 Installation Guide

### Prerequisites

| Tool | Version |
|---|---|
| Java JDK | 21+ |
| Maven | 3.9+ |
| Node.js | 20+ |
| PostgreSQL | 14+ |

---

### 1. 🗄️ Database Setup

```sql
-- Connect to PostgreSQL and create the database
CREATE DATABASE mindmate;
```

> Spring Boot will auto-create all tables on first run via `spring.jpa.hibernate.ddl-auto=update`.

---

### 2. ⚙️ Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Copy the example config and fill in your values
cp src/main/resources/application.properties.example src/main/resources/application.properties
```

Edit `application.properties` and set your values (see [Environment Variables](#-environment-variables)).

```bash
# Build and run the backend
./mvnw spring-boot:run
```

The backend will start on **http://localhost:8080**.

---

### 3. 🎨 Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Copy the example env file
cp .env.example .env.local

# Start the development server
npm run dev
```

The frontend will start on **http://localhost:5173**.

---

## 🔑 Environment Variables

### Backend (`application.properties`)

| Variable | Description | Default |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://localhost:5432/mindmate` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | _(required)_ |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | _(required — change in production)_ |
| `JWT_EXPIRATION` | JWT expiry in milliseconds | `86400000` (24 hours) |
| `GEMINI_API_KEY` | Google Gemini AI API key | _(optional — app uses smart fallback if not set)_ |
| `GEMINI_API_URL` | Gemini model endpoint | `gemini-2.0-flash` endpoint |

> 💡 **No Gemini key?** The app runs fully without one. `GeminiService` includes a built-in smart keyword-based fallback for journal analysis and chatbot responses.

### Frontend (`.env.local`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8080/api` |

---

## ▶️ Running the Project

```bash
# Terminal 1 — Start backend
cd backend
./mvnw spring-boot:run

# Terminal 2 — Start frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

**Default demo account** (created automatically on first run):
- Username: `john`
- Password: `password123`

Or register a new account via the signup page.

---

## 📁 Folder Structure (Quick Reference)

```
AI Mental Wellness/
├── .gitignore                  # Root gitignore
├── README.md
├── frontend/
│   ├── .env.example            # Frontend env template
│   ├── package.json
│   ├── vite.config.js
│   └── src/
└── backend/
    ├── pom.xml
    └── src/main/
        ├── java/               # Java source
        └── resources/
            ├── application.properties          # Your local config (gitignored)
            └── application.properties.example  # Safe template (committed)
```

---

## 🔮 Future Improvements

- [ ] **Progressive Web App (PWA)** — offline support and push notifications
- [ ] **Voice journaling** — record audio entries with speech-to-text transcription
- [ ] **Custom habits** — allow users to define their own habit categories
- [ ] **Export reports** — PDF/CSV export of wellness summaries and mood charts
- [ ] **Therapist integration** — optional sharing of anonymized summaries with a licensed professional
- [ ] **Multi-language support** — i18n for broader accessibility
- [ ] **Mobile apps** — React Native iOS/Android apps
- [ ] **Two-factor authentication** — enhanced account security

---

## ⚠️ Disclaimer

> **Serenity AI is a personal wellness tool, not a medical product.**
>
> This application is designed to support emotional self-awareness, reflection, and positive habit formation. It is **not** a substitute for professional mental health care, clinical therapy, psychiatric treatment, or emergency services.
>
> If you are experiencing a mental health crisis, thoughts of self-harm, or any emergency situation, please contact:
> - **Emergency Services**: 112 (India) / 911 (US)
> - **iCall (India)**: 9152987821
> - **Vandrevala Foundation**: 1860-2662-345 (24/7)
> - **988 Suicide & Crisis Lifeline (US)**: Call or text 988

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Serenity AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">
  <p>Built with 💜 for mental wellness — one mindful day at a time.</p>
  <p>
    <a href="#-features">Features</a> ·
    <a href="#-installation-guide">Installation</a> ·
    <a href="#-environment-variables">Config</a> ·
    <a href="#️-disclaimer">Disclaimer</a>
  </p>
</div>
