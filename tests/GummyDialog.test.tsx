import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  GummyDialog,
  GummyDialogBackdrop,
  GummyDialogClose,
  GummyDialogDescription,
  GummyDialogPopup,
  GummyDialogPortal,
  GummyDialogTitle,
  GummyDialogTrigger,
  GummyDialogViewport,
} from "../app/components/ui/GummyDialog";

afterEach(cleanup);

function ExampleDialog() {
  return (
    <GummyDialog>
      <GummyDialogTrigger>Archive project</GummyDialogTrigger>
      <GummyDialogPortal>
        <GummyDialogBackdrop />
        <GummyDialogViewport>
          <GummyDialogPopup>
            <GummyDialogTitle>Archive project?</GummyDialogTitle>
            <GummyDialogDescription>You can restore it later.</GummyDialogDescription>
            <GummyDialogClose>Keep project</GummyDialogClose>
            <GummyDialogClose>Archive</GummyDialogClose>
          </GummyDialogPopup>
        </GummyDialogViewport>
      </GummyDialogPortal>
    </GummyDialog>
  );
}

describe("GummyDialog", () => {
  it("opens a labelled modal and moves focus inside", async () => {
    const user = userEvent.setup();
    render(<ExampleDialog />);

    await user.click(screen.getByRole("button", { name: "Archive project" }));
    const dialog = await screen.findByRole("dialog", { name: "Archive project?" });
    expect(dialog).toHaveAccessibleDescription("You can restore it later.");
    expect(screen.getByRole("button", { name: "Keep project" })).toHaveFocus();
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<ExampleDialog />);

    const trigger = screen.getByRole("button", { name: "Archive project" });
    await user.click(trigger);
    await screen.findByRole("dialog", { name: "Archive project?" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("closes from an explicit close action", async () => {
    const user = userEvent.setup();
    render(<ExampleDialog />);

    await user.click(screen.getByRole("button", { name: "Archive project" }));
    await user.click(await screen.findByRole("button", { name: "Keep project" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
