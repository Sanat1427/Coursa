"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Network, BookOpen, Video, ArrowRight, BrainCircuit } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const features = [
  "AI Course Generation",
  "Knowledge Graph Mapping",
  "Smart Revision (SRS)",
  "Personalized Learning Paths",
];

const stats = [
  { value: "10,000+", label: "Videos Indexed", icon: <Video className="w-5 h-5 text-sketch-primary" /> },
  { value: "500+", label: "Learning Topics", icon: <BookOpen className="w-5 h-5 text-sketch-orange" /> },
  { value: "50,000+", label: "Concept Connections", icon: <Network className="w-5 h-5 text-slate-800" /> },
];

function AuthLayout({ children, title, subtitle }: Props) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#fdfaf6] dot-pattern">
      
      {/* Left Column: Product Branding & Marketing (Desktop only or stacked top on mobile) */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-6 md:p-10 lg:p-14 border-b-3 md:border-b-0 md:border-r-3 border-slate-900 border-solid select-none bg-[#faf8f5]/85">
        
        {/* Branding Header */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
              <Image src="/logo.png" alt="Coursa Logo" fill className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold tracking-tight text-slate-900">Coursa</span>
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Learning OS</span>
            </div>
          </Link>
        </div>

        {/* Core Marketing Info */}
        <div className="my-6 md:my-0 flex flex-col gap-6 lg:gap-8">
          <div className="flex flex-col gap-3">
            <span className="font-display text-sm tracking-widest uppercase text-sketch-orange font-bold bg-orange-50 px-3 py-1 wobbly-border border-2 inline-block self-start rotate-[-1deg]">
              Generate, Learn, Revise, Master
            </span>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-slate-900">
              {title}
            </h1>
            <p className="font-sans text-lg lg:text-xl text-slate-600 leading-snug">
              {subtitle}
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {features.map((feat, idx) => (
              <div 
                key={idx} 
                className={`wobbly-border border-2 p-3 flex items-center gap-2.5 bg-white hard-shadow-sm ${
                  idx % 2 === 0 ? '-rotate-0.5' : 'rotate-0.5'
                }`}
              >
                <div className="p-1 bg-purple-50 text-sketch-primary rounded-full border border-sketch-primary/40">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
                <span className="font-sans text-base lg:text-lg font-bold text-slate-800 leading-none">{feat}</span>
              </div>
            ))}
          </div>

          {/* Learning Roadmap Flowchart Illustration */}
          <div className="w-full wobbly-border border-2 border-dashed p-5 bg-white rotate-0.5 relative">
            <div className="tape -top-3 left-6 opacity-60"></div>
            <h4 className="font-display text-base font-bold text-slate-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
              <BrainCircuit className="w-5 h-5 text-sketch-primary" /> Active Learning Loop
            </h4>
            
            {/* Horizontal flow steps */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-display text-sm md:text-base">
              <div className="flex-1 text-center bg-slate-50 p-2 wobbly-border border">
                <span className="block font-bold text-slate-800">1. Generate</span>
                <span className="font-sans text-[10px] text-slate-400">Layout Roadmap</span>
              </div>
              
              <div className="hidden sm:block text-slate-400 animate-pulse font-bold">➔</div>
              
              <div className="flex-1 text-center bg-purple-50 p-2 wobbly-border border border-sketch-primary">
                <span className="block font-bold text-sketch-primary">2. Learn</span>
                <span className="font-sans text-[10px] text-slate-400">Concept Map</span>
              </div>
              
              <div className="hidden sm:block text-slate-400 animate-pulse font-bold">➔</div>
              
              <div className="flex-1 text-center bg-orange-50 p-2 wobbly-border border border-sketch-orange">
                <span className="block font-bold text-sketch-orange">3. Revise</span>
                <span className="font-sans text-[10px] text-slate-400">Spaced Review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Bar footer */}
        <div className="grid grid-cols-3 gap-3 border-t border-dashed border-slate-300 pt-5 mt-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-start gap-0.5">
              <div className="flex items-center gap-1.5 font-display text-xl md:text-2xl font-bold text-slate-800">
                {stat.icon}
                <span>{stat.value}</span>
              </div>
              <span className="font-sans text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider leading-tight">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Clerk Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-10 lg:p-14 relative">
        <div className="w-full max-w-[480px]">
          {children}
        </div>
      </div>

    </div>
  );
}

export default AuthLayout;
