import Hero from "./_components/Hero";
import CourseList from "./_components/CourseList";
import Features from "./_components/Features";
import Pricing from "./_components/Pricing";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-start">
        <Hero />
        <Features />
        <section className="w-full px-6 py-12">
          <CourseList />
        </section>
        <Pricing />
      </main>
    </div>
  );
}
