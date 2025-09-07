# Database Migrations

This directory contains database migration scripts for the ReviewQuest application.

## Available Migrations

### 001-add-gamification-data.ts

Adds gamification data structures to existing users in the database.

**What it does:**
- Adds `gamification` field to users who don't have it
- Initializes XP to 0, level to 1
- Sets up empty badges array and XP history
- Initializes activity counters (including current app count)
- Sets up streak tracking

**Usage:**

```bash
# Run the migration
node scripts/migrate-gamification.js

# Rollback the migration (for testing)
node scripts/migrate-gamification.js --rollback
```

**Requirements:**
- MongoDB connection must be configured via `DB_URI` environment variable
- `ts-node` package for TypeScript compilation

## Migration Guidelines

1. Always test migrations on a backup/development database first
2. Each migration should be idempotent (safe to run multiple times)
3. Include both forward and rollback functionality
4. Add comprehensive tests for migration logic
5. Document what the migration does and how to use it