import Link from "next/link";
import { Youtube, Instagram } from "lucide-react";
import { BrandMark } from "./BrandMark";

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-violet-700 transition hover:border-violet-200 hover:bg-violet-50"
    >
      {children}
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 md:py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <BrandMark variant="footer" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Expert-led classes, practice, and outcomes you can trust.
            </p>
            <div className="mt-6 flex gap-3">
              <SocialIcon href="https://youtube.com/@riseupacademy-v9o?si=tT2KHR09YJLiH-76" label="YouTube">
                <Youtube className="h-5 w-5" />
              </SocialIcon>
              <SocialIcon href="https://www.instagram.com/rise_up_academy1?igsh=NW1mN3l1dzVyZzc5" label="Instagram">
                <Instagram className="h-5 w-5" />
              </SocialIcon>
              <SocialIcon href="https://x.com" label="X (Twitter)">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          <div className="md:col-span-3 md:col-start-6">
            <div className="text-sm font-bold text-gray-900">Quick links</div>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition hover:text-violet-700">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/courses" className="transition hover:text-violet-700">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-violet-700">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="text-sm font-bold text-gray-900">Contact</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Jamner, Maharashtra, India</li>
              <li>
                <a href="tel:7030809361" className="transition hover:text-violet-700">
                  7030809361
                </a>
              </li>
              <li>
                <a href="mailto:riseupacademy042@gmail.com" className="transition hover:text-violet-700">
                  riseupacademy042@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        © {new Date().getFullYear()} RiseUp Academy. All rights reserved.
      </div>
    </footer>
  );
}
