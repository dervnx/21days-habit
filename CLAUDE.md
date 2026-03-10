# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A 21-day habit tracking web application with a Django REST API backend and React frontend.

## Commands

### Development
```bash
# Start all services (development mode)
cd deploy/development && docker-compose up --build

# Run backend only (requires PostgreSQL and Redis running)
cd backend && python manage.py runserver

# Run frontend only
cd frontend && npm run dev

# Run frontend tests
cd frontend && npm run lint

# Build frontend for production
cd frontend && npm run build
```

### Production
```bash
# Start production services
cd deploy/production && docker-compose up --build -d
```

### Database
```bash
# Create migrations
cd backend && python manage.py makemigrations

# Apply migrations
cd backend && python manage.py migrate

# Create superuser
cd backend && python manage.py create_superuser
```

### Logs
- Log directory: `logs/`
- Log files: `api_user.log`, `api_admin.log`, `django.log`

## Architecture

### Backend (Django)
- **Framework**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL (habit_db)
- **Cache/Sessions**: Redis
- **Authentication**: Token-based (DRF authtoken) + Session authentication
- **Timezone**: Asia/Shanghai
- **Language**: Chinese (zh-hans)

**Key endpoints**:
- `/api/auth/register/` - User registration
- `/api/auth/login/` - User login
- `/api/auth/logout/` - User logout
- `/api/auth/user/` - Current user profile (GET/PATCH)
- `/api/habits/` - Habit CRUD
- `/api/habits/checkin/` - Daily check-in
- `/api-admin/stats/` - Admin statistics
- `/api-admin/users/` - Admin user management

### Frontend (React)
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with token interceptor
- **Date handling**: dayjs

**Pages**:
- `/login` - Login page
- `/register` - Registration page
- `/` - Habit list (private)
- `/habit/:id` - Habit detail with check-ins (private)
- `/profile` - User profile (private)
- `/admin` - Admin dashboard (admin only)
- `/admin/users` - Admin user management (admin only)

### Data Models

- **User** (custom, extends AbstractUser): email (unique)
- **UserProfile**: nickname, bio, timestamps
- **Habit**: user, name, description, frequency (daily/weekly), is_active
- **CheckIn**: habit, user, date, status (completed/missed), note

## Key Files

- `backend/habit_project/settings.py` - Django settings
- `backend/habit_app/models.py` - Data models
- `backend/habit_app/views.py` - API views and ViewSets
- `backend/habit_app/serializers.py` - DRF serializers
- `frontend/src/services/api.js` - Axios instance with auth interceptor
- `frontend/src/context/AuthContext.jsx` - Authentication state management
