"use client";

import { useEffect, useState } from "react";
import { PipelineBoard } from "@/components/app/PipelineBoard";
import { SlideOver } from "@/components/app/SlideOver";
import { Button } from "@/components/ui/Button";
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

const STAGE_LABELS: Record<Stage, string> = {
  identified: "Identified",
  contacted: "Contacted",
  responded: "Responded",
  chatted: "Chatted",
  applied: "Applied",
  interviewing: "Interviewing",
};

function formatActionDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PipelineView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

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
    const contact = contacts.find((c) => c.id === id);
    if (contact) {
      setSelectedContact(contact);
    }
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
    <>
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

      <SlideOver
        isOpen={selectedContact !== null}
        onClose={() => setSelectedContact(null)}
        title={selectedContact?.name ?? "Contact details"}
      >
        {selectedContact && (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                Company
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {selectedContact.company}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border-card bg-surface p-4">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                  Stage
                </p>
                <p className="mt-2 text-sm font-semibold text-text-primary">
                  {STAGE_LABELS[selectedContact.stage]}
                </p>
              </div>
              <div className="rounded-xl border border-border-card bg-surface p-4">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                  Confidence
                </p>
                <p className="mt-2 text-sm font-semibold capitalize text-text-primary">
                  {selectedContact.confidence}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                Last action
              </p>
              <p className="mt-1 text-sm text-text-body">
                {formatActionDate(selectedContact.lastActionAt)}
              </p>
            </div>

            <div className="rounded-xl border border-border-card bg-surface-alt p-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                Next step
              </p>
              <p className="mt-2 text-sm text-text-body">
                Drag this contact to another stage when the outreach status
                changes. Drafts and research notes open from the search result
                view.
              </p>
            </div>

            <Button type="button" onClick={() => setSelectedContact(null)}>
              Close
            </Button>
          </div>
        )}
      </SlideOver>
    </>
  );
}
