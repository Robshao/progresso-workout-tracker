# Progresso 💪

**漸進性超負荷訓練日誌** — An offline-first workout tracker focused on progressive overload, weekly volume tracking, and muscle group analytics.

---

## 🚀 How to Run in the Browser

### Prerequisites

Make sure you have **Node.js** installed. Check with:

```bash
node --version
```

If not installed, download from [nodejs.org](https://nodejs.org).

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/Robshao/progresso-workout-tracker.git
cd progresso-workout-tracker
```

### Step 2 — Install dependencies

```bash
cd progresso-vite
npm install
```

### Step 3 — Start the dev server

```bash
npm run dev
```

### Step 4 — Open in browser

The terminal will show:

```
VITE ready in ~500ms
➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173/** in your browser. That's it — no login, no backend needed.

---

## 🛑 How to Stop the Server

Press `Ctrl + C` in the terminal.

---

## 📦 Build for Production

To generate a static site you can host anywhere:

```bash
cd progresso-vite
npm run build
```

Output goes to `progresso-vite/dist/`. You can drag this folder into [Netlify](https://netlify.com) or [Vercel](https://vercel.com) for free hosting.

---

## 📱 App Pages

| Route | Page | Description |
|-------|------|-------------|
| `/workout` | 訓練首頁 | Start a workout, see weekly summary & recent history |
| `/workout/active` | 進行中訓練 | Log sets, weights, reps in real time |
| `/history` | 訓練記錄 | Full workout history with expandable set detail |
| `/analytics` | 分析 | Weekly volume chart, muscle group breakdown |
| `/exercises` | 動作庫 | Searchable exercise library with group filters |
| `/settings` | 設定 | Clear local data, app info |

---

## 🗄️ Data Storage

All data is saved **locally in your browser** via IndexedDB (Dexie.js). Nothing is sent to any server — works fully offline.

> ⚠️ Clearing browser data or using a different browser will not carry over your workout history.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vite + React 19 + TypeScript |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 + CSS variables |
| Icons | Lucide React |
| Database | Dexie.js (IndexedDB wrapper) |
| Storage | Browser-local, offline-first |
