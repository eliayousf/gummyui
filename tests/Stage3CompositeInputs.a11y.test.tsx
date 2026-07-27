import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { GummyCalendar } from "../app/components/ui/GummyCalendar";
import { GummyCommand, GummyCommandGroup, GummyCommandInput, GummyCommandItem, GummyCommandList } from "../app/components/ui/GummyCommand";
import { GummyDatePicker } from "../app/components/ui/GummyDatePicker";
import { GummyInputGroup, GummyInputGroupAddon, GummyInputGroupControl } from "../app/components/ui/GummyInputGroup";
import { GummyInputOTP } from "../app/components/ui/GummyInputOTP";

afterEach(cleanup);

describe("Stage 3 composite inputs accessibility", () => {
  it("has no automated violations in representative states", async () => {
    const { container } = render(
      <main>
        <h1>Composite inputs</h1>
        <GummyCalendar defaultMonth={new Date(2026, 6, 1)} />
        <GummyDatePicker label="Start date" defaultValue={new Date(2026, 6, 15)} />
        <label htmlFor="workspace-url">Workspace URL</label>
        <GummyInputGroup>
          <GummyInputGroupAddon>https://</GummyInputGroupAddon>
          <GummyInputGroupControl id="workspace-url" />
        </GummyInputGroup>
        <GummyInputOTP label="Verification code" />
        <GummyCommand>
          <GummyCommandInput aria-label="Search commands" />
          <GummyCommandList>
            <GummyCommandGroup label="Projects">
              <GummyCommandItem value="New project">New project</GummyCommandItem>
            </GummyCommandGroup>
          </GummyCommandList>
        </GummyCommand>
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
