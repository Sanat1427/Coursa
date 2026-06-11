"use client";
import React from 'react';
import { Sparkles, HelpCircle, PenTool, Youtube, Cpu, Network, RefreshCw, BarChart2 } from 'lucide-react';

const steps = [
  {
    icon: <PenTool className="w-6 h-6 text-sketch-primary" />,
    title: "1. Topic Input",
    desc: "Type any skill or interest you want to learn.",
    color: "border-sketch-primary bg-purple-50/30",
  },
  {
    icon: <Sparkles className="w-6 h-6 text-sketch-orange" />,
    title: "2. AI Course Sketch",
    desc: "AI maps the layout, structure, and milestones.",
    color: "border-sketch-orange bg-orange-50/30",
  },
  {
    icon: <Youtube className="w-6 h-6 text-red-500" />,
    title: "3. Video Lessons",
    desc: "Top YouTube lectures are synced to your roadmap.",
    color: "border-red-500 bg-red-50/30",
  },
  {
    icon: <Cpu className="w-6 h-6 text-sketch-primary" />,
    title: "4. Concept Extraction",
    desc: "AI extracts code examples, definitions, and facts.",
    color: "border-sketch-primary bg-purple-50/30",
  },
  {
    icon: <Network className="w-6 h-6 text-slate-800" />,
    title: "5. Knowledge Graph",
    desc: "Concepts link to build your personal knowledge tree.",
    color: "border-slate-800 bg-slate-50/30",
  },
  {
    icon: <RefreshCw className="w-6 h-6 text-sketch-orange" />,
    title: "6. Revision Engine",
    desc: "Inline flashcards prompt you using spaced repetition.",
    color: "border-sketch-orange bg-orange-50/30",
  },
  {
    icon: <BarChart2 className="w-6 h-6 text-sketch-primary" />,
    title: "7. Mastery Tracking",
    desc: "Unlock advanced tracks and level up your coding rank.",
    color: "border-sketch-primary bg-purple-50/30",
  },
];

function HowItWorks() {
  return (
    <section id="features" className="w-full px-6 md:px-12 lg:px-24 py-16 bg-[#faf8f5]">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="font-display text-4xl md:text-5xl font-bold inline-block relative scribble-underline mb-4">
          The Learning OS Workflow
        </h2>
        <p className="font-sans text-2xl text-slate-600 max-w-2xl mx-auto mt-2">
          Unlike static playlists, Coursa turns videos into an active, self-improving knowledge graph.
        </p>
      </div>

      {/* Grid of Steps */}
      <div className="max-w-6xl mx-auto flex flex-col md:grid md:grid-cols-7 gap-6 relative">
        {/* Horizontal connector line for large screens */}
        <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[3px] border-t-2 border-dashed border-slate-300 -z-10" />

        {steps.map((step, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center relative group"
          >
            {/* Step Card */}
            <div className={`w-full wobbly-border hard-shadow-sm p-5 bg-white flex flex-col items-center text-center transition-all duration-200 hover:scale-105 relative z-10 ${
              idx % 2 === 0 ? 'rotate-1' : '-rotate-1'
            } border-2 ${step.color}`}>
              {/* Badge/Icon */}
              <div className="p-3 bg-white wobbly-border border-2 rounded-full -mt-2 mb-3 shadow-sm group-hover:bg-slate-50 transition-colors">
                {step.icon}
              </div>
              <h3 className="font-display text-xl font-bold text-slate-800 leading-tight">
                {step.title}
              </h3>
              <p className="font-sans text-base text-slate-500 mt-2 leading-tight">
                {step.desc}
              </p>
            </div>

            {/* Mobile indicator arrow */}
            {idx < steps.length - 1 && (
              <div className="md:hidden my-4 text-sketch-orange flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="w-8 h-8 animate-bounce"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;
