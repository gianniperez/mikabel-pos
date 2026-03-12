import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Input } from "./Input";

describe("Input Component", () => {
  it("renders correctly", () => {
    const { container } = render(<Input />);
    expect(container).toBeInTheDocument();
  });
});
