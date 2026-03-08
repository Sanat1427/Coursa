"use client"
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Course } from '@/type/CourseType';
import CourseListCard from './CourseListCard';

function CourseList() {
  const [courselist, setCourselist] = useState<Course[]>([]);
  useEffect(() => {
    getcourselist();
  }, []);
  const getcourselist = async () => {
    const result = await axios.get('/api/course');
    setCourselist(result.data);
  }

  return (
    <div id="courses" className='w-full px-6 py-16 text-center'>
      <div className="flex items-center justify-center gap-4 mb-10">
        <h2 className='font-display text-4xl font-bold underline decoration-sketch-blue decoration-4 underline-offset-8 inline-block'>
          My Course sketches
        </h2>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-10'>
        {courselist?.map((course, index) => (
          <div key={index} className={`transition-transform hover:scale-[1.02] ${index % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}>
            <CourseListCard courseItem={course} onDeleted={getcourselist} />
          </div>
        ))}
      </div>
      {courselist?.length === 0 && (
        <div className="w-full p-12 wobbly-border border-dashed text-center">
          <p className="font-display text-2xl text-slate-400 italic">No courses sketched yet... Start one above!</p>
        </div>
      )}
    </div>
  )
}

export default CourseList