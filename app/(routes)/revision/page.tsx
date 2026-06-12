import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function RevisionDashboard() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen dot-pattern bg-[#fdfaf6] p-6 text-center">
            {/* TODO: Re-enable in future release */}
            <div className="wobbly-border bg-white p-10 hard-shadow max-w-md relative rotate-[-1deg]">
                <div className="thumbtack absolute -top-3 left-1/2 -translate-x-1/2"></div>
                <BookOpen className="w-12 h-12 text-sketch-primary mx-auto mb-4" />
                <h2 className="font-display text-3xl font-black text-slate-800 leading-tight">
                    Smart Retention Canvas
                </h2>
                <p className="font-sans text-slate-500 text-sm mt-3 leading-relaxed">
                    This feature is temporarily disabled for stability optimization. We are updating our spaced repetition scheduling algorithm.
                </p>
                <div className="mt-6 font-display text-xl text-sketch-orange font-bold italic">
                    Coming Soon in V2 🚀
                </div>
                <Link href="/" className="mt-6 inline-block">
                    <button className="bg-black text-white font-display text-lg px-6 py-2.5 wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                        Back to Dashboard 
                    </button>
                </Link>
            </div>
        </div>
    );
}
