import { db } from "./db";
import { 
    courseTable, 
    courseCategoriesTable, 
    courseCompletionTable, 
    courseViewsTable, 
    courseRecommendationsTable 
} from "./schema";
import { eq, inArray, ne, and, sql, notInArray } from "drizzle-orm";

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Backend": ["backend", "python", "node", "express", "django", "go", "golang", "rust", "java", "c#", "net core", "server", "api", "graphql", "rest", "flask", "fastapi", "ruby", "rails", "spring", "microservices"],
  "Frontend": ["frontend", "react", "next", "html", "css", "javascript", "typescript", "angular", "vue", "tailwind", "bootstrap", "sass", "web dev", "web design", "ui", "ux", "interface"],
  "Database": ["database", "sql", "postgres", "mysql", "mongodb", "redis", "prisma", "drizzle", "orm", "nosql", "dbms", "cassandra", "firebase", "supabase", "dynamodb"],
  "System Design": ["system design", "architecture", "scalability", "load balancer", "distributed systems", "caching", "dns", "cdn", "docker", "kubernetes", "cloud", "aws", "gcp"],
  "Programming Basics": ["programming", "coding", "introduction", "basics", "fundamentals", "syntax", "oop", "algorithms", "data structures", "dsa", "c++", "c language"],
  "AI & Data Science": ["ai", "ml", "artificial intelligence", "machine learning", "data science", "pandas", "numpy", "tensorflow", "pytorch", "nlp", "deep learning", "neural", "python for data"],
};

export const SIMILAR_CATEGORIES: Record<string, string[]> = {
  "Backend": ["Backend", "Database", "System Design"],
  "Frontend": ["Frontend", "Programming Basics"],
  "Database": ["Database", "Backend", "System Design"],
  "System Design": ["System Design", "Backend", "Database"],
  "Programming Basics": ["Programming Basics", "Frontend", "Backend"],
  "AI & Data Science": ["AI & Data Science", "Programming Basics", "Database"]
};

let categoriesSynced = false;

/**
 * Scans all existing courses and ensures they have categorizations in the database in the background.
 */
async function syncExistingCourseCategoriesBackground(allCoursesRaw: any[], allCategories: any[]) {
  if (categoriesSynced) return;
  try {
    const existingCourseIds = new Set(allCategories.map(c => c.courseId));
    const missingCourses = allCoursesRaw.filter(c => !existingCourseIds.has(c.courseId));
    if (missingCourses.length === 0) {
      categoriesSynced = true;
      return;
    }

    const insertValues: { courseId: string; categoryName: string }[] = [];

    for (const c of missingCourses) {
      const categories: string[] = [];
      const textToScan = `${c.courseName} ${c.userInput || ""}`.toLowerCase();

      for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => textToScan.includes(kw))) {
          categories.push(category);
        }
      }

      if (categories.length === 0) {
        categories.push("Programming Basics");
      }

      for (const catName of categories) {
        insertValues.push({
          courseId: c.courseId,
          categoryName: catName
        });
      }
    }

    if (insertValues.length > 0) {
      await db.insert(courseCategoriesTable).values(insertValues);
    }
    categoriesSynced = true;
  } catch (err) {
    console.error("Failed to sync course categories in background:", err);
  }
}

/**
 * Ensures a course is categorized in course_categories based on its name and input keywords
 */
