"use client"
import React, { useState } from 'react'
import CourseInfoCard from './_components/CourseInfoCard'
import { useParams } from 'next/navigation'
import axios from 'axios';
import { useEffect } from 'react';
import { Course } from '@/type/CourseType';
import CourseChapter from './_components/CourseChapter';

function CoursePreviw() {
  const { courseId } = useParams();
  const [courseDetail, setCourseDetail] = useState<Course>();
  useEffect(() => {
    courseId && GetCourseDetail();
  }, [courseId])
  const GetCourseDetail = async () => {
    try {
      const result = await axios.get('/api/course?courseId=' + courseId);
      setCourseDetail(result.data);
    } catch (e) {
      console.error("Failed to fetch course detail", e);
    }
  }
  return (
    <div className='flex flex-col item-center'>
      <CourseInfoCard course={courseDetail} />
      <CourseChapter course={courseDetail} />
    </div>
  )
}

export default CoursePreviw