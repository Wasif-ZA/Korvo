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
    <div className="flex flex-col gap-1">
      <input
        className={cn(
          "w-full rounded-lg border border-[#E5E4E0] bg-white px-4 text-[#1C1C1A]",
          "placeholder:text-gray-400",
          "transition-colors duration-150 ease-in-out",
          "focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/50",
          heroVariant ? "h-[52px] text-base" : "h-11 text-sm",
          error && "border-red-600 focus:border-red-600 focus:ring-red-600/50",
          disabled && "bg-[#F4F3F0] cursor-not-allowed opacity-60",
          className
        )}
        disabled={disabled}
        {...props}
      />
      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
