# 🎓 Coursa — AI-Powered Learning Operating System

> **Turn any topic or YouTube playlist into a structured, personalized learning experience.**

Coursa is an **AI-powered Learning Operating System** designed to transform unstructured online learning content into a structured and interactive learning experience.

Instead of jumping between YouTube videos, articles, notes, quizzes, and revision tools, Coursa brings them together into one learning workspace.

You can start with a **topic**, a **YouTube playlist**, or a **combination of both**. Coursa uses AI to organize the learning material into chapters, find relevant resources, generate educational content and quizzes, track progress, and support long-term retention through revision and mastery tracking.

---

## ✨ Why Coursa?

Learning from the internet often looks like this:

```text
Search a topic
     ↓
Open YouTube
     ↓
Watch random videos
     ↓
Search another tutorial
     ↓
Read articles
     ↓
Take notes somewhere else
     ↓
Forget what you learned
     ↓
Start searching again
```

Coursa turns this into:

```text
                Topic / Playlist
                       ↓
                 AI Curriculum
                       ↓
              Structured Course
                       ↓
       ┌───────────────┼───────────────┐
       ↓               ↓               ↓
     Videos          Resources       AI Content
       │               │               │
       └───────────────┼───────────────┘
                       ↓
                     Quiz
                       ↓
                Progress Tracking
                       ↓
               Concept / Mastery
                       ↓
                Revision System
                       ↓
                 Better Retention
```

### The core learning loop

**Learn → Practice → Track → Review → Improve**

---

# 🚀 Features

## 🤖 AI Course Generation

Enter a topic such as:

```text
Learn PostgreSQL
```

Coursa uses AI to generate a structured curriculum containing:

* Course title
* Course description
* Chapters
* Learning objectives
* Subtopics
* YouTube search queries
* Additional learning information

---

## 📺 YouTube Playlist → Course

Provide a YouTube playlist and Coursa can transform the playlist into a structured course.

The system processes:

* Playlist metadata
* Video information
* Video ordering
* Titles
* Descriptions
* Thumbnails
* Durations

and maps the content into a learning structure.

---

## 🔀 Topic + Playlist Hybrid Learning

Coursa supports multiple course creation modes:

### Topic Mode

```text
Topic
 ↓
AI
 ↓
Structured Curriculum
```

### Playlist Mode

```text
YouTube Playlist
 ↓
Playlist Analysis
 ↓
Structured Course
```

### Hybrid Mode

```text
Topic + YouTube Playlist
          ↓
           AI
          ↓
Structured Learning Path
```

This allows learners to combine their own preferred learning resources with AI-generated structure.

---

# 🧠 AI Architecture

Coursa does not depend on a single AI provider.

The application uses an AI routing layer with:

* **Google Gemini** as the primary provider
* **Groq** as a fallback provider
* AI response caching
* Retry handling
* Provider health tracking
* JSON validation and normalization
* Local fallback responses for supported structured content

### AI request flow

```text
                    AI Request
                         │
                         ▼
                 ┌──────────────┐
                 │ Response     │
                 │ Cache        │
                 └──────┬───────┘
                        │
                 ┌──────┴──────┐
                 │             │
               HIT            MISS
                 │             │
                 ▼             ▼
              Return        AI Router
                               │
                         ┌─────┴─────┐
                         ▼           ▼
                      Gemini       Groq
                         │           │
                         └─────┬─────┘
                               ▼
                        JSON Validation
                               │
                               ▼
                            Result
```

### Why multiple providers?

AI providers can experience:

* Rate limits
* Temporary outages
* Timeouts
* Service overload
* Invalid responses

Coursa therefore uses retries and fallback providers to improve reliability.

---

# ⚡ AI Response Caching

Repeated AI requests can be expensive and slow.

Coursa uses an AI response cache based on request characteristics such as:

* Topic
* Language
* Difficulty
* Content type

Instead of:

```text
Request
 ↓
Gemini
 ↓
Response
```

the application first checks:

```text
Request
 ↓
Cache?
 ├── YES → Return cached response
 │
 └── NO
       ↓
      AI
       ↓
    Validate
       ↓
      Cache
       ↓
     Return
```

### Benefits

* Lower AI costs
* Lower latency
* Fewer duplicate requests
* Reduced provider usage

---

# 🛠️ AI Output Validation

