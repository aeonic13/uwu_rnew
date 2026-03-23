# Rentra Setup Guide

Complete setup guide for developers joining the Rentra project.

## Prerequisites

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd rentra-app

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Environment Configuration

#### Frontend Environment
```bash
# Copy the template
cp .env.example .env

# Edit .env and configure (optional for development)
# Most defaults work fine for local development
```

#### Backend Environment
```bash
# Copy the template
cp server/.env.example server/.env

# Edit server/.env
# The JWT_SECRET can stay as-is for development
# Other variables are optional until you implement real integrations
```

### 3. Verify Installation

```bash
# Check if linting works
npm run lint

# Run tests
npm test

# Format code
npm run format
```

## Development Workflow

### Running the Application

#### Option 1: Frontend Only
```bash
npm run dev
# Opens http://localhost:3000
```

#### Option 2: Backend Only
```bash
npm run server
# Runs on http://localhost:5000
```

#### Option 3: Full Stack (Recommended)
```bash
npm run dev:all
# Runs both frontend and backend concurrently
```

### Code Quality Checks

```bash
# Lint your code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changing files
npm run format:check
```

### Testing

```bash
# Run tests in watch mode (recommended during development)
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Git Workflow

### Pre-commit Hooks

Husky automatically runs linting and formatting on your staged files before each commit:

```bash
git add .
git commit -m "Your message"
# Husky will automatically:
# 1. Lint and fix JS/JSX files
# 2. Format all staged files with Prettier
# 3. Prevent commit if there are unfixable errors
```

### Best Practices

1. **Always run tests before pushing**
   ```bash
   npm test
   ```

2. **Check for linting errors**
   ```bash
   npm run lint
   ```

3. **Format your code**
   ```bash
   npm run format
   ```

## Project Structure

```
rentra-app/
├── src/                      # Frontend React application
│   ├── RentraApp.jsx         # Main app component
│   ├── main.jsx              # Entry point
│   ├── index.css             # Global styles
│   ├── utils/                # Utility functions
│   │   ├── security.js       # Security utilities
│   │   └── *.test.js         # Test files
│   └── [Components]/         # React components
│
├── server/                   # Backend Express API
│   ├── index.js              # Server entry point
│   ├── routes/               # API route handlers
│   │   ├── auth.js
│   │   ├── listings.js
│   │   └── ...
│   └── package.json
│
├── .husky/                   # Git hooks
├── vite.config.js            # Vite + Vitest config
├── eslint.config.js          # ESLint configuration
├── .prettierrc               # Prettier configuration
├── tailwind.config.js        # Tailwind CSS config
└── package.json              # Dependencies and scripts
```

## Common Issues & Solutions

### ESLint Errors on Commit

If pre-commit hooks fail:
1. Check the error message
2. Run `npm run lint:fix` to auto-fix
3. Manually fix remaining issues
4. Try committing again

### Port Already in Use

If port 3000 or 5000 is busy:
```bash
# Find and kill the process (macOS/Linux)
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### Module Not Found

If you get import errors:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Tests Failing

If tests are failing unexpectedly:
```bash
# Clear Vitest cache
npm run test -- --clearCache
```

## IDE Setup Recommendations

### VS Code

Install these extensions:
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **ES7+ React/Redux/React-Native snippets** (dsznajder.es7-react-js-snippets)

Add to your `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact"]
}
```

## Next Steps

1. **Read the documentation**
   - `README.md` - Project overview
   - `WARP.md` - Detailed architecture guide
   - `server/README.md` - Backend API reference

2. **Explore the codebase**
   - Start with `src/RentraApp.jsx`
   - Check out component files in `src/`
   - Look at security utilities in `src/utils/security.js`

3. **Run the application**
   ```bash
   npm run dev:all
   ```

4. **Make your first change**
   - Pick an issue from the backlog
   - Create a feature branch
   - Write tests for your changes
   - Submit a pull request

## Getting Help

- Check `WARP.md` for architectural guidance
- Review existing component patterns
- Ask questions in team channels
- Refer to React/Vite/Tailwind documentation

## Quick Reference

```bash
# Development
npm run dev              # Frontend only
npm run server           # Backend only
npm run dev:all          # Full stack

# Testing
npm test                 # Watch mode
npm run test:ui          # UI mode
npm run test:coverage    # Coverage

# Code Quality
npm run lint             # Check linting
npm run lint:fix         # Fix linting
npm run format           # Format code
npm run format:check     # Check formatting

# Build
npm run build            # Production build
npm run preview          # Preview build
```

Happy coding! 🚀
