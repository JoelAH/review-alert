# ReviewQuest 🎯

[![Next.js](https://img.shields.io/badge/Next.js-14.2.8-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5-blue?logo=mui)](https://mui.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange?logo=firebase)](https://firebase.google.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)](https://www.mongodb.com/)

**ReviewQuest** is a comprehensive web application that helps developers and app publishers monitor, track, and manage reviews across multiple app stores. Transform your review management into an engaging, gamified experience with XP points, badges, and quest-based workflows.

## 🌟 Features

### Core Functionality
- **Multi-Store Review Monitoring** - Track reviews from Chrome Web Store, Google Play Store, and Apple App Store
- **Google OAuth Authentication** - Secure, seamless sign-in with Google accounts
- **Real-time Review Tracking** - Monitor new reviews and changes across all your applications
- **Centralized Dashboard** - Unified interface for managing all your tracked applications

### Gamification System
- **XP Points & Leveling** - Earn experience points for completing tasks and engaging with reviews
- **Badge Collection** - Unlock achievements for milestones, streaks, and special accomplishments  
- **Quest Management** - Create and track development tasks linked to user feedback
- **Progress Tracking** - Visual indicators for your gamification journey
- **Login Streaks** - Bonus XP for consistent daily engagement

### Advanced Features
- **Review Sentiment Analysis** - Automatic categorization of positive/negative feedback
- **Quest-Review Linking** - Connect development tasks directly to user reviews
- **Filtering & Search** - Advanced filtering by platform, rating, sentiment, and quest status
- **Responsive Design** - Optimized experience across desktop and mobile devices
- **Performance Optimized** - Fast loading with efficient data fetching and caching

## 🛠 Technology Stack

### Frontend
- **Next.js 14.2.8** - React framework with App Router architecture
- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript 5** - Type-safe JavaScript for better development experience
- **Material-UI (MUI) v5** - Comprehensive component library with theming
- **SCSS/Sass** - Advanced CSS preprocessing for styling
- **React Toastify** - Toast notifications for user feedback

### Backend & Database
- **Next.js API Routes** - Server-side API endpoints with middleware
- **Firebase Authentication** - Google OAuth and session management
- **Firebase Admin SDK** - Server-side Firebase operations
- **MongoDB** - NoSQL database with Mongoose ODM
- **Server-Only Architecture** - Secure server-side code separation

### Serverless apps in backend folder
- **Review API** - Gets all reviews for the app when its submitted
- **Classification API** - API that gets the priority, sentinment and category for the review.


### Development Tools
- **ESLint** - Code linting with Next.js configuration
- **Jest** - Testing framework with React Testing Library
- **Sharp** - Image optimization for better performance
- **TypeScript Strict Mode** - Enhanced type checking and safety

## 📋 Prerequisites

Before setting up ReviewQuest, ensure you have:

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **npm or yarn** - Package manager (comes with Node.js)
- **Firebase Project** - [Create at Firebase Console](https://console.firebase.google.com/)
- **MongoDB Database** - Local installation or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Google Cloud Project** - For OAuth credentials (can use same as Firebase)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd review-quest
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Database
DB_URI=mongodb://localhost:27017/reviewquest
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/reviewquest

# Firebase Admin (Service Account)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'

# API Keys (Optional)
EMAIL_API_KEY=your_email_service_key
BACKEND_API_KEY=your_backend_api_key

# Email Authentication Configuration
EMAIL_VALIDATION_ENABLED=true
EMAIL_DISPOSABLE_CHECK_ENABLED=true
EMAIL_DISPOSABLE_CACHE_ENABLED=true
EMAIL_DISPOSABLE_CACHE_TTL=86400000
EMAIL_MAX_LENGTH=254
AUTH_MIN_PASSWORD_LENGTH=8
AUTH_MAX_PASSWORD_LENGTH=128
AUTH_SESSION_EXPIRATION_DAYS=5
```

### 4. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication in Firebase Auth
3. Generate a service account key:
   - Go to Project Settings → Service Accounts
   - Generate new private key
   - Copy the JSON content to `FIREBASE_SERVICE_ACCOUNT_KEY`
4. Add your domain to authorized domains in Firebase Auth settings

### 5. MongoDB Setup
**Local MongoDB:**
```bash
# Install MongoDB locally
# macOS with Homebrew:
brew install mongodb-community
brew services start mongodb-community

# The default connection string is:
# mongodb://localhost:27017/reviewquest
```

**MongoDB Atlas (Cloud):**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and update `DB_URI`

### 6. Start Development Server
```bash
npm run dev
```

Open [http://localhost:8000](http://localhost:8000) to view the application.

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start development server on port 8000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint code linting

# Testing
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API route handlers
│   │   ├── gamification/  # XP and badge endpoints
│   │   ├── quests/        # Quest management API
│   │   ├── reviews/       # Review tracking API
│   │   └── login/         # Authentication endpoints
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Authentication pages
│   ├── signup/           # User registration
│   ├── layout.tsx        # Root layout with MUI theme
│   ├── page.tsx          # Home page
│   └── globals.scss      # Global styles
├── components/            # Reusable React components
│   ├── dashboard/        # Dashboard-specific components
│   ├── landing/          # Landing page components
│   ├── common/           # Shared components
│   └── __tests__/        # Component tests
├── lib/                  # Core business logic
│   ├── db/              # Database connection and models
│   ├── firebase/        # Firebase configuration
│   ├── models/          # Data models (client/server)
│   ├── services/        # Business logic services
│   └── utils/           # Utility functions
├── types/               # TypeScript type definitions
└── actions/             # Server actions
```

## 🔐 Authentication Flow

ReviewQuest uses Firebase Authentication with Google OAuth:

1. **User Sign-In** - Users authenticate via Google OAuth
2. **Session Management** - Firebase creates secure session cookies
3. **API Protection** - All API routes verify session cookies
4. **User Creation** - New users automatically get database records
5. **Gamification Init** - New users start with default XP and level 1

## 🗄 Database Schema

### User Model
```typescript
{
  uid: string,              // Firebase UID
  email: string,            // User email
  apps: [{                  // Tracked applications
    store: 'ChromeExt' | 'GooglePlay' | 'AppleStore',
    url: string,
    appId: string,
    appName: string
  }],
  gamification: {           // Gamification data
    xp: number,
    level: number,
    badges: Badge[],
    streaks: StreakData,
    activityCounts: ActivityCounts,
    xpHistory: XPTransaction[]
  }
}
```

### Quest Model
```typescript
{
  user: ObjectId,           // Reference to user
  title: string,            // Quest title
  details?: string,         // Quest description
  type: QuestType,          // BUG_FIX, FEATURE_REQUEST, etc.
  priority: QuestPriority,  // HIGH, MEDIUM, LOW
  state: QuestState,        // OPEN, IN_PROGRESS, DONE
  reviewId?: ObjectId       // Linked review (optional)
}
```

### Review Model
```typescript
{
  user: ObjectId,           // Reference to user
  appId: ObjectId,          // Reference to tracked app
  rating: number,           // 1-5 star rating
  content: string,          // Review text
  sentiment: ReviewSentiment, // POSITIVE, NEGATIVE
  quest?: ReviewQuest,      // BUG, FEATURE_REQUEST, OTHER
  questId?: ObjectId,       // Linked quest (optional)
  date: Date               // Review date
}
```

## 🌐 API Endpoints

### Authentication
- `POST /api/login` - User authentication
- `POST /api/signout` - User logout

### Gamification
- `GET /api/gamification` - Get user's XP, level, badges, and progress
- `POST /api/gamification/award-xp` - Award XP for actions

### Quests
- `GET /api/quests` - List user's quests with filtering
- `POST /api/quests` - Create new quest
- `GET /api/quests/[questId]` - Get specific quest
- `PUT /api/quests/[questId]` - Update quest
- `DELETE /api/quests/[questId]` - Delete quest

### Reviews
- `GET /api/reviews` - List user's reviews with filtering
- `PUT /api/reviews` - Update review (link to quest)
- `GET /api/reviews/[reviewId]` - Get specific review

### Apps
- `GET /api/apps/[appId]` - Get app details
- `PUT /api/apps/[appId]` - Update app settings
- `DELETE /api/apps/[appId]` - Remove tracked app

## 🎮 Gamification System

### XP Actions & Values
- **Quest Created**: 10 XP
- **Quest In Progress**: 5 XP  
- **Quest Completed**: 15 XP
- **App Added**: 20 XP
- **Review Interaction**: 8 XP
- **Login Streak Bonus**: 5-15 XP (based on streak length)

### Level Thresholds
- Level 1: 0 XP
- Level 2: 100 XP
- Level 3: 250 XP
- Level 4: 500 XP
- Level 5: 1,000 XP
- Level 6: 1,750 XP
- Level 7: 2,750 XP
- Level 8: 4,000 XP
- Level 9: 5,500 XP
- Level 10: 7,500 XP
- Level 11: 10,000 XP

### Badge Categories
- **Milestone**: XP-based achievements
- **Achievement**: Activity-based accomplishments
- **Streak**: Consecutive activity rewards
- **Collection**: Collection-based badges

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to [Vercel](https://vercel.com)
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Variables for Production
Ensure all environment variables are set in your production environment:
- Firebase configuration
- MongoDB connection string
- Service account keys
- API keys

## 🤝 Contributing

We welcome contributions to ReviewQuest! Please follow these guidelines:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the existing code style and conventions
4. Write tests for new functionality
5. Ensure all tests pass: `npm run test`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Standards
- Use TypeScript for all new code
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

### Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Include error messages, browser console logs, and steps to reproduce

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Material-UI](https://mui.com/) for the comprehensive component library
- [Firebase](https://firebase.google.com/) for authentication and hosting
- [MongoDB](https://www.mongodb.com/) for the flexible database solution

---

**Happy Reviewing! 🎯**