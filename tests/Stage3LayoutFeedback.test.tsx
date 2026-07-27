import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GummyAspectRatio } from "../app/components/ui/GummyAspectRatio";
import { GummyKbd, GummyKbdGroup } from "../app/components/ui/GummyKbd";
import { GummySeparator } from "../app/components/ui/GummySeparator";
import {
  GummySkeleton,
  GummySkeletonGroup,
} from "../app/components/ui/GummySkeleton";
import { GummySpinner } from "../app/components/ui/GummySpinner";
import {
  GummyBlockquote,
  GummyEyebrow,
  GummyHeading,
  GummyInlineCode,
  GummyText,
} from "../app/components/ui/GummyTypography";

afterEach(cleanup);

describe("Stage 3 layout and feedback primitives", () => {
  it("supports decorative and semantic separators with orientation", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { rerender } = render(<GummySeparator ref={ref} />);
    expect(ref.current).toHaveAttribute("role", "none");
    expect(ref.current).not.toHaveAttribute("aria-orientation");

    rerender(
      <GummySeparator ref={ref} decorative={false} orientation="vertical" />,
    );
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  });

  it("renders semantic typography and forwards public refs", () => {
    const headingRef = React.createRef<HTMLHeadingElement>();
    render(
      <article>
        <GummyEyebrow>System note</GummyEyebrow>
        <GummyHeading ref={headingRef} level={3} size="title">
          Calm reading surfaces
        </GummyHeading>
        <GummyText tone="soft">
          Install <GummyInlineCode>gummy-base</GummyInlineCode> first.
        </GummyText>
        <GummyBlockquote citeLabel="Gummy quality standard">
          Material communicates hierarchy.
        </GummyBlockquote>
      </article>,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Calm reading surfaces" }),
    ).toBe(headingRef.current);
    expect(screen.getByText("gummy-base").tagName).toBe("CODE");
    expect(screen.getByText("Gummy quality standard").tagName).toBe("FOOTER");
  });

  it("keeps shortcut separators decorative", () => {
    render(
      <GummyKbdGroup aria-label="Save shortcut">
        <GummyKbd>⌘</GummyKbd>
        <GummyKbd>S</GummyKbd>
      </GummyKbdGroup>,
    );
    expect(screen.getByLabelText("Save shortcut")).toHaveTextContent("⌘+S");
    expect(screen.getByText("+")).toHaveAttribute("aria-hidden", "true");
  });

  it("names spinners and exposes size and tone state", () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(
      <GummySpinner
        ref={ref}
        label="Saving workspace"
        size="large"
        tone="aqua"
      />,
    );
    expect(screen.getByRole("status", { name: "Saving workspace" })).toBe(
      ref.current,
    );
    expect(ref.current).toHaveAttribute("data-size", "large");
    expect(ref.current).toHaveAttribute("data-tone", "aqua");
  });

  it("keeps decorative skeletons hidden and supports one named busy group", () => {
    const { rerender } = render(<GummySkeleton shape="text" lines={3} />);
    expect(document.querySelectorAll(".gummy-skeleton__line")).toHaveLength(3);
    expect(document.querySelector(".gummy-skeleton")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    rerender(
      <GummySkeletonGroup label="Loading account">
        <GummySkeleton shape="circle" />
        <GummySkeleton shape="text" lines={2} />
      </GummySkeletonGroup>,
    );
    expect(screen.getByRole("status", { name: "Loading account" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("validates ratios and preserves child content", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { rerender } = render(
      <GummyAspectRatio ref={ref} ratio={4 / 3} fit="contain">
        <span>Media preview</span>
      </GummyAspectRatio>,
    );
    expect(ref.current).toHaveStyle({ aspectRatio: 4 / 3 });
    expect(ref.current).toHaveAttribute("data-fit", "contain");
    expect(screen.getByText("Media preview")).toBeInTheDocument();

    rerender(<GummyAspectRatio ref={ref} ratio={0} />);
    expect(ref.current).toHaveStyle({ aspectRatio: 16 / 9 });
  });
});
