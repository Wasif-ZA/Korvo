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
    <div className="flex flex-col gap-1.5 w-full">
      <input
        className={cn(
          "w-full bg-[#FAFAF8] border border-[#E5E4E0] rounded-lg px-4 py-3 text-[#1C1C1A] text-sm transition-all duration-150",
          "placeholder:text-[#9B9B98]",
          "focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20",
          heroVariant && "py-3.5 text-base px-5",
          error && "border-red-600 focus:border-red-600",
          disabled && "opacity-50 cursor-not-allowed bg-[#F4F3F0]",
          className
        )}
        disabled={disabled}
        {...props}
      />
      {error && (
        <span className="text-red-600 text-xs px-1 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
