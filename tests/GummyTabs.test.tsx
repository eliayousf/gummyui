import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { GummyTab, GummyTabPanel, GummyTabs, GummyTabsList } from "../app/components/ui/GummyTabs";

afterEach(cleanup);

function ExampleTabs() {
  return (
    <GummyTabs defaultValue="overview">
      <GummyTabsList aria-label="Project sections">
        <GummyTab value="overview">Overview</GummyTab>
        <GummyTab value="activity">Activity</GummyTab>
        <GummyTab value="settings">Settings</GummyTab>
      </GummyTabsList>
      <GummyTabPanel value="overview">Overview panel</GummyTabPanel>
      <GummyTabPanel value="activity">Activity panel</GummyTabPanel>
      <GummyTabPanel value="settings">Settings panel</GummyTabPanel>
    </GummyTabs>
  );
}

describe("GummyTabs", () => {
  it("connects the selected tab and its panel", () => {
    render(<ExampleTabs />);

    const overview = screen.getByRole("tab", { name: "Overview" });
    expect(overview).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Overview" })).toHaveTextContent("Overview panel");
    expect(document.querySelector(".gummy-tabs__indicator")).toBeInTheDocument();
  });

  it("supports arrow, Home, and End keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<ExampleTabs />);

    await user.tab();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
  });
});
