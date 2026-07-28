"use client";

import * as React from "react";
import {
  GummyAccordion,
  GummyAccordionHeader,
  GummyAccordionItem,
  GummyAccordionPanel,
  GummyAccordionTrigger,
} from "./radix/GummyAccordion";
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
} from "./radix/GummyAlertDialog";
import {
  GummyCollapsible,
  GummyCollapsiblePanel,
  GummyCollapsibleTrigger,
} from "./radix/GummyCollapsible";
import {
  GummyContextMenu,
  GummyContextMenuItem,
  GummyContextMenuPopup,
  GummyContextMenuPortal,
  GummyContextMenuPositioner,
  GummyContextMenuTrigger,
} from "./radix/GummyContextMenu";
import {
  GummyDialog,
  GummyDialogBackdrop,
  GummyDialogClose,
  GummyDialogDescription,
  GummyDialogPopup,
  GummyDialogPortal,
  GummyDialogTitle,
  GummyDialogTrigger,
  GummyDialogViewport,
} from "./radix/GummyDialog";
import { GummyDirection } from "./radix/GummyDirection";
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
} from "./radix/GummyDrawer";
import {
  GummyDropdownMenu,
  GummyDropdownMenuItem,
  GummyDropdownMenuPopup,
  GummyDropdownMenuPortal,
  GummyDropdownMenuPositioner,
  GummyDropdownMenuTrigger,
} from "./radix/GummyDropdownMenu";
import {
  GummyHoverCard,
  GummyHoverCardPopup,
  GummyHoverCardPortal,
  GummyHoverCardPositioner,
  GummyHoverCardTrigger,
} from "./radix/GummyHoverCard";
import {
  GummyMenubar,
  GummyMenubarItem,
  GummyMenubarMenu,
  GummyMenubarPopup,
  GummyMenubarPortal,
  GummyMenubarPositioner,
  GummyMenubarTrigger,
} from "./radix/GummyMenubar";
import {
  GummyNavigationMenu,
  GummyNavigationMenuContent,
  GummyNavigationMenuItem,
  GummyNavigationMenuLink,
  GummyNavigationMenuList,
  GummyNavigationMenuTrigger,
} from "./radix/GummyNavigationMenu";
import {
  GummyPopover,
  GummyPopoverClose,
  GummyPopoverDescription,
  GummyPopoverPopup,
  GummyPopoverPortal,
  GummyPopoverPositioner,
  GummyPopoverTitle,
  GummyPopoverTrigger,
} from "./radix/GummyPopover";
import {
  GummyScrollArea,
  GummyScrollAreaContent,
  GummyScrollAreaScrollbar,
  GummyScrollAreaThumb,
  GummyScrollAreaViewport,
} from "./radix/GummyScrollArea";
import {
  GummySelect,
  GummySelectItem,
  GummySelectList,
  GummySelectPopup,
  GummySelectPortal,
  GummySelectPositioner,
  GummySelectTrigger,
} from "./radix/GummySelect";
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
} from "./radix/GummySheet";
import {
  GummySlider,
  GummySliderControl,
  GummySliderLabel,
  GummySliderThumb,
  GummySliderValue,
} from "./radix/GummySlider";
import {
  GummySonnerProvider,
  GummyToaster,
  useGummyToast,
} from "./radix/GummySonner";
import { GummySwitch } from "./radix/GummySwitch";
import {
  GummyTab,
  GummyTabPanel,
  GummyTabs,
  GummyTabsList,
} from "./radix/GummyTabs";
import { GummyToggle } from "./radix/GummyToggle";
import {
  GummyToggleGroup,
  GummyToggleGroupItem,
} from "./radix/GummyToggleGroup";
import {
  GummyTooltip,
  GummyTooltipPopup,
  GummyTooltipPortal,
  GummyTooltipPositioner,
  GummyTooltipProvider,
  GummyTooltipTrigger,
} from "./radix/GummyTooltip";

type PreviewRenderer = () => React.ReactNode;

function RadixToastDemo() {
  const toast = useGummyToast();
  return (
    <>
      <button
        type="button"
        className="gummy-overlay-trigger"
        onClick={() =>
          toast.add({
            title: "Release published",
            description: "The protected archive is ready.",
            type: "success",
          })}
      >
        Show notification
      </button>
      <GummyToaster />
    </>
  );
}

