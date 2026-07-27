import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { within } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeBuilder } from "../app/components/ThemeBuilder";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

describe("ThemeBuilder", () => {
  it("covers the complete theme contract and exports both colour modes", () => {
    render(<ThemeBuilder />);

    expect(screen.getByRole("group", { name: "Edit colour mode" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Edit colour mode" }).querySelectorAll("button")).toHaveLength(2);
    expect(screen.getByLabelText("Interface family")).toBeInTheDocument();
    expect(screen.getByLabelText("Type scale")).toBeInTheDocument();
    expect(screen.getByLabelText("Shape")).toBeInTheDocument();
    expect(screen.getByLabelText("Border")).toBeInTheDocument();
    expect(screen.getByLabelText("Shadow")).toBeInTheDocument();
    expect(screen.getByLabelText("Canvas pattern")).toBeInTheDocument();
    expect(screen.getByLabelText("Pattern opacity")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Five-colour chart palette preview" })).toBeInTheDocument();

    const output = screen.getByLabelText("Installable CSS theme").parentElement?.querySelector("pre");
    expect(output).toHaveTextContent(':root[data-theme="dark"]');
    expect(output).toHaveTextContent("--gummy-font-interface");
    expect(output).toHaveTextContent("--gummy-radius-scale");
    expect(output).toHaveTextContent("--gummy-border-width");
    expect(output).toHaveTextContent("--gummy-shadow-strength");
    expect(output).toHaveTextContent("--gummy-pattern");
    expect(output).toHaveTextContent("--chart-5");
  });

  it("updates the selected mode without changing the other mode", () => {
    render(<ThemeBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "dark" }));
    const darkCanvas = within(screen.getByRole("group", { name: "dark colours" }))
      .getAllByDisplayValue("#24142c")[0] as HTMLInputElement;
    fireEvent.change(darkCanvas, { target: { value: "#101827" } });

    const output = screen.getByLabelText("Installable CSS theme").parentElement?.querySelector("pre");
    expect(output).toHaveTextContent("#101827");
    expect(output).toHaveTextContent("#fffaf1");
    expect(screen.getByLabelText("dark theme preview")).toBeInTheDocument();
  });

  it("copies a shareable configuration into the URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<ThemeBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Copy share link" }));

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(new URL(writeText.mock.calls[0][0]).searchParams.get("theme")).toBeTruthy();
  });
});
