import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { sourceSerif, jetbrainsMono, dmSans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Korvo — Job Outreach Engine",
  description:
    "A technical outreach engine that finds the right people and drafts emails worth reading.",
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
        <Toaster />
      </body>
    </html>
  );
}
