import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GummyInput } from "../app/components/ui/GummyInput";

afterEach(cleanup);

describe("GummyInput", () => {
  it("uses a native input and forwards refs and form attributes", async () => {
    const user = userEvent.setup();
    const ref = React.createRef<HTMLInputElement>();
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      return new FormData(event.currentTarget);
    });

    render(
      <form onSubmit={onSubmit}>
        <GummyInput
          ref={ref}
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <button type="submit">Submit</button>
      </form>,
    );

    const input = screen.getByRole("textbox", { name: "Email address" });
    expect(input).toBe(ref.current);
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(input).toBeRequired();

    await user.type(input, "ava@example.com");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledOnce();
    const formData = onSubmit.mock.results[0]?.value as FormData;
    expect(formData.get("email")).toBe("ava@example.com");
  });

  it("associates description and error feedback without adornments changing the name", () => {
    render(
      <GummyInput
        label="Workspace URL"
        description="Use lowercase letters."
        errorMessage="That URL is already in use."
        leadingAdornment="https://"
        trailingAdornment=".gummy.dev"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Workspace URL" });
    expect(input).toHaveAccessibleDescription(
      "Use lowercase letters. That URL is already in use.",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-errormessage");
    expect(screen.getByRole("alert")).toHaveTextContent("That URL is already in use.");
    expect(screen.queryByRole("textbox", { name: /https|gummy\.dev/ })).toBeNull();
  });

  it("preserves native disabled and read-only behaviour", async () => {
    const user = userEvent.setup();
    render(
      <>
        <GummyInput label="Disabled field" defaultValue="locked" disabled />
        <GummyInput label="Read-only field" defaultValue="stable" readOnly />
      </>,
    );

    const disabled = screen.getByRole("textbox", { name: "Disabled field" });
    const readOnly = screen.getByRole("textbox", { name: "Read-only field" });
    expect(disabled).toBeDisabled();
    expect(readOnly).toHaveAttribute("readonly");

    await user.click(readOnly);
    expect(readOnly).toHaveFocus();
    await user.type(readOnly, " changed");
    expect(readOnly).toHaveValue("stable");
  });

  it("adds explicit success feedback in addition to colour", () => {
    render(
      <GummyInput
        label="Username"
        defaultValue="ava-morgan"
        successMessage="That username is available."
      />,
    );

    expect(screen.getByRole("textbox", { name: "Username" })).toHaveAccessibleDescription(
      "That username is available.",
    );
    expect(screen.getByText("That username is available.")).toBeVisible();
  });
});
