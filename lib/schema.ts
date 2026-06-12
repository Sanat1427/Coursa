import { boolean, integer, json, pgTable, text, timestamp, varchar, doublePrecision, index } from "drizzle-orm/pg-core";

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
  language: varchar('language', { length: 50 }).default('English').notNull(),
  courseLayout: json(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});
export const chaptersTable = pgTable("chapters", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: varchar({ length: 255 }).notNull().references(() => courseTable.courseId),
  chapterId: varchar({ length: 255 }).notNull().unique(),
  chapterTitle: varchar({ length: 255 }).notNull(),
  youtubeVideoId: varchar('youtubeVideoId', { length: 255 }), // Added for YouTube Integration
  contentMaterials: json('contentMaterials'),
  videoContent: json(),
  caption: json(),
  audioFileUrl: varchar({ length: 1024 }),
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

export const userProgressTable = pgTable("user_progress", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull(),
  courseId: varchar({ length: 255 }).notNull().references(() => courseTable.courseId),
  chapterId: varchar({ length: 255 }).notNull().references(() => chaptersTable.chapterId),
  status: varchar({ length: 50 }).default('NOT_STARTED').notNull(), // 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  progressPercentage: integer().default(0).notNull(),
  views: integer("views").default(1).notNull(), // tracks chapter views
  lastVisitedAt: timestamp().defaultNow().notNull(),
  completedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const quizzesTable = pgTable("quizzes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  quizId: varchar({ length: 255 }).notNull().unique(),
  courseId: varchar({ length: 255 }).notNull().references(() => courseTable.courseId),
  chapterId: varchar({ length: 255 }).notNull().references(() => chaptersTable.chapterId),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const questionsTable = pgTable("questions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  questionId: varchar({ length: 255 }).notNull().unique(),
  quizId: varchar({ length: 255 }).notNull().references(() => quizzesTable.quizId),
  type: varchar({ length: 50 }).notNull(), // 'MULTIPLE_CHOICE' | 'TRUE_FALSE'
  questionText: text().notNull(),
  options: json(), // Array of strings (options)
  correctAnswer: text().notNull(),
  explanation: text(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const quizAttemptsTable = pgTable("quiz_attempts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  attemptId: varchar({ length: 255 }).notNull().unique(),
  quizId: varchar({ length: 255 }).notNull().references(() => quizzesTable.quizId),
  userId: varchar({ length: 255 }).notNull(),
  score: integer().notNull(),
  totalQuestions: integer().notNull(),
  percentage: integer().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const quizAnswersTable = pgTable("quiz_answers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  attemptId: varchar({ length: 255 }).notNull().references(() => quizAttemptsTable.attemptId),
  questionId: varchar({ length: 255 }).notNull().references(() => questionsTable.questionId),
  selectedAnswer: text().notNull(),
  isCorrect: boolean().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const notesTable = pgTable("notes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  noteId: varchar({ length: 255 }).notNull().unique(),
  userId: varchar({ length: 255 }).notNull(),
  courseId: varchar({ length: 255 }).notNull().references(() => courseTable.courseId),
  chapterId: varchar({ length: 255 }).notNull().references(() => chaptersTable.chapterId),
  content: text().notNull(),
  tags: json().default([]).notNull(), // array of strings
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const bookmarksTable = pgTable("bookmarks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  bookmarkId: varchar({ length: 255 }).notNull().unique(),
  userId: varchar({ length: 255 }).notNull(),
  courseId: varchar({ length: 255 }).notNull().references(() => courseTable.courseId),
  chapterId: varchar({ length: 255 }).notNull().references(() => chaptersTable.chapterId),
  timestamp: integer().notNull(), // in seconds
  note: text(), // optional attached note
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Course Categories Table
export const courseCategoriesTable = pgTable("course_categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  courseId: varchar("courseId", { length: 255 }).notNull().references(() => courseTable.courseId, { onDelete: "cascade" }),
  categoryName: varchar("categoryName", { length: 255 }).notNull(),
}, (table) => ({
  courseIdIdx: index("course_categories_course_id_idx").on(table.courseId),
  categoryNameIdx: index("course_categories_category_name_idx").on(table.categoryName),
}));

// Course Completion Table
export const courseCompletionTable = pgTable("course_completion", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).notNull(),
  courseId: varchar("courseId", { length: 255 }).notNull().references(() => courseTable.courseId, { onDelete: "cascade" }),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("course_completion_user_id_idx").on(table.userId),
  courseIdIdx: index("course_completion_course_id_idx").on(table.courseId),
  completedAtIdx: index("course_completion_completed_at_idx").on(table.completedAt),
}));

// Course Views Table
export const courseViewsTable = pgTable("course_views", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).notNull(),
  courseId: varchar("courseId", { length: 255 }).notNull().references(() => courseTable.courseId, { onDelete: "cascade" }),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("course_views_user_id_idx").on(table.userId),
  courseIdIdx: index("course_views_course_id_idx").on(table.courseId),
}));

// Course Recommendations Table
export const courseRecommendationsTable = pgTable("course_recommendations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).notNull(),
  courseId: varchar("courseId", { length: 255 }).notNull().references(() => courseTable.courseId, { onDelete: "cascade" }),
  score: doublePrecision("score").notNull(),
  recommendationReason: text("recommendationReason").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("course_recs_user_id_idx").on(table.userId),
  courseIdIdx: index("course_recs_course_id_idx").on(table.courseId),
}));

