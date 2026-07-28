"use client";

// Loaded only after a reader explicitly requests the interactive preview.

import * as React from "react";
import {
  GummyAccordion,
  GummyAccordionHeader,
  GummyAccordionItem,
  GummyAccordionPanel,
  GummyAccordionTrigger,
} from "./ui/GummyAccordion";
import {
  GummyAlert,
  GummyAlertDescription,
  GummyAlertTitle,
} from "./ui/GummyAlert";
import {
  GummyAlertDialog,
  GummyAlertDialogBackdrop,
  GummyAlertDialogClose,
  GummyAlertDialogDescription,
  GummyAlertDialogPopup,
  GummyAlertDialogPortal,
  GummyAlertDialogTitle,
  GummyAlertDialogTrigger,
  GummyAlertDialogViewport,
} from "./ui/GummyAlertDialog";
import { GummyAspectRatio } from "./ui/GummyAspectRatio";
import { GummyAvatar, GummyAvatarGroup } from "./ui/GummyAvatar";
import { GummyBadge } from "./ui/GummyBadge";
import {
  GummyBreadcrumb,
  GummyBreadcrumbEllipsis,
  GummyBreadcrumbItem,
  GummyBreadcrumbLink,
  GummyBreadcrumbPage,
  GummyBreadcrumbSeparator,
} from "./ui/GummyBreadcrumb";
import { GummyButton } from "./ui/GummyButton";
import {
  GummyButtonGroup,
  GummyButtonGroupSeparator,
  GummyButtonGroupText,
} from "./ui/GummyButtonGroup";
import { GummyCalendar } from "./ui/GummyCalendar";
import {
  GummyCardButton,
  GummyCardContent,
  GummyCardDescription,
  GummyCardFooter,
  GummyCardHeader,
  GummyCardIcon,
  GummyCardTitle,
} from "./ui/GummyCard";
import {
  GummyCarousel,
  GummyCarouselContent,
  GummyCarouselIndicators,
  GummyCarouselItem,
  GummyCarouselNext,
  GummyCarouselPrevious,
} from "./ui/GummyCarousel";
import { GummyCheckbox } from "./ui/GummyCheckbox";
import {
  GummyCollapsible,
  GummyCollapsiblePanel,
  GummyCollapsibleTrigger,
} from "./ui/GummyCollapsible";
import {
  GummyCombobox,
  GummyComboboxEmpty,
  GummyComboboxInput,
  GummyComboboxInputGroup,
  GummyComboboxItem,
  GummyComboboxList,
  GummyComboboxPopup,
  GummyComboboxPortal,
  GummyComboboxPositioner,
  GummyComboboxTrigger,
} from "./ui/GummyCombobox";
import {
  GummyCommand,
  GummyCommandGroup,
  GummyCommandInput,
  GummyCommandItem,
  GummyCommandList,
  GummyCommandShortcut,
} from "./ui/GummyCommand";
import {
  GummyContextMenu,
  GummyContextMenuItem,
  GummyContextMenuPopup,
  GummyContextMenuPortal,
  GummyContextMenuPositioner,
  GummyContextMenuTrigger,
} from "./ui/GummyContextMenu";
import {
  GummyDataTable,
  type GummyDataTableColumn,
} from "./ui/GummyDataTable";
import { GummyDatePicker } from "./ui/GummyDatePicker";
import {
  GummyDialog,
  GummyDialogBackdrop,
  GummyDialogClose,
  GummyDialogDescription,
  GummyDialogPopup,
  GummyDialogPortal,
  GummyDialogSurface,
  GummyDialogTitle,
  GummyDialogTrigger,
  GummyDialogViewport,
} from "./ui/GummyDialog";
import { GummyDirection } from "./ui/GummyDirection";
import {
  GummyDrawer,
  GummyDrawerBackdrop,
  GummyDrawerClose,
  GummyDrawerDescription,
  GummyDrawerPopup,
  GummyDrawerPortal,
  GummyDrawerTitle,
  GummyDrawerTrigger,
  GummyDrawerViewport,
} from "./ui/GummyDrawer";
import {
  GummyDropdownMenu,
  GummyDropdownMenuItem,
  GummyDropdownMenuPopup,
  GummyDropdownMenuPortal,
  GummyDropdownMenuPositioner,
  GummyDropdownMenuTrigger,
} from "./ui/GummyDropdownMenu";
import {
  GummyEmpty,
  GummyEmptyActions,
  GummyEmptyDescription,
  GummyEmptyMedia,
  GummyEmptyTitle,
} from "./ui/GummyEmpty";
import { GummyField } from "./ui/GummyField";
import {
  GummyHoverCard,
  GummyHoverCardPopup,
  GummyHoverCardPortal,
  GummyHoverCardPositioner,
  GummyHoverCardTrigger,
} from "./ui/GummyHoverCard";
import { GummyInput } from "./ui/GummyInput";
import {
  GummyInputGroup,
  GummyInputGroupAddon,
  GummyInputGroupButton,
  GummyInputGroupControl,
} from "./ui/GummyInputGroup";
import { GummyInputOTP } from "./ui/GummyInputOTP";
import {
  GummyItemActions,
  GummyItemContent,
  GummyItemDescription,
  GummyItemLink,
  GummyItemMedia,
  GummyItemTitle,
} from "./ui/GummyItem";
import { GummyKbd, GummyKbdGroup } from "./ui/GummyKbd";
import { GummyLabel } from "./ui/GummyLabel";
import {
  GummyMenubar,
  GummyMenubarItem,
  GummyMenubarMenu,
  GummyMenubarPopup,
  GummyMenubarPortal,
  GummyMenubarPositioner,
  GummyMenubarTrigger,
} from "./ui/GummyMenubar";
import { GummyNativeSelect } from "./ui/GummyNativeSelect";
import {
  GummyNavigationMenu,
  GummyNavigationMenuContent,
  GummyNavigationMenuItem,
  GummyNavigationMenuLink,
  GummyNavigationMenuList,
  GummyNavigationMenuPopup,
  GummyNavigationMenuPortal,
  GummyNavigationMenuPositioner,
  GummyNavigationMenuTrigger,
  GummyNavigationMenuViewport,
} from "./ui/GummyNavigationMenu";
import {
  GummyPagination,
  GummyPaginationEllipsis,
  GummyPaginationItem,
  GummyPaginationLink,
  GummyPaginationNext,
  GummyPaginationPrevious,
} from "./ui/GummyPagination";
import {
  GummyPopover,
  GummyPopoverClose,
  GummyPopoverDescription,
  GummyPopoverPopup,
  GummyPopoverPortal,
  GummyPopoverPositioner,
  GummyPopoverTitle,
  GummyPopoverTrigger,
} from "./ui/GummyPopover";
import { GummyProgress } from "./ui/GummyProgress";
import {
  GummyRadioGroup,
  GummyRadioItem,
} from "./ui/GummyRadioGroup";
import {
  GummyResizableHandle,
  GummyResizablePanel,
  GummyResizablePanelGroup,
} from "./ui/GummyResizable";
import {
  GummyScrollArea,
  GummyScrollAreaContent,
  GummyScrollAreaScrollbar,
  GummyScrollAreaThumb,
  GummyScrollAreaViewport,
} from "./ui/GummyScrollArea";
import {
  GummySelect,
  GummySelectItem,
  GummySelectList,
  GummySelectPopup,
  GummySelectPortal,
  GummySelectPositioner,
  GummySelectTrigger,
} from "./ui/GummySelect";
import { GummySeparator } from "./ui/GummySeparator";
import {
  GummySheet,
  GummySheetBackdrop,
  GummySheetClose,
  GummySheetDescription,
  GummySheetPopup,
  GummySheetPortal,
  GummySheetTitle,
  GummySheetTrigger,
  GummySheetViewport,
} from "./ui/GummySheet";
import {
  GummySidebar,
  GummySidebarContent,
  GummySidebarGroup,
  GummySidebarGroupLabel,
  GummySidebarInset,
  GummySidebarMenu,
  GummySidebarMenuItem,
  GummySidebarMenuLink,
  GummySidebarPanel,
  GummySidebarTrigger,
} from "./ui/GummySidebar";
import {
  GummySkeleton,
  GummySkeletonGroup,
} from "./ui/GummySkeleton";
import {
  GummySlider,
  GummySliderControl,
  GummySliderLabel,
  GummySliderThumb,
  GummySliderValue,
} from "./ui/GummySlider";
import {
  GummySonnerProvider,
  GummyToaster,
  useGummyToast,
} from "./ui/GummySonner";
import { GummySpinner } from "./ui/GummySpinner";
import { GummySwitch } from "./ui/GummySwitch";
import {
  GummyTable,
  GummyTableBody,
  GummyTableCaption,
  GummyTableCell,
  GummyTableHead,
  GummyTableHeader,
  GummyTableRow,
} from "./ui/GummyTable";
import {
  GummyTab,
  GummyTabPanel,
  GummyTabs,
  GummyTabsList,
} from "./ui/GummyTabs";
import { GummyTextarea } from "./ui/GummyTextarea";
import { GummyToggle } from "./ui/GummyToggle";
import {
  GummyToggleGroup,
  GummyToggleGroupItem,
} from "./ui/GummyToggleGroup";
import {
  GummyTooltip,
  GummyTooltipPopup,
  GummyTooltipPortal,
  GummyTooltipPositioner,
  GummyTooltipProvider,
  GummyTooltipTrigger,
} from "./ui/GummyTooltip";
import {
  GummyBlockquote,
  GummyEyebrow,
  GummyHeading,
  GummyInlineCode,
  GummyText,
} from "./ui/GummyTypography";

