"use client"
import React, { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import Image from 'next/image'
import { 
  Loader2, Sparkles, Pencil, Code2, Video, FileQuestion, 
  Lightbulb, Network, Award, ChevronRight, Check, ArrowRight 
} from 'lucide-react'
import { QUICK_VIDEO_SUGGESTIONS } from '@/data/constant'
import { toast } from 'sonner'
import { SignOutButton, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCourseAction } from '@/app/actions/course'

function Hero() {
  const [userInput, setUserInput] = useState('');
  const [type, setType] = useState('fullcourse');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  // Interactive visual preview state
  const [previewStep, setPreviewStep] = useState(0);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )coursa_lang=([^;]*)/);
      if (match && match[1]) {
        setLanguage(match[1]);
      }
    }
  }, []);

  // Auto loop the visual preview steps
  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewStep((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const GenerateCourseLayout = async () => {
    if (!userInput.trim()) {
      toast.error('Please enter a course topic!');
      return;
    }
    const toastId = toast.loading('Sketching your course layout...');
    const courseId = crypto.randomUUID();
    try {
      setLoading(true);
      const res = await createCourseAction({
        userInput,
        type,
        language,
        courseId: courseId
      });
      setLoading(false);

      toast.success('Course layout sketched successfully!', {
        id: toastId
      })
      router.push('/course/' + res.courseId);
    } catch (e) {
      setLoading(false);
      toast.error('Failed to sketch course layout!', {
        id: toastId
      });
    }
  }

  // Handle smooth scroll to featured roadmap
  const scrollToRoadmap = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('roadmap');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className='relative w-full dot-pattern pt-24 pb-12 overflow-hidden flex flex-col bg-[#fdfaf6]'>
      <div className="w-full px-6 md:px-12 lg:px-24 flex flex-col items-center justify-center gap-12">
        
        {/* Wobbly Navigation Header */}
        <header className="wobbly-border hard-shadow bg-white px-8 py-4 flex items-center justify-between w-full max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="Coursa Logo" fill className="object-contain" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Coursa</h2>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="font-display text-lg wavy-hover cursor-pointer transition-all" href="#features">Features</a>
            <a className="font-display text-lg wavy-hover cursor-pointer transition-all" href="#roadmap" onClick={scrollToRoadmap}>Example Roadmap</a>
            {user && (
              <>
                <Link className="font-display text-lg wavy-hover cursor-pointer transition-all" href="/notes">My Notes</Link>
                <Link className="font-display text-lg wavy-hover cursor-pointer transition-all" href="/analytics">Analytics</Link>
                <Link className="font-display text-lg wavy-hover cursor-pointer transition-all text-sketch-primary font-bold" href="/revision">Retention 🧠</Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:block font-display text-lg px-5 py-1.5 wobbly-border hard-shadow-sm bg-sketch-yellow">
                  Hi, {user.firstName || 'Maker'}!
                </div>
                <SignOutButton>
                  <button className="bg-red-500 text-white font-display text-lg px-6 py-2 wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                    Log Out
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <Link href="/sign-in">
                <button className="bg-sketch-primary text-white font-display text-lg px-8 py-2 wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </header>

        {/* Hero Two-Column Layout */}
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-4">
          
          {/* Left Column: Generator Form & Copy */}
          <div className="lg:col-span-7 flex flex-col gap-6 w-full text-left">
            <div className="flex flex-col gap-4">
              <span className="font-display text-base tracking-widest uppercase text-sketch-orange font-bold bg-orange-50 px-3 py-1.5 wobbly-border border-2 self-start rotate-[-1deg]">
                The AI Learning Operating System
              </span>
              <h1 className="font-display text-5xl md:text-6xl font-bold leading-none text-slate-900">
                Turn Any Topic Into A <span className="scribble-underline text-sketch-primary italic">{`{Learning Journey}`}</span>
              </h1>
              <p className="mt-2 text-xl md:text-2xl text-slate-700 font-sans leading-snug">
                Generate structured courses from YouTube videos, track your knowledge, revise concepts, and master skills through guided learning paths.
              </p>
            </div>

            {/* Main Interactive Form Card */}
            <div className="w-full wobbly-border hard-shadow bg-white p-6 md:p-8 flex flex-col gap-6 relative z-10 rotate-0.5">
              <div className="thumbtack absolute -top-3 left-10 z-20"></div>
              
              <div className="flex flex-col gap-2.5">
                <label className="font-display text-xl font-bold flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-sketch-yellow fill-sketch-yellow" />
                  What do you want to learn today?
                </label>
                <textarea
                  className="wobbly-border w-full p-4 font-sans text-xl focus:ring-0 focus:outline-none min-h-[90px] bg-slate-50/50 resize-none border-dashed border-2"
                  placeholder="e.g. 'Intro to Next.js', 'System Design Basics', 'Cooking Sourdough'"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-display text-lg font-bold">Language</label>
                  <Select value={language} onValueChange={(val) => {
                    setLanguage(val);
                    if (typeof document !== 'undefined') {
                      document.cookie = `coursa_lang=${val}; path=/; max-age=31536000`;
                    }
                  }}>
                    <SelectTrigger className="wobbly-border w-full p-3 h-auto font-sans text-lg bg-white focus:ring-sketch-primary">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent className="wobbly-border p-1 bg-white" position="popper">
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="font-display text-lg font-bold">Depth</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="wobbly-border w-full p-3 h-auto font-sans text-lg bg-white focus:ring-sketch-primary">
                      <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent className="wobbly-border p-1 bg-white" position="popper">
                      <SelectItem value="fullcourse">Full Course</SelectItem>
                      <SelectItem value="quickcourse">Quick Course</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center mt-2 w-full">
                <div className="w-full sm:flex-1">
                  {user ? (
                    <button
                      onClick={GenerateCourseLayout}
                      disabled={loading}
                      className="w-full bg-sketch-primary text-white font-display text-2xl py-4 wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                      {loading ? (
                        <Loader2 className="animate-spin w-6 h-6" />
                      ) : (
                        <>
                          <span>Generate Learning Path</span>
                          <Pencil className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link href="/sign-in" className="w-full">
                      <button className="w-full bg-sketch-primary text-white font-display text-2xl py-4 wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer">
                        <span>Sign In to Generate</span>
                        <Pencil className="w-5 h-5" />
                      </button>
                    </Link>
                  )}
                </div>

                <a 
                  href="#roadmap" 
                  onClick={scrollToRoadmap}
                  className="w-full sm:w-auto"
                >
                  <button className="w-full bg-white text-slate-800 font-display text-2xl py-4 px-6 wobbly-border border-2 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <span>See Example</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </a>
              </div>

              {/* Quick suggestions */}
              <div className="pt-3 border-t border-dashed border-slate-200">
                <span className="font-display text-lg text-slate-600 mr-2">Suggestions:</span>
                <div className="flex flex-wrap gap-2.5 mt-2">
                  {QUICK_VIDEO_SUGGESTIONS.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setUserInput(suggestion?.prompt)}
                      className="wobbly-border border-2 px-4 py-1 bg-white hover:bg-sketch-primary/5 transition-all text-lg hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none font-sans cursor-pointer">
                      {suggestion.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Visual OS Preview */}
          <div className="lg:col-span-5 w-full flex flex-col gap-4">
            
            {/* Step navigation tabs */}
            <div className="grid grid-cols-4 gap-2 w-full">
              {[
                { label: "Topic", icon: <Pencil className="w-4 h-4" /> },
                { label: "Roadmap", icon: <Sparkles className="w-4 h-4" /> },
                { label: "Graph", icon: <Network className="w-4 h-4" /> },
                { label: "Mastery", icon: <Award className="w-4 h-4" /> },
              ].map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setPreviewStep(idx)}
                  className={`py-2 px-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 wobbly-border border-2 text-sm font-display font-bold transition-all cursor-pointer ${
                    previewStep === idx 
                      ? 'bg-slate-900 text-white border-slate-950 scale-105' 
                      : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {step.icon}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              ))}
            </div>

            {/* Display active preview card */}
            <div className="w-full wobbly-border hard-shadow bg-white p-6 relative rotate-[-0.5deg] min-h-[300px] flex flex-col justify-between">
              <div className="tape -top-3 right-6 opacity-60"></div>
              
              {/* Step Content */}
              <div className="flex-1 flex flex-col justify-center">
                {previewStep === 0 && (
                  <div className="flex flex-col gap-4 py-4 animate-fade-in">
                    <span className="font-display text-sm text-slate-400 uppercase font-bold">1. Define Your Target</span>
                    <h4 className="font-display text-2xl font-bold text-slate-900 leading-tight">
                      Type any skill you wish to learn.
                    </h4>
                    {/* Simulated input bar */}
                    <div className="wobbly-border border-2 border-dashed p-4 bg-slate-50 flex items-center justify-between text-slate-400 font-sans text-lg">
                      <span className="text-slate-800 border-r-2 border-slate-900 pr-1 animate-pulse">
                        Next.js Routing and APIs
                      </span>
                      <Pencil className="w-5 h-5 text-sketch-primary shrink-0" />
                    </div>
                    <p className="font-sans text-base text-slate-500 leading-tight">
                      AI parses your query to find target lectures, documentation references, and syllabus prerequisites.
                    </p>
                  </div>
                )}

                {previewStep === 1 && (
                  <div className="flex flex-col gap-4 py-2 animate-fade-in">
                    <span className="font-display text-sm text-slate-400 uppercase font-bold">2. Sketched Curriculum</span>
                    <h4 className="font-display text-2xl font-bold text-slate-900 leading-tight">
                      AI generates structured roadmap with video chapters.
                    </h4>
                    
                    {/* Roadmap node timeline mockup */}
                    <div className="flex flex-col gap-2 pl-4 border-l-2 border-dashed border-slate-400 py-1 font-display text-base">
                      <div className="flex items-center gap-2 bg-purple-50 p-2 wobbly-border border border-sketch-primary font-bold">
                        <Check className="w-4 h-4 text-sketch-primary" strokeWidth={3} />
                        <span>Chapter 1: Routing & Layouts</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 p-2 wobbly-border border border-dashed text-slate-500">
                        <div className="w-3.5 h-3.5 rounded-full bg-sketch-orange shrink-0" />
                        <span>Chapter 2: Data Fetching</span>
                      </div>
                    </div>

                    <p className="font-sans text-base text-slate-500 leading-tight">
                      Syllabus connects immediately to active YouTube clips and lecture documentation, ready to sketch out.
                    </p>
                  </div>
                )}

                {previewStep === 2 && (
                  <div className="flex flex-col gap-4 py-2 animate-fade-in">
                    <span className="font-display text-sm text-slate-400 uppercase font-bold">3. Map Concept Nodes</span>
                    <h4 className="font-display text-2xl font-bold text-slate-900 leading-tight">
                      Concepts are automatically connected as knowledge nodes.
                    </h4>
                    
                    {/* SVG map visual */}
                    <div className="w-full h-24 bg-slate-50 rounded flex items-center justify-center border wobbly-border border-dashed p-1">
                      <svg width="240" height="70" viewBox="0 0 240 70" className="mx-auto">
                        <line x1="40" y1="35" x2="120" y2="35" stroke="#1a1a1a" strokeWidth="2.5" />
                        <line x1="120" y1="35" x2="200" y2="35" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="3,3" />
                        <circle cx="40" cy="35" r="20" fill="#f3e8ff" stroke="#af25f4" strokeWidth="2" />
                        <text x="40" y="35" textAnchor="middle" dominantBaseline="middle" className="font-display text-xs fill-slate-800 font-bold">React</text>
                        <circle cx="120" cy="35" r="22" fill="#ffedd5" stroke="#fb923c" strokeWidth="2" />
                        <text x="120" y="35" textAnchor="middle" dominantBaseline="middle" className="font-display text-xs fill-slate-800 font-bold">Routing</text>
                        <circle cx="200" cy="35" r="18" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />
                        <text x="200" y="35" textAnchor="middle" dominantBaseline="middle" className="font-display text-xs fill-slate-400">APIs</text>
                      </svg>
                    </div>

                    <p className="font-sans text-base text-slate-500 leading-tight">
                      Every skill is linked. Clear prerequisites before unlocking advanced topics to avoid getting stuck.
                    </p>
                  </div>
                )}

                {previewStep === 3 && (
                  <div className="flex flex-col gap-4 py-2 animate-fade-in">
                    <span className="font-display text-sm text-slate-400 uppercase font-bold">4. Track Long-Term Mastery</span>
                    <h4 className="font-display text-2xl font-bold text-slate-900 leading-tight">
                      Spaced repetition tests level up your developer rank.
                    </h4>

                    {/* Progress tracking display */}
                    <div className="flex items-center justify-between bg-purple-50 p-3 wobbly-border border border-sketch-primary">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-sketch-primary shrink-0" />
                        <span className="font-display text-base font-bold text-slate-800">
                          Rank: Novice Apprentice 🪵
                        </span>
                      </div>
                      <span className="font-sans text-sm font-bold text-sketch-primary bg-white px-2 py-0.5 wobbly-border border">
                        Level Up!
                      </span>
                    </div>

                    <p className="font-sans text-base text-slate-500 leading-tight">
                      Retention engine prompts reviews dynamically. Grow your rank from a complete beginner to system architect.
                    </p>
                  </div>
                )}
              </div>

              {/* Visual arrow indicator linking steps */}
              <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-3 mt-4">
                <span className="font-sans text-sm text-slate-400 italic">Looping Preview</span>
                <button 
                  onClick={() => setPreviewStep((prev) => (prev + 1) % 4)}
                  className="text-sketch-primary font-display font-bold flex items-center gap-1 text-sm hover:underline hover:decoration-dashed"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}

export default Hero