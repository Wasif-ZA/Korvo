import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { cn } from "@/lib/utils/cn";

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
}

export function PipelineCard({ contact, onClick }: PipelineCardProps) {
  return (
    <Card 
      onClick={onClick}
      className="p-4 bg-surface border-border-card hover:border-accent cursor-pointer transition-all duration-150 group"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
          {contact.name}
        </h4>
        <ConfidenceBadge confidence={contact.confidence} showLabel={false} />
      </div>
      
      <p className="text-xs text-text-body mb-4 truncate">
        {contact.company}
      </p>
      
      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
        <span>{contact.lastActionAt}</span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent">
          View_Details →
        </span>
      </div>
    </Card>
  );
}
