import posthog from "posthog-js";

export function register() {
  if (typeof window !== "undefined") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      ui_host: "https://app.posthog.com",
      capture_pageview: "history_change",
      capture_exceptions: false,
      respect_dnt: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") {
          ph.debug();
        }
      },
    });
  }
}
