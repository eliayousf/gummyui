import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  GummyCarousel,
  GummyCarouselContent,
  GummyCarouselIndicators,
  GummyCarouselItem,
  GummyCarouselNext,
  GummyCarouselPrevious,
} from "../app/components/ui/GummyCarousel";
import { GummyDataTable, type GummyDataTableColumn } from "../app/components/ui/GummyDataTable";
import {
  GummyResizableHandle,
  GummyResizablePanel,
  GummyResizablePanelGroup,
} from "../app/components/ui/GummyResizable";

type Row = { id: string; name: string };
const columns: GummyDataTableColumn<Row>[] = [{
  id: "name",
  header: "Name",
  cell: (row) => row.name,
  sortValue: (row) => row.name,
}];

afterEach(cleanup);

describe("Stage 3 data and utility accessibility", () => {
  it("has no automated violations in representative states", async () => {
    const { container } = render(
      <main>
        <h1>Data and utility systems</h1>
        <section>
          <h2>Featured work</h2>
          <GummyCarousel itemCount={2} label="Featured work">
            <GummyCarouselContent>
              <GummyCarouselItem index={0}>Beacon</GummyCarouselItem>
              <GummyCarouselItem index={1}>Atlas</GummyCarouselItem>
            </GummyCarouselContent>
            <GummyCarouselPrevious />
            <GummyCarouselNext />
            <GummyCarouselIndicators />
          </GummyCarousel>
        </section>
        <section aria-labelledby="table-heading">
          <h2 id="table-heading">Projects</h2>
          <GummyDataTable
            rows={[{ id: "p1", name: "Beacon" }]}
            columns={columns}
            getRowId={(row) => row.id}
            caption="Project list"
            selectable
          />
        </section>
        <section aria-labelledby="resize-heading">
          <h2 id="resize-heading">Workspace</h2>
          <GummyResizablePanelGroup>
            <GummyResizablePanel order="first">Navigation</GummyResizablePanel>
            <GummyResizableHandle />
            <GummyResizablePanel order="second">Canvas</GummyResizablePanel>
          </GummyResizablePanelGroup>
        </section>
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
