"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchForm } from "@/components/app/SearchForm";
import { PipelineTracker } from "@/components/app/PipelineTracker";
import { toast } from "react-hot-toast";

type StepStatus = "pending" | "running" | "complete" | "failed";

interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

const INITIAL_STEPS: PipelineStep[] = [
  { id: "contacts", label: "Finding Contacts", status: "pending", detail: "Scanning Apollo & LinkedIn" },
  { id: "emails", label: "Guessing Emails", status: "pending", detail: "Pattern matching & validation" },
  { id: "hooks", label: "Researching Hooks", status: "pending", detail: "Firecrawl activity analysis" },
  { id: "drafts", label: "Drafting Emails", status: "pending", detail: "Tone-calibrated generation" },
];

export default function SearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [credits, setCredits] = useState(5);
  const router = useRouter();

  // Load initial credits
  useEffect(() => {
    async function fetchCredits() {
      const res = await fetch("/api/user/usage");
      if (res.ok) {
        const data = await res.json();
        setCredits(data.limit - data.used);
      }
    }
    fetchCredits();
  }, []);

  const startPipeline = async (company: string, role: string) => {
    setIsSearching(true);
    setSteps(INITIAL_STEPS);

    try {
      const res = await fetch("/api/pipeline/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to start pipeline");
      }

      const { jobId } = await res.json();
      setJobId(jobId);
    } catch (error: any) {
      toast.error(error.message);
      setIsSearching(false);
    }
  };

  // Poll for status
  useEffect(() => {
    if (!jobId || !isSearching) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pipeline/status/${jobId}`);
        if (!res.ok) return;

        const data = await res.json();
        
        // Update steps based on data.steps
        if (data.steps) {
          setSteps(data.steps);
        }

        if (data.status === "complete") {
          setIsSearching(false);
          setJobId(null);
          toast.success("Pipeline completed successfully!");
          router.push(`/search/${jobId}`);
        } else if (data.status === "failed") {
          setIsSearching(false);
          setJobId(null);
          toast.error("Pipeline execution failed.");
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, isSearching, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {!isSearching ? (
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SearchForm 
            onStart={startPipeline} 
            isLoading={false} 
            creditsRemaining={credits} 
          />
        </div>
      ) : (
        <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">
          <PipelineTracker steps={steps} />
        </div>
      )}
    </div>
  );
}
