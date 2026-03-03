import React from 'react'
import { Course } from '@/type/CourseType';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dot } from 'lucide-react';
import { Player } from '@remotion/player';
import ChapterVideo from './ChapterVideo';
type Props = {
  course: Course | undefined
}
function CourseChapter({ course }: Props) {
  return (
    <div className='max-w-6xl -mt-10 p-10 border rounded-3xl shadow-lg w-full
    bg-background/80 backdrop-blur-sm'>
      <div className='flex jsutify-between items-center'>
        <h2 className='font-bold text-2xl'>Course Preview</h2>
        <h2 className='text-muted-foreground'>Chapters and Short Previews</h2>
      </div>
      <div className='mt-5'>
        {course?.courseLayout?.chapters.map((chapter, index) => (
          <Card className='mb-5' key={index}>
            <CardHeader>
              <div className='flex items-center gap-4'>
                <h2 className='p-2 bg-primary/40 inline-flex h-10 w-10 text-center rounded-2xl justify-center items-center'>{index + 1}</h2>
                <CardTitle className='md:text-xl text-base'>
                  {chapter.chapterTitle}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-5'>
                <div>
                  {chapter?.subContent?.map((content, index) => (
                    <div className='flex items-center gap-2 mt-2' key={index}>
                      <Dot className='h-5 w-5 text-primary' />
                      <h2>{content}</h2>
                    </div>
                  ))}
                </div>
                <div>
                  <Player
                    controls
                    component={ChapterVideo}
                    durationInFrames={30}
                    compositionWidth={1280}
                    compositionHeight={720}
                    fps={30}
                    style={{
                      width: '80%',
                      height: '180px',
                      aspectRatio: '16/9',
                    }}
                  />

                </div>
              </div>

            </CardContent>

          </Card>
        ))}

      </div>
    </div>
  )
}

export default CourseChapter