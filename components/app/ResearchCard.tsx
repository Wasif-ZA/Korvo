import { Card } from "@/components/ui/Card";

interface ResearchCardProps {
  background?: string | null;
  askThis?: string | null;
  mentionThis?: string | null;
}

const EMPTY = "No research note available yet.";

export function ResearchCard({
  background,
  askThis,
  mentionThis,
}: ResearchCardProps) {
  const rows = [
    ["Background", background ?? EMPTY],
    ["Ask This", askThis ?? EMPTY],
    ["Mention This", mentionThis ?? EMPTY],
  ];

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-accent">
          Research
        </span>
        <div className="h-px flex-1 bg-border-card" />
      </div>
      <div className="space-y-4">
        {rows.map(([label, value]) => (
          <div key={label} className="space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-text-muted">
              {label}
            </p>
            <p className="text-sm leading-relaxed text-text-body">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
