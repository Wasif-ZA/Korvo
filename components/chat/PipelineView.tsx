"use client";

import { useEffect, useState } from "react";
import { PipelineBoard } from "@/components/app/PipelineBoard";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

type Stage =
  | "identified"
  | "contacted"
  | "responded"
  | "chatted"
  | "applied"
  | "interviewing";

interface Contact {
  id: string;
  name: string;
  company: string;
  confidence: "high" | "medium" | "low";
  lastActionAt: string;
  stage: Stage;
}

export function PipelineView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pipeline")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setContacts(data.data);
        }
      })
      .catch(() => {
        toast.error("Failed to load pipeline");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleContactClick = (id: string) => {
    // Could open a detail modal in the future
    console.log("Contact clicked:", id);
  };

  const handleContactMove = async (id: string, newStage: Stage) => {
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: newStage } : c)),
    );

    try {
      const res = await fetch(`/api/contacts/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        throw new Error("Failed to update stage");
      }
    } catch {
      toast.error("Failed to update stage");
      // Revert by re-fetching
      fetch("/api/pipeline")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setContacts(data.data);
        });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[13px] font-mono uppercase tracking-wider">
            Loading pipeline...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary font-serif">
          Outreach Pipeline
        </h2>
        <p className="text-[13px] text-text-muted mt-1">
          Track and manage your networking contacts through each stage.
        </p>
      </div>

      <PipelineBoard
        contacts={contacts}
        onContactClick={handleContactClick}
        onContactMove={handleContactMove}
      />
    </div>
  );
}
