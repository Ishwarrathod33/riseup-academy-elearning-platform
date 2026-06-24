import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";

const points = [
  "Expert educators for school and competitive exams",
  "Live classes, doubt support, and daily practice",
  "Progress analytics to help students improve faster",
] as const;

export default function AboutPage() {
  return (
    <div className="bg-white">
      <Section className="border-b border-gray-100 bg-gradient-to-b from-violet-50/50 to-white py-14 md:py-18">
        <PageContainer className="max-w-5xl">
          <div className="text-center">
            <p className="inline-flex rounded-full border border-violet-200 bg-white px-4 py-1.5 text-sm font-medium text-violet-800 shadow-sm">
              About Us
            </p>
            <h1 className="font-display mt-5 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
              RiseUp Academy
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-gray-600 md:text-lg">
              RiseUp Academy is a modern EdTech learning platform focused on helping students achieve strong academic
              outcomes through structured courses, expert mentoring, and practical daily learning systems.
            </p>
          </div>
        </PageContainer>
      </Section>

      <Section className="py-12 md:py-16">
        <PageContainer className="max-w-5xl">
          <div className="grid gap-4 md:grid-cols-3">
            {points.map((point) => (
              <article
                key={point}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
              >
                <p className="text-sm leading-relaxed text-gray-700">{point}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-violet-200/50 bg-violet-50/50 p-6 text-center md:p-8">
            <h2 className="font-display text-xl font-bold text-gray-900 md:text-2xl">Our Mission</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 md:text-base">
              To make high-quality learning accessible, consistent, and outcome-driven for every student.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/courses"
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border-2 border-violet-200 bg-white px-5 text-sm font-semibold text-violet-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 active:scale-[0.98]"
              >
                View Courses
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 active:scale-[0.98]"
              >
                Start Learning
              </Link>
            </div>
          </div>
        </PageContainer>
      </Section>
    </div>
  );
}
