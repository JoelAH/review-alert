# Technology Stack

## Framework & Runtime
- **Next.js 14.2.8** - React framework with App Router
- **React 18** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Node.js** - Runtime environment

## UI & Styling
- **Material-UI (MUI) v5** - Component library with theming
- **SCSS/Sass** - CSS preprocessing
- **Lato Font** - Primary typography via Google Fonts
- **React Toastify** - Toast notifications

## Authentication & Backend
- **Firebase Auth** - Google OAuth authentication
- **Firebase Admin SDK** - Server-side Firebase operations
- **MongoDB** - Database via Mongoose ODM
- **Next.js API Routes** - Backend API endpoints

## Development Tools
- **ESLint** - Code linting with Next.js config
- **Sharp** - Image optimization

## Common Commands

```bash
# Development
npm run dev          # Start dev server on port 8000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Environment Variables Required
- Firebase configuration (NEXT_PUBLIC_FIREBASE_*)
- MongoDB URI (DB_URI)
- See .env.local for complete list

## Architecture Notes
- Uses App Router (not Pages Router)
- Server-only imports with "server-only" package
- Path aliases configured (@/* maps to ./src/*)
- Strict TypeScript configuration enabled