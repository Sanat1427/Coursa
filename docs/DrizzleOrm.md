# Drizzle ORM Guide

## Why Drizzle?

Type-safe SQL

Fast

Schema-first development

Excellent TypeScript support

---

## Folder Structure

db/

schema.ts

index.ts

migrations/

---

## Schema Definition

Example

export const courses = pgTable(...)

Explain every column.

---

## Relationships

User

↓

Course

↓

Chapter

↓

Explain foreign keys.

---

## Queries

Insert

Select

Update

Delete

Transactions

---

## Migrations

drizzle-kit generate

drizzle-kit migrate

Explain migration workflow.

---

## Benefits

Autocomplete

Compile-time safety

No runtime model generation

SQL-like syntax

---

## Common Errors

Database URL incorrect

Migration mismatch

Foreign key violation

Type mismatch
