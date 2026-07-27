import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { GummyBadge, type GummyBadgeVariant } from "../app/components/ui/GummyBadge";
import {
  GummyCard,
  GummyCardButton,
  GummyCardContent,
  GummyCardDescription,
  GummyCardHeader,
  GummyCardLink,
  GummyCardTitle,
} from "../app/components/ui/GummyCard";
import { GummyInput } from "../app/components/ui/GummyInput";

const variants: readonly GummyBadgeVariant[] = [
  "neutral", "primary", "secondary", "success", "warning", "info",
];

afterEach(cleanup);

describe("Stage 1B Group 1 accessibility", () => {
  it("has no automated violations across representative variants and states", async () => {
    const { container } = render(
      <main>
        <h1>Component checks</h1>
        <form>
          <GummyInput label="Email" name="email" type="email" autoComplete="email" description="Work email only." required />
          <GummyInput label="Website" name="website" errorMessage="Enter a complete URL." />
          <GummyInput label="Username" name="username" successMessage="Available." />
          <GummyInput label="Disabled" disabled />
          <GummyInput label="Read only" readOnly defaultValue="Stable" />
        </form>
        <section aria-label="Badges">
          {variants.map((variant) => <GummyBadge key={variant} variant={variant} dot>{variant} status</GummyBadge>)}
          <GummyBadge variant="info" finish="translucent" icon="i">More information</GummyBadge>
        </section>
        <section aria-label="Cards">
          <h2>Card examples</h2>
          <GummyCard aria-label="Passive summary"><CardContents /></GummyCard>
          <GummyCardLink href="#details" aria-label="Open linked summary"><CardContents /></GummyCardLink>
          <GummyCardButton aria-label="Select summary"><CardContents /></GummyCardButton>
        </section>
        <div id="details">Details</div>
      </main>,
    );

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
        region: { enabled: false },
      },
    });

    expect(results.violations.map(({ id, help, nodes }) => ({
      id,
      help,
      targets: nodes.flatMap((node) => node.target),
    }))).toEqual([]);
  });
});

function CardContents() {
  return (
    <>
      <GummyCardHeader>
        <div>
          <GummyCardTitle>Project pulse</GummyCardTitle>
          <GummyCardDescription>Weekly delivery is on track.</GummyCardDescription>
        </div>
      </GummyCardHeader>
      <GummyCardContent>Three milestones cleared.</GummyCardContent>
    </>
  );
}
