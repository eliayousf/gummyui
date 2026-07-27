"use client";

import * as React from "react";
import {
  GummyTable,
  GummyTableBody,
  GummyTableCaption,
  GummyTableCell,
  GummyTableHead,
  GummyTableHeader,
  GummyTableRow,
} from "./GummyTable";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyDataTableColumn<Row> = {
  id: string;
  header: React.ReactNode;
  cell: (row: Row) => React.ReactNode;
  sortValue?: (row: Row) => string | number | Date | null | undefined;
  filterValue?: (row: Row) => string;
  align?: "start" | "center" | "end";
};

export type GummyDataTableSort = {
  columnId: string;
  direction: "ascending" | "descending";
};

export type GummyDataTableProps<Row> = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children" | "onSelect"
> & {
  rows: readonly Row[];
  columns: readonly GummyDataTableColumn<Row>[];
  getRowId: (row: Row) => string;
  caption: string;
  filterLabel?: string;
  filterPlaceholder?: string;
  pageSize?: number;
  initialSort?: GummyDataTableSort;
  selectable?: boolean;
  selectedRowIds?: readonly string[];
  defaultSelectedRowIds?: readonly string[];
  onSelectedRowIdsChange?: (rowIds: string[]) => void;
  getRowLabel?: (row: Row) => string;
  emptyMessage?: string;
};

