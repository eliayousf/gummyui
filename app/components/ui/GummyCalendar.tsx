"use client";

import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function sameDay(a?: Date, b?: Date) {
  return Boolean(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export type GummyCalendarProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> & {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  min?: Date;
  max?: Date;
  locale?: string;
  weekStartsOn?: 0 | 1 | 6;
  label?: string;
};

export const GummyCalendar = React.forwardRef<HTMLDivElement, GummyCalendarProps>(
  function GummyCalendar(
    {
      value,
      defaultValue,
      onValueChange,
      month: controlledMonth,
      defaultMonth,
      onMonthChange,
      min,
      max,
      locale = "en-US",
      weekStartsOn = 1,
      label = "Choose a date",
      className,
      ...props
    },
    ref,
  ) {
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const setRootRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );
    const today = React.useMemo(() => new Date(), []);
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const selected = value ?? internalValue;
    const [internalMonth, setInternalMonth] = React.useState(() => startOfMonth(defaultMonth ?? selected ?? today));
    const visibleMonth = startOfMonth(controlledMonth ?? internalMonth);
    const monthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(visibleMonth);
    const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const fullDateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "full" });
    const firstWeekday = visibleMonth.getDay();
    const offset = (firstWeekday - weekStartsOn + 7) % 7;
    const gridStart = addDays(visibleMonth, -offset);
    const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
    const weekdays = Array.from({ length: 7 }, (_, index) => addDays(new Date(2026, 5, 7 + weekStartsOn), index));

    function changeMonth(next: Date) {
      if (controlledMonth === undefined) setInternalMonth(startOfMonth(next));
      onMonthChange?.(startOfMonth(next));
    }

    function choose(day: Date) {
      if (value === undefined) setInternalValue(day);
      onValueChange?.(day);
      if (day.getMonth() !== visibleMonth.getMonth()) changeMonth(day);
    }

    function isDisabled(day: Date) {
      const key = dateKey(day);
      return Boolean((min && key < dateKey(min)) || (max && key > dateKey(max)));
    }

    function onDayKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, day: Date) {
      const direction = event.currentTarget.closest("[dir='rtl']") ? -1 : 1;
      const moves: Record<string, number> = {
        ArrowLeft: -direction,
        ArrowRight: direction,
        ArrowUp: -7,
        ArrowDown: 7,
      };
      let next: Date | undefined;
      if (event.key in moves) next = addDays(day, moves[event.key]);
      else if (event.key === "Home") next = addDays(day, -((day.getDay() - weekStartsOn + 7) % 7));
      else if (event.key === "End") next = addDays(day, 6 - ((day.getDay() - weekStartsOn + 7) % 7));
      else if (event.key === "PageUp") next = addMonths(day, event.shiftKey ? -12 : -1);
      else if (event.key === "PageDown") next = addMonths(day, event.shiftKey ? 12 : 1);
      if (!next) return;
      event.preventDefault();
      changeMonth(next);
      const focusNextDay = () => {
        const target = rootRef.current?.querySelector<HTMLButtonElement>(
          `[data-calendar-date="${dateKey(next!)}"]`,
        );
        target?.focus();
        return Boolean(target);
      };
      if (!focusNextDay()) requestAnimationFrame(focusNextDay);
    }

    return (
      <div {...props} ref={setRootRef} className={joinClassNames("gummy-calendar", className)} role="group" aria-label={label}>
        <div className="gummy-calendar__header">
          <button type="button" onClick={() => changeMonth(addMonths(visibleMonth, -1))} aria-label="Previous month"><span aria-hidden="true">←</span></button>
          <strong aria-live="polite">{monthName}</strong>
          <button type="button" onClick={() => changeMonth(addMonths(visibleMonth, 1))} aria-label="Next month"><span aria-hidden="true">→</span></button>
        </div>
        <div className="gummy-calendar__grid" role="grid" aria-label={monthName}>
          <div role="row" className="gummy-calendar__weekdays">
            {weekdays.map((day) => <span role="columnheader" key={day.getDay()} aria-label={weekdayFormatter.format(day)}>{weekdayFormatter.format(day).slice(0, 2)}</span>)}
          </div>
          {Array.from({ length: 6 }, (_, week) => (
            <div role="row" key={week}>
              {days.slice(week * 7, week * 7 + 7).map((day) => {
                const chosen = sameDay(day, selected);
                const current = sameDay(day, today);
                return (
                  <button
                    type="button"
                    role="gridcell"
                    key={dateKey(day)}
                    data-calendar-date={dateKey(day)}
                    data-outside={day.getMonth() !== visibleMonth.getMonth() || undefined}
                    data-today={current || undefined}
                    aria-selected={chosen}
                    aria-label={fullDateFormatter.format(day)}
                    disabled={isDisabled(day)}
                    tabIndex={chosen || (!selected && current) || (!selected && sameDay(day, visibleMonth)) ? 0 : -1}
                    onClick={() => choose(day)}
                    onKeyDown={(event) => onDayKeyDown(event, day)}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  },
);

GummyCalendar.displayName = "GummyCalendar";
