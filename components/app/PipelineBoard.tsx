"use client";

import { PipelineCard } from "./PipelineCard";
import { cn } from "@/lib/utils/cn";

type Stage = "identified" | "contacted" | "responded" | "chatted" | "applied" | "interviewing";

const STAGES: { id: Stage; label: string }[] = [
  { id: "identified", label: "Identified" },
  { id: "contacted", label: "Contacted" },
  { id: "responded", label: "Responded" },
  { id: "chatted", label: "Chatted" },
  { id: "applied", label: "Applied" },
  { id: "interviewing", label: "Interviewing" },
];

interface Contact {
  id: string;
  name: string;
  company: string;
  confidence: "high" | "medium" | "low";
  lastActionAt: string;
  stage: Stage;
}

interface PipelineBoardProps {
  contacts: Contact[];
  onContactClick: (id: string) => void;
}

export function PipelineBoard({ contacts, onContactClick }: PipelineBoardProps) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-10 min-h-[600px] scrollbar-thin scrollbar-thumb-border">
      {STAGES.map((stage) => {
        const stageContacts = contacts.filter((c) => c.stage === stage.id);
        
        return (
          <div key={stage.id} className="flex-shrink-0 w-72 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-[11px] font-mono font-bold text-text-muted uppercase tracking-[0.2em]">
                // {stage.label} \\
              </h3>
              <span className="text-[10px] font-mono font-bold text-text-light bg-surface-alt px-2 py-0.5 rounded border border-border-card">
                {stageContacts.length}
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-3 p-2 bg-surface-alt/30 border border-border-card/50 rounded-xl min-h-[200px]">
              {stageContacts.map((contact) => (
                <PipelineCard 
                  key={contact.id} 
                  contact={contact} 
                  onClick={() => onContactClick(contact.id)}
                />
              ))}
              
              {stageContacts.length === 0 && (
                <div className="flex-1 flex items-center justify-center border border-dashed border-border-card rounded-lg opacity-40">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Empty_Buffer</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
