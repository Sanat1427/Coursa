# 🏗️ Coursa Architecture

> Comprehensive architecture documentation for the Coursa AI-Powered Learning Operating System.

---

# Table of Contents

* System Overview
* Architectural Goals
* High-Level Architecture
* Core Components
* Course Generation Architecture
* Playlist-to-Course Architecture
* Learning Workspace Architecture
* AI Architecture
* Background Processing Architecture
* Authentication Architecture
* Database Architecture
* Deployment Architecture
* Scalability Strategy
* Reliability & Fault Tolerance
* Security Considerations
* Future Architecture Evolution

---

# System Overview

Coursa is an AI-powered learning platform that transforms:

* Learning Topics
* YouTube Playlists

into

* Structured Courses
* Learning Workspaces
* Interactive Learning Experiences

The platform combines:

* Next.js
* PostgreSQL
* Gemini
* Groq
* Clerk
* Inngest

to deliver scalable and personalized learning experiences.

---

# Architectural Goals

The architecture was designed around the following principles:

## 1. Scalability

Support thousands of users generating courses simultaneously.

## 2. Reliability

Continue functioning even when AI providers fail.

## 3. Performance

Deliver low-latency page loads.

## 4. Extensibility

Allow future integration of:

* Mobile Apps
* Additional AI Models
* Learning Analytics
* Team Learning Features

## 5. Cost Efficiency

Use background jobs and caching to minimize expensive AI calls.

---

# High-Level Architecture

```mermaid
flowchart TD

    User[User]

    Frontend[Next.js Frontend]

    API[API Layer]

    DB[(PostgreSQL)]

    Clerk[Clerk Authentication]

    Gemini[Google Gemini]

    Groq[Groq]

    Inngest[Inngest]

    Jobs[Background Workers]

    YouTube[YouTube APIs]

    User --> Frontend

    Frontend --> Clerk

    Frontend --> API

    API --> DB

    API --> Gemini

    Gemini -.Fallback.-> Groq

    API --> YouTube

    API --> Inngest

    Inngest --> Jobs

    Jobs --> DB
```

---

# Core Components

The platform consists of six major subsystems.

## Frontend Layer

Responsible for:

* User Interface
* Routing
* State Management
* Learning Workspace
* Dashboard

Built with:

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* Shadcn UI

---

## API Layer

Responsible for:

* Course Generation
* Playlist Processing
* Progress Tracking
* Quiz Generation
* Notes Management

Implemented using:

* Next.js Route Handlers

---

## AI Layer

Responsible for:

* Curriculum Generation
* Chapter Summaries
* Worked Examples
* Quiz Creation

Providers:

* Gemini
* Groq

---

## Database Layer

Responsible for:

* Course Storage
* User Data
* Progress Tracking
* Notes
* Learning Analytics

Implemented using:

* PostgreSQL
* Drizzle ORM

---

## Background Processing Layer

Responsible for:

* Long Running Tasks
* AI Processing
* Course Generation

Implemented using:

* Inngest

---

## Authentication Layer

Responsible for:

* User Management
* Sessions
* Authorization

Implemented using:

* Clerk

---

# Course Generation Architecture

The topic-based course generation workflow converts a single user prompt into a complete learning curriculum.

```mermaid
flowchart TD

    Topic[Learning Topic]

    Curriculum[AI Curriculum Generator]

    Chapters[Chapter Creation]

    Videos[Video Discovery]

    Materials[Resource Collection]

    Quiz[Quiz Generation]

    Storage[(Database)]

    Workspace[Learning Workspace]

    Topic --> Curriculum

    Curriculum --> Chapters

    Chapters --> Videos

    Videos --> Materials

    Materials --> Quiz

    Quiz --> Storage

    Storage --> Workspace
```

---

# Playlist-to-Course Architecture

Users can convert YouTube playlists into structured courses.

```mermaid
sequenceDiagram

    participant User
    participant Coursa
    participant YouTube
    participant Gemini
    participant Database

    User->>Coursa: Playlist URL

    Coursa->>YouTube: Fetch Playlist Metadata

    YouTube-->>Coursa: Video Information

    Coursa->>Gemini: Analyze Playlist

    Gemini-->>Coursa: Course Structure

    Coursa->>Database: Save Course

    Database-->>Coursa: Course Created

    Coursa-->>User: Learning Workspace Ready
```

---

# Learning Workspace Architecture

The learning workspace acts as the central learning environment.

