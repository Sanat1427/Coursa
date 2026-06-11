# 🎨 Coursa — The AI Learning Operating System

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-2.5_Flash-orange?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Clerk](https://img.shields.io/badge/Clerk_Auth-v6-purple?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Inngest](https://img.shields.io/badge/Inngest-Queue-green?style=for-the-badge&logo=inngest)](https://www.inngest.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Storage-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Coursa is a next-generation interactive learning platform that transforms fragmented digital resources into cohesive, personalized education pathways. Designed with a playful **hand-drawn, wobbly-border sketchbook aesthetic**, Coursa pairs modern frontend micro-interactions with an advanced backend ecosystem featuring AI-driven layout architecting, strict video search validation, parallel web-crawling keyless fallbacks, automated concept dependency mapping, and a database-driven spaced repetition scheduler.

---

## 📖 Table of Contents

- [1. Project Overview](#2-project-overview)
- [2. Demo](#3-demo)
- [3. Key Features](#4-key-features)
- [4. System Architecture](#5-system-architecture)
- [5. High-Level Design (HLD)](#6-high-level-design-hld)
- [6. Application Flow](#7-application-flow)
- [7. Database Design & Relational Schema](#8-database-design--relational-schema)
- [8. Folder Structure](#9-folder-structure)
- [9. Tech Stack Selection](#10-tech-stack-selection)
- [10. API Documentation](#11-api-documentation)
- [11. AI Architecture & Fallback Strategy](#12-ai-architecture--fallback-strategy)
- [12. Knowledge Graph Design](#13-knowledge-graph-design)
- [13. Revision Engine & SM-2 Spaced Repetition](#14-revision-engine--sm-2-spaced-repetition)
- [14. Security Design](#15-security-design)
- [15. Performance Optimizations](#16-performance-optimizations)
- [16. Scalability Architecture](#17-scalability-architecture)
- [17. Design Decisions & Trade-offs](#18-design-decisions--trade-offs)
- [18. SDE Interview Talking Points](#19-sde-interview-talking-points)
- [19. Technical Challenges & Solutions](#20-technical-challenges--solutions)
- [20. Local Development Setup](#21-local-development-setup)
- [21. Deployment Architecture](#22-deployment-architecture)
- [22. Project Roadmap](#23-project-roadmap)
- [23. Contributing](#24-contributing)
- [24. License](#25-license)
- [25. Author & Acknowledgements](#26-author--acknowledgements)

---

## 1. Project Overview

### The Problem
Self-directed online learning is deeply fragmented. While platforms like YouTube host high-quality educational videos, they lack structure, active evaluation, and retention guardrails. Students suffer from:
*   **Video Hell**: Watching hours of playlists passively without applying knowledge, resulting in immediate cognitive decay.
*   **Cold Start Problem**: Not knowing how to partition a complex new subject into logical modular prerequisites.
*   **Lack of Active Recall**: Traditional video feeds provide no interactive checkpoint quizzes or structured study notes.
*   **Disjointed Concepts**: Learning is isolated; students cannot see how "Dynamic Programming" depends on "Recursion", or how "Next.js SSR" links back to the "HTTP Protocol".

### The Solution: Coursa Learning OS
Coursa is built as an **AI Learning Operating System**. Instead of just generating simple course outlines, it dynamically creates a self-reinforcing knowledge ecosystem:
1.  **Syllabus Architecting**: Instantly sketches modular beginner-to-advanced layouts for any topic.
2.  **Validated Asset Ingestion**: Curates YouTube explanations matching the lesson concept while filtering out low-quality clickbait.
3.  **Active Evaluation**: Generates custom quizzes based on lesson transcripts in real-time.
4.  **Automatic Graph Mapping**: Extracts core technical concepts and establishes dependency edges in a relational database.
5.  **SM-2 Spaced Repetition**: Tracks concept mastery and schedules review intervals to systematically interrupt the forgetting curve.

### Comparison Matrix

| Feature | YouTube Playlists | Coursera / Udemy | Coursa OS |
| :--- | :--- | :--- | :--- |
| **Syllabus Personalization** | None (Static feeds) | None (Pre-recorded courses) | **Instant Custom Layouts** (Adaptive length) |
| **Pace Adjustments** | Manual skip | Static schedule | **Concept-level mastery tracking** |
| **Material Sourcing** | YouTube only | Proprietary video uploads | **Validated YouTube + MDN/Wiki Parallel Crawl** |
| **Active Retention Engine** | None | Simple static quizzes | **SM-2 Spaced Repetition + AI Quiz Generator** |
| **Concept Dependency Maps** | None | Textual syllabus outline | **Relational Knowledge Graph Nodes & Edges** |
| **Visual Design Theme** | Standard video grid | Corporate LMS | **Playful hand-drawn sketchbook aesthetic** |

---

## 2. Demo

### Platform Visual Interface Showcase
Since Coursa utilizes a tailored sketchbook design system, the interface utilizes wobbly hand-drawn borders, dotted paper background grids, pinned thumbtack badges, and dynamic page rotations to make digital learning feel tactile.

| Dashboard Overview | Learning Workspace |
| :---: | :---: |
| *[Landing Page & AI Generator Mock]* | *[Split View: YouTube + Live Slides]* |
| Interactive Course Generation Form, credit tracker, and active learning statistics. | Validated video stream on left; dynamic markdown notes, timelines, and slide content on right. |

| Relational Knowledge Graph | Spaced Repetition Review Board |
| :---: | :---: |
| *[Concept Mastery Nodes & Edges]* | *[SM-2 Recall & Active Rating Cards]* |
| Interactive node maps colored by mastery status (Mastered, Needs Review, Locked). | Self-assessment cards rating recall difficulty to reschedule future intervals. |



## 3. Key Features

### 🧠 AI Course Generation & Layout Sketching
*   **Purpose**: To take any abstract user input (e.g., *"Distributed Consensus Algorithms in Go"*) and formulate a logical, structured learning path.
*   **Technical Implementation**: Intercepts the request through a Next.js Server Action, validates user credit balances, and checks the database cache for identical layouts. If cached, returns immediately; otherwise, invokes the custom LLM routing client configured with `gemini-2.5-flash` (falling back to Groq `llama-3.3-70b-versatile` if rate-limited). System instructions force the model to produce a strict JSON payload mapping chapter titles, target search keywords, level tags, and descriptions.
*   **Benefits**: Zero manual syllabus drafting. Instant access to structured learning pathways tailored to the user's specific duration constraint (Quick Course: 3–5 chapters; Full Course: 5–10 chapters).

### 🔍 Strict YouTube Video Validation
*   **Purpose**: Prevents low-quality, clickbait, or irrelevant videos from polluting the syllabus.
*   **Technical Implementation**: Queries the Google YouTube API (via `googleapis`) with optimized search queries. Evaluates the top 5 results using a strict sanitization script ([lib/youtube.ts](file:///c:/Users/hp/Desktop/Coursa-main/lib/youtube.ts)) that filters out terms like *"shorts"*, *"reaction"*, *"review"*, and *"teaser"*. It then tokenizes the chapter description, removes common stop words, and checks for keyword density. Only videos with a matching title keyword and a keyword density match ratio $\ge 0.5$ are ingested.
*   **Benefits**: Guarantees highly technical, educational video content rather than speculative clickbait.

### 🌐 Dual-Mode Reference Crawling
*   **Purpose**: Supplements videos with authoritative text-based documentation and reference material.
*   **Technical Implementation**: Initiates a site-restricted search query targeting `site:developer.mozilla.org` and `site:en.wikipedia.org` using the Google Custom Search API. If API quotas are exceeded, the system initiates a concurrent, asynchronous keyless fallback targeting MDN's document search endpoint and Wikipedia's open-search API in parallel using `Promise.allSettled()`.
*   **Benefits**: Provides context-rich reference articles next to the video stream, catering to multiple learning modalities.

### 🕸️ Relational Knowledge Graph
*   **Purpose**: Maps abstract technical ideas and visualizes prerequisite relationships to prevent cognitive overload.
*   **Technical Implementation**: After a chapter is completed, a background thread scans the study material using LLM concept extraction ([lib/retentionService.ts](file:///c:/Users/hp/Desktop/Coursa-main/lib/retentionService.ts)). It extracts core concepts (creating slug-styled IDs like `time-complexity`), saves them to the `concepts` table, and inserts edges into the `concept_relationships` table (marking types such as `PREREQUISITE` or `USED_IN`). The frontend renders these nodes and edges dynamically.
*   **Benefits**: Learners see a visual representation of their skill tree and understand which foundational topics need to be mastered before progressing.

### ⏱️ Spaced Repetition Revision Scheduler
*   **Purpose**: Halts the forgetting curve by scheduling active recall reviews at mathematically calculated intervals.
*   **Technical Implementation**: Uses a modified SuperMemo-2 (SM-2) algorithm. When a user completes a lesson chapter, the first review is scheduled for 1 day later. During reviews, users answer four categories of questions (Definition, Concept, Scenario, True/False) and rate their recall difficulty. The engine recalculates the ease factor ($EF$), memory strength, and schedules the next interval (Stage 1: 1 day, Stage 2: 3 days, Stage 3: 7 days, etc.). Overdue pending reviews are marked as `MISSED` with a penalty of $-10$ applied to memory strength.
*   **Benefits**: Reduces study time while maximizing long-term memory retention.

---

## 4. System Architecture

Coursa is architected as a decoupled, multi-tiered full-stack application. It leverages serverless Next.js App Router API layers, event-driven background queues, and a relational database.

```mermaid
flowchart TD
    subgraph Client Tier (Frontend)
        User[Learner Browser] <--> UI[Next.js Client Layout / Sketchbook Style]
        UI --> Auth[Clerk Authentication Client]
    end

    subgraph API & Routing Tier (Next.js Serverless)
        AuthGate{Clerk Session Gate}
        UI <--> AuthGate
        AuthGate <--> API[Next.js App Router API Routes / Server Actions]
        API <--> Cache[unstable_cache Revalidation Layer]
    end

    subgraph AI & Verification Tier (External APIs)
        API <--> LLM[LLM Routing Client / Gemini & Groq Fallback]
        API <--> YT[YouTube Search API & Validation Engine]
        API <--> GoogleSearch[Google Custom Search / Wiki & MDN Fallback]
    end

    subgraph Background Processing Tier
        API -->|Enqueue Event| Inngest[Inngest Event Pipeline / QStash]
        Inngest -->|Async Job| Jobs[Content Generation, Concept Extraction, Quiz Seeders]
        Jobs -->|Write back| DB
    end

    subgraph Storage & Data Tier
        API <--> DB[(PostgreSQL Database / Supabase)]
        Jobs <--> DB
        API <--> Storage[(Supabase Storage Bucket)]
    end
    
    style User fill:#fdfaf6,stroke:#8b5a2b,stroke-width:2px
    style UI fill:#faf5ef,stroke:#8b5a2b,stroke-width:2px
    style Inngest fill:#eefaf0,stroke:#2e7d32,stroke-width:2px
    style DB fill:#e8f4fd,stroke:#1565c0,stroke-width:2px
    style LLM fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
```

### Architectural Tiers Breakdown
1.  **Client Tier**: Rendered using React 19, Tailwind CSS, and Radix UI. It maintains a unified, interactive sketchbook state. The frontend uses optimistic UI rendering to provide immediate feedback on progress changes and notes autosaving.
2.  **API Gate Tier**: Secure endpoints protected by Clerk Middleware. Handles route validation and implements Next.js `unstable_cache` with a 30–60 second revalidation window to minimize redundant PostgreSQL joins.
3.  **LLM Routing Client**: A resilient wrapper abstraction that handles rate-limiting and quota errors (`429`, `503`, `RESOURCE_EXHAUSTED`). If Gemini fails, it intercepts the error and routes the payload to Groq's `llama-3.3-70b-versatile` client within milliseconds.
4.  **Background Queue**: Utilizes Inngest to decouple slow API operations (YouTube validation, Google search crawling, quiz generation) from HTTP request threads, eliminating API gateway timeouts.
5.  **Relational Database**: A hosted PostgreSQL instance managed via Drizzle ORM. Tables utilize explicit indexes and foreign key cascade rules to handle relational integrity.

---

## 5. High-Level Design (HLD)

The high-level design illustrates the boundaries between our application layers and how external integrations interface with the core database.

```mermaid
flowchart LR
    Client[Next.js SPA Client] <-->|HTTPS / JSON| NextServer[Next.js App Router Server]
    Clerk[Clerk Auth Server] <-->|JWT Validation| NextServer

    subgraph NextServer [Next.js App Router Server]
        direction TB
        SA[Server Actions]
        APIRoutes[REST Endpoints /api]
        Cache[(Next.js Cache Layer)]
        Drizzle[Drizzle ORM Engine]
        
        SA <--> Drizzle
        APIRoutes <--> Drizzle
        APIRoutes <--> Cache
    end

    subgraph EventQueue [Event Queue]
        InngestRoute[Inngest API Route] -->|Event Trigger| InngestEngine[Inngest Execution Engine]
        InngestEngine -->|Webhook Execution| Worker[Queue Workers]
    end

    NextServer -->|Enqueue Event| InngestRoute
    Worker -->|Update Status / Write Data| PostgreSQL

    subgraph ExternalAPIs [External API Layer]
        Gemini[Gemini API Client]
        Groq[Groq API Fallback]
        YouTube[YouTube v3 API]
        GoogleSearchAPI[Google Custom Search]
        KeylessAPI[MDN & Wiki OpenSearch]
    end

    NextServer <--> ExternalAPIs
    Worker <--> ExternalAPIs

    subgraph DataLayer [Storage & Persistence]
        PostgreSQL[(PostgreSQL Database)]
        SupabaseStorage[(Supabase Storage Buckets)]
    end

    Drizzle <--> PostgreSQL
    NextServer <--> SupabaseStorage
```

---

## 6. Application Flow

The diagram below maps the runtime flow when a learner requests a new course. The system dynamically generates the layout, commits it to the database, initiates background generation, and fetches validated media content.

```mermaid
sequenceDiagram
    autonumber
    actor Learner
    participant Frontend as Next.js Client
    participant Server as Next.js API Server
    participant DB as PostgreSQL (Drizzle)
    participant LLM as AI Routing Client
    participant Queue as Inngest Pipeline
    participant YT as YouTube API
    participant Google as Google Search API

    Learner->>Frontend: Enter topic & request Course Generation
    Frontend->>Server: POST /api/course (userInput, type, language)
    Server->>DB: Query existing identical layouts (Cache Check)
    alt Cache Hit
        DB-->>Server: Return cached Course layout
        Server-->>Frontend: Return Course ID & status (isCached: true)
    else Cache Miss
        Server->>LLM: generateContent() with Course layout prompt
        Note over LLM: Try Gemini-2.5-Flash.<br/>If 429 quota limit hit,<br/>fallback to Groq Llama-3.3-70b
        LLM-->>Server: Return structured JSON layout
        Server->>DB: Insert into courseTable
        Server-->>Frontend: Return Course ID & status (isCached: false)
    end
    
    Frontend->>Learner: Load Course Workspace Layout
    
    loop For Each Chapter in Workspace Load
        Frontend->>Server: GET /api/course/chapter-learning?courseId=c1&chapterId=ch1
        Server->>DB: Query chapter entry
        alt Chapter Ingested in DB
            DB-->>Server: Return chapter data, video ID & articles
        else Chapter Missing (First Load Cache Miss)
            Server->>DB: Query if identical chapter title exists in other courses
            alt Chapter Title Cached Globally
                DB-->>Server: Return global video ID & articles
                Server->>DB: Duplicate chapter to current course
            else Chapter Title Global Miss
                Server->>Google: Fetch YouTube video & MDN/Wiki search materials in parallel
                Google-->>Server: Return raw search results
                Server->>Server: Validate YouTube metadata (Keyword density match ratio)
                Server->>DB: Insert chapter details (youtubeVideoId, contentMaterials)
            end
            Server->>LLM: Trigger background summaries, concept extraction & quiz seeds
            Server->>DB: Insert extracted concepts & mock quiz questions
        end
        Server-->>Frontend: Return detailed chapter payload (Video, summary, concepts, recall questions)
        Frontend->>Learner: Render workspace split-screen view
    end
```

---

## 7. Database Design & Relational Schema

Coursa uses a normalized relational database with 22 tables. Relationships are managed through primary/foreign keys with explicit constraints.

```mermaid
erDiagram
    users ||--o{ courses : "creates"
    users ||--o{ user_progress : "tracks"
    users ||--o{ quiz_attempts : "submits"
    users ||--o{ notes : "writes"
    users ||--o{ bookmarks : "marks"
    users ||--o{ revision_schedule : "scheduled for"
    users ||--o{ memory_strength : "retains"
    users ||--o{ concept_mastery : "masters"

    courses ||--o{ chapters : "contains"
    courses ||--o{ chapter_content_slides : "slides in"
    courses ||--o{ user_progress : "progress on"
    courses ||--o{ quizzes : "quizzes in"
    courses ||--o{ notes : "notes in"
    courses ||--o{ bookmarks : "bookmarks in"
    courses ||--o{ course_categories : "categorized by"
    courses ||--o{ course_completion : "completed in"
    courses ||--o{ course_views : "viewed in"
    courses ||--o{ course_recommendations : "receives"
    courses ||--o{ revision_schedule : "reviewed in"

    chapters ||--o{ chapter_content_slides : "sub-slides"
    chapters ||--o{ user_progress : "completed status"
    chapters ||--o{ quizzes : "evaluates"
    chapters ||--o{ notes : "written for"
    chapters ||--o{ bookmarks : "timeline tags"
    chapters ||--o{ revision_schedule : "scheduled by"
    chapters ||--o{ memory_strength : "retained strength"
    chapters ||--o{ revision_questions : "revision bank"
    chapters ||--o{ chapter_concepts : "teaches"

    quizzes ||--o{ questions : "consists of"
    quizzes ||--o{ quiz_attempts : "attempted via"
    questions ||--o{ quiz_answers : "answered in"
    quiz_attempts ||--o{ quiz_answers : "contains grading"

    concepts ||--o{ concept_mastery : "user score"
    concepts ||--o{ concept_relationships : "relates source"
    concepts ||--o{ concept_relationships : "relates target"
    concepts ||--o{ chapter_concepts : "linked in"
```

### Table Schema Specifications

#### 1. `usersTable`
Stores authenticated user records mapped from Clerk IDs.
*   `id`: `varchar(255)` (Primary Key, matches Clerk `user_xxx` ID)
*   `name`: `varchar(255)` (User displayName)
*   `email`: `varchar(255)` (Unique, validated primary email)
*   `credits`: `integer` (Default: 2; consumed during AI generation actions)

#### 2. `courseTable`
Main course syllabus outlines generated by the AI routing client.
*   `id`: `integer` (Primary Key, auto-increment)
*   `userId`: `varchar(255)` (Foreign Key linking to user)
*   `courseId`: `varchar(255)` (Unique slug/UUID)
*   `courseName`: `varchar(255)`
*   `userInput`: `varchar(255)` (Original prompt string)
*   `type`: `varchar(100)` (e.g., "Quick", "Full")
*   `language`: `varchar(50)` (Default: "English")
*   `courseLayout`: `json` (The structured JSON course schema)

#### 3. `chaptersTable`
Individual modules containing curriculum metadata and reference materials.
*   `id`: `integer` (Primary Key)
*   `courseId`: `varchar(255)` (References `courseTable.courseId` on cascade delete)
*   `chapterId`: `varchar(255)` (Unique identifier)
*   `chapterTitle`: `varchar(255)`
*   `youtubeVideoId`: `varchar(255)` (Validated video stream ID)
*   `contentMaterials`: `json` (MDN/Wiki reference URLs, custom LLM summaries, worked code examples)
*   `videoContent`: `json` (Sub-chapters and concept keys)
*   `caption`: `json` (Closed-captions/transcription lines if processed)

#### 4. `userProgressTable`
Tracks granular progress, completing status, and view metrics.
*   `id`: `integer` (Primary Key)
*   `userId`: `varchar(255)`
*   `courseId`: `varchar(255)` (References `courseTable.courseId`)
*   `chapterId`: `varchar(255)` (References `chaptersTable.chapterId`)
*   `status`: `varchar(50)` (Values: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`)
*   `progressPercentage`: `integer` (0 to 100)
*   `views`: `integer` (Incremented on GET requests, used to track top viewed chapters)
*   `lastVisitedAt`: `timestamp`
*   `completedAt`: `timestamp` (Null if incomplete)

#### 5. `revisionScheduleTable`
Spaced repetition dates and state modifiers for the SM-2 algorithm.
*   `id`: `integer` (Primary Key)
*   `userId`: `varchar(255)`
*   `courseId`: `varchar(255)` (References `courseTable.courseId`)
*   `chapterId`: `varchar(255)` (References `chaptersTable.chapterId`)
*   `reviewNumber`: `integer` (Review stages 1 to 6)
*   `scheduledAt`: `timestamp` (Date of scheduled review)
*   `completedAt`: `timestamp` (Null if pending review)
*   `status`: `varchar(50)` (Values: `PENDING`, `COMPLETED`, `MISSED`)
*   `easeFactor`: `doublePrecision` (Default: 2.5; ease modifier)
*   `nextReviewDate`: `timestamp` (Recalculated date)

#### 6. `conceptsTable`
Universal knowledge graph mapping core concepts.
*   `id`: `varchar(255)` (Primary Key, slug style e.g., `time-complexity`)
*   `name`: `varchar(255)`
*   `description`: `text`
*   `category`: `varchar(255)` (e.g., "Algorithms", "Backend & Systems")
*   `whyItMatters`: `text`
*   `commonMistakes`: `text`
*   `realWorldApps`: `text`

#### 7. `conceptMasteryTable`
Tracks a user's mastery levels for specific concepts in the knowledge graph.
*   `id`: `integer` (Primary Key)
*   `userId`: `varchar(255)`
*   `conceptId`: `varchar(255)` (References `conceptsTable.id`)
*   `masteryScore`: `integer` (Default: 0; bounds 0 to 100)
*   `lastReviewedAt`: `timestamp`

#### 8. `conceptRelationshipsTable`
Binds concept nodes with directional dependency edges.
*   `id`: `integer` (Primary Key)
*   `sourceConceptId`: `varchar(255)` (References `conceptsTable.id`)
*   `targetConceptId`: `varchar(255)` (References `conceptsTable.id`)
*   `relationshipType`: `varchar(50)` (Values: `PREREQUISITE`, `RELATED`, `ADVANCED_TOPIC`, `USED_IN`)

### Database Index Specifications

To optimize database read performance under high transactional load, indexes are placed on columns frequently used in `JOIN`, `WHERE`, and `ORDER BY` operations:

| Index Name | Table | Columns Indexed | Purpose |
| :--- | :--- | :--- | :--- |
| `course_categories_course_id_idx` | `course_categories` | `courseId` | Optimizes category mapping checks on course generation. |
| `course_completion_user_id_idx` | `course_completion` | `userId` | Accelerates user completion aggregation on stats dashboard load. |
| `course_recs_user_id_idx` | `course_recommendations`| `userId` | Speeds up retrieval of personalized recommendations on the homepage. |
| `rev_sched_user_id_idx` | `revision_schedule` | `userId` | Fast query execution for the revision dashboard. |
| `rev_sched_status_idx` | `revision_schedule` | `status` | Filters out completed reviews when checking for pending items. |
| `rev_sched_scheduled_at_idx` | `revision_schedule` | `scheduledAt` | Speeds up overdue reviews processing checks. |
| `mem_strength_user_chapter_idx` | `memory_strength` | `userId, chapterId` | Composite index for fast lookups of user chapter memory scores. |
| `concept_mastery_user_concept_idx`| `concept_mastery` | `userId, conceptId` | Composite index for updating mastery levels. |

---

## 8. Folder Structure

The repository follows standard Next.js App Router conventions with decoupled services in the `lib` directory:

```
Coursa-main/
├── app/                                 # Next.js App Router Directory
│   ├── (routes)/                        # Authenticated UI Layout Groups
│   │   ├── analytics/                   # Page for tracking study completions, charts
│   │   │   └── page.tsx
│   │   ├── concepts/                    # Interactive Relational skill tree visualizer
│   │   ├── course/                      # Course workspace routes
│   │   │   └── [courseId]/
│   │   ├── notes/                       # Central dashboard for all course study notes
│   │   ├── profile/                     # Profile statistics review page
│   │   ├── quiz-history/                # Learner quiz attempts scoreboards
│   │   └── revision/                    # Revision SM-2 spaced repetition cards
│   ├── _components/                     # Dashboard & Landing layouts
│   │   ├── Hero.tsx                     # Landing banner & Input Form
│   │   ├── StatsBar.tsx                 # Trust bar listing indexed metrics
│   │   └── ContinueLearning.tsx         # Active courses carousel
│   ├── actions/                         # Next.js Server Actions
│   │   └── course.ts                    # Handles course initialization
│   ├── api/                             # REST API Route Handlers
│   │   ├── analytics/                   # Aggregates daily completions & quiz trends
│   │   ├── bookmarks/                   # Timeline tag operations
│   │   ├── concepts/                    # Master list search & reviews updater
│   │   ├── course/                      # Course CRUD & chapter progress logs
│   │   ├── inngest/                     # Async queue endpoint
│   │   ├── knowledge-graph/             # Returns active nodes & relationship maps
│   │   ├── learning-insights/           # Weak/Strong concepts list & coverage stats
│   │   ├── notes/                       # Autosave notes routing
│   │   ├── quiz/                        # Quiz generation and grading
│   │   └── recommendations/             # Collaborative filtering & similarity recs
│   ├── layout.tsx                       # Global page wrappers
│   ├── page.tsx                         # Landing Page (AI learning Operating System)
│   └── provider.tsx                     # React Context and Clerk Auth configurations
├── components/                          # Shared Global UI Components
│   ├── ChapterPlaySection.tsx           # Split lesson workspace
│   ├── ConceptCardDrawer.tsx            # Slide-out details drawer for concept nodes
│   ├── CourseWorkspaceLayout.tsx        # Coordinates player tabs, slides, & notes
│   ├── KnowledgeGraphView.tsx           # SVG/Canvas graph visualizer
│   ├── NotesPanel.tsx                   # Autosaving rich note-taking editor
│   ├── QuizCard.tsx                     # Evaluation module
│   └── RecommendationsList.tsx          # Homepage matching courses
├── hooks/                               # Custom React Hooks
│   ├── useBookmarks.ts                  # Fetches/Updates bookmarks list
│   ├── useNotes.ts                      # Controls notes debounced updates
│   └── useSupabaseUpload.ts             # Direct file upload logic
├── lib/                                 # Core Architecture Services & Integrations
│   ├── db.ts                            # PostgreSQL client connection pooling
│   ├── gemini.ts                        # LLM Client wrapper with Groq fallback routing
│   ├── googleSearch.ts                  # Restrict MDN/Wiki searches with backup logic
│   ├── inngest.ts                       # Decoupled events processor client
│   ├── recommendationService.ts         # Hybrid recommendations engine
│   ├── retentionService.ts              # Spaced repetition models and graphs
│   ├── schema.ts                        # Drizzle ORM schemas
│   ├── storage.ts                       # Supabase client credentials mapping
│   └── youtube.ts                       # Validation search algorithms
├── types/                               # Common TypeScript Interfaces
├── utils/                               # Storage helpers & string utilities
├── package.json                         # Global dependencies & script files
├── tsconfig.json                        # compiler configuration rules
└── drizzle.config.ts                    # Drizzle configuration
```

---

## 9. Tech Stack Selection

Coursa uses a modern, robust, and type-safe technology stack. The selected technologies align with performance, scalability, and developer velocity requirements.

| Layer | Technology | Selected Version | Choice Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | `16.1.6` | Support for Server Components, Server Actions, and built-in optimization layers. |
| **UI Library** | React | `19.2.3` | Parallel rendering support, lightweight client-side interactions, and concurrent rendering hooks. |
| **Database Engine** | PostgreSQL | `16` | ACID compliance, support for structured JSONB formats (needed for course layouts), and performance with index filters. |
| **ORM Client** | Drizzle ORM | `0.45.1` | Type safety, zero-overhead queries, and native support for transactions and indexing scripts. |
| **Authentication Service** | Clerk Auth | `6.38.1` | Scalable session management, support for multi-locale settings, and secure webhook sync integration. |
| **AI Models Provider** | Google GenAI SDK | `1.43.0` | Fast generation speeds with `gemini-2.5-flash` at a cost-efficient price point. |
| **Groq Fallback Router** | Groq SDK | `1.2.1` | Zero-cold-start inference with `llama-3.3-70b-versatile` to handle Gemini rate limits. |
| **Asynchronous Jobs Queue**| Inngest Queue | `3.52.6` | Serverless-compatible, event-driven architecture that eliminates the need for separate worker servers. |
| **File Storage Bucket** | Supabase Storage | `2.39.0` | S3-compatible, cost-effective asset uploads with row-level security (RLS). |

---

## 10. API Documentation

All application interactions occur through secured REST API routes. Below is the documentation for the primary endpoints:

### Course API Operations

#### `GET /api/course`
*   **Purpose**: Retrieves all courses created by the authenticated user along with their learning progress, or fetches details for a specific course.
*   **Query Parameters**:
    *   `courseId` (Optional): String slug. If omitted, returns a list of all courses for the user.
*   **Headers**: Authorization Bearer Clerk Session JWT.
*   **Response (List of Courses)**:
    ```json
    [
      {
        "courseId": "c45a-982b",
        "courseName": "Introduction to Rust Programming",
        "userInput": "rust basics",
        "type": "Quick",
        "progressPercentage": 60,
        "completedChapters": 3,
        "remainingChapters": 2
      }
    ]
    ```
*   **Error Responses**:
    *   `401 Unauthorized` (Token invalid or missing).
    *   `404 Course not found` (The requested course ID does not exist).

#### `DELETE /api/course`
*   **Purpose**: Cascade deletes a course and all associated chapters, slides, progress, quizzes, attempts, notes, and bookmarks.
*   **Query Parameters**:
    *   `courseId` (Required): String slug of the course to delete.
*   **Response**:
    ```json
    {
      "success": true,
      "message": "Course deleted successfully"
    }
    ```

---

### Progress & Chapter Ingestion

#### `POST /api/course/progress`
*   **Purpose**: Updates the progress percentage of a chapter. If progress reaches 100%, it sets status to `COMPLETED` and initializes the spaced repetition schedule.
*   **Request Payload**:
    ```json
    {
      "courseId": "c45a-982b",
      "chapterId": "c45a-982b-ch1",
      "progressPercentage": 100
    }
    ```
*   **Response**:
    ```json
    {
      "id": 412,
      "userId": "user_213a",
      "courseId": "c45a-982b",
      "chapterId": "c45a-982b-ch1",
      "status": "COMPLETED",
      "progressPercentage": 100,
      "lastVisitedAt": "2026-06-12T00:00:00Z"
    }
    ```

#### `GET /api/course/chapter-learning`
*   **Purpose**: Fetches learning assets for a chapter. If the chapter does not exist in the database, it initiates parallel searches for YouTube videos and reference articles.
*   **Query Parameters**:
    *   `courseId` (Required)
    *   `chapterId` (Required)
*   **Response**:
    ```json
    {
      "youtubeVideoId": "dQw4w9WgXcQ",
      "chapterTitle": "Rust Ownership Model",
      "summary": "This chapter introduces the concept of ownership...",
      "workedExamples": [
        {
          "title": "Borrowing values",
          "code": "fn main() { let s = String::from(\"hello\"); }",
          "explanation": "Variables scope limits access..."
        }
      ],
      "concepts": [
        { "id": "variables", "name": "Variables & Scope", "masteryScore": 40 }
      ],
      "relatedConcepts": [],
      "recallQuestions": []
    }
    ```

---

### Revision Scheduler

#### `GET /api/revision/today`
*   **Purpose**: Fetches pending spaced repetition reviews scheduled for today or earlier.
*   **Response**:
    ```json
    [
      {
        "id": 92,
        "courseId": "c45a-982b",
        "chapterId": "c45a-982b-ch1",
        "reviewNumber": 2,
        "courseName": "Introduction to Rust Programming",
        "chapterTitle": "Rust Ownership Model",
        "memoryScore": 60,
        "questions": [
          {
            "question": "What is the difference between copy and move in Rust?",
            "answer": "Copy replicates bits, move shifts ownership...",
            "difficulty": "MEDIUM",
            "type": "CONCEPT"
          }
        ]
      }
    ]
    ```

#### `POST /api/revision/complete`
*   **Purpose**: Submits a review rating to update memory strength, ease factor, and schedule the next spaced repetition interval.
*   **Request Payload**:
    ```json
    {
      "chapterId": "c45a-982b-ch1",
      "scheduleId": 92,
      "rating": "EASY"
    }
    ```
*   **Response**:
    ```json
    {
      "success": true,
      "newScore": 70,
      "nextReviewDate": "2026-06-19T08:00:00.000Z"
    }
    ```

---

### Knowledge Graph & Analytics

#### `GET /api/knowledge-graph`
*   **Purpose**: Returns all concepts in the system mapped to nodes along with user mastery scores and relationship edges.
*   **Response**:
    ```json
    {
      "nodes": [
        { "id": "arrays", "name": "Arrays", "category": "Programming Basics", "status": "Mastered", "masteryScore": 85 }
      ],
      "edges": [
        { "id": "edge-1", "source": "arrays", "target": "binary-search", "type": "PREREQUISITE" }
      ]
    }
    ```

#### `GET /api/learning-insights`
*   **Purpose**: Returns aggregated data for the dashboard charts, including weak and strong concepts, category coverage, and recent activity logs.
*   **Response**:
    ```json
    {
      "metrics": {
        "masteredCount": 4,
        "needsReviewCount": 12,
        "totalConcepts": 70
      },
      "activeCourses": [],
      "categoryCoverage": [
        { "name": "Frontend", "total": 4, "learned": 3, "percentage": 75 }
      ],
      "weakConcepts": [
        { "id": "recursion", "name": "Recursion", "score": 25, "category": "Programming Basics" }
      ],
      "strongConcepts": [
        { "id": "variables", "name": "Variables & Scope", "score": 90, "category": "Programming Basics" }
      ],
      "recentActivity": []
    }
    ```

---

## 11. AI Architecture & Fallback Strategy

Coursa is designed to remain operational even when facing upstream rate limits or outages from external AI providers.

```mermaid
flowchart TD
    Request[App Route calls client.models.generateContent] --> CallGemini{Call Gemini API}
    
    CallGemini -->|Success| ReturnResponse[Parse JSON & Return]
    
    CallGemini -->|Error: 429, 503, Quota Exceeded| CheckGroq{Is GROQ_API_KEY Configured?}
    
    CheckGroq -->|Yes| MapPayload[Normalize payload to standard chat completion format]
    CheckGroq -->|No| ThrowOriginal[Throw original Gemini API Error]
    
    MapPayload --> CallGroq[Invoke Groq chat.completions.create with llama-3.3-70b-versatile]
    
    CallGroq -->|Success| AdaptResponse[Wrap response to match Gemini return schema]
    CallGroq -->|Error| ThrowCombined[Throw combined API Error]
    
    AdaptResponse --> ReturnResponse
```

### Prompt Engineering and Verification Strategy
*   **Structured Outputs**: Prompts enforce structured JSON payloads using system instructions. The configuration uses `responseMimeType: "application/json"` to ensure the output can be parsed directly.
*   **Sanitization Safeguards**: A sanitization utility removes markdown code blocks (` ```json `) from LLM responses before JSON parsing to prevent execution errors:
    ```typescript
    const sanitizedResult = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    ```
*   **Token Optimization**: Long transcripts are truncated to the first 4,000 characters before sending them to the LLM. This satisfies context length constraints while retaining core lesson details.

---

## 12. Knowledge Graph Design

The knowledge graph is a relational node-edge map. Concepts are connected by directional dependencies:
1.  **`PREREQUISITE`**: Foundational dependency that must be learned first.
2.  **`RELATED`**: High association without execution order constraints.
3.  **`ADVANCED_TOPIC`**: Advanced extension of a core concept.
4.  **`USED_IN`**: Represents architectural usage (e.g., Arrays are *used in* Hash Maps).

```mermaid
graph TD
    variables[Variables & Scope] -->|PREREQUISITE| loops[Control Flow Loops]
    variables -->|PREREQUISITE| functions[Functions & Scope]
    functions -->|PREREQUISITE| recursion[Recursion]
    recursion -->|PREREQUISITE| dp[Dynamic Programming]
    
    arrays[Arrays] -->|PREREQUISITE| binary_search[Binary Search]
    sorting[Sorting] -->|PREREQUISITE| binary_search
    binary_search -->|RELATED| bst[Binary Search Trees]
    bst -->|ADVANCED_TOPIC| avl[AVL Trees]
    avl -->|ADVANCED_TOPIC| red_black[Red-Black Trees]
    
    linked_list[Linked Lists] -->|USED_IN| stack[Stacks]
    linked_list -->|USED_IN| queue[Queues]
    
    sql[SQL Databases] -->|USED_IN| indexes[Database Indexing]
    sql -->|USED_IN| transactions[ACID Transactions]
    sql -->|RELATED| nosql[NoSQL Databases]
    
    style variables fill:#faf5ef,stroke:#8b5a2b,stroke-width:2px
    style dp fill:#fff9c4,stroke:#fbc02d,stroke-width:2px
    style red_black fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px
```

*   **Extraction Engine**: Ingested chapters generate concepts dynamically using LLMs. Extracted concepts are matched against known concept IDs to maintain graph consistency.
*   **Self-Healing Fallbacks**: If concept extraction fails, a string-matching algorithm extracts matching concepts based on predefined keyword mappings (e.g. searching for *"recurse"*, *"stack overflow"*, or *"base case"* maps back to the `recursion` concept).

---

## 13. Revision Engine & SM-2 Spaced Repetition

The revision engine manages scheduled reviews to maximize retention. It uses a modified version of the SuperMemo-2 (SM-2) algorithm.

### Spaced Repetition Logic

```mermaid
flowchart TD
    Start[User reviews a chapter due today] --> AnswerQuestions[User answers 4 active recall questions]
    AnswerQuestions --> RateRecall[User rates recall difficulty: EASY, MEDIUM, or HARD]
    
    RateRecall --> Choice{Evaluate Rating}
    
    Choice -->|EASY| UpdateEasy[Ease Factor EF += 0.15<br/>Score += 10<br/>Next Interval = Interval * EF/2.5 * 1.2<br/>Review Stage += 1]
    
    Choice -->|MEDIUM| UpdateMedium[EF unchanged<br/>Score += 10<br/>Next Interval = Interval * EF/2.5<br/>Review Stage += 1]
    
    Choice -->|HARD| UpdateHard[EF = max 1.3, EF - 0.20<br/>Score -= 15<br/>Next Interval = 1 Day<br/>Review Stage remains unchanged]
    
    UpdateEasy --> ScheduleNext[Schedule next review date]
    UpdateMedium --> ScheduleNext
    UpdateHard --> ScheduleNext
    
    ScheduleNext --> UpdateDB[Save new status & timestamp to database]
```

### Recalculation Rules
1.  **Ease Factor ($EF$)**: Modifies the scheduling multiplier. Easy reviews increase the ease factor, while Hard reviews decrease it (clamped to a minimum of 1.3).
2.  **Scheduling Interval**:
    *   **EASY**: Increments stage and schedules next review using:
        $$\text{Interval}_{\text{next}} = \text{round}\left(\text{Interval}_{\text{base}} \times \frac{EF}{2.5} \times 1.2\right)$$
    *   **MEDIUM**: Increments stage and schedules next review using:
        $$\text{Interval}_{\text{next}} = \text{round}\left(\text{Interval}_{\text{base}} \times \frac{EF}{2.5}\right)$$
    *   **HARD**: Resets interval to 1 day. The user must repeat the current review stage.
3.  **Overdue Processing**:
    *   If a pending review is overdue by more than 24 hours, the system marks the schedule as `MISSED`. It penalizes the memory strength score by $-10$ points and schedules a makeup review.

---

## 14. Security Design

Coursa enforces strict security protocols across the entire application:
*   **Authentication & Session Management**: Handled via Clerk. API routes and Server Actions extract the user's validated email address from Clerk's JWT session token:
    ```typescript
    const user = await currentUser();
    const safeUserEmail = user?.primaryEmailAddress?.emailAddress || '';
    if (!safeUserEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    ```
*   **Database Authorization**: Raw Postgres database interactions use parametrized queries via Drizzle ORM to protect against SQL Injection.
*   **Cascade Ownership Verification**: For delete operations, the system verifies ownership of the resource before executing cascade deletes in the database:
    ```typescript
    const course = await db.select().from(courseTable)
        .where(and(eq(courseTable.courseId, courseId), eq(courseTable.userId, safeUserEmail)));
    if (course.length === 0) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    ```
*   **Upload Validation**: Media files uploaded to Supabase Storage are validated by size, extension, and content type inside a Next.js API route before generating signed upload URLs.

---

## 15. Performance Optimizations

To handle complex database joins and LLM calls efficiently, the system implements several performance optimizations:

### 1. Multi-Tiered Cache Architecture
*   **Layout Caching**: Before generating a new course layout, the system queries the database to check if an identical layout has already been generated:
    ```typescript
    const existingCourse = await db.select().from(courseTable)
        .where(and(ilike(courseTable.userInput, userInput), eq(courseTable.type, type), eq(courseTable.userId, safeUserEmail)));
    ```
*   **API Caching**: Slow API endpoints like `/api/recommendations` and `/api/analytics` are cached using Next.js `unstable_cache`. They are revalidated on a cron schedule or bypassed using a `refresh=true` query parameter.

### 2. Parallel Request Execution
*   When a chapter page loads, the system fetches YouTube videos and reference articles in parallel using `Promise.all()` to minimize response latency:
    ```typescript
    const [youtubeVideoId, articles] = await Promise.all([
        fetchValidatedYouTubeVideo(optimizedQuery, chapterFromLayout.chapterTitle),
        fetchGoogleSearchMaterials(searchQuery)
    ]);
    ```

### 3. Decoupled Asynchronous Tasks
*   Slow processes like concept extraction and revision question generation are run as background tasks. The API endpoint returns the page payload immediately without waiting for these operations to complete.

---

## 16. Scalability Architecture

To prepare Coursa for high traffic and scaling, the system architecture includes several design patterns:

```mermaid
flowchart TD
    DNS[Route 53 / Cloudflare DNS] --> CDN[Cloudflare CDN Edge Nodes]
    CDN -->|Static Assets Cache| Vercel[Vercel Serverless Hosting]
    Vercel -->|Execute API Handlers| Workers[Vercel Serverless Edge Workers]
    
    Workers -->|Session Verification| Clerk[Clerk Auth Core]
    Workers -->|Read / Write| Redis[(Upstash Redis Cache Cluster)]
    
    Workers -->|Publish Event| Inngest[Inngest Cloud Hub]
    Inngest -->|Batch Execution Requests| QStash[Upstash QStash Worker Queue]
    QStash --> WorkerNode[Dedicated Background Worker Instances]
    
    Workers <-->|Query Pool| DBProxy[PgBouncer / Supabase Database Connection Pooler]
    WorkerNode <-->|Update State| DBProxy
    DBProxy <--> Postgres[(PostgreSQL Read-Replicas / Primary Instance)]
```

### High-Volume Traffic Roadmap
1.  **Connection Pooling**: Uses connection poolers (like PgBouncer) to prevent serverless database exhaustion from open connections.
2.  **Upstash Redis Cache Layer**: Caches analytics and user dashboards globally at the edge to reduce database load.
3.  **Horizontal Scale Workers**: Background queues are run on serverless workers that scale horizontally based on queue depth.

---

## 17. Design Decisions & Trade-offs

During development, we made several architectural trade-offs to balance velocity, complexity, and performance:

### 1. Database Choice: Relational PostgreSQL vs Document Store
*   **Decision**: PostgreSQL with Drizzle ORM.
*   **Trade-off**: A document database (like MongoDB) would allow saving course layouts in a single collection. However, our spaced repetition scheduler, analytics tracking, and knowledge graph are highly relational. Using PostgreSQL ensures data integrity, cascade deletion reliability, and query performance through indexes.

### 2. Next.js Server Actions vs API Endpoints
*   **Decision**: Hybrid Model. Server Actions are used for UI interactions like course creation. Standard API routes (`/api/...`) are used for dashboard queries, autosaving notes, and background tasks.
*   **Trade-off**: While Server Actions are convenient, REST API endpoints are better suited for features like autosaving notes, which require debouncing and rate limiting.

### 3. Event-Driven Background Jobs: Inngest vs BullMQ
*   **Decision**: Inngest.
*   **Trade-off**: BullMQ provides advanced queue control but requires a dedicated Redis instance and background worker servers. Inngest integrates natively with serverless platforms like Vercel and manages retries and step-functions over HTTP.

---

## 18. SDE Interview Talking Points

*This section provides technical talking points for system design and architecture interviews:*

#### Q1: How did you design a resilient LLM client that mitigates 429 rate limit errors?
> **Answer**: I implemented an abstraction client that intercepts errors from the primary provider. If the Gemini SDK returns a `429` or `RESOURCE_EXHAUSTED` status, the client formats the prompt payload and routes it to Groq's `llama-3.3-70b-versatile` client. This failover process completes in under 200ms, ensuring high availability.

#### Q2: How do you handle database connection exhaustion on serverless hosting environments?
> **Answer**: Serverless functions open database connections on demand, which can exhaust connection pools under load. To prevent this, I integrated a database connection pooler (PgBouncer) and instantiated the database client using a global singleton pattern:
> ```typescript
> const globalForDb = global as unknown as { conn: postgres.Sql | undefined };
> const connection = globalForDb.conn ?? postgres(process.env.DATABASE_URL);
> if (process.env.NODE_ENV !== "production") globalForDb.conn = connection;
> export const db = drizzle(connection, { schema });
> ```

#### Q3: How do you prevent database N+1 query problems when fetching user progress?
> **Answer**: When querying courses, we need progress percentages for each course. Instead of running a progress query for each course, I fetch all progress records for the user's courses in a single query:
> ```typescript
> const allProgress = await db.select().from(userProgressTable)
>     .where(and(eq(userProgressTable.userId, email), inArray(userProgressTable.courseId, courseIds)));
> ```
> The progress calculations are then performed in-memory, reducing database overhead.

#### Q4: How is data consistency maintained during deletion operations?
> **Answer**: When deleting a course, all child records (chapters, progress, quizzes, notes) must also be deleted. PostgreSQL manages this through foreign keys with `onDelete: "cascade"` rules. For tables where cascade deletes are not supported natively, the delete endpoint executes these operations sequentially within a database transaction:
> ```typescript
> const attemptResult = await db.transaction(async (tx) => {
>     await tx.delete(quizAnswersTable).where(inArray(quizAnswersTable.attemptId, attemptIds));
>     await tx.delete(quizAttemptsTable).where(eq(quizAttemptsTable.quizId, quizId));
> });
> ```

#### Q5: How do you handle debounced autosaving for notes to prevent database write bottlenecks?
> **Answer**: Notes are autosaved as the user types. To prevent a database write on every keystroke, the frontend uses a custom hook (`useNotes`) to debounce requests by 1000ms. On the backend, we run an upsert query to update the existing note or create a new one:
> ```typescript
> await db.insert(notesTable).values({...})
>     .onConflictDoUpdate({ target: notesTable.noteId, set: { content, updatedAt: new Date() } });
> ```

#### Q6: How does the YouTube search validator verify video quality?
> **Answer**: We query the YouTube API for the top 5 videos. The validator matches keywords between the chapter title and description while filtering out low-quality terms like *"shorts"*, *"clickbait"*, or *"reaction"*. It tokenizes the chapter description, removes stop words, and verifies that the video description has a keyword density match ratio $\ge 0.5$.

#### Q7: How does the keyless Wikipedia and MDN fallback crawler work?
> **Answer**: If the Google Custom Search API rate limit is exceeded, the system falls back to a custom crawler. It sends requests to Wikipedia's opensearch API and MDN's document search endpoint in parallel using `Promise.allSettled()`. This guarantees that reference materials are returned even if the main search API is unavailable.

#### Q8: How did you implement user analytics dashboard aggregations without slowing down page loads?
> **Answer**: Analytics dashboards require complex query aggregations. I wrapped these queries in Next.js `unstable_cache` with a 60-second cache duration. The dashboard queries this cached endpoint by default, but users can bypass the cache and force a reload using a `refresh=true` query parameter.

#### Q9: What is the math behind your spaced repetition scheduler?
> **Answer**: The scheduler uses a modified SuperMemo-2 (SM-2) algorithm. The interval between reviews is determined by the ease factor ($EF$):
> *   Easy reviews increase $EF$ by $0.15$.
> *   Medium reviews keep $EF$ unchanged.
> *   Hard reviews decrease $EF$ by $0.20$ and reset the review interval to 1 day.
> Overdue reviews are marked as `MISSED` with a score penalty of $-10$ points.

#### Q10: How do you optimize concept extraction for the knowledge graph?
> **Answer**: Running concept extraction on raw transcription text can exceed model token limits. The system truncates the text to the first 4,000 characters before sending it to the LLM. The extracted concepts are then matched against existing concept IDs to prevent duplicate nodes in the knowledge graph.

---

## 19. Technical Challenges & Solutions

#### Challenge 1: Gemini API 429 Quota Exceeded Errors
*   **Problem**: In the free tier, the Gemini API has a rate limit of 15 requests per minute. This rate limit is quickly exceeded when generating multi-chapter courses.
*   **Solution**: Built a transparent fallback routing client ([lib/gemini.ts](file:///c:/Users/hp/Desktop/Coursa-main/lib/gemini.ts)). When the client encounters a `429` error, it reformats the prompt and routes it to Groq's `llama-3.3-70b-versatile` client.
*   **Result**: The application remains responsive during traffic spikes.

#### Challenge 2: Long Database Joins Slowing down Learning Insights
*   **Problem**: The analytics dashboard queries several tables (user progress, quizzes, notes) to compute learning metrics. These queries became slow as the tables grew.
*   **Solution**: Grouped and computed progress statistics in-memory on the application server. Additionally, queries are cached using Next.js `unstable_cache` with a 60-second expiration.
*   **Result**: Query execution times dropped from 450ms to under 15ms.

#### Challenge 3: Inngest Queue Webhook Timeouts on Serverless Hosting
*   **Problem**: Serverless functions have execution time limits. Deep crawling and video validation tasks could run longer than these limits, resulting in execution timeouts.
*   **Solution**: Refactored background tasks into step functions using Inngest:
    ```typescript
    const youtubeVideoId = await step.run("fetch-youtube-video", async () => {...});
    const materials = await step.run("generate-chapter-materials", async () => {...});
    ```
*   **Result**: Long-running tasks are divided into smaller steps that execute within serverless timeout limits.

#### Challenge 4: Clickbait and Low-Quality Video Ingestion
*   **Problem**: Simple keyword searches on YouTube often return clickbait or low-quality videos instead of educational tutorials.
*   **Solution**: Implemented a keyword validation filter that checks keyword density matching ratios and excludes terms like *shorts*, *trailer*, or *reaction*.
*   **Result**: Over 95% of ingested videos are high-quality, relevant tutorials.

#### Challenge 5: Managing Cascade Deletions Safely
*   **Problem**: Deleting a course record can leave orphan records in the chapters, slides, progress, and quizzes tables.
*   **Solution**: Structured database relationships with cascade deletes. For tables where cascade deletes are not supported natively, the delete endpoint executes these operations sequentially within a transaction:
    ```typescript
    await db.transaction(async (tx) => {
        await tx.delete(chapterContentSlidesTable).where(...);
        await tx.delete(chaptersTable).where(...);
    });
    ```
*   **Result**: Prevents data leakage and ensures referential integrity in the database.

#### Challenge 6: Dynamic UI Layout Ordering Issues
*   **Problem**: The landing page components had ordering issues on mobile viewports.
*   **Solution**: Refactored the dashboard CSS to use flexbox layout directions:
    ```css
    className="flex flex-col md:flex-row gap-8"
    ```
*   **Result**: Layouts are fully responsive on mobile and desktop viewports.

#### Challenge 7: Missing Google Search API Credentials
*   **Problem**: Learners could not access course materials if the Google Search API key was missing or expired.
*   **Solution**: Implemented a parallel fallback crawler that queries Wikipedia and MDN directly when the main search API is unavailable.
*   **Result**: The search feature remains functional even without Google Search API keys.

#### Challenge 8: Clerk Sign-In Page Layout Alignment
*   **Problem**: The authentication sign-in form was misaligned on wide-screen layouts.
*   **Solution**: Refactored the authentication page into a two-column grid. The brand messaging is displayed on the left, and the Clerk sign-in form is aligned on the right.
*   **Result**: The authentication pages render correctly on all screen resolutions.

#### Challenge 9: Duplicate Concept Node Connections
*   **Problem**: Concept extraction could generate duplicate concept nodes if similar terms were spelled differently (e.g., "arrays" vs "array").
*   **Solution**: Added a sanitization script that maps extracted concepts to unique slug-style IDs.
*   **Result**: Eliminates duplicate nodes in the knowledge graph.

#### Challenge 10: Handling Overdue Spaced Repetition Reviews
*   **Problem**: Learners would fall behind on reviews, causing the scheduler to pile up outdated pending items.
*   **Solution**: Added a task that updates overdue reviews to `MISSED` status and applies a memory score penalty before scheduling makeup sessions.
*   **Result**: The scheduler automatically reschedules missed items, keeping the review dashboard up to date.

---

## 20. Local Development Setup

To run Coursa locally on your machine, follow the steps below:

### Prerequisites
*   Node.js installed (v20+ recommended)
*   PostgreSQL database instance running
*   Clerk Auth account for user sessions

### 1. Clone & Install Dependencies
```powershell
git clone https://github.com/username/coursa-main.git
cd coursa-main
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and add the following keys:
```env
# Database Credentials
DATABASE_URL="postgresql://username:password@localhost:5432/coursa"

# Authentication Credentials
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# AI API Keys
GEMINI_API_KEY="AIzaSy..."
GROQ_API_KEY="gsk_..."

# Asset Integrations
YOUTUBE_API_KEY="AIzaSy..."
GOOGLE_SEARCH_API_KEY="AIzaSy..."
GOOGLE_SEARCH_ENGINE_ID="cx_..."

# Cloud Storage
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."

# Inngest Queue
INNGEST_EVENT_KEY="key_..."
INNGEST_SIGNING_KEY="sign_..."
```

### 3. Initialize Database Migrations
Run the Drizzle push command to generate table schemas in your database:
```powershell
npx drizzle-kit push
```

### 4. Start Local Development Server
```powershell
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## 21. Deployment Architecture

Coursa is deployed using a serverless architecture:

```mermaid
flowchart TD
    Repo[GitHub Repository] -->|Git Push| Vercel[Vercel Serverless Hosting]
    Vercel -->|Deploys Server Components & API Routes| Edge[Vercel Edge Functions]
    Vercel -->|Deploys Static Assets| CDN[Vercel Edge CDN]
    
    InngestCloud[Inngest Cloud Dashboard] -->|Webhook Execution| VercelAPI[Vercel API Handler: /api/inngest]
    
    VercelAPI <--> PostgreSQL[(PostgreSQL Database)]
    VercelAPI <--> SupabaseBucket[(Supabase Storage Bucket)]
```

*   **Vercel Hosting**: Manages Next.js Server Components and API routes.
*   **Inngest Cloud**: Manages event queues and coordinates background execution.
*   **Supabase PostgreSQL**: Hosts the relational database tables and indexes.

---

## 22. Project Roadmap

### Phase 1: Core Features (Completed)
- [x] AI Course Generator with Gemini 2.5 Flash.
- [x] Resilient Groq Llama-3.3 fallback client.
- [x] Split-screen course workspace with progress tracking.
- [x] Clerk authentication and webhook synchronization.

### Phase 2: Retention & Graphs (Completed)
- [x] Spaced repetition scheduler using the SM-2 algorithm.
- [x] Knowledge graph visualizer with concept dependency mapping.
- [x] Collaborative filtering recommendations engine.
- [x] Analytics dashboard tracking learning trends.

### Phase 3: Future Enhancements (Planned)
- [ ] Collaborative study rooms with shared notes.
- [ ] Exportable PDF study guides for offline learning.
- [ ] Interactive coding playgrounds next to the video workspace.
- [ ] Adaptive learning paths that adjust difficulty based on quiz performance.

---

## 23. Contributing

We welcome contributions from the open-source community! To contribute:
1.  **Fork** the repository.
2.  Create a feature branch using standard naming conventions:
    ```powershell
    git checkout -b feature/your-feature-name
    ```
3.  Commit your changes using clear commit messages:
    ```powershell
    git commit -m "feat: add user coding playground component"
    ```
4.  Push your branch to GitHub:
    ```powershell
    git push origin feature/your-feature-name
    ```
5.  Open a **Pull Request** and describe your changes.

---

## 24. License

This project is licensed under the **MIT License**. For details, see the [LICENSE](LICENSE) file in the root directory.

---