export async function ensureCourseCategories(courseId: string, courseName: string, userInput: string) {
  const existing = await db.select().from(courseCategoriesTable)
    .where(eq(courseCategoriesTable.courseId, courseId))
    .limit(1);
    
  if (existing.length > 0) return;

  const categories: string[] = [];
  const textToScan = `${courseName} ${userInput}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => textToScan.includes(kw))) {
      categories.push(category);
    }
  }

  // Fallback category
  if (categories.length === 0) {
    categories.push("Programming Basics");
  }

  for (const catName of categories) {
    await db.insert(courseCategoriesTable).values({
      courseId,
      categoryName: catName
    });
  }
}

export async function syncExistingCourseCategories() {
  if (categoriesSynced) return;
  try {
    const [allCoursesRaw, allCategories] = await Promise.all([
      db.select({
        courseId: courseTable.courseId,
        courseName: courseTable.courseName,
        userInput: courseTable.userInput
      }).from(courseTable),
      db.select().from(courseCategoriesTable)
    ]);
    await syncExistingCourseCategoriesBackground(allCoursesRaw, allCategories);
  } catch (e) {
    console.error("syncExistingCourseCategories failed:", e);
  }
}

export const RecommendationService = {
  /**
   * Collaborative Filtering: "Users who completed this course also completed..."
   */
  async getCollaborativeRecommendations(
    userId: string, 
    preFetchedCompletions?: any[], 
    preFetchedCourses?: any[],
    preFetchedPeerCompletions?: any[]
  ) {
    const userCompletions = preFetchedCompletions || await db.select().from(courseCompletionTable)
      .where(eq(courseCompletionTable.userId, userId));
      
    const completedIds = userCompletions.map(c => c.courseId);
    if (completedIds.length === 0) return [];

    let peerAllCompletions = preFetchedPeerCompletions;
    if (!peerAllCompletions) {
      peerAllCompletions = await db.select()
        .from(courseCompletionTable)
        .where(
          inArray(
            courseCompletionTable.userId,
            db.select({ userId: courseCompletionTable.userId })
              .from(courseCompletionTable)
              .where(
                and(
                  inArray(courseCompletionTable.courseId, completedIds),
                  ne(courseCompletionTable.userId, userId)
                )
              )
          )
        );
    }

    const otherCompletions = peerAllCompletions.filter(c => completedIds.includes(c.courseId));
    const candidateCompletions = peerAllCompletions.filter(c => !completedIds.includes(c.courseId));
    
    const otherUserIds = Array.from(new Set(otherCompletions.map(c => c.userId)));
    if (otherUserIds.length === 0) return [];
    if (candidateCompletions.length === 0) return [];

    const frequencyMap: Record<string, number> = {};
    const sharedCompletions: Record<string, Record<string, number>> = {};

    for (const row of candidateCompletions) {
      frequencyMap[row.courseId] = (frequencyMap[row.courseId] || 0) + 1;
    }

    for (const peerCompletion of otherCompletions) {
      const peerUserId = peerCompletion.userId;
      const peerCompletedCourse = peerCompletion.courseId;
      
      const peerCandidates = candidateCompletions.filter(c => c.userId === peerUserId);
      for (const cand of peerCandidates) {
        if (!sharedCompletions[cand.courseId]) {
          sharedCompletions[cand.courseId] = {};
        }
        sharedCompletions[cand.courseId][peerCompletedCourse] = 
          (sharedCompletions[cand.courseId][peerCompletedCourse] || 0) + 1;
      }
    }

    const candidateIds = Object.keys(frequencyMap);
    let coursesList = preFetchedCourses;
    if (!coursesList) {
      coursesList = await db.select({
        courseId: courseTable.courseId,
        courseName: courseTable.courseName,
        userInput: courseTable.userInput,
        type: courseTable.type,
        language: courseTable.language,
        level: sql<string>`coalesce(${courseTable.courseLayout}->>'level', 'Beginner')`,
        totalChapters: sql<number>`coalesce((${courseTable.courseLayout}->>'totalChapters')::int, json_array_length((${courseTable.courseLayout}->'chapters')::json), 0)`,
        createdAt: courseTable.createdAt,
        updatedAt: courseTable.updatedAt,
      })
      .from(courseTable)
      .where(inArray(courseTable.courseId, [...candidateIds, ...completedIds]));
    }

    const coursesMap = new Map(coursesList.map(c => [c.courseId, c]));
    
    const candidateCourses = candidateIds
      .map(cid => coursesMap.get(cid))
      .filter(Boolean) as any[];
      
    const completedCourses = completedIds
      .map(cid => coursesMap.get(cid))
      .filter(Boolean) as any[];

    const completedNames: Record<string, string> = {};
    completedCourses.forEach(c => completedNames[c.courseId] = c.courseName);

    const maxFreq = Math.max(...Object.values(frequencyMap));

    return candidateCourses.map(course => {
      const freq = frequencyMap[course.courseId] || 0;
      const score = maxFreq > 0 ? freq / maxFreq : 0;

      const triggerCounts = sharedCompletions[course.courseId] || {};
      let bestTriggerId = "";
      let maxTriggerCount = 0;
      for (const [cid, cnt] of Object.entries(triggerCounts)) {
        if (cnt > maxTriggerCount) {
          maxTriggerCount = cnt;
          bestTriggerId = cid;
        }
      }

      const triggerName = completedNames[bestTriggerId] || "related topics";
      const reason = `Users who completed "${triggerName}" also completed this course.`;

      return {
        course: {
          ...course,
          courseLayout: {
            level: (course as any).level,
            totalChapters: (course as any).totalChapters
          }
        },
        score,
        reason,
        type: "collaborative" as const
      };
    }).sort((a, b) => b.score - a.score);
  },

  /**
   * Popularity Score Formula:
   * score = (total_completions * 0.7) + (total_views * 0.3)
   */
  async getPopularRecommendations(preFetchedCourses?: any[], preFetchedCompletionsGroup?: any[], preFetchedViewsGroup?: any[]) {
    const completionsGroup = preFetchedCompletionsGroup || await db.select({
      courseId: courseCompletionTable.courseId,
      count: sql<number>`count(*)::int`
    })
    .from(courseCompletionTable)
    .groupBy(courseCompletionTable.courseId);

    const viewsGroup = preFetchedViewsGroup || await db.select({
      courseId: courseViewsTable.courseId,
      count: sql<number>`count(*)::int`
    })
    .from(courseViewsTable)
    .groupBy(courseViewsTable.courseId);

    let coursesList = preFetchedCourses;
    if (!coursesList) {
      coursesList = await db.select({
        courseId: courseTable.courseId,
        courseName: courseTable.courseName,
        userInput: courseTable.userInput,
        type: courseTable.type,
        language: courseTable.language,
        level: sql<string>`coalesce(${courseTable.courseLayout}->>'level', 'Beginner')`,
        totalChapters: sql<number>`coalesce((${courseTable.courseLayout}->>'totalChapters')::int, json_array_length((${courseTable.courseLayout}->'chapters')::json), 0)`,
        createdAt: courseTable.createdAt,
        updatedAt: courseTable.updatedAt,
      }).from(courseTable);
    }

    const completionsMap: Record<string, number> = {};
    completionsGroup.forEach(c => completionsMap[c.courseId] = c.count);

    const viewsMap: Record<string, number> = {};
    viewsGroup.forEach(v => viewsMap[v.courseId] = v.count);

    const scoredCourses = coursesList.map(course => {
      const completions = completionsMap[course.courseId] || 0;
      const views = viewsMap[course.courseId] || 0;
      const score = (completions * 0.7) + (views * 0.3);

      return {
        course: {
          ...course,
          courseLayout: {
            level: (course as any).level,
            totalChapters: (course as any).totalChapters
          }
        },
        completions,
        views,
        score,
        reason: "Trending this week.",
        type: "popularity" as const
      };
    });

    return scoredCourses.sort((a, b) => b.score - a.score);
  },

  /**
   * Category Similarity Engine
   */
  async getCategoryRecommendations(
    userId: string, 
    popularityRecs?: any[], 
    preFetchedCompletions?: any[],
    preFetchedCourses?: any[],
    preFetchedCategories?: any[]
  ) {
    const userCompletions = preFetchedCompletions || await db.select().from(courseCompletionTable)
      .where(eq(courseCompletionTable.userId, userId));
      
    const completedIds = userCompletions.map(c => c.courseId);
    const allCategories = preFetchedCategories || await db.select().from(courseCategoriesTable);
    
    let sourceCategories: string[] = [];
    if (completedIds.length > 0) {
      const userCats = allCategories.filter((c: any) => completedIds.includes(c.courseId));
      sourceCategories = Array.from(new Set(userCats.map((c: any) => c.categoryName)));
    } else {
      const userViews = await db.select().from(courseViewsTable)
        .where(eq(courseViewsTable.userId, userId));
      const viewedIds = userViews.map(v => v.courseId);
      if (viewedIds.length > 0) {
        const userViewedCats = allCategories.filter((c: any) => viewedIds.includes(c.courseId));
        sourceCategories = Array.from(new Set(userViewedCats.map((c: any) => c.categoryName)));
      }
    }

    if (sourceCategories.length === 0) return [];

    const targetCategoriesSet = new Set<string>();
    sourceCategories.forEach(cat => {
      const similar = SIMILAR_CATEGORIES[cat] || [cat];
      similar.forEach(s => targetCategoriesSet.add(s));
    });
    const targetCategories = Array.from(targetCategoriesSet);

    const matchingCategories = allCategories.filter((c: any) => 
      targetCategories.includes(c.categoryName) && 
      (completedIds.length > 0 ? !completedIds.includes(c.courseId) : true)
    );

    const candidateIds = Array.from(new Set(matchingCategories.map((c: any) => c.courseId)));
    if (candidateIds.length === 0) return [];

    let coursesList = preFetchedCourses;
    if (!coursesList) {
      coursesList = await db.select({
        courseId: courseTable.courseId,
        courseName: courseTable.courseName,
        userInput: courseTable.userInput,
        type: courseTable.type,
        language: courseTable.language,
        level: sql<string>`coalesce(${courseTable.courseLayout}->>'level', 'Beginner')`,
        totalChapters: sql<number>`coalesce((${courseTable.courseLayout}->>'totalChapters')::int, json_array_length((${courseTable.courseLayout}->'chapters')::json), 0)`,
        createdAt: courseTable.createdAt,
        updatedAt: courseTable.updatedAt,
      })
      .from(courseTable)
      .where(inArray(courseTable.courseId, candidateIds));
    } else {
      coursesList = coursesList.filter((c: any) => candidateIds.includes(c.courseId));
    }

    const popList = popularityRecs || await this.getPopularRecommendations(preFetchedCourses);
    const popularityScoreMap: Record<string, number> = {};
    popList.forEach((p: any) => {
      const cid = p.course?.courseId || p.courseId;
      popularityScoreMap[cid] = p.score;
    });

    const courseCatMap: Record<string, string[]> = {};
    matchingCategories.forEach((row: any) => {
      if (!courseCatMap[row.courseId]) {
        courseCatMap[row.courseId] = [];
      }
      courseCatMap[row.courseId].push(row.categoryName);
    });

    return coursesList.map(course => {
      const cats = courseCatMap[course.courseId] || [];
      const matchedCat = cats.find(c => targetCategories.includes(c)) || cats[0] || "Backend";
      const reason = `Matches your "${matchedCat}" learning path.`;
      const score = popularityScoreMap[course.courseId] || 0;

      return {
        course: {
          ...course,
          courseLayout: {
            level: (course as any).level,
            totalChapters: (course as any).totalChapters
          }
        },
        score,
        reason,
        type: "category" as const
      };
    }).sort((a, b) => b.score - a.score);
  },

  /**
   * Get Similar Recommendations for similar/[courseId] endpoint
   */
  async getSimilarRecommendations(courseId: string, limit = 5) {
    const [courseCats, allCategories, allCoursesRaw, completionsGroup, viewsGroup] = await Promise.all([
      db.select().from(courseCategoriesTable).where(eq(courseCategoriesTable.courseId, courseId)),
      db.select().from(courseCategoriesTable),
      db.select({
        courseId: courseTable.courseId,
        courseName: courseTable.courseName,
        userInput: courseTable.userInput,
        type: courseTable.type,
        language: courseTable.language,
        level: sql<string>`coalesce(${courseTable.courseLayout}->>'level', 'Beginner')`,
        totalChapters: sql<number>`coalesce((${courseTable.courseLayout}->>'totalChapters')::int, json_array_length((${courseTable.courseLayout}->'chapters')::json), 0)`,
        createdAt: courseTable.createdAt,
        updatedAt: courseTable.updatedAt,
      }).from(courseTable),
      db.select({
        courseId: courseCompletionTable.courseId,
        count: sql<number>`count(*)::int`
      }).from(courseCompletionTable).groupBy(courseCompletionTable.courseId),
      db.select({
        courseId: courseViewsTable.courseId,
        count: sql<number>`count(*)::int`
      }).from(courseViewsTable).groupBy(courseViewsTable.courseId),
    ]);

    const catNames = courseCats.map(c => c.categoryName);
    if (catNames.length === 0) return [];

    const similarIds = Array.from(new Set(
      allCategories
        .filter(c => catNames.includes(c.categoryName) && c.courseId !== courseId)
        .map(c => c.courseId)
    ));
    if (similarIds.length === 0) return [];

    const matchingCourses = allCoursesRaw.filter(c => similarIds.includes(c.courseId));

    const popList = await this.getPopularRecommendations(allCoursesRaw, completionsGroup, viewsGroup);
    const popularityScoreMap: Record<string, number> = {};
    popList.forEach((p: any) => {
      const cid = p.course?.courseId || p.courseId;
      popularityScoreMap[cid] = p.score;
    });

    return matchingCourses.map(course => {
      const score = popularityScoreMap[course.courseId] || 0;
      return {
        course: {
          ...course,
          courseLayout: {
            level: (course as any).level,
            totalChapters: (course as any).totalChapters
          }
        },
        score,
        reason: "Related subject."
      };
    }).sort((a, b) => b.score - a.score).slice(0, limit);
  },

  /**
   * Hybrid Recommendation Engine
   * Final Score = (CollabScore * 0.5) + (CatScore * 0.3) + (PopScore * 0.2)
   */
  async getHybridRecommendations(userId: string) {
    const [
      userCompletions,
      userViews,
      allCoursesRaw,
      allCategories,
      completionsGroup,
      viewsGroup
    ] = await Promise.all([
      db.select().from(courseCompletionTable).where(eq(courseCompletionTable.userId, userId)),
      db.select().from(courseViewsTable).where(eq(courseViewsTable.userId, userId)),
      db.select({
        id: courseTable.id,
        userId: courseTable.userId,
        courseId: courseTable.courseId,
        courseName: courseTable.courseName,
        userInput: courseTable.userInput,
        type: courseTable.type,
        language: courseTable.language,
        level: sql<string>`coalesce(${courseTable.courseLayout}->>'level', 'Beginner')`,
        totalChapters: sql<number>`coalesce((${courseTable.courseLayout}->>'totalChapters')::int, json_array_length((${courseTable.courseLayout}->'chapters')::json), 0)`,
        createdAt: courseTable.createdAt,
        updatedAt: courseTable.updatedAt,
      }).from(courseTable),
      db.select().from(courseCategoriesTable),
      db.select({
        courseId: courseCompletionTable.courseId,
        count: sql<number>`count(*)::int`
      }).from(courseCompletionTable).groupBy(courseCompletionTable.courseId),
      db.select({
        courseId: courseViewsTable.courseId,
        count: sql<number>`count(*)::int`
      }).from(courseViewsTable).groupBy(courseViewsTable.courseId),
    ]);

    if (!categoriesSynced) {
      syncExistingCourseCategoriesBackground(allCoursesRaw, allCategories).catch(e => console.error("Sync error:", e));
    }

    const completedIds = userCompletions.map(c => c.courseId);
    
    let peerAllCompletions: any[] = [];
    if (completedIds.length > 0) {
      peerAllCompletions = await db.select()
        .from(courseCompletionTable)
        .where(
          inArray(
            courseCompletionTable.userId,
            db.select({ userId: courseCompletionTable.userId })
              .from(courseCompletionTable)
              .where(
                and(
                  inArray(courseCompletionTable.courseId, completedIds),
                  ne(courseCompletionTable.userId, userId)
                )
              )
          )
        );
    }

    const [collab, pop] = await Promise.all([
      this.getCollaborativeRecommendations(userId, userCompletions, allCoursesRaw, peerAllCompletions),
      this.getPopularRecommendations(allCoursesRaw, completionsGroup, viewsGroup)
    ]);

    const cat = await this.getCategoryRecommendations(userId, pop, userCompletions, allCoursesRaw, allCategories);

    const candidateCourses = completedIds.length > 0
      ? allCoursesRaw.filter(c => !completedIds.includes(c.courseId))
      : allCoursesRaw;

    if (candidateCourses.length === 0) return [];

    const collabMap: Record<string, { score: number; reason: string }> = {};
    collab.forEach(c => {
      const cid = c.course?.courseId || (c as any).courseId;
      collabMap[cid] = { score: c.score, reason: c.reason };
    });

    const catMap: Record<string, { score: number; reason: string }> = {};
    cat.forEach(c => {
      const cid = c.course?.courseId || (c as any).courseId;
      catMap[cid] = { score: c.score, reason: c.reason };
    });

    const popMap: Record<string, number> = {};
    pop.forEach(p => {
      const cid = p.course?.courseId || (p as any).courseId;
      popMap[cid] = p.score;
    });
    const maxPopScore = pop.length > 0 ? Math.max(...pop.map(p => p.score)) : 1;

    const finalRecs = candidateCourses.map(course => {
      const cid = course.courseId;

      const collabInfo = collabMap[cid];
      const collabScore = collabInfo ? collabInfo.score : 0;

      const catInfo = catMap[cid];
      const catScore = catInfo ? 1.0 : 0;

      const rawPop = popMap[cid] || 0;
      const popScore = maxPopScore > 0 ? rawPop / maxPopScore : 0;

      const finalScore = (collabScore * 0.5) + (catScore * 0.3) + (popScore * 0.2);

      let reason = "Trending this week.";
      if (collabInfo && collabScore >= 0.1) {
        reason = collabInfo.reason;
      } else if (catInfo && catScore > 0) {
        reason = catInfo.reason;
      }

      return {
        course: {
          ...course,
          courseLayout: {
            level: (course as any).level,
            totalChapters: (course as any).totalChapters
          }
        },
        score: parseFloat(finalScore.toFixed(3)),
        reason,
        popularityScore: rawPop
      };
    });

    const sorted = finalRecs.sort((a, b) => b.score - a.score).slice(0, 10);

    db.delete(courseRecommendationsTable)
      .where(eq(courseRecommendationsTable.userId, userId))
      .then(async () => {
        if (sorted.length > 0) {
          await db.insert(courseRecommendationsTable).values(
            sorted.map(rec => ({
              userId,
              courseId: rec.course.courseId,
              score: rec.score,
              recommendationReason: rec.reason
            }))
          );
        }
      })
      .catch(e => console.error("Failed to log recommendations:", e));

    return sorted;
  }
};