LLM output is probabilistic, so Coursa does not blindly trust model responses.

The application handles cases such as:

```text
Plain JSON
Markdown-wrapped JSON
Unexpected field names
Malformed JSON
Missing optional fields
```

The AI layer normalizes and validates responses before they are used by the application.

For example, different model responses such as:

```text
workedExamples
codingExamples
practicalExamples
```

can be normalized into the application's expected structure.

---

# 🔄 Background Processing with Inngest

Some operations require multiple external services:

```text
YouTube API
     +
Google Search
     +
AI
     +
PostgreSQL
```

Running all of these synchronously would make the user wait for a potentially long-running request.

Coursa uses **Inngest** for background workflows.

### Workflow

```text
User
 ↓
Next.js API
 ↓
Queue Event
 ↓
Inngest
 ↓
Background Worker
 ├── YouTube
 ├── Google Search
 ├── AI
 └── PostgreSQL
```

The API can return quickly while the actual processing happens asynchronously.

### Why Inngest?

* Background execution
* Durable workflows
* Retry support
* Step-based execution
* Better failure isolation
* Reduced HTTP request latency

---

# 📚 Chapter Learning Workspace

Each course is divided into chapters.

A chapter can contain:

* YouTube video
* Video metadata
* Captions
* AI-generated summary
* Worked examples
* Learning resources
* Notes
* Bookmarks
* Progress
* Quiz

Conceptually:

```text
                 Chapter
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
      Video      Summary     Resources
        │           │           │
        └───────────┼───────────┘
                    ↓
             Worked Examples
                    ↓
                  Quiz
                    ↓
                Progress
```

---

# 🎯 YouTube Content Selection

Coursa does not simply take the first YouTube search result.

The application evaluates candidate videos using signals such as:

* Topic relevance
* Keyword matching
* Learning objective relevance
* Technology/framework compatibility
* Description matching
* Language
* Video quality indicators

It also filters obvious low-value content such as:

* Shorts
* Trailers
* Reactions
* Teasers
* Unboxing videos
* Clickbait-style content

This helps produce more relevant educational recommendations.

---

# 🌍 Multilingual Learning

Coursa supports language-aware learning experiences.

The system can work with multiple languages and includes language detection/selection logic for generated learning content and external resources.

The architecture is designed so that the learning experience is not limited to English-only content.

---

# 📝 Notes

Learners can create notes associated with their learning context.

Notes can be connected to:

```text
User
 ↓
Course
 ↓
Chapter
```

This allows learners to keep their study material inside the learning workspace.

---

# 🔖 Video Bookmarks

Coursa supports timestamp-based bookmarks.

For example:

```text
Course: System Design
Chapter: Caching

02:31
"Important explanation of cache invalidation"
```

A bookmark can contain a note and a specific video timestamp, allowing the learner to return directly to an important point.

---

# 📊 Progress Tracking

Coursa tracks learning progress at the chapter level.

A chapter can move through states such as:

```text
NOT_STARTED
     ↓
IN_PROGRESS
     ↓
COMPLETED
```

Progress information includes concepts such as:

* Completion status
* Percentage
* Views
* Last visited time
* Completion time

This allows the dashboard to provide a learner-specific view of progress.

---

# 🧪 AI-Generated Quizzes

Coursa can generate quizzes from learning content.

The quiz architecture separates:

```text
Quiz
 ├── Question
 ├── Question
 ├── Question
 └── Question
```

and stores attempts separately:

```text
Quiz
 │
 ├── Attempt #1
 │    ├── Answer
 │    ├── Answer
 │    └── Answer
 │
 └── Attempt #2
      ├── Answer
      ├── Answer
      └── Answer
```

This allows the system to retain quiz history and performance data.

---

# 🔐 Atomic Quiz Creation

Quiz creation uses database transactions so that the quiz and its questions are created atomically.

```text
BEGIN TRANSACTION
       ↓
Create Quiz
       ↓
Create Questions
       ↓
     COMMIT
```

If an operation fails:

```text
ROLLBACK
```

This prevents partially created quizzes.

---

# 📈 Quiz Attempts

When a learner submits a quiz:

```text
Answers
   ↓
Fetch correct answers
   ↓
Compare responses
   ↓
Calculate score
   ↓
Create quiz attempt
   ↓
Store individual answers
```

For example:

