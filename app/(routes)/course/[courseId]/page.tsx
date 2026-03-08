"use client"
import React, { useState } from 'react'
import CourseInfoCard from './_components/CourseInfoCard'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios';
import { useEffect } from 'react';
import { Course } from '@/type/CourseType';
import CourseChapter from './_components/CourseChapter';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function CoursePreview() {
  const { courseId } = useParams();
  const router = useRouter();
  const isGeneratingRef = React.useRef(false);
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

      // guard against missing or non-array chapters in db return
      if (
        result?.data?.chapters &&
        Array.isArray(result.data.chapters) &&
        result.data.chapters.length < (result.data?.courseLayout?.chapters?.length || 1) &&
        !isGeneratingRef.current
      ) {
        isGeneratingRef.current = true;
        await GenerateVideoContent(result.data);
        // Refresh the course detail to load the newly generated slides from the database
        const refreshedResult = await axios.get('/api/course?courseId=' + courseId);
        setCourseDetail(refreshedResult.data);
      }
    } catch (e: any) {
      if (e?.response?.status === 404) {
        // Suppress the console error overlay for expected 404s
        toast.error("Course not found", { id: loadingToast });
        router.push('/');
      } else {
        console.error("Failed to fetch course detail", e);
        toast.error("Could not load course details", { id: loadingToast });
      }
    } finally {
      toast.dismiss(loadingToast);
    }
  }
  const GenerateVideoContent = async (course: Course) => {
    const toastLoading = toast.loading("Generating video content...");
    try {
      const chapters = course?.courseLayout?.chapters ?? [];
      if (chapters.length === 0) {
        throw new Error("No chapters to generate");
      }
      toast.loading(`Dispatching background workers for ${chapters.length} chapters...`, { id: toastLoading });

      // Dispatch all jobs in parallel
      const generationPromises = chapters.map((chapter: any) =>
        axios.post('/api/generate-video-content', {
          chapter: chapter,
          courseId: course?.courseId,
        }).catch(err => {
          console.error("Failed to queue chapter", chapter.chapterTitle, err);
          return null; // Prevent one failed queue from crashing others
        })
      );

      await Promise.all(generationPromises);

      // Now poll for completion of all chapters
      let isComplete = false;
      let attempts = 0;

      while (!isComplete && attempts < 60) {
        toast.loading(`Drafting your course content... Please wait (${attempts * 10}s elapsed)`, { id: toastLoading });
        await new Promise(r => setTimeout(r, 10000)); // 10s intervals

        const refreshedResult = await axios.get('/api/course?courseId=' + course?.courseId);
        const dbChapters = refreshedResult?.data?.chapters;

        if (dbChapters && Array.isArray(dbChapters)) {
          if (dbChapters.length >= chapters.length) {
            isComplete = true;
            setCourseDetail(refreshedResult.data);
          }
        }
        attempts++;
      }

      if (isComplete) {
        toast.success("All content generated successfully!", { id: toastLoading });
      } else {
        toast.error("Generation taking longer than expected. Please manually refresh the page later.", { id: toastLoading });
      }
    } catch (e: any) {
      console.error("Failed to generate video content", e);
      toast.error("Video generation failed", { id: toastLoading });
    } finally {
      toast.dismiss(toastLoading);
    }
  }
  // Remove Remotion duration loading logic

  // Inside the main return block:
  return (
    <div className='flex flex-col items-center dot-pattern min-h-screen py-10 px-4 md:px-10'>
      <div className='w-full max-w-6xl mb-6'>
        <Link href="/">
          <button className='flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-sketch-yellow/20 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all'>
            <ChevronLeft className='w-5 h-5' />
            Back to Canvas
          </button>
        </Link>
      </div>
      <CourseInfoCard course={courseDetail} />
      <CourseChapter course={courseDetail} />
    </div>
  )
}

export default CoursePreview