# AI Interviewer & Coding Platform

## 🚀 Getting Started

### Option 1: Quick Start (Manual)

If you don't have Docker or prefer running locally:

**1. Start Backend**
Open a new terminal:
```bash
cd backend
npm install
# Update .env if needed (see .env.example)
npm run dev
```
Backend runs on `http://localhost:5000`.

**2. Start Frontend**
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.
Open `http://localhost:5173` in your browser.

---

### Option 2: Docker Setup

If you have Docker Desktop installed:

1. Open a terminal in the project root.
2. Run:
   ```bash
   docker compose up --build
   ```
   *(Note: Use `docker compose` with a space, not `docker-compose`)*

3. Access the app at `http://localhost`.

---

## 🔑 Default Credentials

- **Admin Register**: Go to `/register`, select "Admin" role.
- **Candidate Register**: Go to `/register`, select "Candidate" role.

## 🛠 Features Implemented
- **Admin Dashboard**: Create questions, Manage sessions, View Results.
- **Candidate Exam**: Monaco Editor, Code Execution (JS/Python/Java/C++), AI Interviewer.
- **Anti-Cheating**: Fullscreen enforcement, Tab-switch tracking.
- **Results**: Detailed scoring and AI analysis.
