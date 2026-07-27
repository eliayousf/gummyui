"use client";

import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type CommandContextValue = {
  search: string;
  setSearch: (value: string) => void;
  listId: string;
  label: string;
};

const CommandContext = React.createContext<CommandContextValue | null>(null);

function useCommand() {
  const value = React.useContext(CommandContext);
  if (!value) throw new Error("GummyCommand parts must be used inside GummyCommand.");
  return value;
}

export const GummyCommand = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { label?: string }
>(function GummyCommand({ label = "Command menu", className, onKeyDown, ...props }, ref) {
  const [search, setSearch] = React.useState("");
  const listId = React.useId().replace(/:/g, "");
  return (
    <CommandContext.Provider value={{ search, setSearch, listId, label }}>
      <div
        {...props}
        ref={ref}
        className={joinClassNames("gummy-command", className)}
        aria-label={label}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-command-item]:not([hidden]):not([aria-disabled='true'])"));
          if (!items.length) return;
          event.preventDefault();
          const current = items.indexOf(document.activeElement as HTMLElement);
          const next = event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : event.key === "ArrowDown"
                ? (current + 1 + items.length) % items.length
                : (current - 1 + items.length) % items.length;
          items[next]?.focus();
        }}
      />
    </CommandContext.Provider>
  );
});

GummyCommand.displayName = "GummyCommand";

export const GummyCommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function GummyCommandInput({ className, value, onChange, ...props }, ref) {
  const command = useCommand();
  return (
    <input
      {...props}
      ref={ref}
      className={joinClassNames("gummy-command__input", className)}
      role="combobox"
      aria-controls={command.listId}
      aria-expanded="true"
      autoComplete="off"
      value={value ?? command.search}
      onChange={(event) => {
        if (value === undefined) command.setSearch(event.currentTarget.value);
        onChange?.(event);
      }}
    />
  );
});

GummyCommandInput.displayName = "GummyCommandInput";

export const GummyCommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyCommandList({ className, ...props }, ref) {
  const { listId, label } = useCommand();
  return <div {...props} ref={ref} id={listId} role="listbox" aria-label={props["aria-label"] ?? `${label} results`} className={joinClassNames("gummy-command__list", className)} />;
});

GummyCommandList.displayName = "GummyCommandList";

export const GummyCommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { label: string }
>(function GummyCommandGroup({ label, className, children, ...props }, ref) {
  const id = React.useId().replace(/:/g, "");
  return (
    <div {...props} ref={ref} role="group" aria-labelledby={id} className={joinClassNames("gummy-command__group", className)}>
      <div id={id} className="gummy-command__group-label">{label}</div>
      {children}
    </div>
  );
});

GummyCommandGroup.displayName = "GummyCommandGroup";

export type GummyCommandItemProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> & {
  value: string;
  keywords?: string[];
  disabled?: boolean;
  onSelect?: (value: string) => void;
};

export const GummyCommandItem = React.forwardRef<HTMLDivElement, GummyCommandItemProps>(
  function GummyCommandItem(
    { value, keywords = [], disabled = false, onSelect, className, children, ...props },
    ref,
  ) {
    const { search } = useCommand();
    const haystack = `${value} ${keywords.join(" ")}`.toLocaleLowerCase();
    const hidden = Boolean(search && !haystack.includes(search.toLocaleLowerCase().trim()));
    return (
      <div
        {...props}
        ref={ref}
        role="option"
        aria-selected="false"
        tabIndex={hidden || disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        className={joinClassNames("gummy-command__item", className)}
        data-command-item=""
        hidden={hidden}
        onClick={(event) => {
          props.onClick?.(event);
          if (!event.defaultPrevented && !disabled) onSelect?.(value);
        }}
        onKeyDown={(event) => {
          props.onKeyDown?.(event);
          if (!event.defaultPrevented && !disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onSelect?.(value);
          }
        }}
      >
        {children}
      </div>
    );
  },
);

GummyCommandItem.displayName = "GummyCommandItem";

export function GummyCommandEmpty({
  when,
  children = "No results found.",
}: {
  when: boolean;
  children?: React.ReactNode;
}) {
  return when ? <div className="gummy-command__empty">{children}</div> : null;
}

export function GummyCommandSeparator() {
  return <div className="gummy-command__separator" role="separator" />;
}

export const GummyCommandShortcut = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function GummyCommandShortcut({ className, ...props }, ref) {
    return <span {...props} ref={ref} className={joinClassNames("gummy-command__shortcut", className)} aria-hidden="true" />;
  },
);

GummyCommandShortcut.displayName = "GummyCommandShortcut";
