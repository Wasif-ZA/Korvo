import { cn } from "@/lib/utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  highlighted?: boolean;
}

export function Card({ className, highlighted = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-[#E5E4E0] rounded-xl p-8 transition-all duration-200",
        "hover:translate-y-[-2px] hover:border-[#D5D4D0]",
        highlighted && "border-teal-600/30 border-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
