"use client";

import Image from "next/image";
import * as React from "react";
import {
  GummyBadge,
  type GummyBadgeFinish,
  type GummyBadgeMotion,
  type GummyBadgeVariant,
} from "./ui/GummyBadge";
import { GummyButton } from "./ui/GummyButton";
import {
  GummyCard,
  GummyCardButton,
  GummyCardContent,
  GummyCardDescription,
  GummyCardFooter,
  GummyCardHeader,
  GummyCardIcon,
  GummyCardLink,
  GummyCardTitle,
  type GummyCardElevation,
} from "./ui/GummyCard";
import { GummyInput } from "./ui/GummyInput";
import { GummySwitch } from "./ui/GummySwitch";
import {
  GummyTab,
  GummyTabPanel,
  GummyTabs,
  GummyTabsList,
} from "./ui/GummyTabs";
import {
  GummyDropdownMenu,
  GummyDropdownMenuItem,
  GummyDropdownMenuPopup,
  GummyDropdownMenuPortal,
  GummyDropdownMenuPositioner,
  GummyDropdownMenuSeparator,
  GummyDropdownMenuTrigger,
} from "./ui/GummyDropdownMenu";
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
import { GummyLabel } from "./ui/GummyLabel";
import { GummyField } from "./ui/GummyField";
import { GummyTextarea } from "./ui/GummyTextarea";
import { GummyCheckbox } from "./ui/GummyCheckbox";
import {
  GummyRadioGroup,
  GummyRadioItem,
} from "./ui/GummyRadioGroup";
import { GummyNativeSelect } from "./ui/GummyNativeSelect";
import { GummyAspectRatio } from "./ui/GummyAspectRatio";
import { GummyKbd, GummyKbdGroup } from "./ui/GummyKbd";
import { GummySeparator } from "./ui/GummySeparator";
import {
  GummySkeleton,
  GummySkeletonGroup,
} from "./ui/GummySkeleton";
import { GummySpinner } from "./ui/GummySpinner";
import {
  GummyBlockquote,
  GummyEyebrow,
  GummyHeading,
  GummyInlineCode,
  GummyText,
} from "./ui/GummyTypography";
import {
  GummyAlert,
  GummyAlertDescription,
  GummyAlertTitle,
} from "./ui/GummyAlert";
import { GummyAvatar, GummyAvatarGroup } from "./ui/GummyAvatar";
import {
  GummyEmpty,
  GummyEmptyActions,
  GummyEmptyDescription,
  GummyEmptyMedia,
  GummyEmptyTitle,
} from "./ui/GummyEmpty";
import {
  GummyItemActions,
  GummyItemContent,
  GummyItemDescription,
  GummyItemLink,
  GummyItemMedia,
  GummyItemTitle,
} from "./ui/GummyItem";
import { GummyProgress } from "./ui/GummyProgress";
import {
  GummyAccordion,
  GummyAccordionHeader,
  GummyAccordionItem,
  GummyAccordionPanel,
  GummyAccordionTrigger,
} from "./ui/GummyAccordion";
import {
  GummyBreadcrumb,
  GummyBreadcrumbEllipsis,
  GummyBreadcrumbItem,
  GummyBreadcrumbLink,
  GummyBreadcrumbPage,
  GummyBreadcrumbSeparator,
} from "./ui/GummyBreadcrumb";
import {
  GummyCollapsible,
  GummyCollapsiblePanel,
  GummyCollapsibleTrigger,
} from "./ui/GummyCollapsible";
import {
  GummyPagination,
  GummyPaginationEllipsis,
  GummyPaginationItem,
  GummyPaginationLink,
  GummyPaginationNext,
  GummyPaginationPrevious,
} from "./ui/GummyPagination";
import {
  GummyButtonGroup,
  GummyButtonGroupSeparator,
  GummyButtonGroupText,
} from "./ui/GummyButtonGroup";
import {
  GummySlider,
  GummySliderControl,
  GummySliderLabel,
  GummySliderThumb,
  GummySliderValue,
} from "./ui/GummySlider";
import { GummyToggle } from "./ui/GummyToggle";
import {
  GummyToggleGroup,
  GummyToggleGroupItem,
} from "./ui/GummyToggleGroup";
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
  GummyHoverCard,
  GummyHoverCardPopup,
  GummyHoverCardPortal,
  GummyHoverCardPositioner,
  GummyHoverCardTrigger,
} from "./ui/GummyHoverCard";
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
  GummyTooltip,
  GummyTooltipPopup,
  GummyTooltipPortal,
  GummyTooltipPositioner,
  GummyTooltipProvider,
  GummyTooltipTrigger,
} from "./ui/GummyTooltip";
import {
  GummyContextMenu,
  GummyContextMenuItem,
  GummyContextMenuPopup,
  GummyContextMenuPortal,
  GummyContextMenuPositioner,
  GummyContextMenuTrigger,
} from "./ui/GummyContextMenu";
import {
  GummyMenubar,
  GummyMenubarItem,
  GummyMenubarMenu,
  GummyMenubarPopup,
  GummyMenubarPortal,
  GummyMenubarPositioner,
  GummyMenubarTrigger,
} from "./ui/GummyMenubar";
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
  GummySidebar,
  GummySidebarContent,
  GummySidebarGroup,
  GummySidebarGroupLabel,
  GummySidebarHeader,
  GummySidebarInset,
  GummySidebarMenu,
  GummySidebarMenuItem,
  GummySidebarMenuLink,
  GummySidebarPanel,
  GummySidebarTrigger,
} from "./ui/GummySidebar";
import { GummyCalendar } from "./ui/GummyCalendar";
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
import { GummyDatePicker } from "./ui/GummyDatePicker";
import {
  GummyInputGroup,
  GummyInputGroupAddon,
  GummyInputGroupButton,
  GummyInputGroupControl,
} from "./ui/GummyInputGroup";
import { GummyInputOTP } from "./ui/GummyInputOTP";
import {
  GummySelect,
  GummySelectItem,
  GummySelectList,
  GummySelectPopup,
  GummySelectPortal,
  GummySelectPositioner,
  GummySelectTrigger,
} from "./ui/GummySelect";
import {
  GummyCarousel,
  GummyCarouselContent,
  GummyCarouselIndicators,
  GummyCarouselItem,
  GummyCarouselNext,
  GummyCarouselPrevious,
} from "./ui/GummyCarousel";
import {
  GummyDataTable,
  type GummyDataTableColumn,
} from "./ui/GummyDataTable";
import { GummyDirection } from "./ui/GummyDirection";
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
  GummySonnerProvider,
  GummyToaster,
  useGummyToast,
} from "./ui/GummySonner";
import {
  GummyTable,
  GummyTableBody,
  GummyTableCaption,
  GummyTableCell,
  GummyTableHead,
  GummyTableHeader,
  GummyTableRow,
} from "./ui/GummyTable";

const badgeVariants: readonly GummyBadgeVariant[] = [
  "neutral",
  "primary",
  "secondary",
  "success",
  "warning",
  "info",
];

const badgeLabels: Record<GummyBadgeVariant, string> = {
  neutral: "Neutral",
  primary: "Primary",
  secondary: "Secondary",
  success: "Success",
  warning: "Warning",
  info: "Info",
};

type LabRelease = {
  id: string;
  name: string;
  status: string;
  score: number;
};

const labReleases: LabRelease[] = [
  { id: "beacon", name: "Beacon", status: "Review", score: 72 },
  { id: "atlas", name: "Atlas", status: "Live", score: 95 },
  { id: "cedar", name: "Cedar", status: "Draft", score: 61 },
];

const labReleaseColumns: GummyDataTableColumn<LabRelease>[] = [
  { id: "name", header: "Release", cell: (release) => release.name, sortValue: (release) => release.name },
  { id: "status", header: "Status", cell: (release) => release.status, filterValue: (release) => release.status },
  { id: "score", header: "Score", cell: (release) => release.score, sortValue: (release) => release.score, align: "end" },
];

