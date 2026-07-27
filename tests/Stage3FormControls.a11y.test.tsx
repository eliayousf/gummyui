import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
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

describe("Stage 3 form foundations accessibility", () => {
  it("has no automated violations across representative states", async () => {
    const { container } = render(
      <main>
        <h1>Form foundations</h1>
        <form>
          <GummyLabel htmlFor="standalone-label" required>
            Standalone label
          </GummyLabel>
          <input id="standalone-label" required />
          <GummyField
            label="Workspace name"
            description="Shown to collaborators."
            required
          >
            <input name="workspace-name" />
          </GummyField>
          <GummyField
            label="Tax ID"
            errorMessage="Enter a valid identifier."
          >
            <input name="tax-id" />
          </GummyField>
          <GummyField label="Organisation ID" disabled>
            <input name="organisation-id" />
          </GummyField>
          <GummyTextarea
            label="Project summary"
            description="Describe the intended outcome."
            maxLength={180}
            showCount
          />
          <GummyTextarea
            label="Change reason"
            errorMessage="A reason is required."
            required
          />
          <GummyTextarea
            label="Audit record"
            defaultValue="Approved"
            readOnly
          />
          <GummyCheckbox
            label="Weekly digest"
            description="Sent every Friday."
            defaultChecked
          />
          <GummyCheckbox label="Select all" indeterminate />
          <GummyCheckbox
            label="Accept policy"
            required
            errorMessage="Confirm before continuing."
          />
          <GummyCheckbox label="Contract term" checked readOnly />
          <GummyRadioGroup
            label="Visibility"
            name="visibility"
            defaultValue="team"
            description="Applied to new projects."
          >
            <GummyRadioItem value="team" label="Team only" />
            <GummyRadioItem value="invite" label="Invite only" />
          </GummyRadioGroup>
          <GummyRadioGroup
            label="Data region"
            name="region"
            required
            errorMessage="Choose a region."
          >
            <GummyRadioItem value="eu" label="Europe" />
            <GummyRadioItem value="us" label="United States" />
          </GummyRadioGroup>
          <GummyRadioGroup
            label="Owner"
            name="owner"
            value="ava"
            readOnly
          >
            <GummyRadioItem value="ava" label="Ava Morgan" />
            <GummyRadioItem value="sam" label="Sam Rivera" />
          </GummyRadioGroup>
          <GummyNativeSelect
            label="Team size"
            description="Used for workspace defaults."
            defaultValue="small"
          >
            <option value="small">1–5 people</option>
            <option value="medium">6–20 people</option>
          </GummyNativeSelect>
          <GummyNativeSelect
            label="Contract tier"
            defaultValue="studio"
            readOnly
          >
            <option value="starter">Starter</option>
            <option value="studio">Studio</option>
          </GummyNativeSelect>
        </form>
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
