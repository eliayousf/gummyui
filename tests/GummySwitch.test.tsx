import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GummySwitch } from "../app/components/ui/GummySwitch";

afterEach(cleanup);

describe("GummySwitch", () => {
  it("uses native button switch semantics and associates its description", () => {
    render(<GummySwitch label="Weekly digest" description="Sent every Friday." />);

    const control = screen.getByRole("switch", { name: "Weekly digest" });
    expect(control.tagName).toBe("BUTTON");
    expect(control).toHaveAttribute("type", "button");
    expect(control).toHaveAttribute("aria-checked", "false");
    expect(control).toHaveAccessibleDescription("Sent every Friday.");
  });

  it("toggles with pointer and keyboard input", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<GummySwitch label="Weekly digest" onCheckedChange={onCheckedChange} />);

    const control = screen.getByRole("switch", { name: "Weekly digest" });
    await user.click(control);
    expect(control).toBeChecked();
    await user.keyboard(" ");
    expect(control).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledTimes(2);
  });

  it("forwards refs and preserves disabled behaviour", async () => {
    const user = userEvent.setup();
    const ref = React.createRef<HTMLElement>();
    render(<GummySwitch ref={ref} label="Locked switch" disabled />);

    const control = screen.getByRole("switch", { name: "Locked switch" });
    expect(ref.current).toBe(control);
    expect(control).toBeDisabled();
    await user.click(control);
    expect(control).not.toBeChecked();
  });
});
