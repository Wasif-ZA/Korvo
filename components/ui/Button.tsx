import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150 ease-in-out h-11 px-4 active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "font-sans text-sm",
  ],
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
        outline:
          "bg-transparent text-text-body border border-border hover:border-text-muted hover:bg-accent-bg",
        ghost:
          "bg-transparent text-text-muted hover:text-accent hover:bg-accent-bg",
        destructive: "bg-error text-white hover:bg-red-700 shadow-sm",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
