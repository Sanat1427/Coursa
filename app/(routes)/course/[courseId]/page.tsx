"use client"
import React, { useState } from 'react'
import CourseInfoCard from './_components/CourseInfoCard'
import { useParams } from 'next/navigation'
import axios from 'axios';
import { useEffect } from 'react';
import { Course } from '@/type/CourseType';
import CourseChapter from './_components/CourseChapter';
import { toast } from 'sonner';

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
      toast.success("Course detail loaded successfully",{id:loadingToast});
      if (result.data.chaptercontentslide.length === 0) {
        GenerateVideoContent(result?.data);
      }
    } catch (e) {
      console.error("Failed to fetch course detail", e);
    }
  }
  const GenerateVideoContent =async(course:Course)=>{
   
    for(let i=0;i<course?.courseLayout?.chapters?.length;i++){
       
      if(i>0)
        break;
      const toastLoading=toast.loading("Generating video content...");
      const result=await axios.post('/api/generate-video-content',{chapter:course?.courseLayout?.chapters[0],courseId:course?.courseId});
      console.log(JSON.stringify(result?.data));
      toast.success("Video content generated successfully",{id:toastLoading});
    }
    
  }
  //const VideoContentJson
  return (
    <div className='flex flex-col items-center'>
      <CourseInfoCard course={courseDetail} />
      <CourseChapter course={courseDetail} />
    </div>
  )
}

export default CoursePreview