import React from 'react'
import { Course } from '@/type/CourseType';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dot } from 'lucide-react';

type Props = {
  course: Course | undefined
}
function CourseChapter({ course }: Props) {
  // Find DB chapter to get the YouTube Video ID and Study Materials
  const getChapterData = (chapterId: string): { videoId?: string | null; contentMaterials?: any; isGenerated: boolean } => {
    const expectedChapterId = `${course?.courseId}-${chapterId}`;
    const dbChapter = course?.chapters?.find(
      (c) => c.chapterId === chapterId || c.chapterId === expectedChapterId
    );
    let parsedMaterials = dbChapter?.contentMaterials;
    if (typeof parsedMaterials === 'string') {
      try {
        parsedMaterials = JSON.parse(parsedMaterials);
      } catch (e) {
        console.error("Failed to parse contentMaterials", e);
      }
    }

    return {
      videoId: dbChapter?.youtubeVideoId,
      contentMaterials: parsedMaterials,
      isGenerated: !!dbChapter
    };
  }

  return (
    <div className='max-w-6xl w-full mx-auto mt-16 pb-20'>
      <div className='flex justify-between items-end mb-10'>
        <div>
          <h2 className='font-display text-4xl font-bold text-slate-900'>Course Chapters</h2>
          <h2 className='text-xl font-sans text-slate-600 mt-2'>Your personalized generated lessons</h2>
        </div>
      </div>
      <div className='flex flex-col gap-8'>
        {course?.courseLayout?.chapters?.map((chapter, index) => {
          const chapterData = getChapterData(chapter.chapterId);
          return (
            <div className={`wobbly-border hard-shadow bg-white p-8 flex flex-col md:flex-row gap-8 items-start justify-between ${index % 2 === 0 ? '-rotate-1' : 'rotate-1'}`} key={index}>
              <div className='w-full lg:w-1/2 flex flex-col'>
                <div className='flex items-center gap-4 mb-6'>
                  <h2 className='p-2 bg-sketch-primary text-white font-display text-2xl inline-flex h-12 w-12 text-center wobbly-border justify-center items-center'>{index + 1}</h2>
                  <h3 className='font-display text-2xl font-bold text-slate-900'>
                    {chapter.chapterTitle}
                  </h3>
                </div>
                <div className='flex flex-col gap-3 font-sans text-lg text-slate-700'>
                  {chapter?.subContent?.map((content, idx) => (
                    <div className='flex items-start gap-2' key={idx}>
                      <Dot className='h-6 w-6 text-sketch-orange mt-0.5 flex-shrink-0' />
                      <p>{content}</p>
                    </div>
                  ))}
                </div>

                {/* Render AI Study Materials */}
                {chapterData.contentMaterials?.articles?.length > 0 && (
                  <div className='mt-8 pt-6 border-t-2 border-dashed border-slate-200'>
                    <h3 className='font-display font-bold text-xl mb-4 flex items-center gap-2 text-slate-900'>
                      📚 Hand-picked Materials
                    </h3>
                    <div className='flex flex-col gap-4'>
                      {chapterData.contentMaterials.articles.map((article: any, i: number) => (
                        <a
                          href={article.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          key={i}
                          className='flex flex-col gap-1 p-4 wobbly-border bg-slate-50 hover:bg-sketch-primary/5 transition-colors group'
                        >
                          <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 wobbly-border w-fit ${article.source === 'GeeksforGeeks' ? 'bg-green-100 text-green-700' : 'bg-sketch-blue/20 text-blue-800'}`}>
                            {article.source}
                          </span>
                          <span className='text-lg font-sans font-medium text-slate-900 group-hover:text-sketch-primary transition-colors'>
                            {article.title}
                          </span>
                          <span className='text-sm text-slate-500 truncate'>{article.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className='w-full lg:w-1/2 wobbly-border hard-shadow-sm bg-black overflow-hidden flex items-center justify-center relative' style={{ aspectRatio: '16/9' }}>
                <div className={"thumbtack absolute -top-3 left-1/2 -translate-x-1/2 z-20"}></div>
                {(() => {
                  if (chapterData.videoId) {
                    return (
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${chapterData.videoId}`}
                        title="Course Preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen>
                      </iframe>
                    );
                  } else if (chapterData.isGenerated) {
                    return <div className="text-white/50 font-sans text-center text-lg p-4">Video Not Found</div>;
                  } else {
                    return <div className="text-white/50 font-sans text-center text-lg p-4">Sketching Video & Materials...</div>;
                  }
                })()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CourseChapter