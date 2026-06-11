import { SignIn } from '@clerk/nextjs';
import AuthLayout from '@/components/AuthLayout';

export default function Page() {
  return (
    <AuthLayout
      title="Continue Your Learning Journey"
      subtitle="Welcome back! Resume your courses, track concept mastery, and check off scheduled spaced repetition reviews in your dashboard."
    >
      <div className="relative w-full max-w-[480px]">
        {/* Thumbtack Decoration */}
        <div className="thumbtack absolute -top-3 left-1/2 -translate-x-1/2 z-30"></div>
        <SignIn />
      </div>
    </AuthLayout>
  );
}