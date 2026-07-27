export type PublicRelease = {
  version: string;
  title: string;
  copy: string;
  date: string;
};

export const publicReleases: readonly PublicRelease[] = [
  {
    version: "1.0.0",
    title: "Free component catalogue complete",
    copy: "Carousel, Data Table, Direction, Resizable, Scroll Area, Table, and Sonner complete all 57 public component categories.",
    date: "2026-07-26",
  },
  {
    version: "0.9.0",
    title: "Composite inputs",
    copy: "Calendar, Combobox, Command, Date Picker, Input Group, Input OTP, and Select.",
    date: "2026-07-26",
  },
  {
    version: "0.8.0",
    title: "Navigation systems",
    copy: "Context Menu, Menubar, Navigation Menu, and Sidebar.",
    date: "2026-07-26",
  },
  {
    version: "0.7.0",
    title: "Overlay family",
    copy: "Alert Dialog, Drawer, Hover Card, Popover, Sheet, and Tooltip.",
    date: "2026-07-26",
  },
  {
    version: "0.6.0",
    title: "Selection controls",
    copy: "Button Group, Slider, Toggle, and Toggle Group.",
    date: "2026-07-26",
  },
  {
    version: "0.5.0",
    title: "Navigation and disclosure",
    copy: "Accordion, Breadcrumb, Collapsible, and Pagination.",
    date: "2026-07-26",
  },
  {
    version: "0.4.0",
    title: "Display and feedback",
    copy: "Alert, Avatar, Empty, Item, and Progress.",
    date: "2026-07-26",
  },
  {
    version: "0.3.0",
    title: "Layout and feedback",
    copy: "Separator, Typography, Kbd, Spinner, Skeleton, and Aspect Ratio.",
    date: "2026-07-26",
  },
  {
    version: "0.2.0",
    title: "Form foundations",
    copy: "Label, Field, Textarea, Checkbox, Radio Group, and Native Select.",
    date: "2026-07-23",
  },
] as const;
