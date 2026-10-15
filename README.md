# TaskTide: Intelligent Workload Planning & Feasibility System

> **A Constraint-Based Workload Feasibility and Decision Support Platform** for students, interns, and young professionals balancing coursework, research, internships, and fixed commitments.

---

## 🌊 Core Philosophy & Differentiators

Most traditional task trackers (Todoist, Notion, Trello, Google Calendar) only **record tasks and deadlines**. They lack the mathematical understanding to answer the critical question:
> *"Does this total workload realistically fit into the time available before my deadlines?"*

TaskTide moves from simple task tracking to **workload feasibility analysis, deadline collision simulation, and constraint-based decision support**:

1. **Workload Feasibility Engine**:
   - Calculates the exact capacity delta between required work and unblocked available time.
   - Accounts for fixed commitments (university lectures, labs, work standups, gym).
   - Flags capacity deficits with full causal honesty (e.g. *18.0h required vs 11.0h available before Wednesday = 7.0h deficit*). Refuses to generate "fake schedules" when constraints make it mathematically impossible.

2. **Deadline Collision Simulator (What-If Sandbox)**:
   - When a new task arrives or a deadline moves up, calculates the ripple effect on existing tasks before committing changes.

3. **Multi-Strategy Schedule Generator (Google OR-Tools CP-SAT)**:
   - **Deadline-First Strategy**: Minimizes lateness and places tasks with earlier deadlines first to preserve safety buffers.
   - **Balanced Workload Strategy**: Flattens daily work hours (~4.5–5.5 hrs/day) to prevent cognitive burnout.
   - **Focus-First Strategy (Deep Work)**: Groups tasks into contiguous morning blocks (09:00–13:00) to protect high-energy hours for demanding technical tasks.

4. **Personalized Duration Learning**:
   - Empirical drift calibration tracking estimated vs. actual durations.
   - Learns category multipliers (e.g., Coding & ML assignments run +28% longer).
   - Toggles an empirical safety buffer directly into the CP-SAT solver.

5. **AI Document-to-Tasks & Project Decomposer**:
   - Parses assignment briefs and syllabi into reviewable deliverable checklists.
   - Decomposes massive projects into phased milestones with dependencies.

---

## 🎨 Visual Identity & Design System

- **Palette**:
  - `Midnight` (`#151A2D`): Dark navy sidebar, crisp headings, and strong structure.
  - `Lavender` (`#8878F5`): Primary interactive accent, active indicators, and brand glow.
  - `Soft White` (`#F7F7FB`): Calm, spacious canvas background avoiding visual clutter.
  - `Mint` (`#A7E5C2`): Restrained success accent and buffer margin indicator.
  - `Coral / Amber` (`#EF4444`, `#F59E0B`): High-contrast capacity deficit & collision warnings.
- **Aesthetic**:
  - Clean Inter typography, card micro-interactions, subtle borders, and fluid Framer Motion staggered animations.
  - Fixed commitments visually locked with non-overlapping safety boundaries.

---

## 🚀 Running the Application

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)

### 2. Backend (FastAPI + Google OR-Tools CP-SAT)
```bash
cd TaskTide/backend
# Python virtual environment (optional)
pip install fastapi uvicorn ortools pydantic
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API runs at `http://127.0.0.1:8000`. Interactive docs at `http://127.0.0.1:8000/docs`.

### 3. Frontend (React 19 + TypeScript + Vite + Tailwind CSS v4)
```bash
cd TaskTide/frontend
npm install
npm run dev
```
Frontend runs at `http://127.0.0.1:5173`. Proxies `/api` calls directly to the FastAPI backend.

---

## 📁 Repository Structure

```
TaskTide/
├── backend/
│   ├── main.py              # FastAPI server, endpoints, mock profile & initial state
│   ├── models.py            # Pydantic schemas (Tasks, Commitments, Feasibility, Strategies)
│   ├── scheduler.py         # Google OR-Tools CP-SAT multi-strategy scheduling engine
│   ├── feasibility.py       # Cumulative workload capacity & deficit analyzer
│   ├── ai_engine.py         # Document parsing & project decomposition engine
│   └── requirements.txt     # Python requirements
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx                # Midnight navy navigation & duration learning toggle
│   │   │   ├── Header.tsx                 # Breadcrumbs, strain meter & primary CTA
│   │   │   ├── Dashboard.tsx              # Screen 1: Today's focus, hours meter, deadline radar
│   │   │   ├── SmartCalendar.tsx          # Screen 2: Fixed vs flexible non-overlapping calendar
│   │   │   ├── WorkloadAnalysisView.tsx   # Screen 3: Capacity breakdown & collision diagnosis
│   │   │   ├── OptimizationStudio.tsx     # Screen 4: Side-by-side trade-off comparison
│   │   │   ├── TaskBreakdownView.tsx      # Screen 5: Task manager, decomposer & document parser
│   │   │   ├── WhatIfSimulatorModal.tsx   # Feature 06: Ripple simulation sandbox
│   │   │   ├── OptimizationModal.tsx      # Multi-stage solver loading animation
│   │   │   └── AnalyticsModal.tsx         # Feature 08 & 09: Duration drift & undo history
│   │   ├── services/
│   │   │   └── api.ts                     # API client for FastAPI endpoints
│   │   ├── types/
│   │   │   └── index.ts                   # TypeScript interfaces
│   │   ├── App.tsx                        # Main state coordinator & view routing
│   │   └── index.css                      # TaskTide design system & Tailwind v4
│   ├── package.json
│   └── vite.config.ts                     # Vite + Tailwind v4 + Proxy config
└── README.md
```
