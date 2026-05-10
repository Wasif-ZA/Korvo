import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "./ConfidenceBadge";

function formatLastAction(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = new Date().getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 14) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

interface Contact {
  id: string;
  name: string;
  company: string;
  confidence: "high" | "medium" | "low";
  lastActionAt: string;
}

interface PipelineCardProps {
  contact: Contact;
  onClick?: () => void;
  isOverlay?: boolean;
}

export function PipelineCard({
  contact,
  onClick,
  isOverlay = false,
}: PipelineCardProps) {
  return (
    <Card
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`View details for ${contact.name}`}
      className={`p-4 bg-surface border-border-card hover:border-accent cursor-pointer transition-all duration-150 group ${isOverlay ? "shadow-lg ring-2 ring-accent/20" : ""}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
          {contact.name}
        </h4>
        <ConfidenceBadge confidence={contact.confidence} showLabel={false} />
      </div>

      <p className="text-xs text-text-body mb-4 truncate">{contact.company}</p>

      <div className="flex items-center justify-between gap-3 text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
        <span className="truncate">
          {formatLastAction(contact.lastActionAt)}
        </span>
        <span className="shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity text-accent">
          View details
        </span>
      </div>
    </Card>
  );
}