// Recommendation Events Table
export const recommendationEventsTable = pgTable("recommendation_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).notNull(),
  recommendedCourseId: varchar("recommendedCourseId", { length: 255 }).notNull().references(() => courseTable.courseId, { onDelete: "cascade" }),
  eventType: varchar("eventType", { length: 50 }).notNull(), // 'VIEWED' | 'CLICKED' | 'ENROLLED'
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("rec_events_user_id_idx").on(table.userId),
  recommendedCourseIdIdx: index("rec_events_course_id_idx").on(table.recommendedCourseId),
}));

// Spaced Repetition Schedule Table
export const revisionScheduleTable = pgTable("revision_schedule", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).notNull(),
  courseId: varchar("courseId", { length: 255 }).notNull().references(() => courseTable.courseId, { onDelete: "cascade" }),
  chapterId: varchar("chapterId", { length: 255 }).notNull().references(() => chaptersTable.chapterId, { onDelete: "cascade" }),
  reviewNumber: integer("reviewNumber").notNull(), // 1 to 6
  scheduledAt: timestamp("scheduledAt").notNull(),
  completedAt: timestamp("completedAt"),
  status: varchar("status", { length: 50 }).default('PENDING').notNull(), // 'PENDING' | 'COMPLETED' | 'MISSED'
  easeFactor: doublePrecision("easeFactor").default(2.5).notNull(),
  nextReviewDate: timestamp("nextReviewDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("rev_sched_user_id_idx").on(table.userId),
  statusIdx: index("rev_sched_status_idx").on(table.status),
  scheduledAtIdx: index("rev_sched_scheduled_at_idx").on(table.scheduledAt),
  courseIdIdx: index("rev_sched_course_id_idx").on(table.courseId),
  chapterIdIdx: index("rev_sched_chapter_id_idx").on(table.chapterId),
}));

// Memory Strength Table
export const memoryStrengthTable = pgTable("memory_strength", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).notNull(),
  chapterId: varchar("chapterId", { length: 255 }).notNull().references(() => chaptersTable.chapterId, { onDelete: "cascade" }),
  score: integer("score").default(50).notNull(), // 0 to 100
  lastReviewedAt: timestamp("lastReviewedAt").defaultNow().notNull(),
}, (table) => ({
  userIdChapterIdIdx: index("mem_strength_user_chapter_idx").on(table.userId, table.chapterId),
  userIdIdx: index("mem_strength_user_id_idx").on(table.userId),
}));

// Revision Questions Table
export const revisionQuestionsTable = pgTable("revision_questions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  chapterId: varchar("chapterId", { length: 255 }).notNull().references(() => chaptersTable.chapterId, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  difficulty: varchar("difficulty", { length: 50 }).notNull(), // 'EASY' | 'MEDIUM' | 'HARD'
  type: varchar("type", { length: 50 }).notNull(), // 'DEFINITION' | 'CONCEPT' | 'SCENARIO' | 'TRUE_FALSE'
}, (table) => ({
  chapterIdIdx: index("rev_ques_chapter_id_idx").on(table.chapterId),
}));

// Knowledge Graph Concepts Table
export const conceptsTable = pgTable("concepts", {
  id: varchar("id", { length: 255 }).primaryKey(), // e.g. "arrays"
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 255 }).notNull(), // e.g. "Backend"
  whyItMatters: text("whyItMatters"),
  commonMistakes: text("commonMistakes"),
  realWorldApps: text("realWorldApps"),
});

// Concept Mastery Table
export const conceptMasteryTable = pgTable("concept_mastery", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).notNull(),
  conceptId: varchar("conceptId", { length: 255 }).notNull().references(() => conceptsTable.id, { onDelete: "cascade" }),
  masteryScore: integer("masteryScore").default(0).notNull(), // 0 to 100
  lastReviewedAt: timestamp("lastReviewedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userIdConceptIdIdx: index("concept_mastery_user_concept_idx").on(table.userId, table.conceptId),
  userIdIdx: index("concept_mastery_user_id_idx").on(table.userId),
}));