type PreviewRenderer = () => React.ReactNode;
type PreviewViewport = "compact" | "tablet" | "fluid";
type PreviewTheme = "light" | "dark";
type PreviewDirection = "ltr" | "rtl";

type PreviewRelease = {
  id: string;
  name: string;
  status: string;
};

const previewReleases: PreviewRelease[] = [
  { id: "beacon", name: "Beacon", status: "Review" },
  { id: "atlas", name: "Atlas", status: "Live" },
  { id: "cedar", name: "Cedar", status: "Draft" },
];

const previewReleaseColumns: GummyDataTableColumn<PreviewRelease>[] = [
  {
    id: "name",
    header: "Release",
    cell: (release) => release.name,
    sortValue: (release) => release.name,
  },
  {
    id: "status",
    header: "Status",
    cell: (release) => release.status,
    filterValue: (release) => release.status,
  },
];

function InspectorToastDemo() {
  const toast = useGummyToast();
  return (
    <>
      <GummyButton
        onClick={() => toast.add({
          title: "Release published",
          description: "Beacon is now available to the workspace.",
          type: "success",
        })}
      >
        Publish release
      </GummyButton>
      <GummyToaster />
    </>
  );
}

export const componentPreviewRenderers: Readonly<Record<string, PreviewRenderer>> = {
  accordion: () => (
    <GummyAccordion defaultValue={["details"]}>
      <GummyAccordionItem value="details">
        <GummyAccordionHeader>
          <GummyAccordionTrigger>What ships with the component?</GummyAccordionTrigger>
        </GummyAccordionHeader>
        <GummyAccordionPanel>Editable source, documented behavior, and shared Gel Pop material.</GummyAccordionPanel>
      </GummyAccordionItem>
      <GummyAccordionItem value="delivery">
        <GummyAccordionHeader>
          <GummyAccordionTrigger>How is it delivered?</GummyAccordionTrigger>
        </GummyAccordionHeader>
        <GummyAccordionPanel>Install it from the public registry, then edit it in your application.</GummyAccordionPanel>
      </GummyAccordionItem>
    </GummyAccordion>
  ),
  alert: () => (
    <GummyAlert variant="success" live="polite">
      <GummyAlertTitle>Release checks passed</GummyAlertTitle>
      <GummyAlertDescription>The component is ready for a final review.</GummyAlertDescription>
    </GummyAlert>
  ),
  "alert-dialog": () => (
    <GummyAlertDialog>
      <GummyAlertDialogTrigger>Delete draft</GummyAlertDialogTrigger>
      <GummyAlertDialogPortal>
        <GummyAlertDialogBackdrop />
        <GummyAlertDialogViewport>
          <GummyAlertDialogPopup>
            <GummyAlertDialogTitle>Delete this draft?</GummyAlertDialogTitle>
            <GummyAlertDialogDescription>Review notes attached to this draft will also be removed.</GummyAlertDialogDescription>
            <div className="component-inspector__actions">
              <GummyAlertDialogClose render={<GummyButton variant="secondary" />}>Keep draft</GummyAlertDialogClose>
              <GummyAlertDialogClose render={<GummyButton />}>Delete draft</GummyAlertDialogClose>
            </div>
          </GummyAlertDialogPopup>
        </GummyAlertDialogViewport>
      </GummyAlertDialogPortal>
    </GummyAlertDialog>
  ),
  "aspect-ratio": () => (
    <GummyAspectRatio ratio={16 / 9}>
      <div className="component-inspector__media">
        <span>16:9</span>
        <strong>Product preview</strong>
      </div>
    </GummyAspectRatio>
  ),
  avatar: () => (
    <GummyAvatarGroup label="Review team">
      <GummyAvatar fallback="AM" alt="Ava Morgan" status="online" statusLabel="Ava is online" />
      <GummyAvatar fallback="SR" alt="Sam Rivera" status="busy" statusLabel="Sam is busy" />
      <GummyAvatar fallback="JL" alt="Jordan Lee" status="away" statusLabel="Jordan is away" />
    </GummyAvatarGroup>
  ),
  badge: () => (
    <div className="component-inspector__row">
      <GummyBadge variant="success" dot motion="none">Ready</GummyBadge>
      <GummyBadge variant="warning" finish="translucent" motion="none">In review</GummyBadge>
    </div>
  ),
  breadcrumb: () => (
    <GummyBreadcrumb label="Component location">
      <GummyBreadcrumbItem><GummyBreadcrumbLink href="/">Home</GummyBreadcrumbLink></GummyBreadcrumbItem>
      <GummyBreadcrumbSeparator />
      <GummyBreadcrumbEllipsis />
      <GummyBreadcrumbSeparator />
      <GummyBreadcrumbItem><GummyBreadcrumbPage>Breadcrumb</GummyBreadcrumbPage></GummyBreadcrumbItem>
    </GummyBreadcrumb>
  ),
  button: () => (
    <div className="component-inspector__row">
      <GummyButton>Publish release</GummyButton>
      <GummyButton variant="secondary">Save draft</GummyButton>
    </div>
  ),
  "button-group": () => (
    <GummyButtonGroup label="Document actions">
      <GummyButton>Save</GummyButton>
      <GummyButtonGroupSeparator />
      <GummyButton variant="secondary">Share</GummyButton>
      <GummyButtonGroupText>⌘ S</GummyButtonGroupText>
    </GummyButtonGroup>
  ),
  calendar: () => (
    <GummyCalendar
      defaultMonth={new Date(2026, 6, 1)}
      defaultValue={new Date(2026, 6, 15)}
      label="Choose a review date"
    />
  ),
  card: () => (
    <GummyCardButton className="component-inspector__card">
      <GummyCardHeader>
        <GummyCardIcon aria-hidden="true">↗</GummyCardIcon>
        <div>
          <GummyCardTitle>Project pulse</GummyCardTitle>
          <GummyCardDescription>Weekly delivery is on track.</GummyCardDescription>
        </div>
      </GummyCardHeader>
      <GummyCardContent>Six deliverables moved forward with no blocked reviews.</GummyCardContent>
      <GummyCardFooter><span>Updated today</span><strong>Healthy</strong></GummyCardFooter>
    </GummyCardButton>
  ),
  carousel: () => (
    <GummyCarousel itemCount={3} label="Featured releases">
      <GummyCarouselContent>
        <GummyCarouselItem index={0}><strong>Beacon</strong><p>Research synthesis and delivery signals.</p></GummyCarouselItem>
        <GummyCarouselItem index={1}><strong>Atlas</strong><p>One map for the complete product system.</p></GummyCarouselItem>
        <GummyCarouselItem index={2}><strong>Cedar</strong><p>Calm review flows for dense decisions.</p></GummyCarouselItem>
      </GummyCarouselContent>
      <div className="component-inspector__carousel-controls">
        <GummyCarouselPrevious />
        <GummyCarouselIndicators />
        <GummyCarouselNext />
      </div>
    </GummyCarousel>
  ),
  checkbox: () => (
    <GummyCheckbox
      label="Weekly delivery digest"
      description="Receive one calm summary every Friday."
      defaultChecked
    />
  ),
  collapsible: () => (
    <GummyCollapsible>
      <GummyCollapsibleTrigger>Show advanced settings</GummyCollapsibleTrigger>
      <GummyCollapsiblePanel>Review policy, release channel, and notification controls.</GummyCollapsiblePanel>
    </GummyCollapsible>
  ),
  combobox: () => (
    <GummyCombobox items={["Raspberry", "Grape", "Lime", "Aqua"]}>
      <GummyComboboxInputGroup>
        <GummyComboboxInput aria-label="Choose an accent fruit" placeholder="Search fruit…" />
        <GummyComboboxTrigger />
      </GummyComboboxInputGroup>
      <GummyComboboxPortal>
        <GummyComboboxPositioner>
          <GummyComboboxPopup>
            <GummyComboboxEmpty>No fruit found.</GummyComboboxEmpty>
            <GummyComboboxList>
              {(fruit: string) => <GummyComboboxItem key={fruit} value={fruit}>{fruit}</GummyComboboxItem>}
            </GummyComboboxList>
          </GummyComboboxPopup>
        </GummyComboboxPositioner>
      </GummyComboboxPortal>
    </GummyCombobox>
  ),
  command: () => (
    <GummyCommand label="Project commands">
      <GummyCommandInput aria-label="Search project commands" placeholder="Type a command…" />
      <GummyCommandList>
        <GummyCommandGroup label="Project">
          <GummyCommandItem value="Create project">Create project<GummyCommandShortcut>⌘N</GummyCommandShortcut></GummyCommandItem>
          <GummyCommandItem value="Archive project">Archive project<GummyCommandShortcut>⌘A</GummyCommandShortcut></GummyCommandItem>
        </GummyCommandGroup>
      </GummyCommandList>
    </GummyCommand>
  ),
  "context-menu": () => (
    <GummyContextMenu>
      <GummyContextMenuTrigger tabIndex={0}>Right-click or press Shift+F10 on this project canvas</GummyContextMenuTrigger>
      <GummyContextMenuPortal>
        <GummyContextMenuPositioner>
          <GummyContextMenuPopup>
            <GummyContextMenuItem>Duplicate project</GummyContextMenuItem>
            <GummyContextMenuItem>Move to archive</GummyContextMenuItem>
          </GummyContextMenuPopup>
        </GummyContextMenuPositioner>
      </GummyContextMenuPortal>
    </GummyContextMenu>
  ),
  "data-table": () => (
    <GummyDataTable
      rows={previewReleases}
      columns={previewReleaseColumns}
      getRowId={(release) => release.id}
      getRowLabel={(release) => release.name}
      caption="Release readiness"
      pageSize={2}
      selectable
    />
  ),
  "date-picker": () => (
    <GummyDatePicker label="Review date" defaultValue={new Date(2026, 6, 15)} />
  ),
  dialog: () => (
    <GummyDialog>
      <GummyDialogTrigger>Open release notes</GummyDialogTrigger>
      <GummyDialogPortal>
        <GummyDialogBackdrop />
        <GummyDialogViewport>
          <GummyDialogPopup>
            <GummyDialogSurface>
              <GummyDialogTitle>Release notes</GummyDialogTitle>
              <GummyDialogDescription>Review the final summary before publishing.</GummyDialogDescription>
              <GummyDialogClose>Close</GummyDialogClose>
            </GummyDialogSurface>
          </GummyDialogPopup>
        </GummyDialogViewport>
      </GummyDialogPortal>
    </GummyDialog>
  ),
  direction: () => (
    <GummyDirection direction="rtl">
      <GummyHeading level={3} size="subsection">مساحة العمل</GummyHeading>
      <GummyText tone="soft">تتبع المحاذاة والحواف اتجاه القراءة.</GummyText>
    </GummyDirection>
  ),
  drawer: () => (
    <GummyDrawer>
      <GummyDrawerTrigger>Open quick actions</GummyDrawerTrigger>
      <GummyDrawerPortal>
        <GummyDrawerBackdrop />
        <GummyDrawerViewport>
          <GummyDrawerPopup>
            <GummyDrawerTitle>Quick actions</GummyDrawerTitle>
            <GummyDrawerDescription>Choose a common project action without leaving this page.</GummyDrawerDescription>
            <GummyDrawerClose render={<GummyButton variant="secondary" />}>Close</GummyDrawerClose>
          </GummyDrawerPopup>
        </GummyDrawerViewport>
      </GummyDrawerPortal>
    </GummyDrawer>
  ),
  "dropdown-menu": () => (
    <GummyDropdownMenu>
      <GummyDropdownMenuTrigger>Sort projects</GummyDropdownMenuTrigger>
      <GummyDropdownMenuPortal>
        <GummyDropdownMenuPositioner>
          <GummyDropdownMenuPopup>
            <GummyDropdownMenuItem>Newest first</GummyDropdownMenuItem>
            <GummyDropdownMenuItem>Oldest first</GummyDropdownMenuItem>
            <GummyDropdownMenuItem>Most active</GummyDropdownMenuItem>
          </GummyDropdownMenuPopup>
        </GummyDropdownMenuPositioner>
      </GummyDropdownMenuPortal>
    </GummyDropdownMenu>
  ),
  empty: () => (
    <GummyEmpty>
      <GummyEmptyMedia>○</GummyEmptyMedia>
      <GummyEmptyTitle>No review notes yet</GummyEmptyTitle>
      <GummyEmptyDescription>Add the first note to start a focused review.</GummyEmptyDescription>
      <GummyEmptyActions><GummyButton>Add note</GummyButton></GummyEmptyActions>
    </GummyEmpty>
  ),
  field: () => (
    <GummyField label="Workspace name" description="Shown to collaborators." required>
      <input name="inspector-workspace" defaultValue="GrapeLab" />
    </GummyField>
  ),
  "hover-card": () => (
    <GummyHoverCard>
      <GummyHoverCardTrigger render={<a href="#component-preview-title" />}>Ava Morgan</GummyHoverCardTrigger>
      <GummyHoverCardPortal>
        <GummyHoverCardPositioner>
          <GummyHoverCardPopup>
            <GummyAvatar fallback="AM" status="online" statusLabel="Ava is online" />
            <GummyHeading level={3} size="subsection">Ava Morgan</GummyHeading>
            <GummyText size="small" tone="soft">Product designer reviewing component accessibility.</GummyText>
          </GummyHoverCardPopup>
        </GummyHoverCardPositioner>
      </GummyHoverCardPortal>
    </GummyHoverCard>
  ),
  input: () => (
    <GummyInput
      label="Team slug"
      name="inspector-team-slug"
      defaultValue="design-systems"
      description="Use lowercase letters and hyphens."
    />
  ),
  "input-group": () => (
    <GummyInputGroup>
      <GummyInputGroupAddon>https://</GummyInputGroupAddon>
      <GummyInputGroupControl aria-label="Workspace domain" defaultValue="grapelab.co" />
      <GummyInputGroupButton>Copy</GummyInputGroupButton>
    </GummyInputGroup>
  ),
  "input-otp": () => (
    <GummyInputOTP label="Verification code" name="inspector-verification-code" defaultValue="2741" />
  ),
  item: () => (
    <GummyItemLink href="#component-preview-title" selected>
      <GummyItemMedia aria-hidden="true">◆</GummyItemMedia>
      <GummyItemContent>
        <GummyItemTitle>Beacon release</GummyItemTitle>
        <GummyItemDescription>Ready for final review</GummyItemDescription>
      </GummyItemContent>
      <GummyItemActions aria-hidden="true">→</GummyItemActions>
    </GummyItemLink>
  ),
  kbd: () => (
    <GummyKbdGroup aria-label="Save shortcut">
      <GummyKbd>⌘</GummyKbd>
      <span aria-hidden="true">+</span>
      <GummyKbd>S</GummyKbd>
    </GummyKbdGroup>
  ),
  label: () => (
    <div className="component-inspector__native-field">
      <GummyLabel htmlFor="inspector-company" required>Company name</GummyLabel>
      <input id="inspector-company" defaultValue="GrapeLab" />
    </div>
  ),
  menubar: () => (
    <GummyMenubar>
      <GummyMenubarMenu>
        <GummyMenubarTrigger>File</GummyMenubarTrigger>
        <GummyMenubarPortal><GummyMenubarPositioner><GummyMenubarPopup><GummyMenubarItem>New project</GummyMenubarItem><GummyMenubarItem>Export</GummyMenubarItem></GummyMenubarPopup></GummyMenubarPositioner></GummyMenubarPortal>
      </GummyMenubarMenu>
      <GummyMenubarMenu>
        <GummyMenubarTrigger>Edit</GummyMenubarTrigger>
        <GummyMenubarPortal><GummyMenubarPositioner><GummyMenubarPopup><GummyMenubarItem>Undo</GummyMenubarItem><GummyMenubarItem>Redo</GummyMenubarItem></GummyMenubarPopup></GummyMenubarPositioner></GummyMenubarPortal>
      </GummyMenubarMenu>
    </GummyMenubar>
  ),
  "native-select": () => (
    <GummyNativeSelect label="Data region" name="inspector-region" defaultValue="eu" description="New project data is stored here.">
      <option value="eu">Europe · London</option>
      <option value="us">United States · Virginia</option>
    </GummyNativeSelect>
  ),
  "navigation-menu": () => (
    <GummyNavigationMenu label="Product discovery">
      <GummyNavigationMenuList>
        <GummyNavigationMenuItem value="components">
          <GummyNavigationMenuTrigger>Components</GummyNavigationMenuTrigger>
          <GummyNavigationMenuContent>
            <GummyNavigationMenuLink href="/components">Browse canonical components</GummyNavigationMenuLink>
            <GummyNavigationMenuLink href="/docs">Read installation guidance</GummyNavigationMenuLink>
          </GummyNavigationMenuContent>
        </GummyNavigationMenuItem>
      </GummyNavigationMenuList>
      <GummyNavigationMenuPortal>
        <GummyNavigationMenuPositioner>
          <GummyNavigationMenuPopup><GummyNavigationMenuViewport /></GummyNavigationMenuPopup>
        </GummyNavigationMenuPositioner>
      </GummyNavigationMenuPortal>
    </GummyNavigationMenu>
  ),
  pagination: () => (
    <GummyPagination label="Component pages">
      <GummyPaginationItem><GummyPaginationPrevious href="#component-preview-page-1" /></GummyPaginationItem>
      <GummyPaginationItem><GummyPaginationLink href="#component-preview-page-1">1</GummyPaginationLink></GummyPaginationItem>
      <GummyPaginationItem><GummyPaginationLink href="#component-preview-page-2" current>2</GummyPaginationLink></GummyPaginationItem>
      <GummyPaginationItem><GummyPaginationEllipsis /></GummyPaginationItem>
      <GummyPaginationItem><GummyPaginationNext href="#component-preview-page-3" /></GummyPaginationItem>
    </GummyPagination>
  ),
  popover: () => (
    <GummyPopover>
      <GummyPopoverTrigger>Workspace details</GummyPopoverTrigger>
      <GummyPopoverPortal>
        <GummyPopoverPositioner>
          <GummyPopoverPopup>
            <GummyPopoverTitle>GrapeLab</GummyPopoverTitle>
            <GummyPopoverDescription>Three active projects and six collaborators.</GummyPopoverDescription>
            <GummyPopoverClose>Close</GummyPopoverClose>
          </GummyPopoverPopup>
        </GummyPopoverPositioner>
      </GummyPopoverPortal>
    </GummyPopover>
  ),
  progress: () => (
    <GummyProgress label="Release readiness" value={72} tone="aqua" />
  ),
  "radio-group": () => (
    <GummyRadioGroup label="Default visibility" name="inspector-visibility" defaultValue="team" orientation="horizontal">
      <GummyRadioItem value="team" label="Team only" />
      <GummyRadioItem value="invite" label="Invite only" />
      <GummyRadioItem value="public" label="Public" />
    </GummyRadioGroup>
  ),
  resizable: () => (
    <GummyResizablePanelGroup defaultSize={38} minSize={24} maxSize={76}>
      <GummyResizablePanel order="first"><strong>Navigation</strong><p>Projects<br />Reviews<br />Releases</p></GummyResizablePanel>
      <GummyResizableHandle />
      <GummyResizablePanel order="second"><strong>Canvas</strong><p>The content plane remains stable while the boundary moves.</p></GummyResizablePanel>
    </GummyResizablePanelGroup>
  ),
  "scroll-area": () => (
    <GummyScrollArea style={{ height: 190 }}>
      <GummyScrollAreaViewport aria-label="Release history">
        <GummyScrollAreaContent>
          {Array.from({ length: 8 }, (_, index) => (
            <p key={index}><strong>Version 0.{9 - index}</strong><br />Material, behavior, docs, and registry checks passed.</p>
          ))}
        </GummyScrollAreaContent>
      </GummyScrollAreaViewport>
      <GummyScrollAreaScrollbar><GummyScrollAreaThumb /></GummyScrollAreaScrollbar>
    </GummyScrollArea>
  ),
  select: () => (
    <GummySelect
      items={[
        { label: "Raspberry", value: "Raspberry" },
        { label: "Grape", value: "Grape" },
        { label: "Lime", value: "Lime" },
      ]}
      defaultValue="Grape"
    >
      <GummySelectTrigger aria-label="Grape, accent fruit" />
      <GummySelectPortal>
        <GummySelectPositioner>
          <GummySelectPopup>
            <GummySelectList>
              {["Raspberry", "Grape", "Lime"].map((fruit) => <GummySelectItem key={fruit} value={fruit}>{fruit}</GummySelectItem>)}
            </GummySelectList>
          </GummySelectPopup>
        </GummySelectPositioner>
      </GummySelectPortal>
    </GummySelect>
  ),
  separator: () => (
    <div className="component-inspector__separator-example">
      <span>Overview</span>
      <GummySeparator />
      <span>Activity</span>
    </div>
  ),
  sheet: () => (
    <GummySheet>
      <GummySheetTrigger>Open filters</GummySheetTrigger>
      <GummySheetPortal>
        <GummySheetBackdrop />
        <GummySheetViewport>
          <GummySheetPopup side="right">
            <GummySheetTitle>Filter projects</GummySheetTitle>
            <GummySheetDescription>Narrow the current project list.</GummySheetDescription>
            <GummySheetClose render={<GummyButton variant="secondary" />}>Done</GummySheetClose>
          </GummySheetPopup>
        </GummySheetViewport>
      </GummySheetPortal>
    </GummySheet>
  ),
  sidebar: () => (
    <GummySidebar>
      <GummySidebarPanel label="GrapeLab workspace">
        <GummySidebarContent>
          <GummySidebarGroup>
            <GummySidebarGroupLabel>Workspace</GummySidebarGroupLabel>
            <GummySidebarMenu>
              <GummySidebarMenuItem><GummySidebarMenuLink href="#component-preview-title" current>Projects</GummySidebarMenuLink></GummySidebarMenuItem>
              <GummySidebarMenuItem><GummySidebarMenuLink href="#component-preview-title">Reviews</GummySidebarMenuLink></GummySidebarMenuItem>
            </GummySidebarMenu>
          </GummySidebarGroup>
        </GummySidebarContent>
        <GummySidebarTrigger />
      </GummySidebarPanel>
      <GummySidebarInset as="div"><strong>Project canvas</strong><p>Primary content stays distinct from navigation.</p></GummySidebarInset>
    </GummySidebar>
  ),
  skeleton: () => (
    <GummySkeletonGroup label="Loading project summary">
      <GummySkeleton style={{ width: "42%" }} />
      <GummySkeleton style={{ width: "100%" }} />
      <GummySkeleton style={{ width: "76%" }} />
    </GummySkeletonGroup>
  ),
  slider: () => (
    <GummySlider defaultValue={64}>
      <GummySliderLabel>Material intensity</GummySliderLabel>
      <GummySliderValue />
      <GummySliderControl><GummySliderThumb /></GummySliderControl>
    </GummySlider>
  ),
  sonner: () => (
    <GummySonnerProvider><InspectorToastDemo /></GummySonnerProvider>
  ),
  spinner: () => (
    <div className="component-inspector__row">
      <GummySpinner label="Publishing release" />
      <span>Publishing release…</span>
    </div>
  ),
  switch: () => (
    <GummySwitch label="Weekly digest" description="Send one summary every Friday." defaultChecked />
  ),
  table: () => (
    <div className="component-inspector__table-wrap">
      <GummyTable>
        <GummyTableCaption>Token contrast review</GummyTableCaption>
        <GummyTableHeader><GummyTableRow><GummyTableHead>Token</GummyTableHead><GummyTableHead>State</GummyTableHead></GummyTableRow></GummyTableHeader>
        <GummyTableBody>
          <GummyTableRow><GummyTableCell>Aqua focus</GummyTableCell><GummyTableCell>Pass</GummyTableCell></GummyTableRow>
          <GummyTableRow><GummyTableCell>Grape rim</GummyTableCell><GummyTableCell>Pass</GummyTableCell></GummyTableRow>
        </GummyTableBody>
      </GummyTable>
    </div>
  ),
  tabs: () => (
    <GummyTabs defaultValue="overview">
      <GummyTabsList aria-label="Workspace sections">
        <GummyTab value="overview">Overview</GummyTab>
        <GummyTab value="activity">Activity</GummyTab>
        <GummyTab value="team">Team</GummyTab>
      </GummyTabsList>
      <GummyTabPanel value="overview">Delivery is on track across six active workstreams.</GummyTabPanel>
      <GummyTabPanel value="activity">Three reviews were completed today.</GummyTabPanel>
      <GummyTabPanel value="team">Nine collaborators are active.</GummyTabPanel>
    </GummyTabs>
  ),
  textarea: () => (
    <GummyTextarea
      label="Project summary"
      name="inspector-summary"
      defaultValue="A focused workspace for design-system reviews and release decisions."
      maxLength={140}
      showCount
    />
  ),
  toggle: () => (
    <GummyToggle aria-label="Pin project">Pin project</GummyToggle>
  ),
  "toggle-group": () => (
    <GummyToggleGroup label="Text alignment" defaultValue={["left"]}>
      <GummyToggleGroupItem value="left">Left</GummyToggleGroupItem>
      <GummyToggleGroupItem value="center">Center</GummyToggleGroupItem>
      <GummyToggleGroupItem value="right">Right</GummyToggleGroupItem>
    </GummyToggleGroup>
  ),
  tooltip: () => (
    <GummyTooltipProvider>
      <GummyTooltip>
        <GummyTooltipTrigger render={<button type="button" />}>Archive project</GummyTooltipTrigger>
        <GummyTooltipPortal>
          <GummyTooltipPositioner>
            <GummyTooltipPopup>Moves this project out of active views</GummyTooltipPopup>
          </GummyTooltipPositioner>
        </GummyTooltipPortal>
      </GummyTooltip>
    </GummyTooltipProvider>
  ),
  typography: () => (
    <div className="component-inspector__type-example">
      <GummyEyebrow>Release quality</GummyEyebrow>
      <GummyHeading level={3} size="section">Interfaces can feel deliberate.</GummyHeading>
      <GummyText tone="soft">Use <GummyInlineCode>GummyText</GummyInlineCode> for readable product copy.</GummyText>
      <GummyBlockquote>Behavior stays familiar while the material earns attention.</GummyBlockquote>
    </div>
  ),
};

