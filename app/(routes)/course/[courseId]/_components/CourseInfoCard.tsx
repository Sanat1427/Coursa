import React, { useEffect, useMemo, useState } from 'react'
import { Course } from '@/type/CourseType';
import { BookOpen, ChartNoAxesColumnDecreasingIcon, ChartNoAxesColumnIncreasing, Sparkles } from 'lucide-react';
import { Player } from '@remotion/player';
import { CourseComposition } from './ChapterVideo';
import { getAudioData } from '@remotion/media-utils'
type Props = {
    course: Course | undefined
    durationbyslideid: Record<string, number> | null
}

function CourseInfoCard({ course,durationbyslideid }: Props) {
    const fps = 30;
    const slides = course?.chaptercontentslide ?? [];
    const durationInFrames = useMemo(() => {
        if (!durationbyslideid) return 0;
        return slides.reduce((sum, slide) => sum + (durationbyslideid[slide.slideId] ?? fps * 6), 0);
    }, [durationbyslideid, slides, fps])
    if (!durationbyslideid) {
        return <div>Loading...</div>
    }

    return (
        <div className='p-20 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-5
        bg-gradient-to-br from-slate-950 via-slate-800 to-emerald-950'>
            <div>
                <h2 className='flex gap-2 p-1 px-2 border rounded-2xl items-center inline-flex text-white border-gray-200/20'>
                    <Sparkles className="w-5 h-5" /> Course Preview
                </h2>
                <h2 className='text-5xl font-bold mt-4 text-white'>{course?.courseName}</h2>
                <p className='text-lg text-muted-foreground mt-3 text-white'>{course?.courseLayout?.courseDescription}</p>
                <div className='mt-5 flex gap-5'>
                    <h2 className='px-3 p-2 border rounded-4xl flex gap-2 items-center inline-flex'><ChartNoAxesColumnIncreasing className='text-sky-400' />{course?.courseLayout?.level}</h2>
                    <h2 className='px-3 p-2 border rounded-4xl flex gap-2 items-center inline-flex'><BookOpen className='text-emerald-400' />{course?.courseLayout?.totalChapters} Chapters</h2>
                </div>
            </div>
            <div className='border-2  border-white/10 rounded-2xl'>
                <Player
                    controls
                    acknowledgeRemotionLicense
                    component={CourseComposition}
                    inputProps={{
                        //@ts-ignore
                         slides:slides, durationsBySlideId:durationbyslideid }}
                    durationInFrames={durationInFrames || 30}
                    compositionWidth={1280}
                    compositionHeight={720}
                    fps={30}
                    style={{
                        width: '100%',
                        aspectRatio: '16/9',
                    }}

                />
            </div>
        </div>
    )
}

export default CourseInfoCard
