import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  GummyAlert,
  GummyAlertDescription,
  GummyAlertTitle,
} from "../app/components/ui/GummyAlert";
import { GummyAvatar, GummyAvatarGroup } from "../app/components/ui/GummyAvatar";
import {
  GummyEmpty,
  GummyEmptyActions,
  GummyEmptyDescription,
  GummyEmptyMedia,
  GummyEmptyTitle,
} from "../app/components/ui/GummyEmpty";
import {
  GummyItemContent,
  GummyItemDescription,
  GummyItemLink,
  GummyItemMedia,
  GummyItemTitle,
} from "../app/components/ui/GummyItem";
import { GummyProgress } from "../app/components/ui/GummyProgress";

afterEach(cleanup);

describe("Stage 3 display and feedback accessibility", () => {
  it("has no automated violations across representative states", async () => {
    const { container } = render(
      <main>
        <h1>Display and feedback</h1>
        <h2>Alerts</h2>
        <GummyAlert variant="info">
          <GummyAlertTitle>Workspace ready</GummyAlertTitle>
          <GummyAlertDescription>Invite collaborators when you are ready.</GummyAlertDescription>
        </GummyAlert>
        <GummyAlert variant="danger" live="assertive">
          <GummyAlertTitle>Upload failed</GummyAlertTitle>
          <GummyAlertDescription>Try a smaller file.</GummyAlertDescription>
        </GummyAlert>
        <GummyAvatarGroup label="Project members">
          <GummyAvatar fallback="AM" status="online" statusLabel="Ava is online" />
          <GummyAvatar fallback="SR" status="away" statusLabel="Sam is away" />
        </GummyAvatarGroup>
        <GummyEmpty aria-labelledby="empty-state-title">
          <GummyEmptyMedia>+</GummyEmptyMedia>
          <GummyEmptyTitle id="empty-state-title">No projects yet</GummyEmptyTitle>
          <GummyEmptyDescription>Create a project to begin.</GummyEmptyDescription>
          <GummyEmptyActions><button type="button">New project</button></GummyEmptyActions>
        </GummyEmpty>
        <GummyItemLink href="#project">
          <GummyItemMedia>G</GummyItemMedia>
          <GummyItemContent>
            <GummyItemTitle>Gummy launch</GummyItemTitle>
            <GummyItemDescription>Updated today</GummyItemDescription>
          </GummyItemContent>
        </GummyItemLink>
        <GummyProgress label="Component coverage" value={17} max={57} />
        <GummyProgress label="Preparing export" />
      </main>,
    );

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
        region: { enabled: false },
      },
    });
    expect(results.violations.map(({ id }) => id)).toEqual([]);
  });
});
