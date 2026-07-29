"use client";

import * as React from "react";

export function StandaloneSwitchSpecimen({
  label,
  defaultChecked = false,
}: {
  label: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = React.useState(defaultChecked);
  const generatedId = React.useId();
  const id = `gummy-standalone-switch-${generatedId}`;

  return (
    <div className="gummy-switch-field">
      <button
        id={id}
        type="button"
        className="gummy-switch"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => setChecked((current) => !current)}
        data-checked={checked || undefined}
      >
        <span className="gummy-switch__pool" aria-hidden="true" />
        <span className="gummy-switch__thumb" aria-hidden="true">
          <span />
        </span>
      </button>
      <div className="gummy-switch-field__copy">
        <label htmlFor={id}>{label}</label>
      </div>
    </div>
  );
}