export const componentPreviewSlugs = Object.freeze(
  Object.keys(componentPreviewRenderers),
);

const viewportOptions: ReadonlyArray<{ value: PreviewViewport; label: string }> = [
  { value: "compact", label: "320px" },
  { value: "tablet", label: "768px" },
  { value: "fluid", label: "Fluid" },
];

export function ComponentInspector({
  slug,
  componentName,
}: {
  slug: string;
  componentName: string;
}) {
  const [viewport, setViewport] = React.useState<PreviewViewport>("fluid");
  const [theme, setTheme] = React.useState<PreviewTheme>("light");
  const [direction, setDirection] = React.useState<PreviewDirection>("ltr");
  const renderPreview = componentPreviewRenderers[slug];

  if (!renderPreview) return null;

  return (
    <section className="component-inspector" aria-labelledby="component-preview-title">
      <header className="component-inspector__heading">
        <div>
          <p className="showcase-kicker">Interactive inspection</p>
          <h2 id="component-preview-title">Try {componentName} in context</h2>
        </div>
        <p>Resize the canvas, switch its theme, or reverse its reading direction without changing the rest of the page.</p>
      </header>

      <div
        className="component-inspector__toolbar"
        role="group"
        aria-label={`${componentName} preview controls`}
      >
        <div className="component-inspector__control-group" role="group" aria-label="Preview width">
          <span>Width</span>
          {viewportOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={viewport === option.value}
              onClick={() => setViewport(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="component-inspector__control-group" role="group" aria-label="Preview theme">
          <span>Theme</span>
          {(["light", "dark"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={theme === option}
              onClick={() => setTheme(option)}
            >
              {option === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>
        <div className="component-inspector__control-group" role="group" aria-label="Preview direction">
          <span>Direction</span>
          {(["ltr", "rtl"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={direction === option}
              onClick={() => setDirection(option)}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="component-inspector__canvas">
        <div
          className="component-inspector__viewport"
          data-preview-direction={direction}
          data-preview-theme={theme}
          data-preview-viewport={viewport}
          dir={direction}
        >
          <GummyDirection direction={direction}>
            <div className="component-inspector__stage" data-component-preview={slug}>
              {renderPreview()}
            </div>
          </GummyDirection>
        </div>
      </div>
      <p className="gummy-visually-hidden" aria-live="polite">
        {componentName} preview: {viewport === "fluid" ? "fluid width" : viewport === "compact" ? "320 pixels" : "768 pixels"}, {theme} theme, {direction === "ltr" ? "left to right" : "right to left"}.
      </p>
    </section>
  );
}
