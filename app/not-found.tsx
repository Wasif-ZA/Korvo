import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="fixed inset-0 dot-matrix pointer-events-none z-0" />
      
      <div className="max-w-md w-full text-center relative z-10">
        <div className="mb-8">
          <span className="text-[12px] font-mono font-bold text-accent uppercase tracking-[0.3em]">
            // Error 404 \\
          </span>
          <h1 className="text-4xl md:text-5xl mt-4 mb-6">
            Node <span className="italic-accent">Not Found</span>
          </h1>
          <p className="text-text-body text-lg leading-relaxed mb-10">
            The resource you are looking for has been moved or does not exist in the current pipeline.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className={buttonVariants({ variant: "primary" })}>
            Return to Base
          </Link>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

