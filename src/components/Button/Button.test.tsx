import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "./Button";

describe("Button Component", () => {
  it("renders correctly", () => {
    const { container } = render(<Button>Test</Button>);
    expect(container).toBeInTheDocument();
  });
});
