import { NavBar } from "@/components/marketing/NavBar";
import { Footer } from "@/components/marketing/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background selection:bg-accent/20">
      {/* Persistent Dot-Matrix Texture */}
      <div className="fixed inset-0 dot-matrix pointer-events-none z-0" />
      
      <NavBar />
      <main className="flex-1 relative z-10">{children}</main>
      <Footer />
    </div>
  );
}
