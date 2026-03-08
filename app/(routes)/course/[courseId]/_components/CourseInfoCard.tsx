import React from 'react'
import { Course } from '@/type/CourseType';
import { BookOpen, ChartNoAxesColumnIncreasing, Sparkles } from 'lucide-react';

type Props = {
    course: Course | undefined
}

function CourseInfoCard({ course }: Props) {
    // Get the first chapter's YouTube Video ID if available
    const firstChapterVideoId = course?.chapters?.[0]?.youtubeVideoId;

    return (
        <div className='p-10 md:p-16 w-full max-w-6xl wobbly-border hard-shadow bg-white grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center'>
            <div className='flex flex-col gap-6'>
                <h2 className='flex gap-2 p-2 px-4 wobbly-border items-center inline-flex bg-sketch-yellow/20 text-slate-800 font-sans font-medium w-fit rotate-[-1deg]'>
                    <Sparkles className="w-5 h-5 text-sketch-orange" /> Course Sketch Preview
                </h2>
                <h2 className='text-5xl md:text-6xl font-display font-bold text-slate-900 leading-tight'>
                    {course?.courseName}
                </h2>
                <p className='text-xl text-slate-600 font-sans leading-relaxed'>
                    {course?.courseLayout?.courseDescription}
                </p>
                <div className='mt-2 flex flex-wrap gap-4'>
                    <h2 className='px-4 py-2 wobbly-border flex gap-2 items-center inline-flex bg-slate-50 font-sans'>
                        <ChartNoAxesColumnIncreasing className='text-sketch-blue w-5 h-5' />
                        {course?.courseLayout?.level}
                    </h2>
                    <h2 className='px-4 py-2 wobbly-border flex gap-2 items-center inline-flex bg-slate-50 font-sans'>
                        <BookOpen className='text-sketch-primary w-5 h-5' />
                        {course?.courseLayout?.totalChapters} Chapters
                    </h2>
                </div>
            </div>
            <div className='wobbly-border hard-shadow-sm overflow-hidden aspect-video bg-black flex items-center justify-center rotate-1 relative'>
                <div className="thumbtack absolute -top-3 left-1/2 -translate-x-1/2 z-20"></div>
                {firstChapterVideoId ? (
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${firstChapterVideoId}`}
                        title="Course Preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen>
                    </iframe>
                ) : (
                    <div className="text-white/50 text-center p-5">
                        <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Generating Course Preview...</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CourseInfoCard
