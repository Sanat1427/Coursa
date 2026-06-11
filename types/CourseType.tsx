export type Course = {
    courseId: string,
    courseName: string,
    userInput: string,
    type: string,
    createdAt: any,
    updatedAt: any,
    id: number,
    courseLayout: CourseLayout;
    chapters?: DBChapter[]; // renamed from chaptercontentslide
    completedChapters?: number;
    remainingChapters?: number;
    progressPercentage?: number;
}

export type DBChapter = {
    id: number,
    courseId: string,
    chapterId: string,
    chapterTitle: string,
    youtubeVideoId?: string | null,
    contentMaterials?: any,
    createdAt: any,
    updatedAt: any,
}

export type CourseLayout = {
    courseName: string,
    courseDescription: string,
    courseId: string,
    level: string,
    totalChapters: number,
    chapters: Chapter[];
}
export type Chapter = {
    chapterId: string;
    chapterTitle: string;
    chapterDescription: string;
    subContent: string[];
    youtubeQuery: string;
    webSearchQuery: string;
}
export type ChapterContentSlide = {
    id: number,
    courseId: string,
    chapterId: string,
    slideId: string,
    slideIndex: number,
    audioFileName: string,
    audioFileUrl?: string | null,
    narration: { fullText: string },
    html: string,
    revealData: string[]
}

export type UserProgress = {
    id: number;
    userId: string;
    courseId: string;
    chapterId: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    progressPercentage: number;
    lastVisitedAt: any;
    completedAt?: any | null;
    createdAt: any;
    updatedAt: any;
}

export type UserStats = {
    totalCoursesStarted: number;
    totalCoursesCompleted: number;
    totalChaptersCompleted: number;
}

export type Quiz = {
    id: number;
    quizId: string;
    courseId: string;
    chapterId: string;
    title: string;
    description?: string | null;
    createdAt: any;
    updatedAt: any;
    questions?: Question[];
}

export type Question = {
    id: number;
    questionId: string;
    quizId: string;
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
    questionText: string;
    options?: string[] | any; // JSON string array for MULTIPLE_CHOICE
    correctAnswer: string;
    explanation?: string | null;
    createdAt: any;
    updatedAt: any;
}

export type QuizAttempt = {
    id: number;
    attemptId: string;
    quizId: string;
    userId: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    createdAt: any;
    answers?: QuizAnswer[];
}

export type QuizAnswer = {
    id: number;
    attemptId: string;
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    createdAt: any;
}

export type Note = {
    id: number;
    noteId: string;
    userId: string;
    courseId: string;
    chapterId: string;
    content: string;
    tags: string[];
    createdAt: any;
    updatedAt: any;
}

export type Bookmark = {
    id: number;
    bookmarkId: string;
    userId: string;
    courseId: string;
    chapterId: string;
    timestamp: number;
    note?: string | null;
    createdAt: any;
    updatedAt: any;
}

