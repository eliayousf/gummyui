import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GummyCheckbox } from "../app/components/ui/GummyCheckbox";
import { GummyField } from "../app/components/ui/GummyField";
import { GummyLabel } from "../app/components/ui/GummyLabel";
import { GummyNativeSelect } from "../app/components/ui/GummyNativeSelect";
import {
  GummyRadioGroup,
  GummyRadioItem,
} from "../app/components/ui/GummyRadioGroup";
import { GummyTextarea } from "../app/components/ui/GummyTextarea";

afterEach(cleanup);

describe("GummyLabel", () => {
  it("associates a native control, forwards its ref, and exposes state cues", async () => {
    const user = userEvent.setup();
    const ref = React.createRef<HTMLLabelElement>();
    render(
      <>
        <GummyLabel ref={ref} htmlFor="workspace" required>
          Workspace name
        </GummyLabel>
        <input id="workspace" required />
      </>,
    );

    const input = screen.getByRole("textbox", { name: "Workspace name" });
    await user.click(screen.getByText("Workspace name"));
    expect(input).toHaveFocus();
    expect(ref.current?.tagName).toBe("LABEL");
    expect(ref.current).toHaveAttribute("data-required", "true");
    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});

describe("GummyField", () => {
  it("composes native constraints, descriptions, validation, and refs", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <GummyField
        ref={ref}
        label="Tax ID"
        description="Use the registered identifier."
        errorMessage="Enter a valid identifier."
        required
      >
        <input name="tax-id" />
      </GummyField>,
    );

    const input = screen.getByRole("textbox", { name: "Tax ID" });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Use the registered identifier. Enter a valid identifier.",
    );
    expect(input).toHaveAttribute(
      "aria-errormessage",
      expect.stringContaining("-error"),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid identifier.",
    );
    expect(ref.current).toHaveAttribute("data-status", "error");
  });

  it("preserves child accessibility props and applies disabled and read-only states", () => {
    const { rerender } = render(
      <GummyField label="Organisation ID" disabled>
        <input aria-describedby="external-help" />
      </GummyField>,
    );
    expect(screen.getByRole("textbox", { name: "Organisation ID" })).toBeDisabled();

    rerender(
      <GummyField label="Organisation ID" readOnly description="Stable ID.">
        <input aria-describedby="external-help" />
      </GummyField>,
    );
    const input = screen.getByRole("textbox", { name: "Organisation ID" });
    expect(input).toHaveAttribute("readonly");
    expect(input.getAttribute("aria-describedby")).toContain("external-help");
    expect(input).toHaveAccessibleDescription("Stable ID.");
  });
});

describe("GummyTextarea", () => {
  it("supports native editing, controlled callbacks, and a live character count", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <GummyTextarea
        label="Project summary"
        defaultValue="Calm"
        maxLength={12}
        showCount
        onChange={onChange}
      />,
    );

    const textarea = screen.getByRole("textbox", { name: "Project summary" });
    expect(textarea).toHaveValue("Calm");
    expect(screen.getByText("4 / 12")).toBeInTheDocument();
    await user.type(textarea, " forms");
    expect(textarea).toHaveValue("Calm forms");
    expect(screen.getByText("10 / 12")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalled();
  });

  it("associates feedback and preserves disabled and read-only behavior", () => {
    const { rerender } = render(
      <GummyTextarea
        label="Change reason"
        description="Explain the decision."
        errorMessage="A reason is required."
        required
      />,
    );
    const invalid = screen.getByRole("textbox", { name: "Change reason" });
    expect(invalid).toBeRequired();
    expect(invalid).toHaveAttribute("aria-invalid", "true");
    expect(invalid).toHaveAccessibleDescription(
      "Explain the decision. A reason is required.",
    );

    rerender(
      <GummyTextarea
        label="Audit record"
        defaultValue="Approved"
        readOnly
      />,
    );
    expect(screen.getByRole("textbox", { name: "Audit record" })).toHaveAttribute(
      "readonly",
    );

    rerender(<GummyTextarea label="Archived note" disabled />);
    expect(screen.getByRole("textbox", { name: "Archived note" })).toBeDisabled();
  });
});

describe("GummyCheckbox", () => {
  it("toggles through pointer and keyboard input and reports accepted changes", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <GummyCheckbox
        label="Weekly digest"
        description="Sent every Friday."
        onCheckedChange={onCheckedChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Weekly digest" });
    expect(checkbox).toHaveAccessibleDescription("Sent every Friday.");
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    checkbox.focus();
    await user.keyboard(" ");
    expect(checkbox).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
    expect(onCheckedChange).toHaveBeenNthCalledWith(2, false);
  });

  it("sets the native mixed state and blocks changes while read only", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <GummyCheckbox label="Select all" indeterminate />,
    );
    const mixed = screen.getByRole("checkbox", { name: "Select all" });
    expect(mixed).toBePartiallyChecked();
    expect((mixed as HTMLInputElement).indeterminate).toBe(true);

    rerender(<GummyCheckbox label="Contract term" checked readOnly />);
    const readOnly = screen.getByRole("checkbox", { name: "Contract term" });
    expect(readOnly).toHaveAttribute("aria-readonly", "true");
    await user.click(readOnly);
    expect(readOnly).toBeChecked();
    readOnly.focus();
    await user.keyboard(" ");
    expect(readOnly).toBeChecked();
  });

  it("uses native disabled and validation states", () => {
    const { rerender } = render(
      <GummyCheckbox label="Managed setting" disabled defaultChecked />,
    );
    expect(
      screen.getByRole("checkbox", { name: "Managed setting" }),
    ).toBeDisabled();

    rerender(
      <GummyCheckbox
        label="Accept policy"
        required
        errorMessage="Confirm before continuing."
      />,
    );
    const invalid = screen.getByRole("checkbox", { name: "Accept policy" });
    expect(invalid).toBeRequired();
    expect(invalid).toHaveAttribute("aria-invalid", "true");
    expect(invalid).toHaveAccessibleDescription("Confirm before continuing.");
  });
});

