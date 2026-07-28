import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RegistrySourceViewer } from "../app/components/RegistrySourceViewer";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("registry source viewer", () => {
  it("keeps registry payloads off the initial request and loads on demand", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Button",
        files: [
          {
            path: "components/GummyButton.tsx",
            type: "registry:ui",
            content: "export function GummyButton() {}",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<RegistrySourceViewer registryName="gummy-button" />);

    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Load editable source" }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/r/gummy-button.json",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(
      await screen.findByRole("tabpanel", {
        name: "components/GummyButton.tsx",
      }),
    ).toHaveTextContent("export function GummyButton() {}");
  });
});
