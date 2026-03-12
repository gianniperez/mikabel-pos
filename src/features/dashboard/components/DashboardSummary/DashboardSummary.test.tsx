import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DashboardSummary } from "./DashboardSummary";

describe("DashboardSummary Component", () => {
  it("renders correctly", () => {
    const { container } = render(<DashboardSummary />);
    expect(container).toBeInTheDocument();
  });
});
