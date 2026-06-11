import { SignUp } from '@clerk/nextjs';
import AuthLayout from '@/components/AuthLayout';

export default function Page() {
  return (
    <AuthLayout
      title="Start Your Learning Journey"
      subtitle="Generate structured video roadmaps, visualize connected concept trees, and lock new skills into long-term memory with active revision."
    >
      <div className="relative w-full max-w-[480px]">
        {/* Thumbtack Decoration */}
        <div className="thumbtack absolute -top-3 left-1/2 -translate-x-1/2 z-30"></div>
        <SignUp />
      </div>
    </AuthLayout>
  );
}