# Implementation Plan

- [x] 1. Extend User model with gamification data structures
  - Add gamification fields to server User schema including XP, level, badges, streaks, activity counts, and XP history
  - Update client User type definitions to include gamification data
  - Create database migration script to initialize gamification data for existing users
  - _Requirements: 6.1, 6.2_

- [x] 2. Create core gamification type definitions and enums
  - Define Badge, XPTransaction, BadgeCategory, XPAction enums and interfaces
  - Create BadgeDefinition, BadgeRequirement, and BadgeProgress interfaces
  - Export all gamification types from a central types file
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 3. Implement XP Service with core XP calculation logic
  - Create XPService class with XP award amounts and level thresholds
  - Implement awardXP method with database updates and transaction logging
  - Add calculateLevel and getXPForNextLevel utility methods
  - Write unit tests for XP calculation and level progression logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 4. Create badge definitions and Badge Service
  - Define BADGE_DEFINITIONS array with all badge configurations
  - Implement BadgeService class with badge evaluation logic
  - Add checkAndAwardBadges method to evaluate badge requirements
  - Create getBadgeProgress method to calculate progress toward unearned badges
  - Write unit tests for badge requirement evaluation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 5. Implement streak tracking and bonus XP calculation
  - Add streak tracking logic to XP Service for login streaks
  - Implement calculateStreakBonus method with streak bonus rules
  - Update user login flow to track consecutive login days
  - Add streak-based badge evaluation to Badge Service
  - Write unit tests for streak calculation and bonus XP
  - _Requirements: 1.5, 2.6, 5.3_

- [ ] 6. Create gamification API endpoints
  - Add GET /api/gamification endpoint to fetch user gamification data
  - Add POST /api/gamification/award-xp endpoint for awarding XP
  - Implement proper authentication and error handling for gamification endpoints
  - Add request validation and rate limiting for XP award endpoints
  - Write integration tests for gamification API endpoints
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Integrate XP awarding into existing user actions
  - Add XP awarding to quest creation in quest API route
  - Add XP awarding to quest state changes (in progress, completed)
  - Add XP awarding to app addition in apps API route
  - Add XP awarding to review interactions where applicable
  - Ensure all XP awards are atomic and handle errors gracefully
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [ ] 8. Create XP Progress display component
  - Build XPProgress component showing current XP, level, and progress to next level
  - Add visual progress bar with level progression
  - Display recent XP transactions with action descriptions
  - Include level-up celebration animations
  - Write unit tests for XP progress component rendering
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 9. Create Badge Collection display component
  - Build BadgeCollection component showing earned badges and progress
  - Display badges in grid layout with earned/unearned states
  - Add badge detail modal with description and requirements
  - Show progress bars for badges close to being earned
  - Write unit tests for badge collection component
  - _Requirements: 3.3, 3.6, 5.3_

- [ ] 10. Create main Gamification Display component
  - Build GamificationDisplay component integrating XP and badge components
  - Add loading states and error handling for gamification data
  - Implement refresh functionality to reload gamification data
  - Add responsive design for mobile and desktop views
  - Write integration tests for complete gamification display
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 11. Integrate gamification display into Quest tab
  - Add gamification section to QuestsTab component
  - Fetch and display user gamification data alongside quest information
  - Add loading states while fetching gamification data
  - Handle errors gracefully with retry options
  - Update Quest tab layout to accommodate gamification section
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 12. Implement XP and badge achievement notifications
  - Extend NotificationService with XP gain and badge earned notification types
  - Add celebration animations for badge achievements and level ups
  - Implement notification batching for multiple simultaneous XP gains
  - Add notification preferences and dismissal options
  - Write unit tests for notification service extensions
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 13. Add gamification progress indicators and suggestions
  - Display progress indicators for badges close to being earned
  - Show suggested activities to earn more XP when user is close to leveling up
  - Add motivational messaging for incomplete quests and available activities
  - Implement smart suggestions based on user activity patterns
  - Write unit tests for progress indicator logic
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ] 14. Implement data persistence and error recovery
  - Add atomic database operations for gamification data updates
  - Implement retry logic for failed XP awards and badge updates
  - Add data validation to prevent negative XP and duplicate badges
  - Create backup and recovery mechanisms for gamification data
  - Write integration tests for data persistence and error scenarios
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 15. Add comprehensive error handling and loading states
  - Implement proper error boundaries for gamification components
  - Add skeleton loaders for gamification data loading states
  - Handle network errors with retry mechanisms and offline indicators
  - Add fallback UI states for when gamification data is unavailable
  - Write unit tests for error handling scenarios
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 16. Create comprehensive test suite for gamification system
  - Write end-to-end tests for complete user action to XP award flow
  - Add performance tests for XP calculation with large datasets
  - Create accessibility tests for gamification UI components
  - Add integration tests for badge evaluation with complex requirements
  - Test concurrent user scenarios and race condition handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_