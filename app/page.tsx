import React from "react";
import Hero from "./_components/Hero";
import StatsBar from "./_components/StatsBar";
import ContinueLearning from "./_components/ContinueLearning";
import HowItWorks from "./_components/HowItWorks";
import FeaturedRoadmap from "./_components/FeaturedRoadmap";
import KnowledgeShowcase from "./_components/KnowledgeShowcase";
import RevisionShowcase from "./_components/RevisionShowcase";
import CourseList from "./_components/CourseList";
import RecommendationsList from "@/components/RecommendationsList";
import WhyComparison from "./_components/WhyComparison";
import Pricing from "./_components/Pricing";

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