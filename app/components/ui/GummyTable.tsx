import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyTable = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(function GummyTable({ className, ...props }, ref) {
  return <table {...props} ref={ref} className={joinClassNames("gummy-table", className)} />;
});

export const GummyTableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(function GummyTableCaption({ className, ...props }, ref) {
  return <caption {...props} ref={ref} className={joinClassNames("gummy-table__caption", className)} />;
});

export const GummyTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function GummyTableHeader({ className, ...props }, ref) {
  return <thead {...props} ref={ref} className={joinClassNames("gummy-table__header", className)} />;
});

export const GummyTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function GummyTableBody({ className, ...props }, ref) {
  return <tbody {...props} ref={ref} className={joinClassNames("gummy-table__body", className)} />;
});

export const GummyTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function GummyTableFooter({ className, ...props }, ref) {
  return <tfoot {...props} ref={ref} className={joinClassNames("gummy-table__footer", className)} />;
});

export const GummyTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(function GummyTableRow({ className, ...props }, ref) {
  return <tr {...props} ref={ref} className={joinClassNames("gummy-table__row", className)} />;
});

export const GummyTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(function GummyTableHead({ className, scope = "col", ...props }, ref) {
  return <th {...props} ref={ref} scope={scope} className={joinClassNames("gummy-table__head", className)} />;
});

export const GummyTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(function GummyTableCell({ className, ...props }, ref) {
  return <td {...props} ref={ref} className={joinClassNames("gummy-table__cell", className)} />;
});

GummyTable.displayName = "GummyTable";
GummyTableCaption.displayName = "GummyTableCaption";
GummyTableHeader.displayName = "GummyTableHeader";
GummyTableBody.displayName = "GummyTableBody";
GummyTableFooter.displayName = "GummyTableFooter";
GummyTableRow.displayName = "GummyTableRow";
GummyTableHead.displayName = "GummyTableHead";
GummyTableCell.displayName = "GummyTableCell";
