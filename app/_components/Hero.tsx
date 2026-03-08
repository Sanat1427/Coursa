"use client"
import React, { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import Image from 'next/image'
import { Loader2, Sparkles, Pencil, Code2, Video, FileQuestion, Lightbulb } from 'lucide-react'
import { QUICK_VIDEO_SUGGESTIONS } from '@/data/constant'
import axios from 'axios'
import { toast } from 'sonner'
import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

function Hero() {
  const [userInput, setUserInput] = useState('');
  const [type, setType] = useState('fullcourse');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const GenerateCourseLayout = async () => {
    const toastId = toast.loading('Sketching your course layout...');
    const courseId = crypto.randomUUID();
    try {
      setLoading(true);
      const res = await axios.post('/api/generate-course-layout', {
        userInput,
        type,
        language,
        courseId: courseId
      });
      setLoading(false);

      const serverCourseId = res.data?.courseResult?.[0]?.courseId;
      if (!serverCourseId) {
        throw new Error("No courseId returned from server");
      }

      toast.success('Course layout sketched successfully!', {
        id: toastId
      })
      router.push('/course/' + serverCourseId);
    } catch (e) {
      setLoading(false);
      toast.error('Failed to sketch course layout!', {
        id: toastId
      });
    }
  }

  return (
    <section className='relative w-full dot-pattern pt-24 pb-8 overflow-hidden flex flex-col'>
      {/* Add top padding to account for sticky navbar height */}
      <div className="w-full px-6 md:px-12 lg:px-24 flex flex-col items-center justify-center gap-12">
        <header className="wobbly-border hard-shadow bg-white px-8 py-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="Coursa" fill className="object-contain" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Coursa</h2>
          </div>
          <nav className="hidden md:flex items-center gap-10">
            <a className="font-display text-lg wavy-hover cursor-pointer transition-all" href="#features">Features</a>
            <a className="font-display text-lg wavy-hover cursor-pointer transition-all" href="#courses">Courses</a>
            <a className="font-display text-lg wavy-hover cursor-pointer transition-all" href="#pricing">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="font-display text-lg px-6 py-2 wobbly-border hard-shadow-sm bg-sketch-yellow">
                  Hi, {user.firstName || 'Maker'}!
                </div>
                <SignOutButton>
                  <button className="bg-red-500 text-white font-display text-lg px-6 py-2 wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                    Log Out
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="bg-sketch-primary text-white font-display text-lg px-8 py-2 wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </header>

        <div className="w-full md:max-w-4xl lg:max-w-6xl mx-auto flex flex-col items-center justify-center">
          <div className="text-center w-full">
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight text-slate-900 mt-4">
              Learn Smarter with <span className="scribble-underline text-sketch-primary italic">{`{AI Courses}`}</span>
            </h1>
            <p className="mt-5 text-2xl text-slate-700 max-w-3xl mx-auto font-sans">
              Transform any topic into a complete video course instantly with our <span className="underline decoration-sketch-orange decoration-dashed">hand-drawn</span> AI-powered generator.
            </p>
          </div>

          <div className="w-full max-w-5xl wobbly-border hard-shadow bg-white p-8 flex flex-col gap-8 relative z-10 rotate-1 mt-8">
            <div className="thumbtack absolute -top-3 left-1/2 -translate-x-1/2 z-20"></div>
            <div className="flex flex-col gap-3">
              <label className="font-display text-2xl font-bold flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-sketch-yellow fill-sketch-yellow" />
                Course Topic
              </label>
              <textarea
                className="wobbly-border w-full p-6 font-sans text-2xl focus:ring-0 focus:outline-none min-h-40 bg-slate-50/50 resize-none border-dashed"
                placeholder="What do you want to learn today? e.g. 'Intro to Nextjs'"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <label className="font-display text-xl font-bold">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="wobbly-border w-full p-4 h-auto font-sans text-xl bg-white focus:ring-sketch-primary">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent className="wobbly-border p-2">
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <label className="font-display text-xl font-bold">Theme</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="wobbly-border w-full p-4 h-auto font-sans text-xl bg-white focus:ring-sketch-primary">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent className="wobbly-border p-2">
                    <SelectItem value="fullcourse">Full Course</SelectItem>
                    <SelectItem value="quickcourse">Quick Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {user ? (
              <button
                onClick={GenerateCourseLayout}
                disabled={loading}
                className="w-full bg-sketch-primary text-white font-display text-3xl py-5 wobbly-border hard-shadow hover:translate-x-0.75 hover:translate-y-0.75 hover:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                {loading ? (
                  <Loader2 className="animate-spin w-8 h-8" />
                ) : (
                  <>
                    <span>Generate Course</span>
                    <Pencil className="w-6 h-6" />
                  </>
                )}
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="w-full bg-sketch-primary text-white font-display text-3xl py-5 wobbly-border hard-shadow hover:translate-x-0.75 hover:translate-y-0.75 hover:shadow-none transition-all flex items-center justify-center gap-3">
                  <span>Sign In to Sketch</span>
                  <Pencil className="w-6 h-6" />
                </button>
              </SignInButton>
            )}

            <div className="pt-4 border-t border-dashed border-slate-200">
              <p className="font-display text-lg text-slate-600 mb-3">Quick Sketches:</p>
              <div className="flex flex-wrap gap-3">
                {QUICK_VIDEO_SUGGESTIONS.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setUserInput(suggestion?.prompt)}
                    className="wobbly-border px-6 py-2 bg-white hover:bg-sketch-primary/5 transition-all text-xl hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none font-sans">
                    {suggestion.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero