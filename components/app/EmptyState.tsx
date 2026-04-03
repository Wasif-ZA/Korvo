import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface border border-dashed border-border-card rounded-2xl">
      <div className="w-16 h-16 bg-accent-bg rounded-full flex items-center justify-center mb-8">
        <Search className="w-8 h-8 text-accent" />
      </div>

      <h3 className="text-2xl font-serif font-semibold text-text-primary mb-3">
        No contacts yet
      </h3>
      <p className="text-text-body max-w-sm mx-auto mb-10 leading-relaxed">
        Run your first search to start building your outreach pipeline.
      </p>

      <Link href="/search">
        <Button variant="primary" size="lg" className="min-w-[200px]">
          Start a Search
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}
