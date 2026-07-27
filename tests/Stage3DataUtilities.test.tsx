import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  GummyCarousel,
  GummyCarouselContent,
  GummyCarouselIndicators,
  GummyCarouselItem,
  GummyCarouselNext,
  GummyCarouselPrevious,
} from "../app/components/ui/GummyCarousel";
import {
  GummyDataTable,
  type GummyDataTableColumn,
} from "../app/components/ui/GummyDataTable";
import { GummyDirection } from "../app/components/ui/GummyDirection";
import {
  GummyResizableHandle,
  GummyResizablePanel,
  GummyResizablePanelGroup,
} from "../app/components/ui/GummyResizable";
import {
  GummyScrollArea,
  GummyScrollAreaContent,
  GummyScrollAreaScrollbar,
  GummyScrollAreaThumb,
  GummyScrollAreaViewport,
} from "../app/components/ui/GummyScrollArea";
import {
  GummySonnerProvider,
  GummyToaster,
  useGummyToast,
} from "../app/components/ui/GummySonner";
import {
  GummyTable,
  GummyTableBody,
  GummyTableCaption,
  GummyTableCell,
  GummyTableHead,
  GummyTableHeader,
  GummyTableRow,
} from "../app/components/ui/GummyTable";

afterEach(cleanup);

type Project = {
  id: string;
  name: string;
  status: string;
  score: number;
};

const projects: Project[] = [
  { id: "p1", name: "Beacon", status: "Review", score: 72 },
  { id: "p2", name: "Atlas", status: "Live", score: 95 },
  { id: "p3", name: "Cedar", status: "Draft", score: 61 },
];

const projectColumns: GummyDataTableColumn<Project>[] = [
  {
    id: "name",
    header: "Project",
    cell: (project) => project.name,
    sortValue: (project) => project.name,
  },
  {
    id: "status",
    header: "Status",
    cell: (project) => project.status,
    filterValue: (project) => project.status,
  },
  {
    id: "score",
    header: "Score",
    cell: (project) => project.score,
    sortValue: (project) => project.score,
    align: "end",
  },
];

function ToastFixture() {
  const toast = useGummyToast();
  return (
    <>
      <button type="button" onClick={() => toast.add({ title: "Project saved", description: "The release is ready.", type: "success" })}>
        Save project
      </button>
      <GummyToaster />
    </>
  );
}

describe("Stage 3 data and utility systems", () => {
  it("moves Carousel slides with controls, indicators, and keyboard", async () => {
    const user = userEvent.setup();
    render(
      <GummyCarousel itemCount={3} label="Featured projects">
        <GummyCarouselContent>
          <GummyCarouselItem index={0}>Beacon</GummyCarouselItem>
          <GummyCarouselItem index={1}>Atlas</GummyCarouselItem>
          <GummyCarouselItem index={2}>Cedar</GummyCarouselItem>
        </GummyCarouselContent>
        <GummyCarouselPrevious />
        <GummyCarouselNext />
        <GummyCarouselIndicators />
      </GummyCarousel>,
    );
    expect(screen.getByRole("group", { name: "1 of 3" })).toHaveTextContent("Beacon");
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByRole("group", { name: "2 of 3" })).toHaveTextContent("Atlas");
    const viewport = document.querySelector<HTMLElement>(".gummy-carousel__viewport")!;
    viewport.focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("group", { name: "3 of 3" })).toHaveTextContent("Cedar");
    await user.click(screen.getByRole("button", { name: "Go to slide 1" }));
    expect(screen.getByRole("group", { name: "1 of 3" })).toBeInTheDocument();
  });

  it("filters, sorts, selects, and pages Data Table rows", async () => {
    const user = userEvent.setup();
    render(
      <GummyDataTable
        rows={projects}
        columns={projectColumns}
        getRowId={(project) => project.id}
        getRowLabel={(project) => project.name}
        caption="Project delivery"
        selectable
        pageSize={2}
      />,
    );
    const table = screen.getByRole("table", { name: "Project delivery" });
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: /Project/ }));
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("Atlas");
    await user.click(screen.getByRole("checkbox", { name: "Select Atlas" }));
    expect(screen.getByRole("checkbox", { name: "Select Atlas" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(table).toHaveTextContent("Cedar");
    await user.type(screen.getByRole("searchbox", { name: "Filter rows" }), "live");
    expect(table).toHaveTextContent("Atlas");
    expect(table).not.toHaveTextContent("Beacon");
  });

  it("provides native Direction and Table semantics", () => {
    render(
      <GummyDirection direction="rtl" data-testid="direction">
        <GummyTable>
          <GummyTableCaption>Quarterly totals</GummyTableCaption>
          <GummyTableHeader><GummyTableRow><GummyTableHead>Quarter</GummyTableHead></GummyTableRow></GummyTableHeader>
          <GummyTableBody><GummyTableRow><GummyTableCell>Q3</GummyTableCell></GummyTableRow></GummyTableBody>
        </GummyTable>
      </GummyDirection>,
    );
    expect(screen.getByTestId("direction")).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("columnheader", { name: "Quarter" })).toHaveAttribute("scope", "col");
    expect(screen.getByRole("table", { name: "Quarterly totals" })).toBeInTheDocument();
  });

  it("resizes panels with separator keyboard semantics including RTL", () => {
    render(
      <GummyResizablePanelGroup defaultSize={40} minSize={20} maxSize={80} direction="rtl">
        <GummyResizablePanel order="first">Navigation</GummyResizablePanel>
        <GummyResizableHandle />
        <GummyResizablePanel order="second">Canvas</GummyResizablePanel>
      </GummyResizablePanelGroup>,
    );
    const handle = screen.getByRole("separator", { name: "Resize panels" });
    expect(handle).toHaveAttribute("aria-valuenow", "40");
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(handle).toHaveAttribute("aria-valuenow", "42");
    fireEvent.keyDown(handle, { key: "End" });
    expect(handle).toHaveAttribute("aria-valuenow", "80");
  });

  it("composes a focusable native Scroll Area with custom scrollbar parts", () => {
    render(
      <GummyScrollArea>
        <GummyScrollAreaViewport aria-label="Release notes">
          <GummyScrollAreaContent>Long release history</GummyScrollAreaContent>
        </GummyScrollAreaViewport>
        <GummyScrollAreaScrollbar>
          <GummyScrollAreaThumb />
        </GummyScrollAreaScrollbar>
      </GummyScrollArea>,
    );
    const viewport = screen.getByLabelText("Release notes");
    expect(viewport).toHaveAttribute("tabindex", "0");
    expect(document.querySelector(".gummy-scroll-area__content")).toHaveTextContent("Long release history");
  });

  it("creates and dismisses a polite Sonner notification", async () => {
    const user = userEvent.setup();
    render(
      <GummySonnerProvider timeout={0}>
        <ToastFixture />
      </GummySonnerProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Save project" }));
    expect(await screen.findByText("Project saved")).toBeInTheDocument();
    expect(screen.getByText("The release is ready.")).toBeInTheDocument();
    fireEvent.click(document.querySelector<HTMLButtonElement>(".gummy-toast__close")!);
    expect(screen.queryByText("Project saved")).not.toBeInTheDocument();
  });
});