function LabToastDemo() {
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

function ThemeToggle() {
  function toggleTheme() {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("gummy-theme", nextTheme);
  }

  return (
    <button
      type="button"
      className="lab-theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle light and dark theme"
    >
      <span className="lab-theme-toggle__light" aria-hidden="true">◐</span>
      <span className="lab-theme-toggle__dark" aria-hidden="true">☀</span>
      <span>Theme</span>
    </button>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  id: string;
}) {
  return (
    <div className="lab-section__heading">
      <div>
        <p className="lab-kicker">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  );
}

function Specimen({
  title,
  detail,
  children,
  className = "",
}: {
  title: string;
  detail: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`specimen ${className}`}>
      <div className="specimen__stage">{children}</div>
      <div className="specimen__copy">
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function ProjectCardBody() {
  return (
    <>
      <GummyCardHeader>
        <GummyCardIcon aria-hidden="true">
          <svg viewBox="0 0 36 26" focusable="false">
            <path d="M3 19L13 7L23 17L33 6" />
          </svg>
        </GummyCardIcon>
        <div>
          <GummyCardTitle>Project pulse</GummyCardTitle>
          <GummyCardDescription>Weekly delivery is on track.</GummyCardDescription>
        </div>
      </GummyCardHeader>
      <GummyCardContent>
        <dl className="card-metrics">
          <div><dt>Shipped</dt><dd>24</dd></div>
          <div><dt>In review</dt><dd>6</dd></div>
          <div><dt>At risk</dt><dd>2</dd></div>
        </dl>
      </GummyCardContent>
      <GummyCardFooter>
        <span>Updated 12 min ago</span>
        <span className="card-demo__report">View report <span aria-hidden="true">›</span></span>
      </GummyCardFooter>
    </>
  );
}

function InputWorkbench() {
  const [status, setStatus] = React.useState<"default" | "error" | "success">("default");
  const [disabled, setDisabled] = React.useState(false);
  const [readOnly, setReadOnly] = React.useState(false);
  const [adornments, setAdornments] = React.useState(true);

  return (
    <div className="workbench">
      <form className="workbench__controls" onSubmit={(event) => event.preventDefault()}>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="default">Default</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>
        </label>
        <label className="native-check">
          <input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} />
          <span>Disabled</span>
        </label>
        <label className="native-check">
          <input type="checkbox" checked={readOnly} onChange={(event) => setReadOnly(event.target.checked)} />
          <span>Read only</span>
        </label>
        <label className="native-check">
          <input type="checkbox" checked={adornments} onChange={(event) => setAdornments(event.target.checked)} />
          <span>Adornments</span>
        </label>
      </form>
      <div className="workbench__stage">
        <GummyInput
          label="Workspace URL"
          name="workspace-url"
          type="url"
          autoComplete="url"
          placeholder="acme-studio"
          description="Use lowercase letters and hyphens."
          errorMessage={status === "error" ? "That workspace URL is already in use." : undefined}
          successMessage={status === "success" ? "This workspace URL is available." : undefined}
          disabled={disabled}
          readOnly={readOnly}
          leadingAdornment={adornments ? "https://" : undefined}
          trailingAdornment={adornments ? ".gummy.dev" : undefined}
        />
      </div>
    </div>
  );
}

function BadgeWorkbench() {
  const [variant, setVariant] = React.useState<GummyBadgeVariant>("primary");
  const [finish, setFinish] = React.useState<GummyBadgeFinish>("solid");
  const [motion, setMotion] = React.useState<GummyBadgeMotion>("alive");
  const [dot, setDot] = React.useState(true);
  const [replayCount, setReplayCount] = React.useState(0);

  return (
    <div className="compact-workbench">
      <form className="compact-workbench__controls" onSubmit={(event) => event.preventDefault()}>
        <label>
          <span>Variant</span>
          <select value={variant} onChange={(event) => setVariant(event.target.value as GummyBadgeVariant)}>
            {badgeVariants.map((item) => <option value={item} key={item}>{badgeLabels[item]}</option>)}
          </select>
        </label>
        <label>
          <span>Finish</span>
          <select value={finish} onChange={(event) => setFinish(event.target.value as GummyBadgeFinish)}>
            <option value="solid">Classic Gummy</option>
            <option value="translucent">High-transmission</option>
          </select>
        </label>
        <label>
          <span>Motion</span>
          <select value={motion} onChange={(event) => setMotion(event.target.value as GummyBadgeMotion)}>
            <option value="alive">Alive</option>
            <option value="settle">One-shot settle</option>
            <option value="none">Static</option>
          </select>
        </label>
        <label className="native-check">
          <input type="checkbox" checked={dot} onChange={(event) => setDot(event.target.checked)} />
          <span>Status dot</span>
        </label>
        <div className="badge-motion-control">
          <GummyButton size="small" variant="secondary" onClick={() => setReplayCount((count) => count + 1)}>
            Replay motion
          </GummyButton>
          <span>Ambient gel motion · no false hover affordance</span>
        </div>
      </form>
      <div className="compact-workbench__stage">
        <GummyBadge
          key={`${variant}-${finish}-${motion}-${dot}-${replayCount}`}
          variant={variant}
          finish={finish}
          motion={motion}
          dot={dot}
        >
          Ready for review
        </GummyBadge>
      </div>
    </div>
  );
}

function CardWorkbench() {
  const [elevation, setElevation] = React.useState<GummyCardElevation>("default");
  const [selected, setSelected] = React.useState(false);
  const [interaction, setInteraction] = React.useState<"none" | "link" | "button">("link");
  const [activations, setActivations] = React.useState(0);
  const sharedProps = { elevation, selected, className: "card-demo card-demo--workbench" };
  const cardBody = <ProjectCardBody />;

  return (
    <div className="workbench">
      <form className="workbench__controls" onSubmit={(event) => event.preventDefault()}>
        <label>
          <span>Elevation</span>
          <select value={elevation} onChange={(event) => setElevation(event.target.value as GummyCardElevation)}>
            <option value="default">Default</option>
            <option value="elevated">Elevated</option>
          </select>
        </label>
        <label>
          <span>Element</span>
          <select value={interaction} onChange={(event) => setInteraction(event.target.value as typeof interaction)}>
            <option value="none">Article</option>
            <option value="link">Link</option>
            <option value="button">Button</option>
          </select>
        </label>
        <label className="native-check">
          <input type="checkbox" checked={selected} onChange={(event) => setSelected(event.target.checked)} />
          <span>Selected</span>
        </label>
        <p className="activation-status" aria-live="polite">Button activations <strong>{activations}</strong></p>
      </form>
      <div className="workbench__stage">
        {interaction === "link" ? (
          <GummyCardLink {...sharedProps} href="#card-review-gate">
            {cardBody}
          </GummyCardLink>
        ) : interaction === "button" ? (
          <GummyCardButton {...sharedProps} onClick={() => setActivations((count) => count + 1)}>
            {cardBody}
          </GummyCardButton>
        ) : (
          <GummyCard {...sharedProps}>{cardBody}</GummyCard>
        )}
      </div>
    </div>
  );
}

function SwitchWorkbench() {
  const [checked, setChecked] = React.useState(true);
  const [disabled, setDisabled] = React.useState(false);

  return (
    <div className="workbench">
      <form className="workbench__controls" onSubmit={(event) => event.preventDefault()}>
        <label className="native-check">
          <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
          <span>Checked</span>
        </label>
        <label className="native-check">
          <input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} />
          <span>Disabled</span>
        </label>
        <p className="activation-status">State <strong>{checked ? "On" : "Off"}</strong></p>
      </form>
      <div className="workbench__stage">
        <GummySwitch
          checked={checked}
          onCheckedChange={setChecked}
          disabled={disabled}
          label="Weekly digest"
          description="Receive one calm summary every Friday."
        />
      </div>
    </div>
  );
}

function TabsDemo() {
  return (
    <GummyTabs className="tabs-demo" defaultValue="overview">
      <GummyTabsList aria-label="Project sections">
        <GummyTab value="overview">Overview</GummyTab>
        <GummyTab value="activity">Activity</GummyTab>
        <GummyTab value="settings">Settings</GummyTab>
      </GummyTabsList>
      <GummyTabPanel value="overview">
        <strong>Project overview</strong>
        <p>Delivery is on track, with twenty-four items shipped and six awaiting review.</p>
      </GummyTabPanel>
      <GummyTabPanel value="activity">
        <strong>Recent activity</strong>
        <p>The shared gel pool moves with selection while the labels and reading area stay still.</p>
      </GummyTabPanel>
      <GummyTabPanel value="settings">
        <strong>Project settings</strong>
        <p>Use arrow keys, Home, and End to move through this real tab list.</p>
      </GummyTabPanel>
    </GummyTabs>
  );
}

