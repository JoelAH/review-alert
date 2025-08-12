# Project Structure

## Root Directory
- **src/** - All source code
- **package.json** - Dependencies and scripts
- **tsconfig.json** - TypeScript configuration with path aliases
- **next.config.mjs** - Next.js configuration
- **.env.local** - Environment variables (not committed)

## Source Organization (`src/`)

### App Directory (`src/app/`)
Next.js App Router structure:
- **layout.tsx** - Root layout with MUI theme provider
- **page.tsx** - Home page
- **globals.scss** - Global styles
- **theme.ts** - MUI theme configuration
- **api/** - API route handlers
  - **login/route.ts** - Authentication endpoint
  - **signout/** - Sign out endpoint
- **dashboard/** - Dashboard page

### Components (`src/components/`)
Reusable React components:
- **authButton.tsx** - Google OAuth sign-in button
- **clientDashboard.tsx** - Main dashboard interface
- **getStarted.tsx** - Onboarding component
- **signOut.tsx** - Sign out functionality

### Library (`src/lib/`)
Core business logic and utilities:

#### Database (`src/lib/db/`)
- **db.ts** - MongoDB connection with Mongoose
- **user.ts** - User database operations

#### Firebase (`src/lib/firebase/`)
- **config.ts** - Client-side Firebase configuration
- **admin.config.ts** - Server-side Firebase Admin setup
- **auth.ts** - Authentication utilities

#### Models (`src/lib/models/`)
- **client/** - Client-side type definitions
- **server/** - Server-side Mongoose schemas and types
  - **user.ts** - User schema with app tracking structure
  - **review.ts** - Review data models

#### Services (`src/lib/services/`)
- **auth.ts** - Authentication service layer
- **middleware.ts** - Request middleware
- **request.ts** - HTTP request utilities

### Actions (`src/actions/`)
Server actions for form handling and data mutations

### Types (`src/types/`)
Shared TypeScript type definitions

## Naming Conventions
- **Files**: camelCase for components, kebab-case for pages
- **Components**: PascalCase React components
- **Directories**: camelCase
- **Database Models**: PascalCase schemas, camelCase exports

## Import Patterns
- Use `@/` alias for src imports
- Server-only code uses `"server-only"` import
- Client components marked with `"use client"`
- Absolute imports preferred over relative for cross-directory references