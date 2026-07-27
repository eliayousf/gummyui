import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GummyCard,
  GummyCardButton,
  GummyCardContent,
  GummyCardDescription,
  GummyCardFooter,
  GummyCardHeader,
  GummyCardIcon,
  GummyCardLink,
  GummyCardTitle,
} from "../app/components/ui/GummyCard";

afterEach(cleanup);

function CardBody() {
  return (
    <>
      <GummyCardHeader>
        <GummyCardIcon aria-hidden="true"><span /></GummyCardIcon>
        <div>
          <GummyCardTitle>Project pulse</GummyCardTitle>
          <GummyCardDescription>Weekly delivery is on track.</GummyCardDescription>
        </div>
      </GummyCardHeader>
      <GummyCardContent>Three milestones cleared.</GummyCardContent>
      <GummyCardFooter>Updated today</GummyCardFooter>
    </>
  );
}

describe("GummyCard", () => {
  it("keeps a passive Card semantic and outside the tab order", async () => {
    const user = userEvent.setup();
    render(
      <>
        <GummyCard aria-label="Project summary"><CardBody /></GummyCard>
        <button type="button">Next control</button>
      </>,
    );

    const card = screen.getByRole("article", { name: "Project summary" });
    expect(card).not.toHaveAttribute("tabindex");
    await user.tab();
    expect(screen.getByRole("button", { name: "Next control" })).toHaveFocus();
  });

  it("allows the surrounding document to select an appropriate title level", () => {
    render(<GummyCardTitle level={2}>Section card</GummyCardTitle>);
    expect(
      screen.getByRole("heading", { level: 2, name: "Section card" }),
    ).toBeInTheDocument();
  });

  it("uses a native link for linked Cards and forwards its ref and href", async () => {
    const user = userEvent.setup();
    const ref = React.createRef<HTMLAnchorElement>();
    render(
      <GummyCardLink ref={ref} href="#details" aria-label="Open Project pulse details">
        <CardBody />
      </GummyCardLink>,
    );

    const link = screen.getByRole("link", { name: "Open Project pulse details" });
    expect(link).toBe(ref.current);
    expect(link).toHaveAttribute("href", "#details");
    expect(link).toHaveAttribute("data-interactive", "link");
    await user.tab();
    expect(link).toHaveFocus();
  });

  it("uses native button keyboard activation and a safe default type", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GummyCardButton onClick={onClick} aria-label="Select Project pulse">
        <CardBody />
      </GummyCardButton>,
    );

    const button = screen.getByRole("button", { name: "Select Project pulse" });
    expect(button).toHaveAttribute("type", "button");
    await user.tab();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("exposes elevation and selected visual states without changing semantics", () => {
    render(<GummyCard elevation="elevated" selected aria-label="Selected card"><CardBody /></GummyCard>);

    const card = screen.getByRole("article", { name: "Selected card" });
    expect(card).toHaveAttribute("data-elevation", "elevated");
    expect(card).toHaveAttribute("data-selected", "true");
  });

  it("keeps the continuous gel frame decorative in every Card foundation", () => {
    const { container } = render(
      <>
        <GummyCard aria-label="Passive pocket"><CardBody /></GummyCard>
        <GummyCardLink href="#pocket" aria-label="Linked pocket"><CardBody /></GummyCardLink>
        <GummyCardButton aria-label="Button pocket"><CardBody /></GummyCardButton>
      </>,
    );

    const frames = container.querySelectorAll("svg.gummy-card__frame");
    const iconSlots = container.querySelectorAll(".gummy-card__icon");
    expect(frames).toHaveLength(3);
    expect(iconSlots).toHaveLength(3);
    for (const frame of frames) {
      expect(frame).toHaveAttribute("aria-hidden", "true");
      expect(frame.querySelector(".gummy-card__frame-shell")).toBeInTheDocument();
      expect(frame.querySelector(".gummy-card__frame-plane")).toBeInTheDocument();
      expect(frame.querySelector(".gummy-card__frame-reservoir")).toBeInTheDocument();
      expect(frame.querySelector(".gummy-card__icon-well")).toBeInTheDocument();
    }
  });
});