function compareValues(
  first: string | number | Date | null | undefined,
  second: string | number | Date | null | undefined,
) {
  if (first == null && second == null) return 0;
  if (first == null) return 1;
  if (second == null) return -1;
  if (first instanceof Date && second instanceof Date) return first.getTime() - second.getTime();
  if (typeof first === "number" && typeof second === "number") return first - second;
  return String(first).localeCompare(String(second), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function GummyDataTableInner<Row>(
  {
    rows,
    columns,
    getRowId,
    caption,
    filterLabel = "Filter rows",
    filterPlaceholder = "Search…",
    pageSize = 10,
    initialSort,
    selectable = false,
    selectedRowIds,
    defaultSelectedRowIds = [],
    onSelectedRowIdsChange,
    getRowLabel = (row) => getRowId(row),
    emptyMessage = "No matching rows.",
    className,
    ...props
  }: GummyDataTableProps<Row>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<GummyDataTableSort | undefined>(initialSort);
  const [page, setPage] = React.useState(0);
  const [internalSelection, setInternalSelection] = React.useState(
    () => new Set(defaultSelectedRowIds),
  );
  const selection = React.useMemo(
    () => new Set(selectedRowIds ?? Array.from(internalSelection)),
    [internalSelection, selectedRowIds],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredRows = React.useMemo(
    () => rows.filter((row) => {
      if (!normalizedQuery) return true;
      return columns.some((column) => {
        const value = column.filterValue?.(row)
          ?? column.sortValue?.(row)
          ?? column.cell(row);
        return typeof value === "string" || typeof value === "number"
          ? String(value).toLocaleLowerCase().includes(normalizedQuery)
          : false;
      });
    }),
    [columns, normalizedQuery, rows],
  );
  const sortedRows = React.useMemo(() => {
    if (!sort) return filteredRows;
    const column = columns.find((candidate) => candidate.id === sort.columnId);
    if (!column?.sortValue) return filteredRows;
    const multiplier = sort.direction === "ascending" ? 1 : -1;
    return [...filteredRows].sort(
      (first, second) => compareValues(column.sortValue?.(first), column.sortValue?.(second)) * multiplier,
    );
  }, [columns, filteredRows, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / safePageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = sortedRows.slice(
    currentPage * safePageSize,
    currentPage * safePageSize + safePageSize,
  );
  const visibleIds = visibleRows.map(getRowId);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selection.has(id));
  const someVisibleSelected = visibleIds.some((id) => selection.has(id)) && !allVisibleSelected;

  function updateSelection(next: Set<string>) {
    if (selectedRowIds === undefined) setInternalSelection(next);
    onSelectedRowIdsChange?.(Array.from(next));
  }

  function toggleRow(id: string) {
    const next = new Set(selection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateSelection(next);
  }

  function toggleVisibleRows() {
    const next = new Set(selection);
    if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
    else visibleIds.forEach((id) => next.add(id));
    updateSelection(next);
  }

  function toggleSort(column: GummyDataTableColumn<Row>) {
    if (!column.sortValue) return;
    setSort((current) => current?.columnId === column.id
      ? {
          columnId: column.id,
          direction: current.direction === "ascending" ? "descending" : "ascending",
        }
      : { columnId: column.id, direction: "ascending" });
    setPage(0);
  }

  return (
    <div {...props} ref={ref} className={joinClassNames("gummy-data-table", className)}>
      <div className="gummy-data-table__toolbar">
        <label>
          <span>{filterLabel}</span>
          <input
            type="search"
            value={query}
            placeholder={filterPlaceholder}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setPage(0);
            }}
          />
        </label>
        <span aria-live="polite">{filteredRows.length} {filteredRows.length === 1 ? "row" : "rows"}</span>
      </div>
      <div className="gummy-table-wrap">
        <GummyTable>
          <GummyTableCaption>{caption}</GummyTableCaption>
          <GummyTableHeader>
            <GummyTableRow>
              {selectable ? (
                <GummyTableHead className="gummy-data-table__selection">
                  <input
                    type="checkbox"
                    aria-label={allVisibleSelected ? "Deselect visible rows" : "Select visible rows"}
                    checked={allVisibleSelected}
                    ref={(node) => {
                      if (node) node.indeterminate = someVisibleSelected;
                    }}
                    onChange={toggleVisibleRows}
                  />
                </GummyTableHead>
              ) : null}
              {columns.map((column) => {
                const activeSort = sort?.columnId === column.id ? sort.direction : undefined;
                return (
                  <GummyTableHead
                    key={column.id}
                    aria-sort={activeSort ?? (column.sortValue ? "none" : undefined)}
                    data-align={column.align}
                  >
                    {column.sortValue ? (
                      <button type="button" onClick={() => toggleSort(column)}>
                        <span>{column.header}</span>
                        <span aria-hidden="true">
                          {activeSort === "ascending" ? "↑" : activeSort === "descending" ? "↓" : "↕"}
                        </span>
                      </button>
                    ) : column.header}
                  </GummyTableHead>
                );
              })}
            </GummyTableRow>
          </GummyTableHeader>
          <GummyTableBody>
            {visibleRows.length ? visibleRows.map((row) => {
              const rowId = getRowId(row);
              return (
                <GummyTableRow key={rowId} data-selected={selection.has(rowId) || undefined}>
                  {selectable ? (
                    <GummyTableCell className="gummy-data-table__selection">
                      <input
                        type="checkbox"
                        aria-label={`Select ${getRowLabel(row)}`}
                        checked={selection.has(rowId)}
                        onChange={() => toggleRow(rowId)}
                      />
                    </GummyTableCell>
                  ) : null}
                  {columns.map((column) => (
                    <GummyTableCell key={column.id} data-align={column.align}>
                      {column.cell(row)}
                    </GummyTableCell>
                  ))}
                </GummyTableRow>
              );
            }) : (
              <GummyTableRow>
                <GummyTableCell colSpan={columns.length + (selectable ? 1 : 0)} className="gummy-data-table__empty">
                  {emptyMessage}
                </GummyTableCell>
              </GummyTableRow>
            )}
          </GummyTableBody>
        </GummyTable>
      </div>
      <div className="gummy-data-table__pagination" aria-label="Table pagination">
        <span>Page {currentPage + 1} of {pageCount}</span>
        <div>
          <button type="button" disabled={currentPage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
            Previous
          </button>
          <button type="button" disabled={currentPage >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export const GummyDataTable = React.forwardRef(GummyDataTableInner) as <Row>(
  props: GummyDataTableProps<Row> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement;
