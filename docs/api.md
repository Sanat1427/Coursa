# 🔌 API Documentation

> Complete API reference for Coursa.

---

# Table of Contents

* Authentication
* Course APIs
* Playlist APIs
* Chapter APIs
* Quiz APIs
* Notes APIs
* Progress APIs
* User APIs
* Error Handling
* API Design Decisions

---

# Authentication

Authentication is handled using Clerk.

Protected routes require:

```http
Authorization: Bearer <token>
```

---

# Course APIs

---

## Create Course

Generate a course from a topic.

### Endpoint

```http
POST /api/course
```

### Request

```json
{
  "topic": "System Design",
  "difficulty": "Intermediate",
  "language": "English"
}
```

### Response

```json
{
  "courseId": "123",
  "status": "success"
}
```

---

## Get Course

### Endpoint

```http
GET /api/course/{courseId}
```

### Response

```json
{
  "courseId": "123",
  "courseName": "System Design",
  "chapters": []
}
```

---

## Delete Course

### Endpoint

```http
DELETE /api/course/{courseId}
```

---

# Playlist APIs

---

## Generate Course From Playlist

### Endpoint

```http
POST /api/playlist
```

### Request

```json
{
  "playlistUrl": "https://youtube.com/playlist?..."
}
```

### Flow

```text
Playlist URL
↓
YouTube Metadata
↓
AI Analysis
↓
Course Creation
```

---

# Chapter APIs

---

## Get Chapter Learning Workspace

### Endpoint

```http
GET /api/course/chapter-learning
```

### Query Params

```http
courseId=
chapterId=
```

### Response

```json
{
  "chapter": {},
  "summary": {},
  "workedExamples": [],
  "quiz": [],
  "progress": {}
}
```

---

## Generate Chapter Content

### Endpoint

```http
POST /api/generate-video-content
```

### Purpose

Queues chapter processing in background.

---

# Quiz APIs

---

## Generate Quiz

### Endpoint

```http
POST /api/quiz
```

### Request

```json
{
  "chapterId": "123"
}
```

---

## Submit Quiz

### Endpoint

```http
POST /api/quiz/submit
```

### Request

```json
{
  "quizId": "123",
  "answers": []
}
```

### Response

```json
{
  "score": 8,
  "total": 10
}
```

---

# Notes APIs

---

## Create Note

### Endpoint

```http
POST /api/notes
```

### Request

```json
{
  "chapterId": "123",
  "content": "Important note..."
}
```

---

## Get Notes

### Endpoint

```http
GET /api/notes
```

---

## Update Note

### Endpoint

```http
PUT /api/notes
```

---

## Delete Note

### Endpoint

```http
DELETE /api/notes
```

---

# Progress APIs

---

## Update Progress

### Endpoint

```http
POST /api/progress
```

### Purpose

Track:

* Chapter completion
* Course completion
* Video views

---

## Get Progress

### Endpoint

```http
GET /api/progress
```

---

# User APIs

---

## Create User

### Endpoint

```http
POST /api/user
```

---

## Get User Dashboard

### Endpoint

```http
GET /api/dashboard
```

---

# Error Handling

## Standard Response

```json
{
  "error": true,
  "message": "Internal Server Error"
}
```

---

## Common Errors

### 400

```json
{
  "message": "Bad Request"
}
```

### 401

```json
{
  "message": "Unauthorized"
}
```

### 403

```json
{
  "message": "Forbidden"
}
```

### 404

```json
{
  "message": "Not Found"
}
```

### 500

```json
{
  "message": "Internal Server Error"
}
```

---

# API Design Decisions

## Why REST?

Benefits:

* Simplicity
* Easy debugging
* Familiar ecosystem

---

## Why Background Processing?

Some operations involve:

* AI Generation
* Playlist Analysis
* Content Processing

These are queued using Inngest to avoid request timeouts.
