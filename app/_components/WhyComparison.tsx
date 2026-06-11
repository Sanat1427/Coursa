"use client";
import React from 'react';
import { X, Check, ArrowRight, ShieldAlert, Award } from 'lucide-react';

function WhyComparison() {
  return (
    <section id="why-coursa" className="w-full px-6 md:px-12 lg:px-24 py-16 bg-[#faf8f5]">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="font-display text-4xl md:text-5xl font-bold inline-block relative scribble-underline mb-4">
          Why Coursa?
        </h2>
        <p className="font-sans text-2xl text-slate-600 max-w-2xl mx-auto mt-2">
          YouTube playlists are passive videos. Coursa turns them into an interactive learning machine.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch relative">
        {/* VS badge in the middle */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 text-white rounded-full wobbly-border border-2 items-center justify-center font-display text-lg font-bold rotate-6 z-20 shadow-md">
          VS
        </div>

        {/* YouTube Playlist (Left) */}
        <div className="w-full wobbly-border border-2 border-dashed border-red-200 bg-white p-8 opacity-75 relative rotate-[-1deg] hover:rotate-0 transition-transform">
          <div className="flex items-center gap-3 border-b border-dashed border-red-100 pb-4 mb-6">
            <div className="p-2 bg-red-50 text-red-500 rounded-full border border-red-200 wobbly-border">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-slate-700">
              Standard YouTube Playlist
            </h3>
          </div>

          <ul className="flex flex-col gap-5">
            <li className="flex items-start gap-3 text-slate-500 font-sans text-lg">
              <X className="w-6 h-6 text-red-500 shrink-0 mt-0.5" strokeWidth={3} />
              <div>
                <strong>No Structure:</strong> Just a flat list of videos. Hard to gauge depth, topics, or course progression.
              </div>
            </li>
            <li className="flex items-start gap-3 text-slate-500 font-sans text-lg">
              <X className="w-6 h-6 text-red-500 shrink-0 mt-0.5" strokeWidth={3} />
              <div>
                <strong>No Progress Tracking:</strong> YouTube doesn't track which core concepts you've mastered, only which videos you've clicked.
              </div>
            </li>
            <li className="flex items-start gap-3 text-slate-500 font-sans text-lg">
              <X className="w-6 h-6 text-red-500 shrink-0 mt-0.5" strokeWidth={3} />
              <div>
                <strong>No Revision System:</strong> You finish a video, forget it 3 days later, and have no schedule to bring it back.
              </div>
            </li>
            <li className="flex items-start gap-3 text-slate-500 font-sans text-lg">
              <X className="w-6 h-6 text-red-500 shrink-0 mt-0.5" strokeWidth={3} />
              <div>
                <strong>No Knowledge Graph:</strong> Interconnected topics aren't mapped. You can't see prerequisites or advanced recommendations.
              </div>
            </li>
          </ul>
        </div>

        {/* Coursa Learning OS (Right) */}
        <div className="w-full wobbly-border border-3 border-slate-900 bg-white p-8 relative rotate-[1deg] hover:rotate-0 transition-transform hard-shadow">
          <div className="tape -top-3 right-6 opacity-60"></div>
          
          <div className="flex items-center gap-3 border-b border-dashed border-slate-200 pb-4 mb-6">
            <div className="p-2 bg-purple-50 text-sketch-primary rounded-full border border-sketch-primary wobbly-border">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-slate-900">
              Coursa AI Learning OS
            </h3>
          </div>

          <ul className="flex flex-col gap-5">
            <li className="flex items-start gap-3 text-slate-700 font-sans text-lg">
              <Check className="w-6 h-6 text-green-600 shrink-0 mt-0.5" strokeWidth={3} />
              <div>
                <strong>Structured Roadmap:</strong> Generated lesson chapters organized logically from beginner to advanced.
              </div>
            </li>
            <li className="flex items-start gap-3 text-slate-700 font-sans text-lg">
              <Check className="w-6 h-6 text-green-600 shrink-0 mt-0.5" strokeWidth={3} />
              <div>
                <strong>Concept Tracking:</strong> AI extracts definitions and notes dynamically, tracking exact concept mastery on a 0-100 scale.
              </div>
            </li>
            <li className="flex items-start gap-3 text-slate-700 font-sans text-lg">
              <Check className="w-6 h-6 text-green-600 shrink-0 mt-0.5" strokeWidth={3} />
              <div>
                <strong>Smart Revision:</strong> Integrated Spaced Repetition (SRS) prompts you to review concepts precisely when they start fading.
              </div>
            </li>
            <li className="flex items-start gap-3 text-slate-700 font-sans text-lg">
              <Check className="w-6 h-6 text-green-600 shrink-0 mt-0.5" strokeWidth={3} />
              <div>
                <strong>Personalized Learning Path:</strong> Recommendations unlock new courses based on your mastered nodes in the knowledge graph.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default WhyComparison;