```mermaid
flowchart LR

    Video[Video Lesson]

    Summary[Chapter Summary]

    Notes[Notes]

    Quiz[Quiz Engine]

    Progress[Progress Tracking]

    Materials[Learning Resources]

    Video --> Summary

    Summary --> Quiz

    Quiz --> Progress

    Summary --> Notes

    Summary --> Materials
```

---

# AI Architecture

Coursa uses a multi-provider AI architecture.

## Primary Provider

Google Gemini

Used for:

* Curriculum Generation
* Chapter Summaries
* Worked Examples
* Quizzes

---

## Fallback Provider

Groq

Activated when:

* Gemini returns 429
* Gemini returns 503
* Gemini experiences downtime

---

## AI Failover Flow

```mermaid
flowchart TD

    Request[AI Request]

    Gemini[Gemini]

    Groq[Groq]

    Success[Successful Response]

    Request --> Gemini

    Gemini --> Success

    Gemini -.429 / 503.-> Groq

    Groq --> Success
```

---

# Background Processing Architecture

Long-running operations are executed asynchronously.

```mermaid
sequenceDiagram

    participant User
    participant API
    participant Inngest
    participant Worker
    participant Database

    User->>API: Generate Course

    API->>Inngest: Queue Job

    API-->>User: Request Accepted

    Inngest->>Worker: Execute Task

    Worker->>Database: Store Results
```

Benefits:

* Faster responses
* Better scalability
* Reduced timeout risk

---

# Authentication Architecture

Authentication is handled by Clerk.

```mermaid
flowchart TD

    User

    Clerk

    Frontend

    API

    User --> Clerk

    Clerk --> Frontend

    Frontend --> API
```

Features:

* Session Management
* Social Login
* User Profiles
* Protected Routes

---

# Database Architecture

Coursa follows a relational database design.

Core entities:

```mermaid
erDiagram

    USERS ||--o{ COURSES : creates

    COURSES ||--o{ CHAPTERS : contains

    USERS ||--o{ USER_PROGRESS : tracks

    COURSES ||--o{ USER_PROGRESS : has

    CHAPTERS ||--o{ NOTES : contains

    USERS ||--o{ NOTES : writes

    CHAPTERS ||--o{ QUIZZES : generates
```

---

# Deployment Architecture

The application is deployed using Vercel.

```mermaid
flowchart LR

    User[User]

    Vercel[Vercel]

    Clerk[Clerk]

    PostgreSQL[(PostgreSQL)]

    Gemini[Gemini]

    Groq[Groq]

    Inngest[Inngest]

    User --> Vercel

    Vercel --> Clerk

    Vercel --> PostgreSQL

    Vercel --> Gemini

    Gemini -.Fallback.-> Groq

    Vercel --> Inngest
```

---

# Scalability Strategy

## Horizontal Scaling

Frontend:

* Stateless Next.js deployment

Backend:

* Serverless API routes

Database:

* Managed PostgreSQL

---

## Async Processing

AI workloads are offloaded to:

* Inngest Workers

instead of blocking requests.

---

## Future Scaling

Potential additions:

* Redis Cache
* Kafka Event Bus
* Dedicated AI Workers
* CDN Layer
* Multi-Region Deployment

---

# Reliability & Fault Tolerance

## AI Failover

Gemini → Groq

Ensures AI generation remains available.

---

## Background Processing

Long-running tasks are isolated from user-facing requests.

---

## Error Recovery

Implemented:

* Retry Logic
* Graceful Degradation
* Fallback Content

---

# Security Considerations

## Authentication

Managed by Clerk.

---

## Authorization

Users can only access:

* Their own courses
* Their own notes
* Their own progress

---

## Secrets Management

Environment variables store:

* Database URLs
* API Keys
* Authentication Secrets

---

## Input Validation

All user input is validated before processing.

---

# Future Architecture Evolution

Planned improvements:

## Learning Intelligence Layer

* Adaptive Learning Paths
* Personalized Recommendations
* Knowledge Gap Detection

## Mobile Architecture

* React Native Client

## Enterprise Features

* Team Learning
* Learning Analytics
* Organization Dashboards

## Infrastructure

* Redis
* Kafka
* Dedicated Worker Services
* Multi-Region Support

---

# Architecture Summary

Coursa is designed as a modern, scalable learning platform that combines:

* AI-Powered Course Generation
* YouTube-Based Learning
* Interactive Learning Workspaces
* Background Processing
* Multi-LLM Reliability
* Serverless Scalability

The architecture balances developer productivity, user experience, reliability, and future extensibility while maintaining a clean separation of concerns across frontend, backend, AI, and data layers.
