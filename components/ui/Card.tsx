import { cn } from "@/lib/utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  highlighted?: boolean;
}

export function Card({ className, highlighted = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-6 shadow-sm",
        highlighted
          ? "border-2 border-teal-600 bg-white"
          : "bg-[#F4F3F0] border border-[#E5E4E0]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