```text
Correct = 4
Total = 5

Score = 4 / 5 × 100
      = 80%
```

---

# 🧠 Knowledge Graph

Coursa contains a knowledge representation layer where concepts can be represented as a graph.

Example:

```text
Arrays
   │
   ▼
Searching
   │
   ▼
Binary Search
   │
   ▼
Time Complexity
```

Concept relationships can represent ideas such as:

* Prerequisites
* Related concepts
* Advanced topics
* Dependencies

This allows learning concepts to be represented as relationships rather than just a flat list of chapters.

---

# 🎓 Concept Mastery

Coursa has a concept mastery model that associates learning concepts with a user's mastery.

Conceptually:

```text
                Concept
                   │
                   ▼
             User Mastery
                   │
          ┌────────┼────────┐
          ↓        ↓        ↓
       Strong    Review    Weak
```

This provides the foundation for personalized learning and revision.

---

# 🔁 Spaced Repetition / Revision

Coursa contains a revision system inspired by spaced-repetition techniques.

A revision schedule can track:

* Review number
* Scheduled date
* Ease factor
* Status
* Next review
* Memory strength

Example review progression:

```text
Chapter Completed
       ↓
   Review #1
       ↓
   Review #2
       ↓
   Review #3
       ↓
   Review #4
       ↓
   Review #5
```

The implementation uses a customized approach involving review stages, ease factors, memory strength and mastery rather than being a literal textbook implementation of SM-2.

---

# 📊 Learning Analytics

Coursa aggregates learning information to provide learner insights.

Examples include:

* Course progress
* Chapter completion
* Quiz performance
* Category coverage
* Strong concepts
* Weak concepts
* Recent learning activity
* Revision information

The frontend can therefore consume higher-level learning insights rather than independently querying every underlying table.

---

# 🤝 Recommendation System

Coursa contains recommendation infrastructure based on multiple signals.

### Collaborative filtering

```text
User A
 ├── React
 ├── Node.js
 └── PostgreSQL

Similar users
 ├── React
 ├── Node.js
 └── Docker

             ↓

Recommended:
Docker
```

### Popularity

Courses can be ranked using engagement signals such as:

```text
Popularity Score
=
0.7 × Completions
+
0.3 × Views
```

### Category-based recommendations

Courses can also be grouped into categories and used to identify related learning opportunities.

### Hybrid approach

```text
Collaborative Filtering
          +
Category Similarity
          +
Popularity
          ↓
     Ranked Results
```

> **Implementation note:** The underlying recommendation service and supporting data model exist, but the current recommendation API routes are temporarily disabled.

---

# 🗄️ Database Architecture

Coursa uses:

### PostgreSQL

PostgreSQL is the **primary relational database**.

### Drizzle ORM

Drizzle provides:

* Type-safe database access
* Schema definitions in TypeScript
* SQL-like querying
* Migration support

### Core data model

```text
User
 │
 ├── Courses
 │     └── Chapters
 │            ├── Quiz
 │            │    ├── Questions
 │            │    └── Attempts
 │            │
 │            ├── Notes
 │            ├── Bookmarks
 │            └── Progress
 │
 ├── Concept Mastery
 │
 └── Revision Schedule
```

---

# ☁️ Why Supabase?

Supabase is used separately from the primary PostgreSQL application layer.

Coursa uses **Supabase Storage for file/media storage**.

```text
                    Coursa
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    PostgreSQL                  Supabase
     + Drizzle                  Storage
          │                         │
          ▼                         ▼
 Structured data              Files / Media
          │
 ┌────────┼─────────┐
 ↓        ↓         ↓
Users   Courses   Quizzes
```

The application contains dedicated storage functionality such as:

```text
utils/supabase-storage.ts
hooks/useSupabaseUpload.ts
components/SupabaseUploadZone.tsx
```

### Why use object storage?

Large files are better suited to object storage than being stored directly inside relational database rows.

Instead of:

```text
PostgreSQL
 └── Large audio/file binary
```

the application can use:

```text
Supabase Storage
 └── File

PostgreSQL
 └── File metadata / URL
```

---

# 🔐 Authentication

Coursa uses **Clerk** for authentication and user identity.

The general flow is:

```text
User
 ↓
Clerk
 ↓
Authenticated Session
 ↓
Next.js Server
 ↓
currentUser()
 ↓
Application Authorization
 ↓
Database
```

