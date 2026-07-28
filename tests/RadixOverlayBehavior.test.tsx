import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { RadixComponentInspector } from "../app/components/RadixComponentInspectorRuntime";

afterEach(cleanup);

const originalResizeObserver = globalThis.ResizeObserver;
const originalHasPointerCapture = Element.prototype.hasPointerCapture;
const originalSetPointerCapture = Element.prototype.setPointerCapture;
const originalReleasePointerCapture = Element.prototype.releasePointerCapture;
const originalScrollIntoView = Element.prototype.scrollIntoView;

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

afterAll(() => {
  globalThis.ResizeObserver = originalResizeObserver;
  Element.prototype.hasPointerCapture = originalHasPointerCapture;
  Element.prototype.setPointerCapture = originalSetPointerCapture;
  Element.prototype.releasePointerCapture = originalReleasePointerCapture;
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

function renderPreview(slug: string, componentName: string) {
  render(
    <main>
      <h1>{componentName}</h1>
      <RadixComponentInspector
        slug={slug}
        componentName={componentName}
      />
    </main>,
  );
}

describe("Radix overlay and menu behavior", () => {
  it.each([
    ["alert-dialog", "Alert Dialog", "Delete draft", "alertdialog"],
    ["dialog", "Dialog", "Open release", "dialog"],
    ["drawer", "Drawer", "Open drawer", "dialog"],
    ["sheet", "Sheet", "Open settings", "dialog"],
  ])(
    "%s opens a labelled modal and closes with Escape",
    async (slug, componentName, triggerName, role) => {
      const user = userEvent.setup();
      renderPreview(slug, componentName);
      const trigger = screen.getByRole("button", { name: triggerName });
      await user.click(trigger);
      expect(await screen.findByRole(role)).toBeVisible();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole(role)).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
    },
  );

  it("opens dropdown and menubar commands with keyboard-ready menu roles", async () => {
    const user = userEvent.setup();
    renderPreview("dropdown-menu", "Dropdown Menu");
    await user.click(screen.getByRole("button", { name: "Project actions" }));
    expect(await screen.findByRole("menu")).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeVisible();
    cleanup();

    renderPreview("menubar", "Menubar");
    await user.click(screen.getByRole("menuitem", { name: "File" }));
    expect(await screen.findByRole("menu")).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "New release" })).toBeVisible();
  });

  it("opens context-menu commands from a genuine context event", async () => {
    renderPreview("context-menu", "Context Menu");
    fireEvent.contextMenu(screen.getByText("Right-click for project actions"));
    expect(await screen.findByRole("menu")).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Edit project" })).toBeVisible();
  });

  it("opens popover, hover-card, select, tooltip, and toast content", async () => {
    const user = userEvent.setup();
    renderPreview("popover", "Popover");
    await user.click(screen.getByRole("button", { name: "Workspace details" }));
    expect(await screen.findByText("Three active projects.")).toBeVisible();
    cleanup();

    renderPreview("hover-card", "Hover Card");
    await user.hover(screen.getByRole("link", { name: "Gummy UI catalogue" }));
    expect(await screen.findByText("57 editable component categories.")).toBeVisible();
    cleanup();

    renderPreview("select", "Select");
    await user.click(screen.getByRole("combobox", {
      name: "Raspberry, accent fruit",
    }));
    expect(await screen.findByRole("listbox")).toBeVisible();
    expect(screen.getByRole("option", { name: "Grape" })).toBeVisible();
    cleanup();

    renderPreview("tooltip", "Tooltip");
    await user.hover(screen.getByRole("button", { name: "Archive" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Archive project");
    cleanup();

    renderPreview("sonner", "Sonner");
    await user.click(screen.getByRole("button", { name: "Show notification" }));
    expect(await screen.findByText("Release published")).toBeVisible();
  });
});