const previewRenderers: Readonly<Record<string, PreviewRenderer>> = {
  accordion: () => (
    <GummyAccordion defaultValue={["delivery"]}>
      <GummyAccordionItem value="delivery">
        <GummyAccordionHeader>
          <GummyAccordionTrigger>What ships?</GummyAccordionTrigger>
        </GummyAccordionHeader>
        <GummyAccordionPanel>Editable React source and shared material styles.</GummyAccordionPanel>
      </GummyAccordionItem>
    </GummyAccordion>
  ),
  "alert-dialog": () => (
    <GummyAlertDialog>
      <GummyAlertDialogTrigger>Delete draft</GummyAlertDialogTrigger>
      <GummyAlertDialogPortal>
        <GummyAlertDialogBackdrop />
        <GummyAlertDialogViewport>
          <GummyAlertDialogPopup>
            <GummyAlertDialogTitle>Delete this draft?</GummyAlertDialogTitle>
            <GummyAlertDialogDescription>This cannot be undone.</GummyAlertDialogDescription>
            <GummyAlertDialogClose>Keep draft</GummyAlertDialogClose>
          </GummyAlertDialogPopup>
        </GummyAlertDialogViewport>
      </GummyAlertDialogPortal>
    </GummyAlertDialog>
  ),
  collapsible: () => (
    <GummyCollapsible defaultOpen>
      <GummyCollapsibleTrigger>Release details</GummyCollapsibleTrigger>
      <GummyCollapsiblePanel>Version 1.0 includes future updates while subscribed.</GummyCollapsiblePanel>
    </GummyCollapsible>
  ),
  "context-menu": () => (
    <GummyContextMenu>
      <GummyContextMenuTrigger>Right-click for project actions</GummyContextMenuTrigger>
      <GummyContextMenuPortal>
        <GummyContextMenuPositioner>
          <GummyContextMenuPopup>
            <GummyContextMenuItem>Edit project</GummyContextMenuItem>
            <GummyContextMenuItem>Duplicate project</GummyContextMenuItem>
          </GummyContextMenuPopup>
        </GummyContextMenuPositioner>
      </GummyContextMenuPortal>
    </GummyContextMenu>
  ),
  dialog: () => (
    <GummyDialog>
      <GummyDialogTrigger>Open release</GummyDialogTrigger>
      <GummyDialogPortal>
        <GummyDialogBackdrop />
        <GummyDialogViewport>
          <GummyDialogPopup>
            <GummyDialogTitle>Release ready</GummyDialogTitle>
            <GummyDialogDescription>Review the version before publishing.</GummyDialogDescription>
            <GummyDialogClose>Close</GummyDialogClose>
          </GummyDialogPopup>
        </GummyDialogViewport>
      </GummyDialogPortal>
    </GummyDialog>
  ),
  direction: () => (
    <GummyDirection direction="rtl">
      <p>واجهة قابلة للتحرير من اليمين إلى اليسار.</p>
    </GummyDirection>
  ),
  drawer: () => (
    <GummyDrawer>
      <GummyDrawerTrigger>Open drawer</GummyDrawerTrigger>
      <GummyDrawerPortal>
        <GummyDrawerBackdrop />
        <GummyDrawerViewport>
          <GummyDrawerPopup>
            <GummyDrawerTitle>Mobile task</GummyDrawerTitle>
            <GummyDrawerDescription>Review the current release.</GummyDrawerDescription>
            <GummyDrawerClose>Close</GummyDrawerClose>
          </GummyDrawerPopup>
        </GummyDrawerViewport>
      </GummyDrawerPortal>
    </GummyDrawer>
  ),
  "dropdown-menu": () => (
    <GummyDropdownMenu>
      <GummyDropdownMenuTrigger>Project actions</GummyDropdownMenuTrigger>
      <GummyDropdownMenuPortal>
        <GummyDropdownMenuPositioner>
          <GummyDropdownMenuPopup>
            <GummyDropdownMenuItem>Edit</GummyDropdownMenuItem>
            <GummyDropdownMenuItem>Duplicate</GummyDropdownMenuItem>
          </GummyDropdownMenuPopup>
        </GummyDropdownMenuPositioner>
      </GummyDropdownMenuPortal>
    </GummyDropdownMenu>
  ),
  "hover-card": () => (
    <GummyHoverCard>
      <GummyHoverCardTrigger href="/components">Gummy UI catalogue</GummyHoverCardTrigger>
      <GummyHoverCardPortal>
        <GummyHoverCardPositioner>
          <GummyHoverCardPopup>57 editable component categories.</GummyHoverCardPopup>
        </GummyHoverCardPositioner>
      </GummyHoverCardPortal>
    </GummyHoverCard>
  ),
  menubar: () => (
    <GummyMenubar>
      <GummyMenubarMenu>
        <GummyMenubarTrigger>File</GummyMenubarTrigger>
        <GummyMenubarPortal>
          <GummyMenubarPositioner>
            <GummyMenubarPopup>
              <GummyMenubarItem>New release</GummyMenubarItem>
              <GummyMenubarItem>Archive</GummyMenubarItem>
            </GummyMenubarPopup>
          </GummyMenubarPositioner>
        </GummyMenubarPortal>
      </GummyMenubarMenu>
    </GummyMenubar>
  ),
  "navigation-menu": () => (
    <GummyNavigationMenu label="Product discovery">
      <GummyNavigationMenuList>
        <GummyNavigationMenuItem>
          <GummyNavigationMenuTrigger>Explore</GummyNavigationMenuTrigger>
          <GummyNavigationMenuContent>
            <GummyNavigationMenuLink href="/components">Components</GummyNavigationMenuLink>
          </GummyNavigationMenuContent>
        </GummyNavigationMenuItem>
      </GummyNavigationMenuList>
    </GummyNavigationMenu>
  ),
  popover: () => (
    <GummyPopover>
      <GummyPopoverTrigger>Workspace details</GummyPopoverTrigger>
      <GummyPopoverPortal>
        <GummyPopoverPositioner>
          <GummyPopoverPopup>
            <GummyPopoverTitle>Workspace</GummyPopoverTitle>
            <GummyPopoverDescription>Three active projects.</GummyPopoverDescription>
            <GummyPopoverClose>Close</GummyPopoverClose>
          </GummyPopoverPopup>
        </GummyPopoverPositioner>
      </GummyPopoverPortal>
    </GummyPopover>
  ),
  "scroll-area": () => (
    <GummyScrollArea>
      <GummyScrollAreaViewport aria-label="Release notes">
        <GummyScrollAreaContent>Version 1.0 · Components, blocks, templates, and design kit.</GummyScrollAreaContent>
      </GummyScrollAreaViewport>
      <GummyScrollAreaScrollbar>
        <GummyScrollAreaThumb />
      </GummyScrollAreaScrollbar>
    </GummyScrollArea>
  ),
  select: () => (
    <GummySelect defaultValue="raspberry">
      <GummySelectTrigger aria-label="Raspberry, accent fruit" />
      <GummySelectPortal>
        <GummySelectPositioner>
          <GummySelectPopup>
            <GummySelectList>
              <GummySelectItem value="raspberry">Raspberry</GummySelectItem>
              <GummySelectItem value="grape">Grape</GummySelectItem>
            </GummySelectList>
          </GummySelectPopup>
        </GummySelectPositioner>
      </GummySelectPortal>
    </GummySelect>
  ),
  sheet: () => (
    <GummySheet>
      <GummySheetTrigger>Open settings</GummySheetTrigger>
      <GummySheetPortal>
        <GummySheetBackdrop />
        <GummySheetViewport>
          <GummySheetPopup>
            <GummySheetTitle>Settings</GummySheetTitle>
            <GummySheetDescription>Update workspace preferences.</GummySheetDescription>
            <GummySheetClose>Close</GummySheetClose>
          </GummySheetPopup>
        </GummySheetViewport>
      </GummySheetPortal>
    </GummySheet>
  ),
  slider: () => (
    <GummySlider defaultValue={60}>
      <GummySliderLabel>Opacity <GummySliderValue /></GummySliderLabel>
      <GummySliderControl>
        <GummySliderThumb aria-label="Opacity" />
      </GummySliderControl>
    </GummySlider>
  ),
  sonner: () => (
    <GummySonnerProvider>
      <RadixToastDemo />
    </GummySonnerProvider>
  ),
  switch: () => (
    <GummySwitch label="Automatic updates" description="Install compatible releases." />
  ),
  tabs: () => (
    <GummyTabs defaultValue="preview">
      <GummyTabsList aria-label="Component views">
        <GummyTab value="preview">Preview</GummyTab>
        <GummyTab value="source">Source</GummyTab>
      </GummyTabsList>
      <GummyTabPanel value="preview">Interactive component preview.</GummyTabPanel>
      <GummyTabPanel value="source">Editable TypeScript source.</GummyTabPanel>
    </GummyTabs>
  ),
  toggle: () => <GummyToggle aria-label="Pin release">Pin release</GummyToggle>,
  "toggle-group": () => (
    <GummyToggleGroup label="Alignment" defaultValue={["left"]}>
      <GummyToggleGroupItem value="left">Left</GummyToggleGroupItem>
      <GummyToggleGroupItem value="center">Center</GummyToggleGroupItem>
      <GummyToggleGroupItem value="right">Right</GummyToggleGroupItem>
    </GummyToggleGroup>
  ),
  tooltip: () => (
    <GummyTooltipProvider delay={0}>
      <GummyTooltip>
        <GummyTooltipTrigger>Archive</GummyTooltipTrigger>
        <GummyTooltipPortal>
          <GummyTooltipPositioner>
            <GummyTooltipPopup>Archive project</GummyTooltipPopup>
          </GummyTooltipPositioner>
        </GummyTooltipPortal>
      </GummyTooltip>
    </GummyTooltipProvider>
  ),
};

export function RadixComponentInspector({
  slug,
  componentName,
}: {
  slug: string;
  componentName: string;
}) {
  const renderPreview = previewRenderers[slug];
  if (!renderPreview) return null;
  return (
    <section className="component-inspector" aria-labelledby="radix-preview-title">
      <div className="component-detail__section-heading">
        <p className="showcase-kicker">Radix UI counterpart</p>
        <h2 id="radix-preview-title">Try {componentName} with Radix UI</h2>
      </div>
      <p>
        This is the real separately installable Radix source using the same
        Gummy material and behavior contract.
      </p>
      <div className="component-inspector__preview">{renderPreview()}</div>
    </section>
  );
}
