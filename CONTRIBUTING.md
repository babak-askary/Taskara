# Contributing to Taskara

## Workflow Overview

1. Always branch off `develop` (never from `main`)
2. Use feature branch naming: `feature/xyz`, `backend/xyz`, or `frontend/xyz`
3. Write code in **modular chunks** — each function/component does one thing
4. Commit frequently with clear messages
5. Push and create a Pull Request to `develop`
6. Wait for Babak's review and approval to merge

## Code Guidelines

### Backend
- Each controller function handles one action (e.g., `createTask`, `updateTask`)
- Each route file represents one resource
- Use middleware for cross-cutting concerns (auth, error handling)
- Keep business logic in services, not controllers

### Frontend
- One component per feature or UI element
- Group components by feature area (auth/, tasks/, dashboard/)
- Keep API calls in the `api/` folder
- Use React hooks for state and side effects

### General
- Write clear, descriptive commit messages
- Comment only when logic is non-obvious
- Follow existing code patterns in the project
- Test your changes before pushing

## Commit Message Format

```
<type>: <subject>

<body (optional)>
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `refactor` — code reorganization
- `docs` — documentation updates
- `test` — test changes
- `style` — formatting/style (no logic changes)

**Examples:**
```
feat: add task search filter by category
fix: correct date validation in task form
refactor: extract task API calls into separate module
docs: update API endpoint documentation
```

## Branch Naming

- `feature/task-comments` — general features
- `backend/auth-middleware` — backend-specific work
- `frontend/dashboard-charts` — frontend-specific work
- `fix/task-deletion-bug` — bug fixes

## Code Review Process

1. Push your branch and create a PR to `develop`
2. Babak will review your code
3. Address feedback and push changes to the same branch
4. Once approved, Babak will merge to `develop`
5. After integration, code moves to `main` via another PR

## Setting Up Locally

See README.md for full setup instructions.

Quick version:
```bash
git clone https://github.com/babak-askary/Taskara.git
cd Taskara
npm run install:all
# Create .env files (see .env.example)
npm run dev
```

## Questions?

Contact Babak or discuss in the project management board (Jira).
