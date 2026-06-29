# Inngest Workflow

## Why Inngest?

Course generation takes time.

Instead of blocking the request,
the work is done asynchronously.

---

## Architecture

User clicks Generate

↓

API Route

↓

Send Event

↓

Inngest Function

↓

Gemini AI

↓

Generate Chapters

↓

Save Database

↓

Return Success

---

## Folder Structure

inngest/

functions/

client.ts

---

## Event Flow

generate-course

↓

AI

↓

Database

↓

Status Updated

---

## Function Lifecycle

Event Received

↓

Run Step 1

↓

Run Step 2

↓

Run Step 3

↓

Complete

---

## Retry Mechanism

If AI fails

↓

Retry automatically

↓

Resume execution

---

## Why Not API Routes?

API Routes timeout after a while.

Inngest can:

- retry
- resume
- schedule
- queue jobs

---

## Debugging

Open Inngest dashboard

View events

Replay failed events

Inspect logs