describe("GummyRadioGroup", () => {
  function Example({
    readOnly = false,
    onValueChange,
  }: {
    readOnly?: boolean;
    onValueChange?: (value: string) => void;
  }) {
    return (
      <GummyRadioGroup
        label="Plan"
        name="plan"
        defaultValue="starter"
        readOnly={readOnly}
        onValueChange={onValueChange}
      >
        <GummyRadioItem value="starter" label="Starter" />
        <GummyRadioItem value="studio" label="Studio" />
        <GummyRadioItem value="company" label="Company" />
      </GummyRadioGroup>
    );
  }

  it("uses native group semantics and changes selection with pointer and arrows", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);

    const starter = screen.getByRole("radio", { name: "Starter" });
    const studio = screen.getByRole("radio", { name: "Studio" });
    expect(starter).toBeChecked();
    await user.click(studio);
    expect(studio).toBeChecked();
    studio.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Company" })).toBeChecked();
    expect(onValueChange).toHaveBeenNthCalledWith(1, "studio");
    expect(onValueChange).toHaveBeenNthCalledWith(2, "company");
  });

  it("supports Home, End, RTL arrows, disabled items, and read-only selection", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Example />);
    const starter = screen.getByRole("radio", { name: "Starter" });
    starter.focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "Company" })).toBeChecked();
    await user.keyboard("{Home}");
    expect(starter).toBeChecked();

    rerender(
      <div dir="rtl">
        <GummyRadioGroup label="Plan" name="rtl-plan" defaultValue="studio">
          <GummyRadioItem value="starter" label="Starter" />
          <GummyRadioItem value="studio" label="Studio" />
          <GummyRadioItem value="company" label="Company" disabled />
        </GummyRadioGroup>
      </div>,
    );
    const studioRtl = screen.getByRole("radio", { name: "Studio" });
    studioRtl.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Starter" })).toBeChecked();

    rerender(<Example readOnly />);
    const readOnlyStarter = screen.getByRole("radio", { name: "Starter" });
    readOnlyStarter.focus();
    await user.keyboard("{ArrowDown}");
    expect(readOnlyStarter).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Studio" }));
    expect(readOnlyStarter).toBeChecked();
  });

  it("associates group and item descriptions with validation feedback", () => {
    render(
      <GummyRadioGroup
        label="Data region"
        name="region"
        description="Choose where data is stored."
        errorMessage="A region is required."
        required
      >
        <GummyRadioItem
          value="eu"
          label="Europe"
          description="London region"
        />
        <GummyRadioItem value="us" label="United States" />
      </GummyRadioGroup>,
    );
    const europe = screen.getByRole("radio", { name: "Europe" });
    expect(europe).toBeRequired();
    expect(europe).toHaveAccessibleDescription(
      "Choose where data is stored. A region is required. London region",
    );
    expect(screen.getByRole("group", { name: "Data region" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});

describe("GummyNativeSelect", () => {
  it("preserves native selection, labels, descriptions, and refs", async () => {
    const user = userEvent.setup();
    const ref = React.createRef<HTMLSelectElement>();
    const onChange = vi.fn();
    render(
      <GummyNativeSelect
        ref={ref}
        label="Data region"
        description="New project data is stored here."
        defaultValue="eu"
        onChange={onChange}
      >
        <option value="eu">Europe</option>
        <option value="us">United States</option>
      </GummyNativeSelect>,
    );

    const select = screen.getByRole("combobox", { name: "Data region" });
    expect(select).toHaveAccessibleDescription(
      "New project data is stored here.",
    );
    await user.selectOptions(select, "us");
    expect(select).toHaveValue("us");
    expect(onChange).toHaveBeenCalledOnce();
    expect(ref.current).toBe(select);
  });

  it("blocks read-only changes while retaining focus and uses native disabled state", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <GummyNativeSelect label="Contract tier" defaultValue="studio" readOnly>
        <option value="starter">Starter</option>
        <option value="studio">Studio</option>
      </GummyNativeSelect>,
    );
    const readOnly = screen.getByRole("combobox", { name: "Contract tier" });
    expect(readOnly).toHaveAttribute("aria-readonly", "true");
    await user.selectOptions(readOnly, "starter");
    expect(readOnly).toHaveValue("studio");
    readOnly.focus();
    await user.keyboard("{ArrowUp}");
    expect(readOnly).toHaveValue("studio");

    rerender(
      <GummyNativeSelect label="Billing currency" disabled>
        <option>GBP</option>
      </GummyNativeSelect>,
    );
    expect(
      screen.getByRole("combobox", { name: "Billing currency" }),
    ).toBeDisabled();
  });

  it("composes native required and validation semantics", () => {
    render(
      <GummyNativeSelect
        label="Team size"
        defaultValue=""
        required
        errorMessage="Choose a team size."
      >
        <option value="" disabled>
          Choose
        </option>
        <option value="small">1–5 people</option>
      </GummyNativeSelect>,
    );
    const select = screen.getByRole("combobox", { name: "Team size" });
    expect(select).toBeRequired();
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Choose a team size.");
  });
});