Authentication and authorization are treated as separate concerns:

* **Authentication:** Who is the user?
* **Authorization:** Can the user access this course/chapter/resource?

---

# 🏗️ High-Level Architecture

```text
                         ┌───────────────┐
                         │     User      │
                         └───────┬───────┘
                                 │
                                 ▼
                       ┌──────────────────┐
                       │     Next.js      │
                       │ React + TypeScript│
                       └────────┬─────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
           Clerk           API Routes       Server Actions
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
        PostgreSQL           AI Router          Inngest
             │                  │                  │
             │            ┌─────┴─────┐            ▼
             │            ▼           ▼         Workers
             │         Gemini        Groq          │
             │                                      │
             │                              ┌───────┼───────┐
             │                              ▼       ▼       ▼
             │                           YouTube  Search    AI
             │
             ▼
       Learning Data

                         Supabase Storage
                              │
                              ▼
                         Files / Media
```

---

# 🧰 Tech Stack

| Layer           | Technology       |
| --------------- | ---------------- |
| Framework       | Next.js          |
| UI              | React            |
| Language        | TypeScript       |
| Styling         | Tailwind CSS     |
| Components      | shadcn/ui        |
| Database        | PostgreSQL       |
| ORM             | Drizzle ORM      |
| Authentication  | Clerk            |
| Primary AI      | Google Gemini    |
| AI Fallback     | Groq             |
| Background Jobs | Inngest          |
| Video Data      | YouTube API      |
| Search          | Google Search    |
| File Storage    | Supabase Storage |
| Charts          | Recharts         |
| Video/Media     | Remotion         |
| Validation      | Zod              |
| Deployment      | Vercel           |

---

# 📁 Project Structure

```text
Coursa/
│
├── app/
│   ├── api/
│   ├── course/
│   ├── dashboard/
│   └── ...
│
├── components/
│   ├── CourseWorkspaceLayout
│   ├── ChapterPlaySection
│   ├── ChapterProgressTracker
│   ├── NotesPanel
│   ├── QuizCard
│   ├── YouTubePlayer
│   └── ...
│
├── hooks/
│   ├── useBookmarks
│   ├── useNotes
│   ├── useSupabaseUpload
│   └── ...
│
├── lib/
│   ├── AI services
│   ├── Database services
│   ├── Recommendation services
│   ├── Revision services
│   └── ...
│
├── utils/
│   └── supabase-storage.ts
│
├── db/
│   ├── schema
│   └── ...
│
├── inngest/
│   └── background workflows
│
└── ...
```

---

# 🔄 Complete User Journey

```text
                    User
                     │
                     ▼
          Login with Clerk
                     │
                     ▼
        Choose learning method
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
        Topic     Playlist    Hybrid
          │          │          │
          └──────────┼──────────┘
                     ▼
                 AI Router
                     │
              ┌──────┴──────┐
              ▼             ▼
           Gemini          Groq
              │             │
              └──────┬──────┘
                     ▼
              Course Created
                     │
                     ▼
            Chapter Processing
                     │
                  Inngest
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
    YouTube        Search          AI
       │             │             │
       └─────────────┼─────────────┘
                     ▼
              Learning Workspace
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
      Video        Notes         Quiz
        │            │            │
        └────────────┼────────────┘
                     ▼
              Progress Tracking
                     │
                     ▼
               Course Complete
                     │
                     ▼
             Revision / Mastery
```

---

# 🧩 API Surface

Coursa contains API routes for major application capabilities, including:

```text
/api/analytics
/api/bookmarks
/api/concepts
/api/concepts/review
/api/course
/api/course/progress
/api/course/chapter-learning
/api/generate-video-content
/api/knowledge-graph
/api/learning-insights
/api/notes
/api/playlist/preview
/api/playlist/graph
/api/playlist/flashcards
/api/quiz
/api/quiz/attempt
/api/quiz/history
/api/recommendations
/api/revision/today
/api/revision/upcoming
/api/revision/complete
/api/transcribe
/api/upload-file
/api/user
/api/user/stats
/api/inngest
```

---

# ⚡ Performance & Reliability

Coursa uses several techniques to improve application performance and reliability.

### AI caching

Avoid repeated expensive model calls.

### Database indexes

Improve frequent lookup and filtering operations.

