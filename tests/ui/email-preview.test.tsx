import { describe, expect, it } from "vitest";
import { render, screen } from "@/tests/utils";
import { DemoCard } from "@/components/marketing/DemoCard";

describe("Email preview / demo card", () => {
  it("renders pipeline output and email preview labels", () => {
    render(<DemoCard />);

    expect(screen.getByText("Pipeline Output")).toBeInTheDocument();
    expect(screen.getByText("Email Preview")).toBeInTheDocument();
    expect(screen.getByText("Structured Response")).toBeInTheDocument();
  });
});
