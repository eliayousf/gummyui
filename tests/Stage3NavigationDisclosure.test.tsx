import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  GummyBreadcrumbEllipsis,
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
  GummyPaginationEllipsis,
  GummyPaginationItem,
  GummyPaginationLink,
  GummyPaginationNext,
  GummyPaginationPrevious,
} from "../app/components/ui/GummyPagination";

afterEach(cleanup);

describe("Stage 3 navigation and disclosure", () => {
  it("opens accordion panels and keeps every trigger in the tab order", async () => {
    const user = userEvent.setup();
    render(
      <GummyAccordion>
        <GummyAccordionItem value="one">
          <GummyAccordionHeader>
            <GummyAccordionTrigger>First section</GummyAccordionTrigger>
          </GummyAccordionHeader>
          <GummyAccordionPanel>First content</GummyAccordionPanel>
        </GummyAccordionItem>
        <GummyAccordionItem value="two">
          <GummyAccordionHeader>
            <GummyAccordionTrigger>Second section</GummyAccordionTrigger>
          </GummyAccordionHeader>
          <GummyAccordionPanel>Second content</GummyAccordionPanel>
        </GummyAccordionItem>
      </GummyAccordion>,
    );
    const first = screen.getByRole("button", { name: "First section" });
    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("First content")).toBeVisible();
    const second = screen.getByRole("button", { name: "Second section" });
    expect(first).toHaveAttribute("tabindex", "0");
    expect(second).toHaveAttribute("tabindex", "0");
  });

  it("uses semantic breadcrumb navigation and current page", () => {
    render(
      <GummyBreadcrumb label="Documentation breadcrumb">
        <GummyBreadcrumbItem><GummyBreadcrumbLink href="/">Home</GummyBreadcrumbLink></GummyBreadcrumbItem>
        <GummyBreadcrumbSeparator />
        <GummyBreadcrumbEllipsis />
        <GummyBreadcrumbSeparator />
        <GummyBreadcrumbItem><GummyBreadcrumbPage>Accordion</GummyBreadcrumbPage></GummyBreadcrumbItem>
      </GummyBreadcrumb>,
    );
    const nav = screen.getByRole("navigation", { name: "Documentation breadcrumb" });
    expect(nav.querySelector("ol")).toBeInTheDocument();
    expect(screen.getByText("Accordion")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("More pages")).toHaveClass("gummy-visually-hidden");
  });

  it("toggles a collapsible panel with pointer and keyboard", async () => {
    const user = userEvent.setup();
    render(
      <GummyCollapsible>
        <GummyCollapsibleTrigger>Show advanced settings</GummyCollapsibleTrigger>
        <GummyCollapsiblePanel>Advanced controls</GummyCollapsiblePanel>
      </GummyCollapsible>,
    );
    const trigger = screen.getByRole("button", { name: "Show advanced settings" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Advanced controls")).toBeVisible();
  });

  it("marks the current page and gives previous and next useful names", () => {
    render(
      <GummyPagination label="Component pages">
        <GummyPaginationItem><GummyPaginationPrevious href="?page=1" /></GummyPaginationItem>
        <GummyPaginationItem><GummyPaginationLink href="?page=1">1</GummyPaginationLink></GummyPaginationItem>
        <GummyPaginationItem><GummyPaginationLink href="?page=2" current>2</GummyPaginationLink></GummyPaginationItem>
        <GummyPaginationItem><GummyPaginationEllipsis /></GummyPaginationItem>
        <GummyPaginationItem><GummyPaginationNext href="?page=3" /></GummyPaginationItem>
      </GummyPagination>,
    );
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "?page=1");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "?page=3");
  });
});
