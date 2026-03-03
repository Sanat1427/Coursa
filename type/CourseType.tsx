export type Course = {
    courseId: string,
    courseName: string,
    userInput: string,
    type: string,
    createdAt: string,
    updatedAt: string,
    id: number,
    courseLayout: CourseLayout;
    chaptercontentslide:ChapterContentSlide[];
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
    narration: { fullText: string },
    html: string,
    revealData: string[]
}

