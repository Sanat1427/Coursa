# 📚 Coursa — AI YouTube Course Generator

Coursa turns any topic into a **structured, multi-chapter video course** in seconds. You type
what you want to learn (e.g. *"Learn Machine Learning"*), and the app uses **Google Gemini** to
design a syllabus, generates an optimized **YouTube** search query per chapter, fetches the most
relevant tutorial video, and gathers supplementary reading from **GeeksforGeeks, Wikipedia, MDN,
and W3Schools** — all stitched into a clean, Udemy-style learning experience.

The heavy lifting (video lookup + study-material gathering) runs as **background jobs** via
**Inngest**, so the UI stays responsive while courses are built asynchronously.

---

## ✨ Features

- **AI course generation** — Gemini 2.5 Flash produces a structured syllabus (course name,
  description, level, chapters with key takeaways) as strict JSON.
- **Quick vs. full courses** — `quickcourse` (3–5 chapters) or `fullcourse` (5–10 chapters).
- **Multi-language** — courses can be generated in a chosen language; the YouTube query is
  localized accordingly.
- **Smart YouTube matching** — each chapter gets an AI-optimized search query and the best
  embeddable, medium-length tutorial is selected via the YouTube Data API.
- **Auto study materials** — relevant articles are gathered from GeeksforGeeks, Wikipedia, MDN,
  and W3Schools per chapter.
- **Background processing** — video lookup + material gathering run as Inngest jobs (with
  `maxDuration` tuned for Vercel) so requests never block.
- **Caching** — previously generated course layouts and chapter videos are reused to save API
  quota and time.
- **Auth & credits** — Clerk handles sign-in/sign-up; new users start with credits stored in
  Postgres.
- **File uploads** — images/videos/files upload to Supabase Storage (1 GB free tier).
- **Optional audio transcription** — `/api/transcribe` runs OpenAI Whisper locally via CLI.
- **Modern UI** — Next.js App Router, React 19, Tailwind CSS v4, and shadcn/ui (new-york style).

---

## 🧱 Tech Stack

