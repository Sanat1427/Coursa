"use client";
import React from 'react';
import { BookOpen, Sparkles, Pencil, Video, Zap, Bot } from 'lucide-react';

const features = [
    {
        icon: <Bot className="w-8 h-8 text-sketch-primary" />,
        title: "AI-Powered Outlines",
        description: "Just type what you want to learn. Our AI will instantly sketch out a comprehensive curriculum tailored to your needs."
    },
    {
        icon: <Video className="w-8 h-8 text-sketch-orange" />,
        title: "Instant Video Lessons",
        description: "We don't just give you text. Watch full video lessons generated on the fly, complete with voiceovers and visuals."
    },
    {
        icon: <BookOpen className="w-8 h-8 text-sketch-blue" />,
        title: "Curated Study Materials",
        description: "Get hand-picked resources, quizzes, and summaries to reinforce your learning after every single video chapter."
    },
    {
        icon: <Zap className="w-8 h-8 text-sketch-yellow" />,
        title: "Learn at Your Pace",
        description: "Whether you want a quick 5-minute crash course or a deep dive, Coursa adapts to your schedule and learning style."
    }
];

export default function Features() {
    return (
        <section id="features" className="w-full px-6 py-24 bg-slate-50 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-10 left-10 w-32 h-32 border-4 border-sketch-yellow rounded-full opacity-20 border-dashed pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-24 h-24 border-4 border-sketch-blue rotate-12 opacity-20 pointer-events-none" />

            <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
                <div className="text-center mb-16 relative">
                    <div className="absolute -left-8 -top-8 text-sketch-primary opacity-50 rotate-[-15deg]">
                        <Sparkles className="w-12 h-12" />
                    </div>
                    <h2 className="font-display text-5xl font-bold text-slate-900 mb-6">
                        Why Choose <span className="text-sketch-primary italic scribble-underline">Coursa?</span>
                    </h2>
                    <p className="font-sans text-xl text-slate-600 max-w-2xl mx-auto">
                        Everything you need to master a new skill, bundled into one beautifully simple platform.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`wobbly-border hard-shadow bg-white p-8 flex flex-col gap-4 transform transition-transform hover:-translate-y-1 hover:shadow-none ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
                        >
                            <div className="w-16 h-16 wobbly-border bg-slate-50 flex items-center justify-center mb-2">
                                {feature.icon}
                            </div>
                            <h3 className="font-display text-2xl font-bold text-slate-800">
                                {feature.title}
                            </h3>
                            <p className="font-sans text-lg text-slate-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