function DropdownDemo({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [sort, setSort] = React.useState("Newest");
  const menuItems = [
    { label: "Newest", accessibleLabel: "Newest first", icon: "clock" },
    { label: "Oldest", accessibleLabel: "Oldest first", icon: "history" },
    { label: "Most active", accessibleLabel: "Most active first", icon: "trend" },
  ] as const;

  return (
    <GummyDropdownMenu open={defaultOpen ? true : undefined} modal={false}>
      <GummyDropdownMenuTrigger>
        Sort · {sort}
      </GummyDropdownMenuTrigger>
      <GummyDropdownMenuPortal>
        <GummyDropdownMenuPositioner align="center">
          <GummyDropdownMenuPopup aria-label="Sort projects">
            {menuItems.map(({ label, accessibleLabel, icon }) => (
              <GummyDropdownMenuItem
                key={label}
                aria-label={accessibleLabel}
                onClick={() => setSort(label)}
                selected={sort === label}
                icon={<span className="gummy-menu-demo-icon" data-icon={icon} />}
              >
                {label}
              </GummyDropdownMenuItem>
            ))}
            <GummyDropdownMenuSeparator />
            <GummyDropdownMenuItem
              data-tone="danger"
              icon={<span className="gummy-menu-demo-icon" data-icon="archive" />}
              onClick={() => undefined}
            >
              Archive project
            </GummyDropdownMenuItem>
          </GummyDropdownMenuPopup>
        </GummyDropdownMenuPositioner>
      </GummyDropdownMenuPortal>
    </GummyDropdownMenu>
  );
}

function DialogPreviewContents() {
  return (
    <>
      <span className="gummy-dialog__close gummy-dialog__close--icon">×</span>
      <h3 className="gummy-dialog__title">Archive project?</h3>
      <p className="gummy-dialog__description">You can restore it later. Your current collaborators will lose access until then.</p>
      <div className="gummy-dialog__actions">
        <span className="gummy-button" data-size="small" data-variant="secondary" data-finish="gel">
          <span className="gummy-button__body"><span className="gummy-button__content"><span>Keep project</span></span></span>
        </span>
        <span className="gummy-button" data-size="small" data-variant="primary" data-finish="gel">
          <span className="gummy-button__body"><span className="gummy-button__content"><span>Archive</span></span></span>
        </span>
      </div>
    </>
  );
}

function DialogDemo() {
  return (
    <GummyDialog>
      <GummyDialogTrigger>Open archive dialog</GummyDialogTrigger>
      <GummyDialogPortal>
        <GummyDialogBackdrop />
        <GummyDialogViewport>
          <GummyDialogPopup>
            <GummyDialogClose className="gummy-dialog__close--icon" aria-label="Close dialog">×</GummyDialogClose>
            <GummyDialogTitle>Archive project?</GummyDialogTitle>
            <GummyDialogDescription>You can restore it later. Your current collaborators will lose access until then.</GummyDialogDescription>
            <div className="gummy-dialog__actions">
              <GummyDialogClose render={<GummyButton size="small" variant="secondary" />}>
                Keep project
              </GummyDialogClose>
              <GummyDialogClose render={<GummyButton size="small" />}>
                Archive
              </GummyDialogClose>
            </div>
          </GummyDialogPopup>
        </GummyDialogViewport>
      </GummyDialogPortal>
    </GummyDialog>
  );
}

function Stage3ComposedForm() {
  const [summary, setSummary] = React.useState(
    "A focused workspace for component reviews, accessibility notes, and release decisions.",
  );
  const [visibility, setVisibility] = React.useState("team");
  const [region, setRegion] = React.useState("eu-west");
  const [digest, setDigest] = React.useState(true);

  return (
    <form
      className="stage3-composed-form"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="stage3-composed-form__heading">
        <div>
          <p className="lab-kicker">Realistic composition</p>
          <h3>Workspace details</h3>
        </div>
        <span>Autosaved locally</span>
      </div>
      <div className="stage3-composed-form__grid">
        <GummyField
          label="Workspace name"
          description="Shown in project navigation and invites."
          required
        >
          <input
            name="workspace-name"
            autoComplete="organization"
            defaultValue="GrapeLab"
          />
        </GummyField>
        <GummyNativeSelect
          label="Data region"
          name="data-region"
          value={region}
          onChange={(event) => setRegion(event.currentTarget.value)}
          description="New project data is stored here."
        >
          <option value="eu-west">Europe · London</option>
          <option value="us-east">United States · Virginia</option>
          <option value="ap-southeast">Asia Pacific · Singapore</option>
        </GummyNativeSelect>
        <GummyTextarea
          wrapperClassName="stage3-composed-form__wide"
          label="Project summary"
          name="project-summary"
          value={summary}
          onChange={(event) => setSummary(event.currentTarget.value)}
          maxLength={180}
          showCount
          description="Help collaborators understand the purpose of this workspace."
        />
        <GummyRadioGroup
          label="Default visibility"
          name="visibility"
          value={visibility}
          onValueChange={setVisibility}
          orientation="horizontal"
          description="You can override this on individual projects."
        >
          <GummyRadioItem value="team" label="Team only" />
          <GummyRadioItem value="invite" label="Invite only" />
          <GummyRadioItem value="public" label="Public" />
        </GummyRadioGroup>
        <GummyCheckbox
          checked={digest}
          onCheckedChange={(checked) => setDigest(checked === true)}
          label="Weekly delivery digest"
          description="One summary every Friday; never a stream of alerts."
        />
      </div>
      <div className="stage3-composed-form__actions">
        <GummyButton variant="secondary">Cancel</GummyButton>
        <GummyButton type="submit">Save workspace</GummyButton>
      </div>
    </form>
  );
}

export function ComponentLab() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to component specimens</a>

      <header className="lab-header">
        <a href="#main-content" className="lab-brand">
          <span className="lab-brand__mark" aria-hidden="true">g</span>
          <span>Gummy UI</span>
          <span className="lab-brand__tag">Component Lab</span>
        </a>
        <div className="lab-header__status">
          <span><i /> Stage 3 · free catalogue complete</span>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="lab-shell">
        <section className="lab-intro" aria-labelledby="lab-title">
          <div>
            <p className="lab-kicker">Stage 3 · free catalogue groups 01–09</p>
            <h1 id="lab-title">Foundations that feel<br />deliberate.</h1>
            <p className="lab-intro__lede">
              Form, layout, type, loading, and media primitives extend the
              approved material into calm, credible product interfaces. Fifty-seven canonical components
              now feed the Lab, documentation, and installable registry. React source—not reference artwork—remains canonical.
            </p>
          </div>
          <div className="lab-intro__measure" aria-label="Group review status">
            <span>Canonical foundations</span>
            <strong>57</strong>
            <p><b>All nine Stage 3 dependency groups are complete.</b><br />Every launch component category is represented by live public source.</p>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="label-title">
          <SectionHeading
            eyebrow="Stage 3 · semantic foundation"
            title="Gummy Label"
            id="label-title"
            description={<>A real <code>label</code> with restrained required, optional, disabled, and read-only cues. Click any live label to move focus to its associated control.</>}
          />
          <div className="stage3-state-grid stage3-state-grid--labels">
            <Specimen title="Default" detail="Native label · calm hierarchy">
              <div className="label-demo"><GummyLabel htmlFor="label-default">Workspace name</GummyLabel><input id="label-default" defaultValue="GrapeLab" /></div>
            </Specimen>
            <Specimen title="Hover association" detail="Pointer label targets its control" className="form-preview-hover">
              <div className="label-demo"><GummyLabel htmlFor="label-hover">Company domain</GummyLabel><input id="label-hover" defaultValue="studio.co" /></div>
            </Specimen>
            <Specimen title="Keyboard focus" detail="Focus remains on the associated control" className="form-preview-focus">
              <div className="label-demo"><GummyLabel htmlFor="label-focus">Team slug</GummyLabel><input id="label-focus" defaultValue="product-design" /></div>
            </Specimen>
            <Specimen title="Required" detail="Visible cue supplements native required">
              <div className="label-demo"><GummyLabel htmlFor="label-required" required>Billing email</GummyLabel><input id="label-required" type="email" required defaultValue="ops@grapelab.co" /></div>
            </Specimen>
            <Specimen title="Optional" detail="Optional status stays quiet">
              <div className="label-demo"><GummyLabel htmlFor="label-optional" optional>Job title</GummyLabel><input id="label-optional" defaultValue="Design lead" /></div>
            </Specimen>
            <Specimen title="Read only" detail="State cue without false affordance">
              <div className="label-demo"><GummyLabel htmlFor="label-readonly" readOnly>Organisation ID</GummyLabel><input id="label-readonly" readOnly defaultValue="org_042" /></div>
            </Specimen>
            <Specimen title="Disabled" detail="State mirrors the native control">
              <div className="label-demo"><GummyLabel htmlFor="label-disabled" disabled>Archived workspace</GummyLabel><input id="label-disabled" disabled defaultValue="Northstar" /></div>
            </Specimen>
            <Specimen title="Dense content" detail="Long labels wrap without losing meta">
              <div className="label-demo"><GummyLabel htmlFor="label-dense" required>Primary contact for billing, account recovery, and security notices</GummyLabel><input id="label-dense" required defaultValue="Ava Morgan" /></div>
            </Specimen>
            <Specimen title="RTL" detail="Logical alignment · attached metadata">
              <div className="label-demo" dir="rtl"><GummyLabel htmlFor="label-rtl" required>اسم مساحة العمل</GummyLabel><input id="label-rtl" required defaultValue="فريق التصميم" /></div>
            </Specimen>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="field-title">
          <SectionHeading
            eyebrow="Stage 3 · accessible composition"
            title="Gummy Field"
            id="field-title"
            description="Field composes a visible Label, one native or custom control, descriptions, validation, and state props. The editing plane stays still while connected edge material carries state."
          />
          <div className="stage3-state-grid">
            <Specimen title="Default" detail="Label · control · description">
              <GummyField label="Display name" description="Shown to collaborators."><input name="field-default" placeholder="Ava Morgan" /></GummyField>
            </Specimen>
            <Specimen title="Hover" detail="Fine-pointer lift · connected pool" className="form-preview-hover">
              <GummyField label="Company" description="Your legal organisation name."><input name="field-hover" defaultValue="GrapeLab Ltd" /></GummyField>
            </Specimen>
            <Specimen title="Keyboard focus" detail="Aqua redistributed inside shell" className="form-preview-focus">
              <GummyField label="Team slug"><input name="field-focus" defaultValue="design-systems" /></GummyField>
            </Specimen>
            <Specimen title="Filled / active" detail="Native editing and selection remain stable">
              <GummyField label="Workspace URL" successMessage="This address is available."><input name="field-filled" defaultValue="grapelab" /></GummyField>
            </Specimen>
            <Specimen title="Validation" detail="aria-invalid · errormessage · alert">
              <GummyField label="Tax ID" errorMessage="Enter the registered tax identifier." required><input name="field-error" defaultValue="—" /></GummyField>
            </Specimen>
            <Specimen title="Disabled" detail="Native disabled control">
              <GummyField label="Organisation ID" disabled><input name="field-disabled" defaultValue="org_042" /></GummyField>
            </Specimen>
            <Specimen title="Read only" detail="Focusable and selectable">
              <GummyField label="Account owner" readOnly><input name="field-readonly" defaultValue="Ava Morgan" /></GummyField>
            </Specimen>
            <Specimen title="Dense horizontal" detail="Compact layout · responsive reflow">
              <GummyField label="Invoice reference" orientation="horizontal" density="compact" description="Up to 32 characters."><input name="field-dense" defaultValue="PO-2026-042" /></GummyField>
            </Specimen>
            <Specimen title="RTL" detail="Logical reservoir and content padding">
              <div dir="rtl"><GummyField label="اسم الفريق" description="يظهر لأعضاء مساحة العمل."><input name="field-rtl" defaultValue="فريق التصميم" /></GummyField></div>
            </Specimen>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="textarea-title">
          <SectionHeading
            eyebrow="Stage 3 · multiline editing"
            title="Gummy Textarea"
            id="textarea-title"
            description={<>A native <code>textarea</code> with a stable reading plane, connected lower-end reservoir, resizing policy, live count, and complete validation semantics.</>}
          />
          <div className="stage3-state-grid">
            <Specimen title="Default" detail="Native resize · visible label">
              <GummyTextarea label="Project summary" name="textarea-default" placeholder="Describe the outcome this project should create." />
            </Specimen>
            <Specimen title="Hover" detail="Restrained shell lift" className="form-preview-hover">
              <GummyTextarea label="Internal note" name="textarea-hover" defaultValue="Share context that will help reviewers make a decision." />
            </Specimen>
            <Specimen title="Keyboard focus" detail="Aqua pool stays inside the shell" className="form-preview-focus">
              <GummyTextarea label="Release notes" name="textarea-focus" defaultValue="Improved accessible form foundations." />
            </Specimen>
            <Specimen title="Active with count" detail="Controlled count · maximum length">
              <GummyTextarea label="Short bio" name="textarea-count" defaultValue="Product designer building calm, expressive tools." maxLength={120} showCount />
            </Specimen>
            <Specimen title="Validation" detail="Associated alert · raspberry reservoir">
              <GummyTextarea label="Change reason" name="textarea-error" required errorMessage="Add a reason before requesting approval." />
            </Specimen>
            <Specimen title="Success" detail="Confirmation supplements colour">
              <GummyTextarea label="Review note" name="textarea-success" defaultValue="Keyboard and screen-reader paths verified." successMessage="Saved to the review record." />
            </Specimen>
            <Specimen title="Disabled" detail="Native disabled editing surface">
              <GummyTextarea label="Archived note" name="textarea-disabled" disabled defaultValue="This release has been archived." />
            </Specimen>
            <Specimen title="Read only" detail="Selectable long-form content">
              <GummyTextarea label="Audit record" name="textarea-readonly" readOnly resize="none" defaultValue="Approved by Ava Morgan on 23 July 2026 after accessibility review." />
            </Specimen>
            <Specimen title="RTL dense content" detail="Logical reservoir · stable wrapping">
              <div dir="rtl"><GummyTextarea label="ملخص المشروع" name="textarea-rtl" defaultValue="مساحة عمل هادئة لمراجعة المكونات وقرارات الإصدار." showCount /></div>
            </Specimen>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="checkbox-title">
          <SectionHeading
            eyebrow="Stage 3 · binary native input"
            title="Gummy Checkbox"
            id="checkbox-title"
            description={<>A real checkbox with a 44px target. The compact indicator inherits the approved Switch’s connected material, supports mixed state, and never depends on colour alone.</>}
          />
          <div className="stage3-state-grid stage3-state-grid--compact">
            <Specimen title="Default" detail="Unchecked · native semantics"><GummyCheckbox label="Weekly digest" /></Specimen>
            <Specimen title="Hover" detail="Fine-pointer material response" className="form-preview-hover"><GummyCheckbox label="Product updates" /></Specimen>
            <Specimen title="Keyboard focus" detail="Aqua internal focus" className="form-preview-focus"><GummyCheckbox label="Security alerts" /></Specimen>
            <Specimen title="Checked / active" detail="Lime fill · visible check"><GummyCheckbox label="Weekly digest" defaultChecked /></Specimen>
            <Specimen title="Indeterminate" detail="Mixed state · native property"><GummyCheckbox label="Select all projects" indeterminate /></Specimen>
            <Specimen title="Validation" detail="aria-invalid · associated alert"><GummyCheckbox label="Accept data policy" required errorMessage="Confirm before continuing." /></Specimen>
            <Specimen title="Disabled" detail="Native disabled behavior"><GummyCheckbox label="Managed by administrator" defaultChecked disabled /></Specimen>
            <Specimen title="Read only" detail="Focusable state cannot change"><GummyCheckbox label="Included in contract" checked readOnly /></Specimen>
            <Specimen title="Dense content" detail="Long copy wraps beside fixed target"><GummyCheckbox label="Send a consolidated weekly summary to workspace owners and project leads" description="Includes delivery risk, unresolved reviews, and upcoming milestones." /></Specimen>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="radio-group-title">
          <SectionHeading
            eyebrow="Stage 3 · exclusive native choice"
            title="Gummy Radio Group"
            id="radio-group-title"
            description={<>A native <code>fieldset</code> and same-name radio inputs. Arrow keys, <kbd>Home</kbd>, and <kbd>End</kbd> move selection; horizontal arrows follow RTL direction.</>}
          />
          <div className="stage3-state-grid stage3-state-grid--radio">
            <Specimen title="Default" detail="Legend · description · no selection"><GummyRadioGroup label="Billing cycle" name="radio-default" description="Choose when invoices are issued."><GummyRadioItem value="monthly" label="Monthly" /><GummyRadioItem value="annual" label="Annual" /></GummyRadioGroup></Specimen>
            <Specimen title="Hover" detail="Local indicator response" className="form-preview-hover"><GummyRadioGroup label="Plan" name="radio-hover"><GummyRadioItem value="starter" label="Starter" /><GummyRadioItem value="studio" label="Studio" /></GummyRadioGroup></Specimen>
            <Specimen title="Keyboard focus" detail="Aqua material remains internal" className="form-preview-focus"><GummyRadioGroup label="Access" name="radio-focus" defaultValue="team"><GummyRadioItem value="team" label="Team" /><GummyRadioItem value="invite" label="Invite only" /></GummyRadioGroup></Specimen>
            <Specimen title="Selected / active" detail="Lime dot plus checked semantics"><GummyRadioGroup label="Theme" name="radio-selected" defaultValue="system" orientation="horizontal"><GummyRadioItem value="light" label="Light" /><GummyRadioItem value="dark" label="Dark" /><GummyRadioItem value="system" label="System" /></GummyRadioGroup></Specimen>
            <Specimen title="Validation" detail="Group-level invalid state and alert"><GummyRadioGroup label="Data region" name="radio-error" required errorMessage="Choose where project data is stored."><GummyRadioItem value="eu" label="Europe" /><GummyRadioItem value="us" label="United States" /></GummyRadioGroup></Specimen>
            <Specimen title="Disabled" detail="Fieldset disables descendants"><GummyRadioGroup label="Invoice currency" name="radio-disabled" defaultValue="gbp" disabled><GummyRadioItem value="gbp" label="GBP" /><GummyRadioItem value="eur" label="EUR" /></GummyRadioGroup></Specimen>
            <Specimen title="Read only" detail="Focusable selection stays fixed"><GummyRadioGroup label="Workspace owner" name="radio-readonly" value="ava" readOnly><GummyRadioItem value="ava" label="Ava Morgan" /><GummyRadioItem value="sam" label="Sam Rivera" /></GummyRadioGroup></Specimen>
            <Specimen title="Dense content" detail="Item descriptions preserve scan order"><GummyRadioGroup label="Review policy" name="radio-dense" defaultValue="required"><GummyRadioItem value="required" label="Approval required" description="A reviewer must approve before release." /><GummyRadioItem value="optional" label="Approval optional" description="Teams can release after automated checks." /></GummyRadioGroup></Specimen>
            <Specimen title="RTL horizontal" detail="Arrow direction and logical alignment"><div dir="rtl"><GummyRadioGroup label="الخطة" name="radio-rtl" defaultValue="team" orientation="horizontal"><GummyRadioItem value="personal" label="شخصي" /><GummyRadioItem value="team" label="فريق" /><GummyRadioItem value="studio" label="استوديو" /></GummyRadioGroup></div></Specimen>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="native-select-title">
          <SectionHeading
            eyebrow="Stage 3 · platform picker"
            title="Gummy Native Select"
            id="native-select-title"
            description={<>The platform <code>select</code> keeps familiar keyboard, pointer, touch, and mobile picker behavior. Its chevron sits in one attached trailing reservoir.</>}
          />
          <div className="stage3-state-grid">
            <Specimen title="Default" detail="Native options · calm plane"><GummyNativeSelect label="Team size" name="select-default"><option>1–5 people</option><option>6–20 people</option><option>21–50 people</option></GummyNativeSelect></Specimen>
            <Specimen title="Hover" detail="Fine-pointer shell response" className="form-preview-hover"><GummyNativeSelect label="Workspace role" name="select-hover" defaultValue="editor"><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Administrator</option></GummyNativeSelect></Specimen>
            <Specimen title="Keyboard focus" detail="Aqua attached reservoir" className="form-preview-focus"><GummyNativeSelect label="Timezone" name="select-focus" defaultValue="london"><option value="london">London · UTC+1</option><option value="new-york">New York · UTC−4</option></GummyNativeSelect></Specimen>
            <Specimen title="Active selection" detail="Change with arrows or native picker"><GummyNativeSelect label="Weekly digest" name="select-active" defaultValue="friday" successMessage="Delivery day saved."><option value="monday">Monday</option><option value="friday">Friday</option></GummyNativeSelect></Specimen>
            <Specimen title="Validation" detail="aria-invalid · associated alert"><GummyNativeSelect label="Data region" name="select-error" defaultValue="" required errorMessage="Select a data region."><option value="" disabled>Choose a region</option><option value="eu">Europe</option><option value="us">United States</option></GummyNativeSelect></Specimen>
            <Specimen title="Disabled" detail="Native disabled behavior"><GummyNativeSelect label="Billing currency" name="select-disabled" defaultValue="gbp" disabled><option value="gbp">GBP · Pound sterling</option></GummyNativeSelect></Specimen>
            <Specimen title="Read only" detail="Focusable value cannot be changed"><GummyNativeSelect label="Contract tier" name="select-readonly" defaultValue="studio" readOnly><option value="starter">Starter</option><option value="studio">Studio</option></GummyNativeSelect></Specimen>
            <Specimen title="Dense content" detail="Long options keep text clear"><GummyNativeSelect label="Notification policy" name="select-dense" defaultValue="summary" description="Applied to new projects by default."><option value="summary">One consolidated weekly summary</option><option value="mentions">Only direct mentions and assignments</option><option value="all">Every project update</option></GummyNativeSelect></Specimen>
            <Specimen title="RTL" detail="Native chevron moves to inline end"><div dir="rtl"><GummyNativeSelect label="حجم الفريق" name="select-rtl" defaultValue="small"><option value="small">من ١ إلى ٥ أشخاص</option><option value="medium">من ٦ إلى ٢٠ شخصًا</option></GummyNativeSelect></div></Specimen>
          </div>
        </section>

        <section className="lab-section stage3-composed" aria-labelledby="stage3-composed-title">
          <SectionHeading
            eyebrow="Stage 3 · composed proof"
            title="A calm, realistic form"
            id="stage3-composed-title"
            description="All six foundations are shown at realistic density. Material marks hierarchy and interaction while labels, descriptions, and editing content remain quiet."
          />
          <Stage3ComposedForm />
        </section>

        <section className="lab-section" aria-labelledby="separator-title">
          <SectionHeading
            eyebrow="Stage 3 · layout primitive"
            title="Gummy Separator"
            id="separator-title"
            description="A restrained boundary whose attached aqua pool keeps Gel Pop continuity without competing with adjacent content. Decorative and semantic modes are explicit."
          />
          <div className="primitive-grid">
            <Specimen title="Quiet horizontal" detail="Decorative by default">
              <div className="separator-demo">
                <span>Project overview</span>
                <GummySeparator />
                <span>Recent activity</span>
              </div>
            </Specimen>
            <Specimen title="Semantic horizontal" detail="Exposed to assistive technology">
              <div className="separator-demo">
                <span>Account</span>
                <GummySeparator decorative={false} tone="fruit" />
                <span>Security</span>
              </div>
            </Specimen>
            <Specimen title="Vertical" detail="Logical spacing · fixed reservoir">
              <div className="separator-demo separator-demo--row">
                <span>12 open</span>
                <GummySeparator decorative={false} orientation="vertical" />
                <span>8 shipped</span>
              </div>
            </Specimen>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="typography-title">
          <SectionHeading
            eyebrow="Stage 3 · reading foundation"
            title="Gummy Typography"
            id="typography-title"
            description="Semantic headings and calm body copy carry the editorial side of Gel Pop. Material is limited to compact code and one connected blockquote edge."
          />
          <div className="typography-proof">
            <GummyEyebrow>Workspace pulse · Friday 24 July</GummyEyebrow>
            <GummyHeading level={3} size="title">
              Make product work feel considered.
            </GummyHeading>
            <GummyText size="large" tone="soft">
              Gummy UI combines stable reading planes with selective fruit-gel
              emphasis. Install <GummyInlineCode>gummy-base</GummyInlineCode>{" "}
              once, then keep the source in your product.
            </GummyText>
            <GummyBlockquote citeLabel="Component quality standard">
              Gel intensity communicates emphasis rather than decorating every surface.
            </GummyBlockquote>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="kbd-title">
          <SectionHeading
            eyebrow="Stage 3 · compact instruction"
            title="Gummy Kbd"
            id="kbd-title"
            description="Native keycap semantics with enough internal depth to feel tactile at small scale. Group separators are visual only."
          />
          <div className="primitive-grid">
            <Specimen title="Single key" detail="Semantic kbd element">
              <GummyKbd>Esc</GummyKbd>
            </Specimen>
            <Specimen title="Shortcut" detail="Decorative joiner · named group">
              <GummyKbdGroup aria-label="Command K">
                <GummyKbd>⌘</GummyKbd>
                <GummyKbd>K</GummyKbd>
              </GummyKbdGroup>
            </Specimen>
            <Specimen title="Navigation" detail="Works in instructions and tables">
              <GummyKbdGroup separator="/">
                <GummyKbd>↑</GummyKbd>
                <GummyKbd>↓</GummyKbd>
              </GummyKbdGroup>
            </Specimen>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="spinner-title">
          <SectionHeading
            eyebrow="Stage 3 · named feedback"
            title="Gummy Spinner"
            id="spinner-title"
            description="A compact status indicator with an accessible name and a physical fruit drop. Reduced motion keeps the state visible without rotation."
          />
          <div className="primitive-grid primitive-grid--feedback">
            <Specimen title="Sizes" detail="Small · medium · large">
              <div className="spinner-demo">
                <GummySpinner size="small" label="Loading small preview" />
                <GummySpinner label="Loading preview" tone="grape" />
                <GummySpinner size="large" label="Loading large preview" tone="aqua" />
              </div>
            </Specimen>
            <Specimen title="Button composition" detail="Named once by the action">
              <GummyButton loading loadingText="Saving changes">
                Save changes
              </GummyButton>
            </Specimen>
            <Specimen title="Inline status" detail="Status remains readable">
              <div className="spinner-status">
                <GummySpinner size="small" label="Syncing workspace" tone="aqua" />
                <span>Syncing workspace</span>
              </div>
            </Specimen>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="skeleton-title">
          <SectionHeading
            eyebrow="Stage 3 · loading structure"
            title="Gummy Skeleton"
            id="skeleton-title"
            description="One busy group names the loading region while its individual shapes remain decorative. The internal tide becomes a static highlight under reduced motion."
          />
          <div className="primitive-grid">
            <Specimen title="Text" detail="Variable lines · quiet last measure">
              <GummySkeleton shape="text" lines={4} />
            </Specimen>
            <Specimen title="Profile row" detail="One named busy composition">
              <GummySkeletonGroup className="skeleton-profile" label="Loading profile">
                <GummySkeleton shape="circle" />
                <GummySkeleton shape="text" lines={2} />
              </GummySkeletonGroup>
            </Specimen>
            <Specimen title="Card" detail="Responsive material envelope">
              <GummySkeleton shape="card" />
            </Specimen>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="aspect-ratio-title">
          <SectionHeading
            eyebrow="Stage 3 · responsive media"
            title="Gummy Aspect Ratio"
            id="aspect-ratio-title"
            description="A CSS-native responsive frame keeps media geometry stable across layouts. Cover, contain, and fill policies remain explicit."
          />
          <div className="aspect-ratio-grid">
            <div>
              <span>16:9 product preview</span>
              <GummyAspectRatio ratio={16 / 9}>
                <div className="aspect-ratio-demo">
                  <GummyEyebrow>Live preview</GummyEyebrow>
                  <GummyHeading level={3} size="subsection">Release dashboard</GummyHeading>
                  <GummyText size="small" tone="soft">Stable geometry before media arrives.</GummyText>
                </div>
              </GummyAspectRatio>
            </div>
            <div>
              <span>4:3 documentation figure</span>
              <GummyAspectRatio ratio={4 / 3}>
                <div className="aspect-ratio-demo aspect-ratio-demo--grape">
                  <GummyEyebrow>Component anatomy</GummyEyebrow>
                  <GummyHeading level={3} size="subsection">Connected edge material</GummyHeading>
                </div>
              </GummyAspectRatio>
            </div>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="display-feedback-title">
          <SectionHeading
            eyebrow="Stage 3 · display and feedback"
            title="Alerts, identity, empty states, items, and progress"
            id="display-feedback-title"
            description="Five related foundations compose the primitive group into credible product feedback. Interactive rows use real links, live alerts are opt-in, and progress remains a native element."
          />
          <div className="display-feedback-grid">
            <div className="display-feedback-grid__alerts">
              <GummyAlert variant="info">
                <GummyAlertTitle>Review window opened</GummyAlertTitle>
                <GummyAlertDescription>Three teammates can now comment on this release.</GummyAlertDescription>
              </GummyAlert>
              <GummyAlert variant="success">
                <GummyAlertTitle>Workspace synced</GummyAlertTitle>
                <GummyAlertDescription>Your latest component decisions are available offline.</GummyAlertDescription>
              </GummyAlert>
            </div>
            <GummyEmpty aria-labelledby="lab-empty-title">
              <GummyEmptyMedia>+</GummyEmptyMedia>
              <GummyEmptyTitle id="lab-empty-title">No review notes yet</GummyEmptyTitle>
              <GummyEmptyDescription>Capture the first decision when the team is ready.</GummyEmptyDescription>
              <GummyEmptyActions>
                <GummyButton size="small">Add review note</GummyButton>
              </GummyEmptyActions>
            </GummyEmpty>
            <div className="display-feedback-grid__items">
              <GummyItemLink href="#display-feedback-title" selected>
                <GummyItemMedia><GummyAvatar fallback="AM" size="small" status="online" statusLabel="Ava is online" /></GummyItemMedia>
                <GummyItemContent>
                  <GummyItemTitle>Ava Morgan</GummyItemTitle>
                  <GummyItemDescription>Approved the keyboard path</GummyItemDescription>
                </GummyItemContent>
                <GummyItemActions>Now</GummyItemActions>
              </GummyItemLink>
              <GummyItemLink href="#display-feedback-title">
                <GummyItemMedia><GummyAvatar fallback="SR" size="small" status="away" statusLabel="Sam is away" /></GummyItemMedia>
                <GummyItemContent>
                  <GummyItemTitle>Sam Rivera</GummyItemTitle>
                  <GummyItemDescription>Reviewing responsive states</GummyItemDescription>
                </GummyItemContent>
                <GummyItemActions>12m</GummyItemActions>
              </GummyItemLink>
              <GummyAvatarGroup label="Three project members">
                <GummyAvatar fallback="AM" />
                <GummyAvatar fallback="SR" />
                <GummyAvatar fallback="JL" />
              </GummyAvatarGroup>
            </div>
            <div className="display-feedback-grid__progress">
              <GummyProgress label="Free catalogue" value={17} max={57} />
              <GummyProgress label="Accessibility review" value={3} max={9} tone="aqua" />
              <GummyProgress label="Preparing clean fixture" tone="grape" />
            </div>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="navigation-disclosure-title">
          <SectionHeading
            eyebrow="Stage 3 · navigation and disclosure"
            title="Structure that reveals itself calmly"
            id="navigation-disclosure-title"
            description="Accordion and Collapsible use Base UI’s current accessibility model. Breadcrumb and Pagination use native navigation, ordered lists, current-page state, logical arrows, and 44px page targets."
          />
          <div className="navigation-disclosure-grid">
            <div>
              <GummyBreadcrumb label="Component breadcrumb">
                <GummyBreadcrumbItem><GummyBreadcrumbLink href="/">Home</GummyBreadcrumbLink></GummyBreadcrumbItem>
                <GummyBreadcrumbSeparator />
                <GummyBreadcrumbEllipsis />
                <GummyBreadcrumbSeparator />
                <GummyBreadcrumbItem><GummyBreadcrumbPage>Accordion</GummyBreadcrumbPage></GummyBreadcrumbItem>
              </GummyBreadcrumb>
              <GummyAccordion defaultValue={["install"]}>
                <GummyAccordionItem value="install">
                  <GummyAccordionHeader><GummyAccordionTrigger>How do I install a component?</GummyAccordionTrigger></GummyAccordionHeader>
                  <GummyAccordionPanel>Run the registry command, then import the copied source from your own components directory.</GummyAccordionPanel>
                </GummyAccordionItem>
                <GummyAccordionItem value="runtime">
                  <GummyAccordionHeader><GummyAccordionTrigger>Does Gummy add a runtime package?</GummyAccordionTrigger></GummyAccordionHeader>
                  <GummyAccordionPanel>No. The registry copies editable source into the consuming application.</GummyAccordionPanel>
                </GummyAccordionItem>
              </GummyAccordion>
            </div>
            <div>
              <GummyCollapsible defaultOpen>
                <GummyCollapsibleTrigger>Show release details</GummyCollapsibleTrigger>
                <GummyCollapsiblePanel>
                  Twenty-one Stage 3 sources now install from the local registry fixture.
                </GummyCollapsiblePanel>
              </GummyCollapsible>
              <GummyPagination label="Component catalogue pages">
                <GummyPaginationItem><GummyPaginationPrevious href="#navigation-disclosure-title" /></GummyPaginationItem>
                <GummyPaginationItem><GummyPaginationLink href="#navigation-disclosure-title">1</GummyPaginationLink></GummyPaginationItem>
                <GummyPaginationItem><GummyPaginationLink href="#navigation-disclosure-title" current>2</GummyPaginationLink></GummyPaginationItem>
                <GummyPaginationItem><GummyPaginationEllipsis /></GummyPaginationItem>
                <GummyPaginationItem><GummyPaginationNext href="#navigation-disclosure-title" /></GummyPaginationItem>
              </GummyPagination>
            </div>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="selection-controls-title">
          <SectionHeading
            eyebrow="Stage 3 · selection controls"
            title="Related actions and explicit selection"
            id="selection-controls-title"
            description="Button Group preserves canonical Button behaviour. Slider, Toggle, and Toggle Group use Base UI for form integration, keyboard state, range values, orientation, and roving focus."
          />
          <div className="selection-control-grid">
            <div>
              <span>Related actions</span>
              <GummyButtonGroup label="Document actions">
                <GummyButton>Save</GummyButton>
                <GummyButtonGroupSeparator />
                <GummyButton variant="secondary">Share</GummyButton>
                <GummyButtonGroupText>⌘ S</GummyButtonGroupText>
              </GummyButtonGroup>
            </div>
            <div>
              <span>Single and range values</span>
              <GummySlider defaultValue={62}>
                <GummySliderLabel>Frame padding</GummySliderLabel>
                <GummySliderValue>{([value]) => `${value}px`}</GummySliderValue>
                <GummySliderControl><GummySliderThumb aria-label="Frame padding" /></GummySliderControl>
              </GummySlider>
              <GummySlider defaultValue={[20, 78]}>
                <GummySliderLabel>Contrast range</GummySliderLabel>
                <GummySliderValue>{(formatted) => formatted.join("–")}</GummySliderValue>
                <GummySliderControl>
                  <GummySliderThumb aria-label="Minimum contrast" />
                  <GummySliderThumb aria-label="Maximum contrast" />
                </GummySliderControl>
              </GummySlider>
            </div>
            <div>
              <span>Independent pressed state</span>
              <div className="toggle-proof-row">
                <GummyToggle aria-label="Pin project">Pin</GummyToggle>
                <GummyToggle defaultPressed variant="fruit">Featured</GummyToggle>
                <GummyToggle disabled>Locked</GummyToggle>
              </div>
            </div>
            <div>
              <span>Single and multiple groups</span>
              <GummyToggleGroup label="Text alignment" defaultValue={["left"]}>
                <GummyToggleGroupItem value="left">Left</GummyToggleGroupItem>
                <GummyToggleGroupItem value="center">Center</GummyToggleGroupItem>
                <GummyToggleGroupItem value="right">Right</GummyToggleGroupItem>
              </GummyToggleGroup>
              <GummyToggleGroup label="Text styles" multiple defaultValue={["bold"]}>
                <GummyToggleGroupItem value="bold">Bold</GummyToggleGroupItem>
                <GummyToggleGroupItem value="italic">Italic</GummyToggleGroupItem>
              </GummyToggleGroup>
            </div>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="overlay-family-title">
          <SectionHeading
            eyebrow="Stage 3 · focus-managed overlays"
            title="Six overlays, six distinct jobs"
            id="overlay-family-title"
            description="Destructive confirmation, bottom drawer, side sheet, non-modal popover, preview hover card, and descriptive tooltip each keep their own interaction contract while sharing restrained Gel Pop material."
          />
          <GummyTooltipProvider delay={120}>
            <div className="overlay-family-grid">
              <div>
                <span>Consequential confirmation</span>
                <GummyAlertDialog>
                  <GummyAlertDialogTrigger>Delete release</GummyAlertDialogTrigger>
                  <GummyAlertDialogPortal>
                    <GummyAlertDialogBackdrop />
                    <GummyAlertDialogViewport>
                      <GummyAlertDialogPopup>
                        <GummyAlertDialogTitle>Delete this release?</GummyAlertDialogTitle>
                        <GummyAlertDialogDescription>The public version remains available, but this draft and its review notes will be removed.</GummyAlertDialogDescription>
                        <div className="overlay-demo-actions">
                          <GummyAlertDialogClose render={<GummyButton variant="secondary" />}>Keep release</GummyAlertDialogClose>
                          <GummyAlertDialogClose render={<GummyButton />}>Delete draft</GummyAlertDialogClose>
                        </div>
                      </GummyAlertDialogPopup>
                    </GummyAlertDialogViewport>
                  </GummyAlertDialogPortal>
                </GummyAlertDialog>
              </div>
              <div>
                <span>Mobile-first task</span>
                <GummyDrawer>
                  <GummyDrawerTrigger>Open quick actions</GummyDrawerTrigger>
                  <GummyDrawerPortal>
                    <GummyDrawerBackdrop />
                    <GummyDrawerViewport>
                      <GummyDrawerPopup>
                        <GummyDrawerTitle>Quick actions</GummyDrawerTitle>
                        <GummyDrawerDescription>Choose a common project action without leaving the current view.</GummyDrawerDescription>
                        <div className="overlay-demo-actions">
                          <GummyDrawerClose render={<GummyButton variant="secondary" />}>Close</GummyDrawerClose>
                          <GummyButton>New review</GummyButton>
                        </div>
                      </GummyDrawerPopup>
                    </GummyDrawerViewport>
                  </GummyDrawerPortal>
                </GummyDrawer>
              </div>
              <div>
                <span>Contextual controls</span>
                <GummyPopover>
                  <GummyPopoverTrigger>Workspace details</GummyPopoverTrigger>
                  <GummyPopoverPortal>
                    <GummyPopoverPositioner>
                      <GummyPopoverPopup>
                        <GummyPopoverTitle>GrapeLab</GummyPopoverTitle>
                        <GummyPopoverDescription>Three active projects and six collaborators.</GummyPopoverDescription>
                        <GummyPopoverClose className="overlay-demo-close">Close</GummyPopoverClose>
                      </GummyPopoverPopup>
                    </GummyPopoverPositioner>
                  </GummyPopoverPortal>
                </GummyPopover>
              </div>
              <div>
                <span>Supporting preview</span>
                <GummyHoverCard>
                  <GummyHoverCardTrigger render={<a href="#overlay-family-title" />}>Ava Morgan</GummyHoverCardTrigger>
                  <GummyHoverCardPortal>
                    <GummyHoverCardPositioner>
                      <GummyHoverCardPopup>
                        <GummyAvatar fallback="AM" status="online" statusLabel="Ava is online" />
                        <GummyHeading level={3} size="subsection">Ava Morgan</GummyHeading>
                        <GummyText size="small" tone="soft">Product designer · reviewing component accessibility.</GummyText>
                      </GummyHoverCardPopup>
                    </GummyHoverCardPositioner>
                  </GummyHoverCardPortal>
                </GummyHoverCard>
              </div>
              <div>
                <span>Side workflow</span>
                <GummySheet>
                  <GummySheetTrigger>Open filters</GummySheetTrigger>
                  <GummySheetPortal>
                    <GummySheetBackdrop />
                    <GummySheetViewport>
                      <GummySheetPopup>
                        <GummySheetTitle>Filter projects</GummySheetTitle>
                        <GummySheetDescription>Narrow the current project list. Results remain on the page behind this sheet.</GummySheetDescription>
                        <div className="overlay-demo-actions">
                          <GummySheetClose render={<GummyButton variant="secondary" />}>Done</GummySheetClose>
                        </div>
                      </GummySheetPopup>
                    </GummySheetViewport>
                  </GummySheetPortal>
                </GummySheet>
              </div>
              <div>
                <span>Short description</span>
                <GummyTooltip>
                  <GummyTooltipTrigger render={<button type="button" />}>Archive</GummyTooltipTrigger>
                  <GummyTooltipPortal>
                    <GummyTooltipPositioner>
                      <GummyTooltipPopup>Moves this project out of active views</GummyTooltipPopup>
                    </GummyTooltipPositioner>
                  </GummyTooltipPortal>
                </GummyTooltip>
              </div>
            </div>
          </GummyTooltipProvider>
        </section>

        <section className="lab-section" aria-labelledby="navigation-systems-title">
          <SectionHeading
            eyebrow="Stage 3 · navigation systems"
            title="Navigation at product scale"
            id="navigation-systems-title"
            description="Context Menu and Menubar serve application commands. Navigation Menu serves site discovery. Sidebar provides a controlled workspace shell with native landmarks and current-page links."
          />
          <div className="navigation-system-rack">
            <GummyContextMenu>
              <GummyContextMenuTrigger tabIndex={0}>
                Right-click or long-press this project canvas
              </GummyContextMenuTrigger>
              <GummyContextMenuPortal>
                <GummyContextMenuPositioner>
                  <GummyContextMenuPopup>
                    <GummyContextMenuItem>Duplicate project</GummyContextMenuItem>
                    <GummyContextMenuItem>Move to archive</GummyContextMenuItem>
                  </GummyContextMenuPopup>
                </GummyContextMenuPositioner>
              </GummyContextMenuPortal>
            </GummyContextMenu>
            <div className="navigation-system-rack__compact">
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
              <GummyNavigationMenu label="Product discovery">
                <GummyNavigationMenuList>
                  <GummyNavigationMenuItem value="components">
                    <GummyNavigationMenuTrigger>Components</GummyNavigationMenuTrigger>
                    <GummyNavigationMenuContent>
                      <GummyNavigationMenuLink href="#navigation-systems-title">Browse canonical components</GummyNavigationMenuLink>
                      <GummyNavigationMenuLink href="#navigation-systems-title">Read installation guidance</GummyNavigationMenuLink>
                    </GummyNavigationMenuContent>
                  </GummyNavigationMenuItem>
                </GummyNavigationMenuList>
                <GummyNavigationMenuPortal>
                  <GummyNavigationMenuPositioner>
                    <GummyNavigationMenuPopup><GummyNavigationMenuViewport /></GummyNavigationMenuPopup>
                  </GummyNavigationMenuPositioner>
                </GummyNavigationMenuPortal>
              </GummyNavigationMenu>
            </div>
          </div>
          <GummySidebar>
            <GummySidebarPanel label="GrapeLab workspace">
              <GummySidebarHeader><GummySidebarTrigger /></GummySidebarHeader>
              <GummySidebarContent>
                <GummySidebarGroup>
                  <GummySidebarGroupLabel>Workspace</GummySidebarGroupLabel>
                  <GummySidebarMenu>
                    <GummySidebarMenuItem><GummySidebarMenuLink href="#navigation-systems-title" current><span aria-hidden="true">●</span><span>Projects</span></GummySidebarMenuLink></GummySidebarMenuItem>
                    <GummySidebarMenuItem><GummySidebarMenuLink href="#navigation-systems-title"><span aria-hidden="true">◆</span><span>Reviews</span></GummySidebarMenuLink></GummySidebarMenuItem>
                    <GummySidebarMenuItem><GummySidebarMenuLink href="#navigation-systems-title"><span aria-hidden="true">■</span><span>Releases</span></GummySidebarMenuLink></GummySidebarMenuItem>
                  </GummySidebarMenu>
                </GummySidebarGroup>
              </GummySidebarContent>
            </GummySidebarPanel>
            <GummySidebarInset as="div">
              <GummyEyebrow>Workspace overview</GummyEyebrow>
              <GummyHeading level={3} size="section">Projects</GummyHeading>
              <GummyText tone="soft">The inset remains the primary content landmark while the panel supplies labelled navigation.</GummyText>
            </GummySidebarInset>
          </GummySidebar>
        </section>

        <section className="lab-section" aria-labelledby="composite-inputs-title">
          <SectionHeading
            eyebrow="Stage 3 · composite inputs"
            title="Dense input without fragile interaction"
            id="composite-inputs-title"
            description="Calendar, Combobox, Command, Date Picker, Input Group, OTP, and Select keep editing stable while adding deliberate keyboard paths, labelled relationships, locale support, and native form values."
          />
          <div className="stage3-state-grid">
            <Specimen title="Calendar" detail="Locale-aware grid · arrow, week, month, and year movement">
              <GummyCalendar defaultMonth={new Date(2026, 6, 1)} defaultValue={new Date(2026, 6, 15)} />
            </Specimen>
            <Specimen title="Combobox" detail="Editable filtering · Base UI listbox focus">
              <GummyCombobox items={["Raspberry", "Grape", "Lime", "Aqua"]}>
                <GummyComboboxInputGroup>
                  <GummyComboboxInput aria-label="Choose a fruit" placeholder="Search fruit…" />
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
            </Specimen>
            <Specimen title="Command" detail="Searchable actions · group labels and keyboard activation">
              <GummyCommand label="Project commands">
                <GummyCommandInput aria-label="Search project commands" placeholder="Type a command…" />
                <GummyCommandList>
                  <GummyCommandGroup label="Project">
                    <GummyCommandItem value="Create project">Create project<GummyCommandShortcut>⌘N</GummyCommandShortcut></GummyCommandItem>
                    <GummyCommandItem value="Archive project">Archive project<GummyCommandShortcut>⌘A</GummyCommandShortcut></GummyCommandItem>
                  </GummyCommandGroup>
                </GummyCommandList>
              </GummyCommand>
            </Specimen>
            <Specimen title="Date Picker" detail="Popover composition · formatted trigger and focus return">
              <GummyDatePicker label="Review date" defaultValue={new Date(2026, 6, 15)} />
            </Specimen>
            <Specimen title="Input Group" detail="One shell · native input and explicit action">
              <GummyInputGroup>
                <GummyInputGroupAddon>https://</GummyInputGroupAddon>
                <GummyInputGroupControl aria-label="Workspace domain" defaultValue="grapelab.co" />
                <GummyInputGroupButton>Copy</GummyInputGroupButton>
              </GummyInputGroup>
            </Specimen>
            <Specimen title="Input OTP" detail="Paste distribution · LTR digits in every document direction">
              <GummyInputOTP label="Verification code" name="lab-verification-code" />
            </Specimen>
            <Specimen title="Select" detail="Custom listbox · typeahead and native form integration">
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
            </Specimen>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="data-utilities-title">
          <SectionHeading
            eyebrow="Stage 3 · data and utility systems"
            title="Product-scale data, layout, and notification tools"
            id="data-utilities-title"
            description="Carousel, Data Table, Direction, Resizable, Scroll Area, Table, and Sonner complete the free catalogue with typed data handling, native semantics, pointer and keyboard parity, RTL, and quiet system feedback."
          />
          <div className="stage3-state-grid">
            <Specimen title="Carousel" detail="Labelled slides · controls, indicators, keyboard, and RTL">
              <GummyCarousel itemCount={3} label="Featured releases">
                <GummyCarouselContent>
                  <GummyCarouselItem index={0}><GummyHeading level={3} size="subsection">Beacon</GummyHeading><GummyText tone="soft">Research synthesis and delivery signals.</GummyText></GummyCarouselItem>
                  <GummyCarouselItem index={1}><GummyHeading level={3} size="subsection">Atlas</GummyHeading><GummyText tone="soft">One map for the complete product system.</GummyText></GummyCarouselItem>
                  <GummyCarouselItem index={2}><GummyHeading level={3} size="subsection">Cedar</GummyHeading><GummyText tone="soft">Calm review flows for dense decisions.</GummyText></GummyCarouselItem>
                </GummyCarouselContent>
                <div className="gummy-carousel-demo__controls">
                  <GummyCarouselPrevious />
                  <GummyCarouselIndicators />
                  <GummyCarouselNext />
                </div>
              </GummyCarousel>
            </Specimen>
            <Specimen title="Data Table" detail="Typed rows · filter, sort, selection, and pagination">
              <GummyDataTable
                rows={labReleases}
                columns={labReleaseColumns}
                getRowId={(release) => release.id}
                getRowLabel={(release) => release.name}
                caption="Release readiness"
                pageSize={2}
                selectable
              />
            </Specimen>
            <Specimen title="Direction" detail="Native dir plus Base UI direction context">
              <GummyDirection direction="rtl">
                <GummyHeading level={3} size="subsection">مساحة العمل</GummyHeading>
                <GummyText tone="soft">تنتقل الحواف والأسهم وسلوك المفاتيح مع اتجاه القراءة.</GummyText>
              </GummyDirection>
            </Specimen>
            <Specimen title="Resizable" detail="Pointer split · separator value and arrow-key control">
              <GummyResizablePanelGroup defaultSize={38} minSize={24} maxSize={76}>
                <GummyResizablePanel order="first"><strong>Navigation</strong><p>Projects<br />Reviews<br />Releases</p></GummyResizablePanel>
                <GummyResizableHandle />
                <GummyResizablePanel order="second"><strong>Canvas</strong><p>The content plane remains stable while the boundary moves.</p></GummyResizablePanel>
              </GummyResizablePanelGroup>
            </Specimen>
            <Specimen title="Scroll Area" detail="Native scrolling · focusable viewport and custom thumb">
              <GummyScrollArea style={{ height: 190 }}>
                <GummyScrollAreaViewport aria-label="Release history">
                  <GummyScrollAreaContent>
                    {Array.from({ length: 8 }, (_, index) => <p key={index}><strong>Version 0.{9 - index}</strong><br />Material, behaviour, documentation, and registry checks passed.</p>)}
                  </GummyScrollAreaContent>
                </GummyScrollAreaViewport>
                <GummyScrollAreaScrollbar><GummyScrollAreaThumb /></GummyScrollAreaScrollbar>
              </GummyScrollArea>
            </Specimen>
            <Specimen title="Table" detail="Native caption, headers, rows, and logical alignment">
              <div className="gummy-table-wrap">
                <GummyTable>
                  <GummyTableCaption>Token contrast review</GummyTableCaption>
                  <GummyTableHeader><GummyTableRow><GummyTableHead>Token</GummyTableHead><GummyTableHead>State</GummyTableHead></GummyTableRow></GummyTableHeader>
                  <GummyTableBody>
                    <GummyTableRow><GummyTableCell>Aqua focus</GummyTableCell><GummyTableCell>Pass</GummyTableCell></GummyTableRow>
                    <GummyTableRow><GummyTableCell>Grape rim</GummyTableCell><GummyTableCell>Pass</GummyTableCell></GummyTableRow>
                  </GummyTableBody>
                </GummyTable>
              </div>
            </Specimen>
            <Specimen title="Sonner" detail="Polite toast · timeout pause, swipe, action, and dismissal">
              <GummySonnerProvider><LabToastDemo /></GummySonnerProvider>
            </Specimen>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="input-title">
          <SectionHeading
            eyebrow="Canonical 01 · native form control"
            title="Gummy Input"
            id="input-title"
            description={<>Every specimen is a real <code>input</code>. Use <kbd>Tab</kbd> to inspect focus and edit the live fields normally.</>}
          />
          <div className="input-state-grid">
            <Specimen title="Empty" detail="Label · description · native semantics">
              <GummyInput label="Display name" name="empty-name" description="Shown to your collaborators." />
            </Specimen>
            <Specimen title="Placeholder" detail="Helpful hint, never the label">
              <GummyInput label="Email address" name="placeholder-email" type="email" autoComplete="email" placeholder="you@studio.co" />
            </Specimen>
            <Specimen title="Filled" detail="Stable editing layer · fruit-cast rim">
              <GummyInput label="Project name" name="filled-project" defaultValue="Gummy launch" />
            </Specimen>
            <Specimen title="Hover" detail="Preview plus fully live input" className="gummy-input--preview-hover">
              <GummyInput label="Company" name="hover-company" defaultValue="Acme Labs" />
            </Specimen>
            <Specimen title="Keyboard focus" detail="Plump field · attached focus glint" className="gummy-input--preview-focus">
              <GummyInput label="Team slug" name="focus-slug" defaultValue="design-systems" />
            </Specimen>
            <Specimen title="Error" detail="Icon and associated text, not colour alone">
              <GummyInput label="Website" name="error-site" type="url" defaultValue="gummy" errorMessage="Enter a complete URL, including https://." />
            </Specimen>
            <Specimen title="Success" detail="Icon and associated confirmation">
              <GummyInput label="Username" name="success-name" defaultValue="ava-morgan" successMessage="That username is available." />
            </Specimen>
            <Specimen title="Disabled" detail="Native disabled behaviour">
              <GummyInput label="Organisation ID" name="disabled-id" defaultValue="org_042" disabled />
            </Specimen>
            <Specimen title="Read only" detail="Focusable and selectable, not editable">
              <GummyInput label="Account owner" name="readonly-owner" defaultValue="Ava Morgan" readOnly />
            </Specimen>
          </div>
          <InputWorkbench />
        </section>

        <section className="lab-section" aria-labelledby="badge-title">
          <SectionHeading
            eyebrow="Canonical 02 · semantic label"
            title="Gummy Badge"
            id="badge-title"
            description="One pressure-uneven gel pebble that visibly leans, squashes, and settles. It stays non-interactive; optional dots and icons remain decorative."
          />
          <div className="badge-rack">
            {badgeVariants.map((variant) => (
              <div className="badge-specimen" key={variant}>
                <span>{badgeLabels[variant]}</span>
                <GummyBadge variant={variant} dot={variant === "success"}>{badgeLabels[variant]}</GummyBadge>
                <GummyBadge variant={variant}>24</GummyBadge>
              </div>
            ))}
          </div>
          <div className="badge-proof-row">
            <div><span>Long label</span><GummyBadge variant="secondary">Awaiting design review</GummyBadge></div>
            <div><span>High-transmission</span><GummyBadge variant="info" finish="translucent" icon="i">Information available</GummyBadge></div>
            <div><span>Glass fruit</span><span className="badge-glass-pair"><GummyBadge variant="primary" finish="translucent">Signal</GummyBadge><GummyBadge variant="secondary" finish="translucent">Beta</GummyBadge></span></div>
          </div>
          <BadgeWorkbench />
        </section>

        <section className="lab-section" aria-labelledby="card-title">
          <SectionHeading
            eyebrow="Canonical 03 · composable surface"
            title="Gummy Card"
            id="card-title"
            description="A calm reading plane held in a pooled gel-pocket frame. Passive Cards stay passive; native link and button versions move their edge material for keyboard focus."
          />
          <div className="card-grid">
            <div className="card-specimen">
              <span>Default passive · article</span>
              <GummyCard className="card-demo"><ProjectCardBody /></GummyCard>
            </div>
            <div className="card-specimen">
              <span>Elevated passive · article</span>
              <GummyCard className="card-demo" elevation="elevated"><ProjectCardBody /></GummyCard>
            </div>
            <div className="card-specimen">
              <span>Selected · article</span>
              <GummyCard className="card-demo" selected><ProjectCardBody /></GummyCard>
            </div>
            <div className="card-specimen">
              <span>Interactive focus · link</span>
              <GummyCardLink className="card-demo gummy-card--preview-focus" href="#card-review-gate"><ProjectCardBody /></GummyCardLink>
            </div>
            <div className="card-specimen card-specimen--wide">
              <span>Dense content · responsive</span>
              <GummyCard className="card-demo card-demo--dense">
                <ProjectCardBody />
              </GummyCard>
            </div>
          </div>
          <CardWorkbench />
        </section>

        <section className="lab-section" aria-labelledby="switch-title">
          <SectionHeading
            eyebrow="Canonical 04 · binary control"
            title="Gummy Switch"
            id="switch-title"
            description={<>A real switch with one transmitting track and an attached fruit-glass thumb. Use <kbd>Space</kbd> to toggle it; focus pools aqua inside the track.</>}
          />
          <div className="switch-state-rack">
            <div className="interaction-specimen"><span>Off</span><GummySwitch label="Digest" /></div>
            <div className="interaction-specimen"><span>On</span><GummySwitch label="Digest" defaultChecked /></div>
            <div className="interaction-specimen"><span>Keyboard focus</span><GummySwitch label="Digest" previewFocus /></div>
            <div className="interaction-specimen"><span>Disabled</span><GummySwitch label="Digest" disabled /></div>
          </div>
          <SwitchWorkbench />
        </section>

        <section className="lab-section" aria-labelledby="tabs-title">
          <SectionHeading
            eyebrow="Canonical 05 · navigation"
            title="Gummy Tabs"
            id="tabs-title"
            description={<>One shared gel rail carries selection instead of turning every label into a pill. Use arrow keys, <kbd>Home</kbd>, and <kbd>End</kbd> to move the material pool.</>}
          />
          <div className="group-two-grid">
            <div className="interaction-specimen group-two-reference"><span>Live selection rail</span><TabsDemo /></div>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="menu-title">
          <SectionHeading
            eyebrow="Canonical 06 · focus-managed popup"
            title="Gummy Dropdown Menu"
            id="menu-title"
            description={<>The compact gel trigger opens a calm reading plane with roving focus, typeahead, <kbd>Escape</kbd> dismissal, and trigger-focus restoration.</>}
          />
          <div className="group-two-grid">
            <div className="interaction-specimen"><span>Closed trigger</span><DropdownDemo /></div>
            <div className="interaction-specimen"><span>Open with live selection</span><DropdownDemo defaultOpen /></div>
          </div>
        </section>

        <section className="lab-section" aria-labelledby="dialog-title">
          <SectionHeading
            eyebrow="Canonical 07 · modal overlay"
            title="Gummy Dialog"
            id="dialog-title"
            description={<>A compact frosted reading plane held by a raspberry pocket perimeter. The live dialog contains focus, dismisses with <kbd>Escape</kbd>, and restores focus to its trigger.</>}
          />
          <div className="overlay-proof-grid">
            <div className="interaction-specimen"><span>Live modal trigger</span><DialogDemo /></div>
            <div className="interaction-specimen"><span>Open material anatomy</span><GummyDialogSurface><DialogPreviewContents /></GummyDialogSurface></div>
          </div>
        </section>

        <section className="lab-section approved-reference" aria-labelledby="button-reference-title">
          <SectionHeading
            eyebrow="Approved reference · 22 July 2026"
            title="Canonical Button"
            id="button-reference-title"
            description="Classic Gummy and the quick chewy press/rebound remain locked. High-transmission returns to the clearer aqua optical shell and internal material pool from the prior approved pass."
          />
          <div className="approved-reference__stage">
            <div><span>Classic Gummy</span><GummyButton>New task</GummyButton></div>
            <div><span>High-transmission</span><GummyButton finish="translucent" variant="info">View details</GummyButton></div>
          </div>
        </section>

        <section className="lab-section art-reference" aria-labelledby="art-reference-title">
          <SectionHeading
            eyebrow="Art direction · not product source"
            title="Material and motion references"
            id="art-reference-title"
            description="The studies define focused material contracts from the Button pilot through the early Stage 3 groups. Every later component derives restrained material from those approved sources; all live components above remain product source."
          />
          <div className="art-reference__grid">
            <figure>
              <Image
                src="/gummy-stage3-form-controls-imagegen-01.webp"
                alt="Focused form-control art-direction study showing Label, Field, Textarea, Checkbox, Radio Group, and Native Select states in light and dark themes"
                width={1536}
                height={1024}
                sizes="(max-width: 1280px) 100vw, 1240px"
                priority
                unoptimized
              />
              <figcaption>Stage 3 form-control material study 01 · exact prompt saved beside the asset.</figcaption>
            </figure>
            <figure>
              <Image
                src="/gummy-badge-pebble-imagegen-02.webp"
                alt="Focused art-direction study showing irregular gel-pebble Badges and their lean, squash, wobble, and settle cycle"
                width={1536}
                height={1024}
                sizes="(max-width: 1280px) 100vw, 1240px"
                priority
                unoptimized
              />
              <figcaption>Badge pebble iteration 02 · exact prompt saved beside the asset.</figcaption>
            </figure>
            <figure>
              <Image
                src="/gummy-card-pocket-frame-imagegen-02.webp"
                alt="Focused art-direction study showing a warm reading plane held inside a translucent gel-pocket Card frame"
                width={1536}
                height={1024}
                sizes="(max-width: 1280px) 100vw, 1240px"
                unoptimized
              />
              <figcaption>Card gel-pocket iteration 02 · exact prompt saved beside the asset.</figcaption>
            </figure>
            <figure>
              <Image
                src="/gummy-switch-tabs-menu-dialog-imagegen-01.webp"
                alt="Focused art-direction study showing gummy Switch, Tabs, Dropdown Menu, and Dialog states in light and dark themes"
                width={1536}
                height={1024}
                sizes="(max-width: 1280px) 100vw, 1240px"
                unoptimized
              />
              <figcaption>Group 2 interaction study 01 · exact prompt saved beside the asset.</figcaption>
            </figure>
            <figure>
              <Image
                src="/gummy-dropdown-menu-imagegen-02.webp"
                alt="Focused Dropdown Menu study showing a translucent milk-glass trigger and a wavy grape-gel popup membrane in light and dark themes"
                width={1536}
                height={1024}
                sizes="(max-width: 1280px) 100vw, 1240px"
                unoptimized
              />
              <figcaption>Dropdown Menu material iteration 02 · exact prompt saved beside the asset.</figcaption>
            </figure>
            <figure>
              <Image
                src="/gummy-input-tabs-dialog-imagegen-02.webp"
                alt="Focused study showing Input, Tabs, and Dialog translated to the approved Switch's connected translucent gel quality in light and dark themes"
                width={1536}
                height={1024}
                sizes="(max-width: 1280px) 100vw, 1240px"
                unoptimized
              />
              <figcaption>Input, Tabs, and Dialog material iteration 02 · exact prompt saved beside the asset.</figcaption>
            </figure>
          </div>
        </section>

        <section className="review-gate" id="card-review-gate" aria-labelledby="review-title">
          <div>
            <p className="lab-kicker">Stage 3 groups 01–09 quality gate</p>
            <h2 id="review-title">Do the foundations stay calm and unmistakably Gummy?</h2>
          </div>
          <ul>
            <li>Editing planes remain stable while connected reservoirs communicate state</li>
            <li>Checkbox and Radio Group inherit Switch quality without becoming toy-like</li>
            <li>Responsive, dense, and RTL compositions preserve hierarchy and touch targets</li>
            <li>Both themes, validation, keyboard paths, read-only behavior, and reduced motion hold up</li>
            <li>Loading, type, dividers, and media frames remain useful without ornamental noise</li>
          </ul>
        </section>
      </main>

      <footer className="lab-footer">
        <p>Canonical catalogue retained as editable source for the public system.</p>
        <p>Open-source React source · no Pro source in this repository</p>
      </footer>
    </>
  );
}
