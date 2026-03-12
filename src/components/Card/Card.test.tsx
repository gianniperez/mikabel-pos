import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "./Card";

describe("Card Component", () => {
  it("renders without crashing", () => {
    const { container } = render(<Card>Test Content</Card>);
    expect(container).toBeInTheDocument();
  });
});
