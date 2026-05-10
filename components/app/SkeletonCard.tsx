import { Card } from "@/components/ui/Card";

export function SkeletonCard() {
  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-5 w-40 rounded bg-border/30" />
          <div className="h-4 w-56 rounded bg-border/20" />
        </div>
        <div className="h-6 w-20 rounded-full bg-border/20" />
      </div>
      <div className="h-16 rounded-xl bg-border/20" />
      <div className="flex gap-3">
        <div className="h-9 w-32 rounded bg-border/25" />
        <div className="h-9 w-24 rounded bg-border/20" />
      </div>
    </Card>
  );
}
