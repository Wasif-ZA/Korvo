import { cn } from "@/lib/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  heroVariant?: boolean;
}

export function Input({
  className,
  error,
  heroVariant = false,
  disabled,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <input
        className={cn(
          "w-full bg-surface border border-border-card rounded-lg px-4 text-text-body transition-all duration-150 placeholder:text-text-light font-sans",
          "focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none",
          heroVariant ? "h-[52px]" : "h-11",
          error && "border-error focus:border-error focus:ring-error/20",
          disabled && "opacity-50 cursor-not-allowed bg-surface-alt",
          className
        )}
        disabled={disabled}
        {...props}
      />
      {error && (
        <span className="text-error text-[13px] font-sans" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
