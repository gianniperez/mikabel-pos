import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader Component", () => {
  it("renders correctly", () => {
    const { container } = render(<PageHeader title="Test Title" description="Test Description" />);
    expect(container).toBeInTheDocument();
  });
});
