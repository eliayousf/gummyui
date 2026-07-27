import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GummyCalendar } from "../app/components/ui/GummyCalendar";
import {
  GummyCombobox,
  GummyComboboxEmpty,
  GummyComboboxInput,
  GummyComboboxInputGroup,
  GummyComboboxItem,
  GummyComboboxList,
  GummyComboboxPopup,
  GummyComboboxPortal,
  GummyComboboxPositioner,
  GummyComboboxTrigger,
} from "../app/components/ui/GummyCombobox";
import {
  GummyCommand,
  GummyCommandGroup,
  GummyCommandInput,
  GummyCommandItem,
  GummyCommandList,
} from "../app/components/ui/GummyCommand";
import { GummyDatePicker } from "../app/components/ui/GummyDatePicker";
import {
  GummyInputGroup,
  GummyInputGroupAddon,
  GummyInputGroupButton,
  GummyInputGroupControl,
} from "../app/components/ui/GummyInputGroup";
import { GummyInputOTP } from "../app/components/ui/GummyInputOTP";
import {
  GummySelect,
  GummySelectItem,
  GummySelectList,
  GummySelectPopup,
  GummySelectPortal,
  GummySelectPositioner,
  GummySelectTrigger,
} from "../app/components/ui/GummySelect";

afterEach(cleanup);

const fruits = [
  { label: "Raspberry", value: "raspberry" },
  { label: "Grape", value: "grape" },
  { label: "Lime", value: "lime" },
];

describe("Stage 3 composite inputs", () => {
  it("selects dates and moves Calendar focus by week", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<GummyCalendar defaultMonth={new Date(2026, 6, 1)} onValueChange={onValueChange} />);
    const day = screen.getByRole("gridcell", { name: /July 15, 2026/i });
    await user.click(day);
    expect(day).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).toHaveBeenCalledWith(expect.any(Date));
    day.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("gridcell", { name: /July 22, 2026/i })).toHaveFocus();
  });

  it("filters and selects a Base UI Combobox option", async () => {
    const user = userEvent.setup();
    render(
      <GummyCombobox items={fruits}>
        <GummyComboboxInputGroup>
          <GummyComboboxInput aria-label="Fruit" />
          <GummyComboboxTrigger />
        </GummyComboboxInputGroup>
        <GummyComboboxPortal>
          <GummyComboboxPositioner>
            <GummyComboboxPopup>
              <GummyComboboxEmpty>No fruit found.</GummyComboboxEmpty>
              <GummyComboboxList>
                {(fruit: (typeof fruits)[number]) => <GummyComboboxItem key={fruit.value} value={fruit}>{fruit.label}</GummyComboboxItem>}
              </GummyComboboxList>
            </GummyComboboxPopup>
          </GummyComboboxPositioner>
        </GummyComboboxPortal>
      </GummyCombobox>,
    );
    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.type(input, "gra");
    expect(await screen.findByRole("option", { name: "Grape" })).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(input).toHaveValue("Grape");
  });

  it("filters Command items and activates by keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <GummyCommand>
        <GummyCommandInput aria-label="Search commands" />
        <GummyCommandList>
          <GummyCommandGroup label="Projects">
            <GummyCommandItem value="New project" onSelect={onSelect}>New project</GummyCommandItem>
            <GummyCommandItem value="Archive project" onSelect={onSelect}>Archive project</GummyCommandItem>
          </GummyCommandGroup>
        </GummyCommandList>
      </GummyCommand>,
    );
    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "archive");
    expect(screen.getByRole("option", { name: "Archive project" })).toBeVisible();
    expect(screen.queryByRole("option", { name: "New project" })).not.toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("Archive project");
  });

  it("selects a Date Picker day and closes its popup", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<GummyDatePicker label="Start date" defaultValue={new Date(2026, 6, 15)} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: /Start date:/ }));
    await user.click(screen.getByRole("gridcell", { name: /July 16, 2026/i }));
    expect(onValueChange).toHaveBeenCalled();
    expect(screen.queryByRole("grid", { name: /July 2026/ })).not.toBeInTheDocument();
  });

  it("composes native Input Group controls and an action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GummyInputGroup>
        <GummyInputGroupAddon>https://</GummyInputGroupAddon>
        <GummyInputGroupControl aria-label="Workspace URL" />
        <GummyInputGroupButton onClick={onClick}>Copy</GummyInputGroupButton>
      </GummyInputGroup>,
    );
    await user.type(screen.getByRole("textbox", { name: "Workspace URL" }), "gummy.dev");
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("accepts OTP digits, paste distribution, and a hidden form value", async () => {
    const user = userEvent.setup();
    render(<GummyInputOTP label="Verification code" name="code" />);
    const first = screen.getByRole("textbox", { name: "Digit 1 of 6" });
    await user.type(first, "1");
    expect(screen.getByRole("textbox", { name: "Digit 2 of 6" })).toHaveFocus();
    fireEvent.paste(screen.getByRole("textbox", { name: "Digit 2 of 6" }), {
      clipboardData: { getData: () => "234567" },
    });
    expect(document.querySelector<HTMLInputElement>('input[name="code"]')).toHaveValue("234567");
  });

  it("selects a Base UI custom Select value", async () => {
    render(
      <GummySelect items={fruits}>
        <GummySelectTrigger aria-label="Accent fruit" />
        <GummySelectPortal>
          <GummySelectPositioner>
            <GummySelectPopup>
              <GummySelectList>
                {fruits.map((fruit) => <GummySelectItem key={fruit.value} value={fruit}>{fruit.label}</GummySelectItem>)}
              </GummySelectList>
            </GummySelectPopup>
          </GummySelectPositioner>
        </GummySelectPortal>
      </GummySelect>,
    );
    const trigger = screen.getByRole("combobox", { name: "Accent fruit" });
    fireEvent.click(trigger);
    const grape = screen.getByRole("option", { name: "Grape", hidden: true });
    fireEvent.keyDown(grape, { key: "Enter" });
    expect(trigger).toHaveTextContent("Grape");
  });
});
