import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  GraduationCap,
  Instagram,
  LineChart,
  Linkedin,
  MessageCircleQuestion,
  Rocket,
  Sparkles,
  Star,
  Timer,
  Users,
  Quote,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";

export type HomeCourse = {
  id: string;
  title: string;
  level?: string;
  price?: number;
  currency?: string;
  subjects?: { id?: string; name: string }[];
};

const features = [
  {
    icon: Sparkles,
    title: "AI-powered learning",
    desc: "Smart recommendations, weak-topic analysis, and faster progress for every student.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Live doubt solving",
    desc: "Ask questions during classes and get mentor guidance instantly.",
  },
  {
    icon: BadgeCheck,
    title: "Daily practice quizzes",
    desc: "Topic-wise quizzes with scoring, explanations, and revision tips.",
  },
  {
    icon: LineChart,
    title: "Performance analytics",
    desc: "Track attendance, marks, and learning consistency in one dashboard.",
  },
] as const;

const liveBatches = [
  { id: "jee", title: "JEE Batch", startDate: "10 April 2026", price: "₹3,499" },
  { id: "cet", title: "MHT CET Batch", startDate: "15 April 2026", price: "₹2,999" },
  { id: "eng", title: "English Speaking Course", startDate: "20 April 2026", price: "₹1,499" },
] as const;

const educators = [
  { id: "1", name: "Aarav Sharma", subject: "Physics", exp: "8+ years", initials: "AS" },
  { id: "2", name: "Neha Patil", subject: "Mathematics", exp: "6+ years", initials: "NP" },
  { id: "3", name: "Ritika Joshi", subject: "English", exp: "5+ years", initials: "RJ" },
] as const;

const testimonials = [
  {
    id: "1",
    name: "Rahul Patil",
    text: "RiseUp Academy helped me improve my CET score and confidence.",
  },
  {
    id: "2",
    name: "Sneha More",
    text: "Best teachers, regular tests, and easy learning dashboard.",
  },
  {
    id: "3",
    name: "Aman Jain",
    text: "English speaking course improved my communication a lot.",
  },
] as const;

const demoCourses: HomeCourse[] = [
  { id: "demo1", title: "JEE Main & Advanced", level: "JEE", price: 2999 },
  { id: "demo2", title: "MHT CET Complete", level: "MHT CET", price: 2499 },
  { id: "demo3", title: "Class 10 Science", level: "Grade 10", price: 1299 },
  { id: "demo4", title: "English Mastery", level: "English", price: 999 },
  { id: "demo5", title: "Biology Deep Dive", level: "Biology", price: 1499 },
  { id: "demo6", title: "Math Problem Solving", level: "Mathematics", price: 1799 },
];

