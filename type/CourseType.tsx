export type Course = {
    courseId: string,
    courseName: string,
    userInput: string,
    type: string,
    createdAt: string,
    updatedAt: string,
    id: number,
    courseLayout: CourseLayout;
    chapters?: DBChapter[]; // renamed from chaptercontentslide
}

export type DBChapter = {
    id: number,
    courseId: string,
    chapterId: string,
    chapterTitle: string,
    youtubeVideoId?: string | null,
    contentMaterials?: any,
    createdAt: string,
    updatedAt: string,
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
    chapterId: string,
    chapterTitle: string,
    subContent: string[];
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

