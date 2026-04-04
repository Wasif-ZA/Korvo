"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { PipelineColumn } from "./PipelineColumn";
import { PipelineCard } from "./PipelineCard";
import { StageSelector } from "./StageSelector";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { track } from "@/lib/analytics/track";

type Stage =
  | "identified"
  | "contacted"
  | "responded"
  | "chatted"
  | "applied"
  | "interviewing";

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
  onContactMove: (id: string, newStage: Stage) => void;
}

export function PipelineBoard({
  contacts,
  onContactClick,
  onContactMove,
}: PipelineBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveContact(active.data.current as Contact);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const newStage = over.id as Stage;
      const contactId = active.id as string;
      const dragged = active.data.current as Contact | undefined;

      // Check if it's a valid stage drop
      if (STAGES.some((s) => s.id === newStage)) {
        // Fire pipeline_stage_change event (MON-01/MON-03)
        if (dragged) {
          track("pipeline_stage_change", {
            contact_id: contactId,
            from_stage: dragged.stage,
            to_stage: newStage,
          });
        }
        onContactMove(contactId, newStage);
      }
    }

    setActiveId(null);
    setActiveContact(null);
  }

  return (
    <>
      {/* Mobile list view: visible below md breakpoint */}
      <div className="md:hidden space-y-3">
        {STAGES.map((stage) => {
          const stageContacts = contacts.filter((c) => c.stage === stage.id);
          if (stageContacts.length === 0) return null;
          return (
            <div key={stage.id} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">
                  {stage.label}
                </span>
                <span className="text-[10px] font-mono text-text-light bg-surface-alt border border-border-card px-1.5 py-0.5 rounded-full">
                  {stageContacts.length}
                </span>
              </div>
              {stageContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-surface border border-border-card rounded-xl shadow-sm"
                >
                  <button
                    onClick={() => onContactClick(contact.id)}
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                  >
                    <ConfidenceBadge
                      confidence={contact.confidence}
                      showLabel={false}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {contact.name}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-text-muted uppercase truncate">
                        {contact.company}
                      </p>
                    </div>
                  </button>
                  <StageSelector
                    currentStage={contact.stage}
                    contactId={contact.id}
                    onStageChange={(id, newStage) =>
                      onContactMove(id, newStage as Stage)
                    }
                  />
                </div>
              ))}
            </div>
          );
        })}
        {contacts.length === 0 && (
          <p className="text-center text-sm text-text-muted italic py-8 font-mono uppercase tracking-widest">
            No_Contacts_Yet
          </p>
        )}
      </div>

      {/* Desktop Kanban view: visible from md breakpoint */}
      <div className="hidden md:flex gap-6 overflow-x-auto pb-10 min-h-[600px] scrollbar-thin scrollbar-thumb-border-card/60 scrollbar-track-transparent">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {STAGES.map((stage) => {
            const stageContacts = contacts.filter((c) => c.stage === stage.id);

            return (
              <PipelineColumn
                key={stage.id}
                id={stage.id}
                label={stage.label}
                count={stageContacts.length}
              >
                {stageContacts.map((contact) => (
                  <PipelineCard
                    key={contact.id}
                    contact={contact}
                    onClick={() => onContactClick(contact.id)}
                  />
                ))}
              </PipelineColumn>
            );
          })}

          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: "0.5",
                  },
                },
              }),
            }}
          >
            {activeId && activeContact ? (
              <PipelineCard contact={activeContact} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}
