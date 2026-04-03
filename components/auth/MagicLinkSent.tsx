import { Button } from "@/components/ui/Button";

export function MagicLinkSent() {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-accent-bg rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-serif font-semibold text-text-primary">
          Check your email
        </h1>
        <p className="text-text-body text-sm leading-relaxed">
          We&apos;ve sent a magic link to your email address. Click the link to sign in to your account.
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => window.location.reload()}
      >
        Didn&apos;t get the email? Try again
      </Button>
    </div>
  );
}
