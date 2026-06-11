"use client";
import React from 'react';
import { Video, BookOpen, Network, ShieldCheck } from 'lucide-react';

const stats = [
  {
    icon: <Video className="w-8 h-8 text-sketch-primary" />,
    value: "10,000+",
    label: "Videos Indexed",
    bgColor: "bg-purple-50",
  },
  {
    icon: <BookOpen className="w-8 h-8 text-sketch-orange" />,
    value: "500+",
    label: "Learning Topics",
    bgColor: "bg-orange-50",
  },
  {
    icon: <Network className="w-8 h-8 text-slate-800" />,
    value: "Thousands",
    label: "Concepts Connected",
    bgColor: "bg-slate-50",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-sketch-primary" />,
    value: "95%",
    label: "Structured Coverage",
    bgColor: "bg-purple-50",
  },
];

function StatsBar() {
  return (
    <section className="w-full px-6 md:px-12 lg:px-24 py-8 bg-[#faf8f5]">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`wobbly-border hard-shadow-sm p-6 flex flex-col items-center justify-center text-center bg-white relative transition-transform hover:-translate-y-1 ${
              idx % 2 === 0 ? '-rotate-1' : 'rotate-1'
            }`}
          >
            {/* Small decorative tape on random stats cards */}
            {idx % 3 === 0 && <div className="tape -top-3 left-3 opacity-60"></div>}
            
            <div className={`p-4 rounded-full ${stat.bgColor} wobbly-border border-2 mb-4`}>
              {stat.icon}
            </div>
            <h3 className="font-display text-3xl font-bold text-slate-900 leading-none">
              {stat.value}
            </h3>
            <p className="font-sans text-lg text-slate-600 mt-1 leading-tight">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatsBar;
