import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GummyAlert,
  GummyAlertDescription,
  GummyAlertTitle,
} from "../app/components/ui/GummyAlert";
import {
  GummyAvatar,
  GummyAvatarGroup,
} from "../app/components/ui/GummyAvatar";
import {
  GummyEmpty,
  GummyEmptyActions,
  GummyEmptyDescription,
  GummyEmptyMedia,
  GummyEmptyTitle,
} from "../app/components/ui/GummyEmpty";
import {
  GummyItem,
  GummyItemActions,
  GummyItemButton,
  GummyItemContent,
  GummyItemDescription,
  GummyItemLink,
  GummyItemMedia,
  GummyItemTitle,
} from "../app/components/ui/GummyItem";
import { GummyProgress } from "../app/components/ui/GummyProgress";

afterEach(cleanup);

describe("Stage 3 display and feedback", () => {
  it("keeps static alerts quiet and maps live priority to native roles", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { rerender } = render(
      <GummyAlert ref={ref} variant="info">
        <GummyAlertTitle>Draft saved</GummyAlertTitle>
        <GummyAlertDescription>Only you can see it.</GummyAlertDescription>
      </GummyAlert>,
    );
    expect(ref.current).not.toHaveAttribute("role");
    expect(ref.current).toHaveAttribute("data-variant", "info");

    rerender(
      <GummyAlert ref={ref} live="polite">
        Changes synced
      </GummyAlert>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Changes synced");

    rerender(
      <GummyAlert ref={ref} live="assertive" variant="danger">
        Connection lost
      </GummyAlert>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Connection lost");
  });

  it("renders image alt text, falls back after image failure, and names presence", () => {
    const { rerender } = render(
      <GummyAvatar
        src="/ava.png"
        alt="Ava Morgan"
        fallback="AM"
        status="online"
        statusLabel="Ava is online"
      />,
    );
    const image = screen.getByRole("img", { name: "Ava Morgan" });
    expect(screen.getByRole("img", { name: "Ava is online" })).toBeInTheDocument();
    fireEvent.error(image);
    expect(screen.queryByRole("img", { name: "Ava Morgan" })).not.toBeInTheDocument();
    expect(screen.getByText("AM")).toBeInTheDocument();

    rerender(
      <GummyAvatarGroup label="Project members">
        <GummyAvatar fallback="AM" />
        <GummyAvatar fallback="SR" />
      </GummyAvatarGroup>,
    );
    expect(screen.getByRole("group", { name: "Project members" })).toBeInTheDocument();
  });

  it("provides semantic empty-state slots without inventing interaction", () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <GummyEmpty ref={ref} aria-labelledby="empty-title">
        <GummyEmptyMedia>+</GummyEmptyMedia>
        <GummyEmptyTitle id="empty-title">No projects yet</GummyEmptyTitle>
        <GummyEmptyDescription>Create the first one.</GummyEmptyDescription>
        <GummyEmptyActions>
          <button type="button">New project</button>
        </GummyEmptyActions>
      </GummyEmpty>,
    );
    expect(ref.current?.tagName).toBe("SECTION");
    expect(screen.getByRole("heading", { name: "No projects yet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New project" })).toBeInTheDocument();
  });

  it("separates passive, link, and button item roots", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <div>
        <GummyItem as="article" selected>
          <GummyItemMedia>1</GummyItemMedia>
          <GummyItemContent>
            <GummyItemTitle>Passive project</GummyItemTitle>
            <GummyItemDescription>Updated today</GummyItemDescription>
          </GummyItemContent>
          <GummyItemActions>Ready</GummyItemActions>
        </GummyItem>
        <GummyItemLink href="#linked">
          <GummyItemContent><GummyItemTitle>Linked project</GummyItemTitle></GummyItemContent>
        </GummyItemLink>
        <GummyItemButton onClick={onClick}>
          <GummyItemContent><GummyItemTitle>Archive project</GummyItemTitle></GummyItemContent>
        </GummyItemButton>
      </div>,
    );
    expect(screen.getByText("Passive project").closest("article")).toHaveAttribute(
      "data-selected",
      "true",
    );
    expect(screen.getByRole("link", { name: "Linked project" })).toHaveAttribute(
      "href",
      "#linked",
    );
    await user.click(screen.getByRole("button", { name: "Archive project" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("uses native progress semantics for determinate and indeterminate work", () => {
    const ref = React.createRef<HTMLProgressElement>();
    const { rerender } = render(
      <GummyProgress ref={ref} label="Upload" value={25} max={50} />,
    );
    expect(screen.getByRole("progressbar", { name: "Upload" })).toBe(ref.current);
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(ref.current).toHaveAttribute("value", "25");

    rerender(<GummyProgress ref={ref} label="Preparing export" />);
    expect(ref.current).not.toHaveAttribute("value");
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });
});