// Concept Relationships Table
export const conceptRelationshipsTable = pgTable("concept_relationships", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sourceConceptId: varchar("sourceConceptId", { length: 255 }).notNull().references(() => conceptsTable.id, { onDelete: "cascade" }),
  targetConceptId: varchar("targetConceptId", { length: 255 }).notNull().references(() => conceptsTable.id, { onDelete: "cascade" }),
  relationshipType: varchar("relationshipType", { length: 50 }).notNull(), // 'PREREQUISITE' | 'RELATED' | 'ADVANCED_TOPIC' | 'USED_IN'
}, (table) => ({
  sourceIdx: index("concept_rel_source_idx").on(table.sourceConceptId),
  targetIdx: index("concept_rel_target_idx").on(table.targetConceptId),
}));

// Chapter Concepts Junction Table
export const chapterConceptsTable = pgTable("chapter_concepts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  chapterId: varchar("chapterId", { length: 255 }).notNull().references(() => chaptersTable.chapterId, { onDelete: "cascade" }),
  conceptId: varchar("conceptId", { length: 255 }).notNull().references(() => conceptsTable.id, { onDelete: "cascade" }),
}, (table) => ({
  chapterIdx: index("chapter_concepts_chapter_idx").on(table.chapterId),
  conceptIdx: index("chapter_concepts_concept_idx").on(table.conceptId),
}));

// Playlists Metadata Table
export const playlistsTable = pgTable("playlists", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  playlistId: varchar("playlistId", { length: 255 }).notNull().unique(),
  playlistTitle: varchar("playlistTitle", { length: 255 }).notNull(),
  playlistDescription: text("playlistDescription"),
  channelName: varchar("channelName", { length: 255 }),
  videoCount: integer("videoCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Playlist Videos Table
export const playlistVideosTable = pgTable("playlist_videos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  playlistId: varchar("playlistId", { length: 255 }).notNull().references(() => playlistsTable.playlistId, { onDelete: "cascade" }),
  videoId: varchar("videoId", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  thumbnail: varchar("thumbnail", { length: 1024 }),
  duration: integer("duration").default(0), // in seconds
  position: integer("position").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Playlist Concepts Table
export const playlistConceptsTable = pgTable("playlist_concepts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  courseId: varchar("courseId", { length: 255 }).notNull().references(() => courseTable.courseId, { onDelete: "cascade" }),
  concept: varchar("concept", { length: 255 }).notNull(),
  description: text("description").notNull(),
  sourceVideoId: varchar("sourceVideoId", { length: 255 }),
  confidence: doublePrecision("confidence").default(1.0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Playlist Graph Nodes Table
export const playlistGraphNodesTable = pgTable("playlist_graph_nodes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  courseId: varchar("courseId", { length: 255 }).notNull().references(() => courseTable.courseId, { onDelete: "cascade" }),
  conceptId: varchar("conceptId", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  x: doublePrecision("x"),
  y: doublePrecision("y"),
});

// Playlist Graph Edges Table
export const playlistGraphEdgesTable = pgTable("playlist_graph_edges", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  courseId: varchar("courseId", { length: 255 }).notNull().references(() => courseTable.courseId, { onDelete: "cascade" }),
  source: varchar("source", { length: 255 }).notNull(),
  target: varchar("target", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).default('RELATED'),
});

// Playlist Flashcards Table
export const playlistFlashcardsTable = pgTable("playlist_flashcards", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  courseId: varchar("courseId", { length: 255 }).notNull().references(() => courseTable.courseId, { onDelete: "cascade" }),
  concept: varchar("concept", { length: 255 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  reviewSchedule: timestamp("reviewSchedule"),
  box: integer("box").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Playlist Progress Table
export const playlistProgressTable = pgTable("playlist_progress", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).notNull(),
  courseId: varchar("courseId", { length: 255 }).notNull().references(() => courseTable.courseId, { onDelete: "cascade" }),
  videoId: varchar("videoId", { length: 255 }).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// AI Response Cache Table
export const aiResponseCacheTable = pgTable("ai_response_cache", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  topic: varchar("topic", { length: 255 }).notNull(),
  language: varchar("language", { length: 100 }).notNull(),
  difficulty: varchar("difficulty", { length: 100 }).notNull(),
  contentType: varchar("contentType", { length: 100 }).notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => {
  return {
    lookupIndex: index("ai_response_cache_lookup_idx").on(
      table.topic,
      table.language,
      table.difficulty,
      table.contentType
    ),
  };
});