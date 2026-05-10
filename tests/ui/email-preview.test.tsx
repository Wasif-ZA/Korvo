import { describe, expect, it } from "vitest";
import { render, screen } from "@/tests/utils";
import { DemoCard } from "@/components/marketing/DemoCard";

describe("Email preview / demo card", () => {
  it("renders pipeline output and email preview labels", () => {
    render(<DemoCard />);

    expect(screen.getByText("PIPELINE_OUTPUT")).toBeInTheDocument();
    expect(screen.getByText("PAYLOAD_STABLE")).toBeInTheDocument();
    expect(screen.getByText("STRUCTURED_LOG")).toBeInTheDocument();
  });
});