### Parallel data fetching

Independent queries can be executed concurrently.

### Background processing

Move expensive operations away from the main HTTP request.

### AI fallback

Gemini → Groq when necessary.

### Defensive parsing

Protect the application from malformed model output.

### Cached learning insights

Avoid recalculating expensive dashboard-level analytics for every request.

---

# 🔒 Security Considerations

Coursa uses Clerk authentication and performs server-side user checks.

For a production deployment, important security practices include:

* Never expose AI API keys to the browser
* Keep database credentials server-side
* Validate API input
* Enforce resource ownership
* Rate-limit expensive endpoints
* Protect upload endpoints
* Use signed URLs where appropriate
* Avoid trusting client-provided user IDs
* Prefer immutable authentication-provider IDs over mutable emails

---

# 🧪 Testing Strategy

A production-ready testing strategy for Coursa includes:

### Unit Tests

Test isolated logic such as:

* AI response parsing
* YouTube scoring
* Language detection
* Revision calculations
* Recommendation scoring
* Mastery calculations

### Integration Tests

Test:

```text
API → Database
API → Authentication
Quiz → Transaction
Progress → Revision
```

### End-to-End Tests

Example:

```text
Login
 ↓
Create Course
 ↓
Open Chapter
 ↓
Track Progress
 ↓
Complete Chapter
 ↓
Take Quiz
 ↓
Submit Attempt
 ↓
Revision Scheduled
```

---

# 📈 Scaling Coursa

If the application grows significantly, the architecture can evolve toward:

```text
                    CDN
                     │
                     ▼
              Next.js Instances
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
        Cache      APIs       Workers
          │          │          │
          └──────────┼──────────┘
                     ▼
               PostgreSQL
                /       \
               /         \
        Read Replicas    Primary
```

Potential improvements include:

* Redis/Upstash caching
* Distributed locks
* Request deduplication
* AI request rate limiting
* Database connection pooling
* Read replicas
* Background job scaling
* CDN-backed media
* Structured logging
* Error tracking
* Distributed tracing

---

# 🛣️ Future Improvements

Potential future improvements include:

* More advanced personalization
* Fully automated concept extraction
* Improved recommendation APIs
* Better knowledge graph generation
* More sophisticated spaced repetition
* Learning streaks
* AI tutoring/chat
* Voice-based learning
* Flashcard generation
* More learning providers beyond YouTube
* Advanced progress analytics
* Team/classroom learning
* Better AI source verification
* Comprehensive automated testing

---

# ⚙️ Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/Sanat1427/Coursa.git

cd Coursa
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create:

```text
.env.local
```

and configure the required credentials for:

```text
PostgreSQL
Clerk
Gemini
Groq
YouTube
Inngest
Supabase
```

Refer to the project's setup documentation for the exact variables required by each integration.

## 4. Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🧠 Engineering Principles

Coursa follows several important engineering principles:

### 1. AI should not be a single point of failure

Use:

```text
Cache → Gemini → Groq → Fallback
```

### 2. Long-running operations should be asynchronous

Use:

```text
API → Inngest → Worker
```

### 3. PostgreSQL remains the source of truth

Structured learning state belongs in the relational database.

### 4. External services should be treated as unreliable dependencies

YouTube, Search and AI providers can fail and should therefore have defensive handling.

### 5. AI output should be validated

Never assume LLM output is perfectly structured.

### 6. Separate storage concerns

```text
PostgreSQL → structured application data
Supabase Storage → files/media
```

---

# 📌 Current Implementation Notes

Some advanced systems are present in the codebase but are not currently enabled in every workflow.

### Recommendation APIs

The recommendation services and supporting data model are implemented, but the current recommendation API endpoints are temporarily disabled.

### Automatic concept/revision extraction

The supporting concept and revision infrastructure exists, but some automatic extraction steps in the active chapter-processing workflow are currently disabled.

This README intentionally distinguishes between **implemented infrastructure** and **currently active application flows**.

---

# 👨‍💻 Author

**Sanat Kishore**

GitHub:
https://github.com/Sanat1427

Project:
https://github.com/Sanat1427/Coursa

---

# ⭐ If you find Coursa interesting

Give the repository a ⭐ and feel free to explore the implementation.

---

## Coursa

### Learn smarter. Practice better. Remember longer.

**Learn → Practice → Track → Review → Improve**
