import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GummyDropdownMenu,
  GummyDropdownMenuItem,
  GummyDropdownMenuPopup,
  GummyDropdownMenuPortal,
  GummyDropdownMenuPositioner,
  GummyDropdownMenuSeparator,
  GummyDropdownMenuTrigger,
} from "../app/components/ui/GummyDropdownMenu";

afterEach(cleanup);

function ExampleMenu({ onNewest = () => undefined }: { onNewest?: () => void }) {
  return (
    <GummyDropdownMenu>
      <GummyDropdownMenuTrigger>Sort projects</GummyDropdownMenuTrigger>
      <GummyDropdownMenuPortal>
        <GummyDropdownMenuPositioner>
          <GummyDropdownMenuPopup aria-label="Sort projects">
            <GummyDropdownMenuItem onClick={onNewest}>Newest</GummyDropdownMenuItem>
            <GummyDropdownMenuItem>Oldest</GummyDropdownMenuItem>
            <GummyDropdownMenuSeparator />
            <GummyDropdownMenuItem>Archive project</GummyDropdownMenuItem>
          </GummyDropdownMenuPopup>
        </GummyDropdownMenuPositioner>
      </GummyDropdownMenuPortal>
    </GummyDropdownMenu>
  );
}

describe("GummyDropdownMenu", () => {
  it("opens from its trigger, focuses items, and activates an item", async () => {
    const user = userEvent.setup();
    const onNewest = vi.fn();
    render(<ExampleMenu onNewest={onNewest} />);

    const trigger = screen.getByRole("button", { name: "Sort projects" });
    await user.click(trigger);
    const newest = await screen.findByRole("menuitem", { name: "Newest" });
    await user.keyboard("{ArrowDown}");
    expect(newest).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onNewest).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("supports arrow navigation and Escape focus restoration", async () => {
    const user = userEvent.setup();
    render(<ExampleMenu />);

    const trigger = screen.getByRole("button", { name: "Sort projects" });
    await user.click(trigger);
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Newest" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Oldest" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
