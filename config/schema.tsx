import { integer, json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  // Clerk user IDs are strings like "user_xxx", so store as varchar
  // We removed the identity generation so that we can insert our own IDs.
  id: varchar({ length: 255 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits: integer().default(2),
});
export const courseTable = pgTable("courses", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull(),
  courseId: varchar({ length: 255 }).notNull().unique(),
  courseName: varchar({ length: 255 }).notNull(),
  userInput: varchar({ length: 255 }).notNull(),
  type: varchar({ length: 100 }).notNull(),
  courseLayout: json(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),

});
export const chaptersTable = pgTable("chapters", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: varchar({ length: 255 }).notNull().references(() => courseTable.courseId),
  chapterId: varchar({ length: 255 }).notNull().unique(),
  chapterTitle: varchar({ length: 255 }).notNull(),
  videoContent: json(),
  caption: json(),
  audioFileUrl: varchar({length:1024}),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});
export const chapterContentSlidesTable = pgTable("chapter_content_slides", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: varchar({ length: 255 }).notNull().references(() => courseTable.courseId),
  chapterId: varchar({ length: 255 }).notNull().references(() => chaptersTable.chapterId),
  slideId: varchar({ length: 255 }).notNull(),
  slideIndex: integer().notNull(),
  audioFileName: varchar({ length: 255 }).notNull(),
  audioFileUrl: varchar({ length: 1024 }),
  narration: json().notNull(),
  html: text(),
  revealData: json().notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),

});