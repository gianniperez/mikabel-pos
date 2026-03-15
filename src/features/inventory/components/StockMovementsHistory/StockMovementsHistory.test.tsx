import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StockMovementsHistory } from "./StockMovementsHistory";

describe("StockMovementsHistory Component", () => {
  it("renders correctly", () => {
    const { container } = render(<StockMovementsHistory />);
    expect(container).toBeInTheDocument();
  });
});
