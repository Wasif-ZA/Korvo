import { Card } from "@/components/ui/Card";

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="max-w-[420px] w-full p-10 mx-auto bg-surface border-border-card rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col items-center mb-8">
        <span className="text-2xl font-bold font-sans tracking-tight text-text-primary">
          Korvo
        </span>
      </div>
      {children}
    </Card>
  );
}