| Layer            | Technology                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Framework        | [Next.js 16](https://nextjs.org/) (App Router) + React 19             |
| Language         | TypeScript                                                            |
| Styling / UI     | Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/), Radix UI, lucide |
| Auth             | [Clerk](https://clerk.com/)                                           |
| AI               | [Google Gemini](https://ai.google.dev/) (`@google/genai`), Groq fallback |
| Video data       | YouTube Data API v3 (`googleapis`)                                    |
| Database         | PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/) + `postgres`  |
| Background jobs  | [Inngest](https://www.inngest.com/)                                   |
| Storage          | [Supabase Storage](https://supabase.com/storage)                      |
| Video rendering  | [Remotion](https://www.remotion.dev/)                                 |
| Validation/forms | Zod, React Hook Form                                                  |

---

## 🏗️ How It Works

```
User enters a topic (Hero form)
        │
        ▼
POST /api/generate-course-layout
   • Gemini 2.5 Flash builds the syllabus (JSON)   ──► falls back to Groq (llama-3.3-70b) on failure
   • cached if the same topic+type exists for the user
   • course saved to `courses` table
        │
        ▼  (per chapter)
POST /api/generate-video-content
   • returns cached video if the chapter was built before
   • otherwise dispatches an Inngest event `video/generate`
        │
        ▼  (Inngest background job — app/api/inngest/functions.ts)
   1. fetch best YouTube video for the chapter's optimized query
   2. gather articles (GeeksforGeeks / Wikipedia / MDN / W3Schools)
   3. persist the chapter (video id + materials) to `chapters` table
        │
        ▼
GET /api/course?courseId=...  ──► renders the finished course at /course/[courseId]
```

---

## 📁 Project Structure

```
Coursa/
├── app/
│   ├── (auth)/                 # Clerk sign-in / sign-up routes
│   ├── (routes)/course/[courseId]/   # Course viewer page + components
│   ├── _components/            # Landing page: Hero, Features, Pricing, CourseList, Header
│   ├── api/
│   │   ├── generate-course-layout/   # POST — Gemini syllabus generation (+ Groq fallback)
│   │   ├── generate-video-content/   # POST — queue/cached chapter video generation
│   │   ├── inngest/                  # Inngest serve handler + background functions
│   │   ├── course/                   # GET (fetch) / DELETE (cascade) courses
│   │   ├── user/                     # POST — upsert Clerk user into DB
│   │   ├── upload-file/              # POST — upload to Supabase Storage
│   │   ├── transcribe/               # POST — Whisper CLI audio transcription
│   │   ├── proxy-audio/              # GET — SSRF-guarded audio proxy
│   │   ├── debug/ · test/            # diagnostics
│   ├── layout.tsx · provider.tsx · page.tsx · globals.css
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   └── SupabaseUploadZone.tsx
├── config/
│   ├── db.tsx                  # Drizzle + postgres client (cached on globalThis)
│   ├── schema.tsx              # Drizzle schema (users, courses, chapters, slides)
│   ├── gemini.ts · inngest.ts · storage.ts
├── context/                    # UserDetailContext
├── data/                       # Prompt.ts (AI prompts), constant.ts (suggestions), Dummy.ts
├── hooks/                      # useSupabaseUpload, use-mobile
├── lib/ · type/ · utils/       # helpers, types, supabase-storage util
├── scripts/                    # one-off DB inspection/maintenance scripts
├── drizzle.config.ts           # Drizzle Kit config (schema → ./drizzle)
├── proxy.ts                    # Clerk middleware (route protection)
└── SUPABASE_STORAGE_SETUP.md   # detailed storage setup guide
```

### Database schema (`config/schema.tsx`)

- **`users`** — `id` (Clerk user id), `name`, `email` (unique), `credits` (default 2).
- **`courses`** — `courseId` (unique), `userId`, `courseName`, `userInput`, `type`, `language`,
  `courseLayout` (JSON), timestamps.
- **`chapters`** — `chapterId` (unique), `courseId` (FK), `chapterTitle`, `youtubeVideoId`,
  `contentMaterials` / `videoContent` / `caption` (JSON), `audioFileUrl`, timestamps.
- **`chapter_content_slides`** — per-slide narration/HTML/reveal data + audio for richer content.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (Node 20 recommended) and npm
- A **PostgreSQL** database (e.g. Supabase, Neon, or local Postgres)
- Accounts / API keys for: **Clerk**, **Google Gemini**, **YouTube Data API**, **Supabase**,
  and (optional) **Inngest**, **Groq**

### 1. Clone & install

```bash
git clone https://github.com/Sanat1427/Coursa.git
cd Coursa
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root (see the full table below):

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Clerk auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# AI
GEMINI_API_KEY="..."
GROQ_API_KEY="..."            # optional fallback

# YouTube Data API
YOUTUBE_API_KEY="..."

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."   # optional, server-side only — keep secret

# Inngest (optional for local dev; uses "local" defaults)
INNGEST_EVENT_KEY="..."
```

> See [`SUPABASE_STORAGE_SETUP.md`](./SUPABASE_STORAGE_SETUP.md) for bucket creation and storage
> details. **Never** prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_` or expose it to the
> client.

### 3. Set up the database

Push the Drizzle schema to your Postgres database:

```bash
npx drizzle-kit push       # apply schema directly
# or
npx drizzle-kit generate   # generate SQL migrations into ./drizzle
npx drizzle-kit migrate    # then apply them
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. (Optional) Run Inngest locally

Background jobs (YouTube lookup + study materials) are dispatched to Inngest. To process them
locally, run the Inngest Dev Server alongside Next.js:

```bash
npx inngest-cli@latest dev
```

It auto-discovers the serve endpoint at `/api/inngest`.

---

## 🔑 Environment Variables

| Variable                          | Required | Description                                                         |
| --------------------------------- | :------: | ------------------------------------------------------------------- |
| `DATABASE_URL`                    |    ✅    | PostgreSQL connection string (used by Drizzle + `postgres`).        |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |  ✅    | Clerk publishable key (client).                                     |
| `CLERK_SECRET_KEY`                |    ✅    | Clerk secret key (server).                                          |
| `GEMINI_API_KEY`                  |    ✅    | Google Gemini API key for course/syllabus generation.              |
| `YOUTUBE_API_KEY`                 |    ✅    | YouTube Data API v3 key for chapter video search.                  |
| `NEXT_PUBLIC_SUPABASE_URL`        |    ✅    | Supabase project URL (used by storage client).                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   |    ✅    | Supabase anon key.                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`       |    ⬜    | Server-side admin key for privileged storage ops. **Keep secret.**  |
| `GROQ_API_KEY`                    |    ⬜    | Fallback LLM (llama-3.3-70b) if Gemini fails during layout gen.    |
| `INNGEST_EVENT_KEY`               |    ⬜    | Inngest event key (defaults to `local` in dev).                    |
| `WHISPER_TIMEOUT_MS`              |    ⬜    | Timeout (ms) for the Whisper transcription CLI (default 30000).    |
| `GOOGLE_SEARCH_API_KEY`           |    ⬜    | Google Programmable Search key (used by helper/diagnostics).       |
| `GOOGLE_SEARCH_ENGINE_ID`         |    ⬜    | Google Programmable Search engine id.                              |

---

## 📜 npm Scripts

| Script          | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the Next.js dev server.        |
| `npm run build` | Production build.                    |
| `npm run start` | Run the production build.            |

### Drizzle / utility commands

```bash
npx drizzle-kit push        # sync schema to DB
npx drizzle-kit generate    # generate SQL migrations
npx tsx scripts/check_db.ts # inspect chapters in the DB
```

The `scripts/` directory contains additional one-off Node/TS helpers for inspecting and
maintaining user records (`checkUsers.js`, `inspectUsers.ts`, `alterUsers.js`, etc.).

---

## 🌐 API Routes

| Method   | Route                          | Description                                                        |
| -------- | ------------------------------ | ------------------------------------------------------------------ |
| `POST`   | `/api/generate-course-layout`  | Generate the course syllabus with Gemini (Groq fallback); caches.  |
| `POST`   | `/api/generate-video-content`  | Return cached chapter video or queue an Inngest background job.     |
| `GET`    | `/api/course?courseId=...`     | Fetch a course (with chapters). Without `courseId`, lists user courses. |
| `DELETE` | `/api/course?courseId=...`     | Delete a course and cascade-delete its chapters/slides.            |
| `POST`   | `/api/user`                    | Upsert the current Clerk user into the `users` table.              |
| `POST`   | `/api/upload-file`             | Upload a file to a Supabase Storage bucket.                        |
| `POST`   | `/api/transcribe`              | Transcribe an audio file using the local Whisper CLI.             |
| `GET`    | `/api/proxy-audio?url=...`     | SSRF-guarded proxy for streaming external (https) audio.          |
| `*`      | `/api/inngest`                 | Inngest serve endpoint (background function handler).             |

Routes are protected by Clerk middleware (`proxy.ts`); `/sign-in`, `/sign-up`, and `/api/*` are
public, everything else requires authentication.

---

## 🎙️ Optional: Audio Transcription (Whisper)

`/api/transcribe` shells out to the OpenAI **Whisper** CLI. To use it, install Whisper in your
environment:

```bash
pip install -U openai-whisper
```

Accepts `audio/mpeg`, `audio/wav`, `audio/webm` (max 50 MB). Adjust `WHISPER_TIMEOUT_MS` if your
audio is long.

---

## ☁️ Deployment

The app is designed for **Vercel**:

1. Push to GitHub and import the repo into Vercel.
2. Add all required environment variables in the Vercel project settings.
3. Register your deployed `/api/inngest` endpoint with [Inngest Cloud](https://www.inngest.com/)
   and set `INNGEST_EVENT_KEY`.
4. Long-running route handlers set `export const maxDuration = 60` to avoid Vercel timeouts; the
   Postgres client is cached on `globalThis` to avoid connection exhaustion in serverless.

---

## 🗺️ Roadmap

- AI-generated video summaries and transcripts per chapter
- Auto-generated quizzes after each module
- Progress tracking and completion state
- Personalized learning paths (skill level / goal / available time)

---

## 📄 License

No license file is currently provided. Add one (e.g. MIT) before distributing.
