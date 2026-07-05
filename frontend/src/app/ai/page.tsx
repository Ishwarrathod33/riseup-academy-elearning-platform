import { AiTutor } from "@/features/ai-tutor/AiTutor";

export const metadata = {
  title: "AI Tutor | RiseUp Academy",
  description: "Get personalized guidance from your Gemini-powered AI Tutor.",
};

export default function AiTutorPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Your AI Tutor
        </h1>

        <p className="mt-2 text-gray-600 text-lg">
          Stuck on a concept or assignment? Ask for guidance below.
        </p>

        <AiTutor />
      </div>
    </main>
  );
}