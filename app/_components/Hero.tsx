"use client"
import React, { useState } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import TextareaAutosize from "react-textarea-autosize"
import { Loader2, Send } from 'lucide-react'
import { QUICK_VIDEO_SUGGESTIONS } from '@/data/constant'
import axios from 'axios'
import { toast } from 'sonner'
import { SignInButton, useUser } from '@clerk/nextjs'


function Hero() {
  const [userInput, setUserInput] = useState('');
  const [type, setType] = useState('fullcourse');
  const [loading, setLoading] = useState(false);
  const {user}=useUser();
  const GenerateCourseLayout = async () => {
       const toastId=toast.loading('Generating course layout...');
       const courseId= await crypto.randomUUID();
    try{
    setLoading(true);

    const result = await axios.post('/api/generate-course-layout', {
      userInput,
      type,
      courseId:courseId
    });
    console.log(result.data);
    setLoading(false);
    toast.success('Course layout generated successfully!',{
      id:toastId
    });
  }catch(e){
    
    setLoading(false);
    toast.error('Failed to generate course layout!',{
      id:toastId
    });
  }
  }
  return (
    <div className='flex items-center flex-col mt-20'>
      <div>
        <h2 className='text-4xl font-bold text-center'>Learn Smarter with <span className='text-primary'>AI Video Courses</span></h2>
        <p className='text-center text-gray-500 mt-5'>Turn Any Topic into a Complete Course</p>
      </div>
      <div className="grid w-full max-w-xl mt-5  gap-6">
        <InputGroup>
          <InputGroupTextarea
            data-slot="input-group-control"
            className="flex field-sizing-content min-h-24 w-full resize-none rounded-xl px-3 py-2.5 text-base transition-[color,box-shadow] outline-none md:text-sm"
            placeholder="Enter your course topic..."
            value={userInput}
            onChange={(e)=> setUserInput(e.target.value)}
          />
          <InputGroupAddon align="block-end">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Full Course">Full Course</SelectItem>
                  <SelectItem value="Quick Course">Quick Course</SelectItem>

                </SelectGroup>
              </SelectContent>
            </Select>
            {user?
            <InputGroupButton className="ml-auto" size="icon-sm" variant="default"
              onClick={GenerateCourseLayout} disabled={loading}>
              {loading ? <Loader2 className='animate-spin' /> :
                <Send />}
            </InputGroupButton>
            :<SignInButton mode ='modal'>
            <InputGroupButton className="ml-auto" size="icon-sm" variant="default">
              <Send/>
            </InputGroupButton>
            </SignInButton>}
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className='flex gap-5 mt-5 max-w-3xl flex-wrap justify-center z-10'>
        {QUICK_VIDEO_SUGGESTIONS.map((suggestion, index) => (
          <h2 key={index} onClick={()=> setUserInput(suggestion?.prompt)} className='border rounded-2xl px-2 p-1 text-sm bg-white'>{suggestion.title}</h2>
        ))}
      </div>
    </div>

  )
}

export default Hero