const btn = {
  base: "inline-flex min-h-[44px] items-center justify-center rounded-2xl px-6 text-sm font-semibold transition active:scale-[0.98]",
  primary: "bg-violet-700 text-white hover:bg-violet-800",
  outline: "border-2 border-violet-200 bg-white text-gray-900 hover:bg-violet-50",
  accent: "bg-orange-500 text-white hover:bg-orange-600",
};

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function HomePage({ courses }: { courses: HomeCourse[] }) {
  const featured =
    courses.length >= 3
      ? courses.slice(0, 6)
      : [...courses, ...demoCourses].slice(0, 6);

  return (
    <div className="bg-white">

      {/* HERO */}
      <Section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-orange-50 py-16 md:py-24">
        <PageContainer className="max-w-6xl">
          <div className="grid items-center gap-10 md:grid-cols-2">

            {/* LEFT */}
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-violet-200 bg-white px-4 py-1 text-sm font-medium text-violet-700">
                  Trusted by 1000+ students
                </span>

                <span className="rounded-full bg-orange-100 px-4 py-1 text-sm font-semibold text-orange-700">
                  90% success rate
                </span>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold leading-tight text-gray-900 md:text-6xl">
                Crack Exams. Build Skills.{" "}
                <span className="text-violet-700">RiseUp Academy</span>
              </h1>

              <p className="mt-5 max-w-xl text-lg text-gray-600">
                Live classes, quizzes, doubt solving, AI learning support, and
                complete preparation for school & competitive exams.
              </p>

              <div className="mt-4 inline-flex items-center rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
                <Timer className="mr-2 h-4 w-4" />
                Limited time offer - Enroll now
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className={cn(btn.base, btn.primary)}>
                  Start Learning
                </Link>

                <Link href="/courses" className={cn(btn.base, btn.outline)}>
                  View Courses
                </Link>

                <Link href="/book-demo" className={cn(btn.base, btn.accent)}>
                  Book Free Demo
                </Link>
              </div>
            </div>

            {/* RIGHT */}
            <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-xl">
              <div className="rounded-2xl bg-violet-700 p-5 text-white">
                <p className="text-sm">Student Dashboard</p>
                <h3 className="mt-2 text-2xl font-bold">85% Progress</h3>
                <p className="mt-1 text-violet-100">3 Courses Active</p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-gray-500">Tests Completed</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">42</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-gray-500">Attendance</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">92%</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-orange-50 p-4">
                <p className="text-sm font-semibold text-orange-700">
                  AI Suggestion:
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  Focus on Mathematics this week for better score growth.
                </p>
              </div>
            </div>

          </div>
        </PageContainer>
      </Section>

      {/* STATS */}
      <Section className="py-12">
        <PageContainer className="max-w-6xl">
          <div className="grid gap-4 md:grid-cols-3">

            {[
              { icon: Users, title: "1000+ Students", sub: "Active learners" },
              { icon: GraduationCap, title: "Expert Teachers", sub: "Experienced mentors" },
              { icon: LineChart, title: "High Results", sub: "Consistent success rate" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <item.icon className="h-8 w-8 text-violet-700" />
                <h3 className="mt-3 text-xl font-bold">{item.title}</h3>
                <p className="text-gray-600">{item.sub}</p>
              </div>
            ))}

          </div>
        </PageContainer>
      </Section>

      {/* COURSES */}
      <Section className="bg-slate-50 py-16">
        <PageContainer className="max-w-6xl">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold">Popular Courses</h2>
              <p className="mt-2 text-gray-600">
                Choose a program and start learning.
              </p>
            </div>

            <Link href="/courses" className={cn(btn.base, btn.outline)}>
              View All
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {featured.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-violet-700">
                    {c.level}
                  </span>

                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    Trending
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold">{c.title}</h3>

                <div className="mt-4 flex items-center justify-between">
                  <Stars />
                  <span className="text-sm text-gray-500">1200+ students</span>
                </div>

                <p className="mt-5 text-2xl font-bold text-violet-700">
                  ₹{c.price?.toLocaleString("en-IN")}
                </p>

                <Link
                  href={`/courses?courseId=${c.id}`}
                  className={cn(btn.base, btn.primary, "mt-5 w-full")}
                >
                  Enroll Now
                </Link>
              </div>
            ))}
          </div>
        </PageContainer>
      </Section>

      {/* TESTIMONIALS */}
      <Section className="py-16">
        <PageContainer className="max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Student Reviews</h2>
            <p className="mt-2 text-gray-600">
              Real feedback from our learners.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                <Quote className="h-8 w-8 text-violet-700" />
                <p className="mt-4 text-gray-700">{t.text}</p>
                <p className="mt-4 font-bold">{t.name}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </Section>

      {/* CTA */}
      <Section className="bg-violet-700 py-16 text-white">
        <PageContainer className="max-w-4xl text-center">
          <Rocket className="mx-auto h-10 w-10" />
          <h2 className="mt-4 text-3xl font-bold">
            Start Your Learning Journey Today
          </h2>

          <p className="mt-3 text-violet-100">
            Join RiseUp Academy and transform your future with expert guidance.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={cn(btn.base, "bg-white text-violet-700")}>
              Get Started
            </Link>

            <Link
              href="/book-demo"
              className={cn(btn.base, "border border-white text-white")}
            >
              Book Demo <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </PageContainer>
      </Section>

    </div>
  );
}