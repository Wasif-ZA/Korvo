"use client";

const STAGES = [
  { id: "identified", label: "Identified" },
  { id: "contacted", label: "Contacted" },
  { id: "responded", label: "Responded" },
  { id: "chatted", label: "Chatted" },
  { id: "applied", label: "Applied" },
  { id: "interviewing", label: "Interviewing" },
];

interface StageSelectorProps {
  currentStage: string;
  contactId: string;
  onStageChange: (contactId: string, newStage: string) => void;
}

export function StageSelector({
  currentStage,
  contactId,
  onStageChange,
}: StageSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value;
    if (newStage !== currentStage) {
      onStageChange(contactId, newStage);
    }
  };

  return (
    <select
      value={currentStage}
      onChange={handleChange}
      className="md:hidden bg-surface border border-border-card rounded-md text-text-primary font-sans text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer"
    >
      {STAGES.map((stage) => (
        <option key={stage.id} value={stage.id}>
          {stage.label}
        </option>
      ))}
    </select>
  );
}
