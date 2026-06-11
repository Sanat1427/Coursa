"use client";
import React, { useState } from 'react';
import { RefreshCw, BookOpen, Clock, BrainCircuit, ShieldAlert, Award } from 'lucide-react';

const intervals = [
  {
    stage: "Stage 1",
    title: "Learn Today",
    timing: "Immediate",
    desc: "Complete a chapter. AI extracts flashcards and concepts (100% memory strength).",
    icon: <BookOpen className="w-5 h-5 text-sketch-primary" />,
    color: "bg-purple-50 border-sketch-primary",
  },
  {
    stage: "Stage 2",
    title: "Review Tomorrow",
    timing: "1 Day Later",
    desc: "First review combats the steep initial forgetting curve. Re-hearse and recall.",
    icon: <Clock className="w-5 h-5 text-sketch-orange" />,
    color: "bg-orange-50 border-sketch-orange",
  },
  {
    stage: "Stage 3",
    title: "Review Next Week",
    timing: "7 Days Later",
    desc: "Decay rate slows down. Third review locks concepts into intermediate memory.",
    icon: <BrainCircuit className="w-5 h-5 text-slate-800" />,
    color: "bg-slate-50 border-slate-900",
  },
  {
    stage: "Stage 4",
    title: "Master Forever",
    timing: "30+ Days Later",
    desc: "Permanent crystallization. Node becomes a permanent pillar of your knowledge tree.",
    icon: <Award className="w-5 h-5 text-sketch-primary" />,
    color: "bg-purple-50 border-sketch-primary",
  },
];

function RevisionShowcase() {
  const [selectedInterval, setSelectedInterval] = useState(intervals[1]);

  return (
    <section id="revision-engine" className="w-full px-6 md:px-12 lg:px-24 py-16 bg-[#faf8f5]">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="font-display text-4xl md:text-5xl font-bold inline-block relative scribble-underline mb-4">
          Spaced Repetition Revision Engine
        </h2>
        <p className="font-sans text-2xl text-slate-600 max-w-2xl mx-auto mt-2">
          Stop learning and forgetting immediately. Coursa calculates optimal intervals to lock concepts in long-term memory.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
        {/* Interval Cards (Left) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {intervals.map((interval) => {
            const isSelected = selectedInterval.title === interval.title;
            return (
              <div
                key={interval.title}
                onClick={() => setSelectedInterval(interval)}
                className={`wobbly-border border-2 p-5 bg-white cursor-pointer transition-all flex gap-4 items-start ${
                  isSelected ? 'hard-shadow border-slate-950 translate-x-1' : 'hard-shadow-sm border-slate-900/60 hover:bg-slate-50/50'
                }`}
              >
                <div className={`p-3 rounded-full wobbly-border border-2 ${interval.color} shrink-0`}>
                  {interval.icon}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm text-slate-400 uppercase font-bold">
                      {interval.stage} ({interval.timing})
                    </span>
                  </div>
                  <h3 className="font-display text-xl md:text-2xl font-bold text-slate-800">
                    {interval.title}
                  </h3>
                  <p className="font-sans text-lg text-slate-500 mt-1 leading-tight">
                    {interval.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Graph: Forgetting Curve (Right) */}
        <div className="lg:col-span-2 wobbly-border hard-shadow bg-white p-6 relative flex flex-col justify-between rotate-[-0.5deg]">
          <div className="tape -top-3 right-6 opacity-60"></div>
          <div>
            <h4 className="font-display text-2xl font-bold text-slate-800 border-b-2 border-dashed border-slate-200 pb-3 mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-sketch-primary" /> The Forgetting Curve
            </h4>

            {/* SVG graph of the forgetting curve */}
            <div className="relative w-full h-48 bg-slate-50/50 wobbly-border border-2 border-dashed flex items-center justify-center p-2">
              <svg className="w-full h-full" viewBox="0 0 320 160">
                {/* Axes */}
                <line x1="30" y1="10" x2="30" y2="140" stroke="#1a1a1a" strokeWidth="2.5" />
                <line x1="30" y1="140" x2="300" y2="140" stroke="#1a1a1a" strokeWidth="2.5" />
                
                {/* Labels */}
                <text x="25" y="25" textAnchor="end" className="font-sans text-[10px] font-bold fill-slate-400">100%</text>
                <text x="25" y="80" textAnchor="end" className="font-sans text-[10px] font-bold fill-slate-400">50%</text>
                <text x="25" y="135" textAnchor="end" className="font-sans text-[10px] font-bold fill-slate-400">0%</text>
                <text x="30" y="152" textAnchor="start" className="font-sans text-[10px] font-bold fill-slate-400">Day 0</text>
                <text x="120" y="152" textAnchor="middle" className="font-sans text-[10px] font-bold fill-slate-400">Day 1</text>
                <text x="210" y="152" textAnchor="middle" className="font-sans text-[10px] font-bold fill-slate-400">Day 7</text>
                <text x="290" y="152" textAnchor="end" className="font-sans text-[10px] font-bold fill-slate-400">Day 30</text>

                {/* Curve 1: No Review (Falls off rapidly) */}
                <path
                  d="M 30 20 Q 75 110 120 135"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeDasharray="4,3"
                />
                <text x="100" y="105" className="font-sans text-[9px] font-bold fill-red-500 rotate-[-25deg]">No Review</text>

                {/* Curve 2: Review Day 1 */}
                <path
                  d="M 120 20 Q 165 65 210 90"
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="2.5"
                />
                {/* Spaced Review 1 connector vertical line */}
                <line x1="120" y1="135" x2="120" y2="20" stroke="#fb923c" strokeWidth="1.5" strokeDasharray="3,3" />
                <circle cx="120" cy="20" r="4" fill="#fb923c" stroke="#1a1a1a" strokeWidth="1" />

                {/* Curve 3: Review Day 7 */}
                <path
                  d="M 210 20 Q 255 35 300 45"
                  fill="none"
                  stroke="#af25f4"
                  strokeWidth="2.5"
                />
                {/* Spaced Review 2 connector vertical line */}
                <line x1="210" y1="90" x2="210" y2="20" stroke="#af25f4" strokeWidth="1.5" strokeDasharray="3,3" />
                <circle cx="210" cy="20" r="4" fill="#af25f4" stroke="#1a1a1a" strokeWidth="1" />
                <circle cx="300" cy="45" r="4" fill="#af25f4" stroke="#1a1a1a" strokeWidth="1" />
              </svg>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-4 mt-6">
            <span className="font-display text-sm text-slate-400 uppercase font-bold block mb-1">
              Active Highlight:
            </span>
            <h5 className="font-display text-xl font-bold text-sketch-primary">
              {selectedInterval.timing} — {selectedInterval.title}
            </h5>
            <p className="font-sans text-base text-slate-500 mt-1 leading-tight">
              Review session boosts memory levels back to 100% and flattens the forgetting curve for this topic.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RevisionShowcase;
