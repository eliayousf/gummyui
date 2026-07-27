import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GummyFrameStudio } from "../app/components/GummyFrameStudio";

beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:gummy-local-preview"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("GummyFrameStudio", () => {
  it("starts without any upload or network action", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<GummyFrameStudio />);

    expect(screen.getByRole("region", { name: "Frame preview" })).toHaveTextContent("Your image stays here.");
    expect(screen.getByRole("button", { name: "Export PNG" })).toBeDisabled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("previews a supported image through a browser object URL", () => {
    render(<GummyFrameStudio />);
    const file = new File(["local-bytes"], "release.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText(/Local image/), { target: { files: [file] } });

    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByRole("img", { name: "Local frame preview" })).toHaveAttribute(
      "src",
      "blob:gummy-local-preview",
    );
    expect(screen.getByRole("status", { name: "Studio status" })).toHaveTextContent("remains on this device");
    expect(screen.getByRole("button", { name: "Export PNG" })).toBeEnabled();
  });

  it("rejects unsupported formats before preview", () => {
    render(<GummyFrameStudio />);
    const file = new File(["local-bytes"], "vector.svg", { type: "image/svg+xml" });
    fireEvent.change(screen.getByLabelText(/Local image/), { target: { files: [file] } });

    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByRole("status", { name: "Studio status" })).toHaveTextContent("not supported");
  });
});
