# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- `npm run dev` - Start development server
- `npm run host` - Start development server with host access
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run Svelte type checking
- `npm run check:watch` - Run Svelte type checking in watch mode
- `npm run format` - Format code with Prettier
- `npm run lint` - Check formatting and linting (Prettier + ESLint)

## Architecture Overview

This is a SvelteKit-based workout tracking application with the following architecture:

### Core Technologies
- **SvelteKit 2.x** - Full-stack framework with file-based routing
- **Supabase** - Backend-as-a-Service for authentication and database
- **TailwindCSS 4.x** - Utility-first CSS framework
- **TypeScript** - Type safety throughout the codebase
- **Cloudflare adapter** - Deployment target

### Project Structure

**Authentication & Authorization:**
- `src/hooks.server.ts` - Global server hooks for Supabase auth and route protection
- Auth routes in `src/routes/auth/` (login, register, logout, confirm)
- Route protection: `/app/*` routes require authentication

**Data Layer:**
- `src/lib/types.ts` - Core TypeScript types (Workout, Exercise, Cardio, Profile)
- Supabase integration via SSR client in hooks
- API routes in `src/routes/api/` for workout operations

**Application Routes:**
- `/` - Landing page
- `/demo` - Demo functionality
- `/app/*` - Protected application routes (dashboard, workout, profile, onboarding)
- `/auth/*` - Authentication flows

**Core Components:**
- `src/lib/components/` - Reusable Svelte components (Modal, ExerciseItem, CardioItem, FloatingTimer, Navbar)
- `src/lib/stores/` - Svelte stores for state management (user, workoutStore)
- `src/lib/utils/` - Utility functions (localStorage, status, normalizer, jsonParser)

### Key Features
- User onboarding and profile management
- Workout creation and tracking with exercises and cardio
- Exercise completion tracking with notes and weight adjustments
- Workout history and dashboard analytics
- Demo mode for testing without authentication
- REST timer functionality

### Authentication Flow
The app uses Supabase auth with server-side session management. The `hooks.server.ts` file handles:
1. Creating Supabase client per request
2. Session validation via JWT
3. Route protection (redirects unauthenticated users from `/app` to `/auth/login`)
4. Automatic redirect of authenticated users from `/auth` to `/app`

### Database Schema
Based on TypeScript types, the main entities are:
- **Workouts** - Contains exercises, cardio, and metadata
- **Exercises** - Strength training with sets, reps, weight, completion status
- **Cardio** - Cardio activities with distance and type
- **Profiles** - User settings, goals, and preferences

### Environment Setup
- Requires Node.js ^18.18.0 || ^20.9.0 || >=21.1.0
- Uses Supabase environment variables (PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, ENVIRONMENT)
- Development vs production configurations handled via ENVIRONMENT variable