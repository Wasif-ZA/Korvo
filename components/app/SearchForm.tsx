"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search as SearchIcon, ArrowRight } from "lucide-react";

interface SearchFormProps {
  onStart: (company: string, role: string) => void;
  isLoading: boolean;
  creditsRemaining: number;
}

export function SearchForm({ onStart, isLoading, creditsRemaining }: SearchFormProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !role) return;
    onStart(company, role);
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-text-primary mb-2">
          Start a <span className="italic-accent">new search</span>
        </h1>
        <p className="text-text-body">
          Enter a company name and target role. Korvo handles the rest.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">Company</label>
            <Input
              placeholder="e.g. Canva"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">Target Role</label>
            <Input
              placeholder="e.g. Junior SWE"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
          <p className="text-sm text-text-muted flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Using <span className="font-bold text-text-primary">1 credit</span> of your monthly allowance ({creditsRemaining} remaining)
          </p>
          
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto min-w-[200px]"
            isLoading={isLoading}
          >
            Run Pipeline
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
