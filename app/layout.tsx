import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { sourceSerif, jetbrainsMono, dmSans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Korvo — Conversational Job Outreach Engine",
  description:
    "Find anyone's email, research their background, and draft personalized outreach emails in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${jetbrainsMono.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        {/* Animated Background Grid */}
        <div className="fixed inset-0 grid-bg pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
        <footer className="fixed bottom-0 left-0 right-0 py-2 px-4 flex justify-center gap-4 text-[10px] text-text-muted/60 pointer-events-none z-10">
          <a
            href="/privacy"
            className="pointer-events-auto hover:text-text-secondary transition-colors"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="pointer-events-auto hover:text-text-secondary transition-colors"
          >
            Terms
          </a>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
