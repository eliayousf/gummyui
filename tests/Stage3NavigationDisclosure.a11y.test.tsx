import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  GummyAccordion,
  GummyAccordionHeader,
  GummyAccordionItem,
  GummyAccordionPanel,
  GummyAccordionTrigger,
} from "../app/components/ui/GummyAccordion";
import {
  GummyBreadcrumb,
  GummyBreadcrumbItem,
  GummyBreadcrumbLink,
  GummyBreadcrumbPage,
  GummyBreadcrumbSeparator,
} from "../app/components/ui/GummyBreadcrumb";
import {
  GummyCollapsible,
  GummyCollapsiblePanel,
  GummyCollapsibleTrigger,
} from "../app/components/ui/GummyCollapsible";
import {
  GummyPagination,
  GummyPaginationItem,
  GummyPaginationLink,
  GummyPaginationNext,
  GummyPaginationPrevious,
} from "../app/components/ui/GummyPagination";

afterEach(cleanup);

describe("Stage 3 navigation and disclosure accessibility", () => {
  it("has no automated violations in open and closed states", async () => {
    const { container } = render(
      <main>
        <h1>Navigation and disclosure</h1>
        <GummyBreadcrumb>
          <GummyBreadcrumbItem><GummyBreadcrumbLink href="/">Home</GummyBreadcrumbLink></GummyBreadcrumbItem>
          <GummyBreadcrumbSeparator />
          <GummyBreadcrumbItem><GummyBreadcrumbPage>Disclosure</GummyBreadcrumbPage></GummyBreadcrumbItem>
        </GummyBreadcrumb>
        <h2>Installation questions</h2>
        <GummyAccordion defaultValue={["one"]}>
          <GummyAccordionItem value="one">
            <GummyAccordionHeader><GummyAccordionTrigger>Installation</GummyAccordionTrigger></GummyAccordionHeader>
            <GummyAccordionPanel>Install the base first.</GummyAccordionPanel>
          </GummyAccordionItem>
          <GummyAccordionItem value="two">
            <GummyAccordionHeader><GummyAccordionTrigger>Frameworks</GummyAccordionTrigger></GummyAccordionHeader>
            <GummyAccordionPanel>Next.js and Vite are supported.</GummyAccordionPanel>
          </GummyAccordionItem>
        </GummyAccordion>
        <GummyCollapsible defaultOpen>
          <GummyCollapsibleTrigger>Advanced settings</GummyCollapsibleTrigger>
          <GummyCollapsiblePanel>Optional configuration.</GummyCollapsiblePanel>
        </GummyCollapsible>
        <GummyPagination>
          <GummyPaginationItem><GummyPaginationPrevious href="?page=1" /></GummyPaginationItem>
          <GummyPaginationItem><GummyPaginationLink href="?page=2" current>2</GummyPaginationLink></GummyPaginationItem>
          <GummyPaginationItem><GummyPaginationNext href="?page=3" /></GummyPaginationItem>
        </GummyPagination>
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
