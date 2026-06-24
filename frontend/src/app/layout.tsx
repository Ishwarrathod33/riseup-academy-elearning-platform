/**
 * Font CSS first (Webpack resolves packages), then Tailwind globals — avoids broken @import without postcss-import.
 */
import "./globals.css";
import "@fontsource-variable/inter/wght.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";


import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { AppNavbar, SiteFooter } from "@/features/layout";

export const metadata: Metadata = {
  title: "RiseUp Academy — The Peak of Learning",
  description:
    "Online learning for English, Math, Science, Biology & competitive exams — live classes, smart quizzes, and expert teachers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <AppNavbar />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
