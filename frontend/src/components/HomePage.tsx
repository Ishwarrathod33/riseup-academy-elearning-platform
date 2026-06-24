import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  BookOpen, 
  GraduationCap, 
  LayoutDashboard, 
  Star, 
  ShieldCheck, 
  Users, 
  PlayCircle 
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-violet-950 px-6 py-20 text-white lg:px-8 lg:py-32">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-400 via-violet-900 to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-5xl text-center animate-fade-up">
          <div className="mb-6 inline-flex items-center rounded-full border border-violet-700 bg-violet-900/50 px-3 py-1 text-sm font-medium text-violet-200 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-violet-400 mr-2"></span>
            New courses available for the upcoming semester
          </div>
          
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl">
            Master the Skills of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-violet-100">
              Tomorrow, Today.
            </span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg text-violet-200 sm:text-xl">
            Join RiseUp Academy to unlock world-class interactive courses, hands-on assignments, and expert mentorship. Take control of your career right now.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-14 rounded-full bg-white px-8 text-base font-bold text-violet-950 transition-transform hover:scale-105 hover:bg-gray-100 shadow-xl shadow-violet-900/20" asChild>
              <Link href="/register">
                Start Learning for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-full border-violet-600 bg-violet-900/30 px-8 text-base font-bold text-white backdrop-blur-sm hover:bg-violet-800" asChild>
              <Link href="/courses">
                <PlayCircle className="mr-2 h-5 w-5" /> Explore Courses
              </Link>
            </Button>
          </div>
          
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-violet-300">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-violet-950 bg-violet-400 opacity-80" />
              ))}
            </div>
            <p className="ml-2">Trusted by <span className="font-bold text-white">10,000+</span> students globally</p>
          </div>
        </div>
      </section>

      {/* PLATFORM STATS */}
      <section className="border-b border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-8 text-center lg:grid-cols-4">
            <div className="mx-auto flex max-w-xs flex-col gap-y-2">
              <dt className="text-base leading-7 text-gray-600">Active Students</dt>
              <dd className="order-first text-3xl font-extrabold tracking-tight text-violet-900 sm:text-4xl">10k+</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-2">
              <dt className="text-base leading-7 text-gray-600">Expert Instructors</dt>
              <dd className="order-first text-3xl font-extrabold tracking-tight text-violet-900 sm:text-4xl">50+</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-2">
              <dt className="text-base leading-7 text-gray-600">Video Lectures</dt>
              <dd className="order-first text-3xl font-extrabold tracking-tight text-violet-900 sm:text-4xl">1,200+</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-2">
              <dt className="text-base leading-7 text-gray-600">Success Rate</dt>
              <dd className="order-first text-3xl font-extrabold tracking-tight text-violet-900 sm:text-4xl">94%</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* VALUE PROPOSITION (FEATURES) */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-violet-700">Why RiseUp Academy?</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to succeed
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              A fully integrated Learning Management System designed to take you from beginner to professional with ease.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                    <LayoutDashboard className="h-6 w-6 text-violet-700" aria-hidden="true" />
                  </div>
                  Interactive LMS
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Track your progress, take quizzes, and submit assignments all in one beautiful dashboard.</p>
                </dd>
              </div>
              <div className="flex flex-col rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                    <Users className="h-6 w-6 text-violet-700" aria-hidden="true" />
                  </div>
                  Live Classes
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Join live attendance sessions, ask questions in real-time, and get unblocked immediately.</p>
                </dd>
              </div>
              <div className="flex flex-col rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                    <ShieldCheck className="h-6 w-6 text-violet-700" aria-hidden="true" />
                  </div>
                  Verified Certificates
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Earn highly-regarded certificates upon course completion to boost your resume and LinkedIn profile.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* FEATURED COURSES (MOCK) */}
      <section className="bg-gray-100 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between sm:flex-row">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Popular Courses</h2>
              <p className="mt-2 text-lg text-gray-600">Hand-picked by our expert instructors.</p>
            </div>
            <Button variant="ghost" className="mt-4 text-violet-700 hover:text-violet-900 sm:mt-0" asChild>
              <Link href="/courses">View all courses <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          
          <div className="mx-auto mt-12 grid max-w-md grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {/* Mock Course Card 1 */}
            <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-lg">
              <div className="h-48 w-full bg-violet-200 bg-[url('https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center" />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="font-semibold text-violet-700">Web Development</span>
                  <div className="flex items-center text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="ml-1 text-gray-700">4.9</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">React & Next.js Masterclass</h3>
                <p className="mb-6 flex-1 text-sm text-gray-600 line-clamp-2">Learn to build production-ready applications from scratch with modern React 18 and Next.js App Router.</p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-lg font-bold text-gray-900">$49.00</span>
                  <Button size="sm" className="rounded-full" asChild><Link href="/courses/mock-id">Enroll</Link></Button>
                </div>
              </div>
            </div>

            {/* Mock Course Card 2 */}
            <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-lg">
              <div className="h-48 w-full bg-blue-200 bg-[url('https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center" />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="font-semibold text-violet-700">Backend Systems</span>
                  <div className="flex items-center text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="ml-1 text-gray-700">4.8</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Node.js API Development</h3>
                <p className="mb-6 flex-1 text-sm text-gray-600 line-clamp-2">Master backend architectures, authentication, PostgreSQL with Prisma, and scalable APIs.</p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-lg font-bold text-gray-900">Free</span>
                  <Button size="sm" className="rounded-full" asChild><Link href="/courses/mock-id">Enroll</Link></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-violet-900 py-16 px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to elevate your career?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-violet-200">
            Join thousands of students who have transformed their professional lives through our interactive academy.
          </p>
          <div className="mt-8">
            <Button size="lg" className="h-14 rounded-full bg-white px-10 text-lg font-bold text-violet-950 hover:bg-gray-100" asChild>
              <Link href="/register">Join RiseUp Today</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}