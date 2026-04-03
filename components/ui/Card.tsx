import { cn } from "@/lib/utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  highlighted?: boolean;
}

export function Card({ className, highlighted = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface border transition-all duration-150 p-6 md:p-8",
        highlighted
          ? "border-accent ring-1 ring-accent/20 shadow-md"
          : "border-border-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-text-light",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
