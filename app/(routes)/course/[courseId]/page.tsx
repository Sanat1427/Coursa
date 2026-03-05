"use client"
import React, { useState } from 'react'
import CourseInfoCard from './_components/CourseInfoCard'
import { useParams } from 'next/navigation'
import axios from 'axios';
import { useEffect } from 'react';
import { Course } from '@/type/CourseType';
import CourseChapter from './_components/CourseChapter';
import { toast } from 'sonner';
import { getAudioData } from '@remotion/media-utils'

function CoursePreview() {
  const { courseId } = useParams();
  const [courseDetail, setCourseDetail] = useState<Course>();
  useEffect(() => {
    courseId && GetCourseDetail();
  }, [courseId])
  const GetCourseDetail = async () => {
    const loadingToast = toast.loading("Loading course detail...");
    try {
      const result = await axios.get('/api/course?courseId=' + courseId);
      setCourseDetail(result.data);
      toast.success("Course detail loaded successfully", { id: loadingToast });

      // guard against missing or non-array chaptercontentslide
      if (
        result?.data?.chaptercontentslide &&
        Array.isArray(result.data.chaptercontentslide) &&
        result.data.chaptercontentslide.length === 0
      ) {
        await GenerateVideoContent(result.data);
      }
    } catch (e) {
      console.error("Failed to fetch course detail", e);
      toast.error("Could not load course details", { id: loadingToast });
    } finally {
      toast.dismiss(loadingToast);
    }
  }
  const GenerateVideoContent = async (course: Course) => {
    const toastLoading = toast.loading("Generating video content...");
    try {
      const chapterToGenerate = course?.courseLayout?.chapters?.[0];
      if (!chapterToGenerate) {
        throw new Error("No chapter to generate");
      }
      const result = await axios.post('/api/generate-video-content', {
        chapter: chapterToGenerate,
        courseId: course?.courseId,
      });
      console.log(JSON.stringify(result?.data));
      toast.success("Video content generated successfully", { id: toastLoading });
    } catch (e) {
      console.error("Failed to generate video content", e);
      toast.error("Video generation failed", { id: toastLoading });
    } finally {
      toast.dismiss(toastLoading);
    }
  }
     const fps = 30;
      const slides = courseDetail?.chaptercontentslide ?? [];
      const [durationbySlideId, setDurationbySlideId] = useState<Record<string, number> | null>(null);
      useEffect(() => {
          let cancelled = false;
          const run = async () => {
              if (!slides) return;
              const entries = await Promise.all(
                  slides.map(async (slide) => {
                      if (!slide?.audioFileUrl) return;
                      const audioData = await getAudioData(slide.audioFileUrl);
                      const audiosec = audioData?.durationInSeconds
                      const frames = Math.max(1, Math.ceil(audiosec * fps));
                      return [slide.slideId, frames] as const;
                  })
              );
  
              if (!cancelled) {
                  const validEntries = entries.filter((entry): entry is readonly [string, number] => entry !== undefined);
                  setDurationbySlideId(Object.fromEntries(validEntries));
              }
  
          }
          run();
          return () => {
              cancelled = true;
          }
  
      }, [slides, fps])
  //const VideoContentJson
  return (
    <div className='flex flex-col items-center'>
      <CourseInfoCard course={courseDetail} durationbySlideId={durationbySlideId} />
      <CourseChapter course={courseDetail}  durationbySlideId={durationbySlideId}/>
    </div>
  )
}

export default CoursePreview