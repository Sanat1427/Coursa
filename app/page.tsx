import React from "react";
import dynamic from "next/dynamic";
import Hero from "./_components/Hero";
import StatsBar from "./_components/StatsBar";
import ContinueLearning from "./_components/ContinueLearning";
import HowItWorks from "./_components/HowItWorks";
import CourseList from "./_components/CourseList";

// Dynamically import below-the-fold components with premium sketch fallback states
const RecommendationsList = dynamic(() => import("@/components/RecommendationsList"), {
  loading: () => (
    <div className="w-full max-w-6xl mx-auto my-8 py-10 px-4 md:px-8 bg-white wobbly-border border-2 font-display text-slate-400 italic text-center">
      Fetching personalized matching recommendations...
    </div>
  )
});

const FeaturedRoadmap = dynamic(() => import("./_components/FeaturedRoadmap"), {
  loading: () => (
    <div className="w-full max-w-6xl mx-auto my-8 py-12 px-6 bg-white wobbly-border border-2 font-display text-slate-400 italic text-center">
      Loading featured syllabus roadmaps...
    </div>
  )
});

const KnowledgeShowcase = dynamic(() => import("./_components/KnowledgeShowcase"), {
  loading: () => (
    <div className="w-full max-w-6xl mx-auto my-8 py-12 px-6 bg-[#faf8f5] wobbly-border border-2 font-display text-slate-400 italic text-center">
      Loading interactive knowledge tree showcase...
    </div>
  )
});

const RevisionShowcase = dynamic(() => import("./_components/RevisionShowcase"), {
  loading: () => (
    <div className="w-full max-w-6xl mx-auto my-8 py-12 px-6 bg-[#faf8f5] wobbly-border border-2 font-display text-slate-400 italic text-center">
      Loading spaced repetition logs showcase...
    </div>
  )
});

const WhyComparison = dynamic(() => import("./_components/WhyComparison"), {
  loading: () => (
    <div className="w-full max-w-6xl mx-auto my-8 py-12 px-6 bg-white wobbly-border border-2 font-display text-slate-400 italic text-center">
      Loading platform comparisons...
    </div>
  )
});

const Pricing = dynamic(() => import("./_components/Pricing"), {
  loading: () => (
    <div className="w-full max-w-6xl mx-auto my-8 py-12 px-6 bg-white wobbly-border border-2 font-display text-slate-400 italic text-center">
      Loading membership plans...
    </div>
  )
});

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen bg-[#fdfaf6]">
      {/* 1. Hero Area with Generator & Interactive Visual loops */}
      <Hero />

      {/* 2. Social Proof Trust metrics */}
      <StatsBar />

      {/* 3. Continue learning dashboard section (dynamic for authed users) */}
      <ContinueLearning />

      {/* 4. User generated course list (dynamic for authed users) */}
      <CourseList />

      {/* 5. Personalized matching recommendations (dynamic for authed users) */}
      <RecommendationsList />

      {/* 6. Visual workflow steps */}
      <HowItWorks />

      {/* 7. Featured Syllabus Roadmap Tree */}
      <FeaturedRoadmap />

      {/* 8. Mock Interactive Knowledge Tree graph showcase */}
      <KnowledgeShowcase />

      {/* 9. Memory decay & spaced repetition explanation */}
      <RevisionShowcase />

      {/* 10. Table comparing playlists against Coursa OS */}
      <WhyComparison />

      {/* 11. pricing table at lower fold */}
      <Pricing />
    </main>
  );
}