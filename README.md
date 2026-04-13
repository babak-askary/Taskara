# Taskara — Task Management Platform

A modern task management platform built with React, Node.js/Express, and PostgreSQL. Designed for team collaboration with real-time updates, progress tracking, and integrated features.

## Project Structure

```
Taskara/
├── backend/          # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/    # Business logic (one function = one action)
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, error handling
│   │   ├── models/         # DB queries
│   │   ├── services/       # Business logic layer
│   │   └── sockets/        # Real-time updates
│   └── tests/
│
├── frontend/         # React + Vite SPA
│   └── src/
│       ├── components/     # React components (grouped by feature)
│       ├── pages/          # Page components
│       ├── api/            # API client functions
│       ├── contexts/       # React Context state
│       ├── hooks/          # Custom React hooks
│       └── styles/         # CSS files
```

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/babak-askary/Taskara.git
cd Taskara
```

### 2. Install dependencies
```bash
npm run install:all
```

This installs packages in root, backend, and frontend folders.

### 3. Setup environment variables

**Backend** (create `backend/.env`):
```bash
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/taskara
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secret_here
NODE_ENV=development
```

**Frontend** (create `frontend/.env`):
```bash
VITE_API_URL=http://localhost:5000/api
```

See `.env.example` files for reference.

### 4. Run the project
```bash
npm run dev
```

This starts:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## Development Workflow

### Branching Strategy
- **main** — production (protected, PR-only)
- **develop** — integration (protected, PR-only)
- **feature/feature-name** — branch off `develop` for features

### Code Organization
Each piece of code does **one thing only**:
- One controller function = one action
- One API function = one endpoint
- One component = one feature

### Creating a Feature
1. Branch off `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Write code, commit frequently with clear messages:
   ```bash
   git commit -m "feat: add task creation endpoint"
   ```

3. Push and create a Pull Request to `develop`:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Wait for review and merge

### Commit Message Convention
- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code reorganization
- `docs:` — documentation
- `style:` — formatting (no logic changes)

Example:
```
feat: implement task search with filters
fix: correct task deadline validation
refactor: consolidate API client methods
```

## Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL (Neon)
- Socket.io for real-time updates
- JWT authentication

**Frontend:**
- React 19
- React Router
- Axios for HTTP
- Recharts for visualizations
- Socket.io client

## Features to Implement

- [ ] User Authentication (Auth0/Google)
- [ ] Task Management (CRUD)
- [ ] Task Comments & Attachments
- [ ] Progress Dashboard
- [ ] Search & Filtering
- [ ] Real-time Collaboration
- [ ] Performance Metrics
- [ ] AI-based Feature

## Database Setup

Create a PostgreSQL database (free tier on Neon):
1. Sign up at neon.tech
2. Create a project and database
3. Copy the connection string to `backend/.env` as `DATABASE_URL`

## Team

- **Manager**: Babak (reviews and merges PRs)
- **Backend**: 2 developers
- **Frontend**: 2 developers
