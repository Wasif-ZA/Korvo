"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchForm } from "@/components/app/SearchForm";
import { PipelineTracker } from "@/components/app/PipelineTracker";
import { toast } from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics/track";
import { getOrCreateGuestSessionId } from "@/lib/guest";

type StepStatus = "pending" | "running" | "complete" | "failed";

interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

const INITIAL_STEPS: PipelineStep[] = [
  {
    id: "contacts",
    label: "Finding Contacts",
    status: "pending",
    detail: "Scanning company pages and public profiles",
  },
  {
    id: "emails",
    label: "Guessing Emails",
    status: "pending",
    detail: "Detecting email patterns from public sources",
  },
  {
    id: "hooks",
    label: "Researching Hooks",
    status: "pending",
    detail: "Finding personalization hooks via Firecrawl",
  },
  {
    id: "drafts",
    label: "Drafting Emails",
    status: "pending",
    detail: "Generating tone-calibrated cold emails",
  },
];

export default function SearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  // Store search params so we can fire search_completed when pipeline finishes
  const [searchParams, setSearchParams] = useState<{
    company: string;
    role: string;
    location: string;
  } | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const startPipeline = async (
    company: string,
    role: string,
    location?: string,
  ) => {
    setIsSearching(true);
    // Store params for search_completed event
    setSearchParams({ company, role, location: location ?? "" });
    // Start first step as running immediately
    setSteps(
      INITIAL_STEPS.map((s, i) =>
        i === 0 ? { ...s, status: "running" } : { ...s, status: "pending" },
      ),
    );

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          location,
          guestSessionId: getOrCreateGuestSessionId(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to start pipeline",
        );
      }

      if (data.limitReached === true) {
        throw new Error(data.message || "Search limit reached");
      }

      setSearchId(data.searchId);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Couldn't start the search.";
      toast.error(msg);
      setIsSearching(false);
    }
  };

  // Subscribe to Realtime progress
  useEffect(() => {
    if (!searchId || !isSearching) return;

    const channel = supabase.channel(`search:${searchId}:progress`);

    channel
      .on("broadcast", { event: "stage" }, ({ payload }) => {
        const { stage } = payload;

        setSteps((prev) => {
          const newSteps = [...prev];
          if (stage === "contacts_found") {
            newSteps[0] = { ...newSteps[0], status: "complete" };
            newSteps[1] = { ...newSteps[1], status: "running" };
          } else if (stage === "emails_guessed") {
            newSteps[1] = { ...newSteps[1], status: "complete" };
            newSteps[2] = { ...newSteps[2], status: "running" };
          } else if (stage === "research_done") {
            newSteps[2] = { ...newSteps[2], status: "complete" };
            newSteps[3] = { ...newSteps[3], status: "running" };
          } else if (stage === "drafts_ready") {
            newSteps[3] = { ...newSteps[3], status: "complete" };
          }
          return newSteps;
        });
      })
      .subscribe();

    // Also poll for final completion status
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/search/${searchId}`);
        if (!res.ok) return;

        const data = await res.json();

        if (data.data?.pipeline_status === "complete") {
          setIsSearching(false);
          setSearchId(null);
          // Fire search_completed event with contacts_found count (MON-03 funnel)
          if (searchParams) {
            track("search_completed", {
              company: searchParams.company,
              role: searchParams.role,
              location: searchParams.location,
              contacts_found: data.data?.contacts?.length ?? 0,
            });
          }
          toast.success("Pipeline completed successfully!");
          router.push(`/search/${searchId}`);
        } else if (data.data?.pipeline_status === "failed") {
          setIsSearching(false);
          setSearchId(null);
          toast.error("The search didn't complete. Please try again.");
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [searchId, isSearching, router, supabase, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {!isSearching ? (
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SearchForm
            onStart={startPipeline}
            isLoading={false}
            creditsRemaining={5}
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
