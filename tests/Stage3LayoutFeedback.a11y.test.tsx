import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
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

describe("Stage 3 layout and feedback accessibility", () => {
  it("has no automated violations across representative states", async () => {
    const { container } = render(
      <main>
        <GummyEyebrow>Foundation</GummyEyebrow>
        <GummyHeading level={1} size="title">
          Layout and feedback
        </GummyHeading>
        <GummyText>
          Use <GummyInlineCode>gummy-base</GummyInlineCode> with every primitive.
        </GummyText>
        <GummySeparator />
        <GummySeparator decorative={false} />
        <GummyBlockquote citeLabel="Quality standard">
          State information stays available without motion.
        </GummyBlockquote>
        <p>
          Save with{" "}
          <GummyKbdGroup aria-label="Command S">
            <GummyKbd>⌘</GummyKbd>
            <GummyKbd>S</GummyKbd>
          </GummyKbdGroup>
        </p>
        <GummySpinner label="Saving changes" />
        <GummySkeletonGroup label="Loading preview">
          <GummySkeleton shape="circle" />
          <GummySkeleton shape="text" lines={3} />
        </GummySkeletonGroup>
        <GummyAspectRatio ratio={16 / 9}>
          <div aria-label="Media preview">Preview</div>
        </GummyAspectRatio>
      </main>,
    );

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
        region: { enabled: false },
      },
    });

    expect(
      results.violations.map(({ id, help, nodes }) => ({
        id,
        help,
        targets: nodes.flatMap((node) => node.target),
      })),
    ).toEqual([]);
  });
});
