# Supabase Integration

## Overview

Coursa uses Supabase as the primary backend service.

Responsibilities:

- PostgreSQL Database
- Authentication
- Secure connection
- Database hosting

---

## Architecture

Browser
      ↓

Next.js Server Actions
      ↓

Drizzle ORM
      ↓

Supabase PostgreSQL

---

## Environment Variables

DATABASE_URL=

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

---

## Authentication Flow

User Login

↓

Supabase Auth

↓

JWT

↓

Session

↓

Protected Pages

---

## Database

Tables

- users
- courses
- chapters
- notes
- quizzes

Relationships

users
  ↓
courses
  ↓
chapters
  ↓
notes

---

## Storage

Explain if PDFs or images are stored.

---

## Best Practices

Never expose SERVICE_ROLE_KEY.

Always use server-side database access.

Use RLS in production.
