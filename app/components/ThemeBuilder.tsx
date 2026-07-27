"use client";

import * as React from "react";
import { CopyTextButton } from "./RegistrySourceViewer";
import { GummyBadge } from "./ui/GummyBadge";
import { GummyButton } from "./ui/GummyButton";
import { GummyCard, GummyCardContent, GummyCardDescription, GummyCardFooter, GummyCardHeader, GummyCardTitle } from "./ui/GummyCard";
import { GummyProgress } from "./ui/GummyProgress";
import { GummySwitch } from "./ui/GummySwitch";

type ThemeMode = "light" | "dark";
type Pattern = "none" | "dots" | "grid" | "waves";

type ThemeConfiguration = {
  light: {
    canvas: string;
    ink: string;
    raspberry: string;
    grape: string;
    lime: string;
    tangerine: string;
    aqua: string;
  };
  dark: {
    canvas: string;
    ink: string;
    raspberry: string;
    grape: string;
    lime: string;
    tangerine: string;
    aqua: string;
  };
  typography: {
    interface: "system" | "humanist" | "geometric";
    scale: number;
  };
  shape: {
    radius: number;
    border: number;
  };
  shadow: number;
  pattern: Pattern;
  patternOpacity: number;
};

const defaults: ThemeConfiguration = {
  light: {
    canvas: "#fffaf1",
    ink: "#2e1738",
    raspberry: "#e84d72",
    grape: "#9b6be8",
    lime: "#a9db42",
    tangerine: "#f39a42",
    aqua: "#54bfd0",
  },
  dark: {
    canvas: "#24142c",
    ink: "#fff8ea",
    raspberry: "#f26b8d",
    grape: "#b38af2",
    lime: "#bde65d",
    tangerine: "#f6ad61",
    aqua: "#70d0dc",
  },
  typography: { interface: "system", scale: 1 },
  shape: { radius: 1, border: 1 },
  shadow: 1,
  pattern: "dots",
  patternOpacity: 0.16,
};

const fontStacks = {
  system: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  humanist: '"Trebuchet MS", "Gill Sans", ui-sans-serif, sans-serif',
  geometric: 'Futura, "Century Gothic", "Avenir Next", ui-sans-serif, sans-serif',
} as const;

const colorLabels = {
  canvas: "Canvas",
  ink: "Ink",
  raspberry: "Raspberry",
  grape: "Grape",
  lime: "Lime",
  tangerine: "Tangerine",
  aqua: "Aqua",
} as const;

function isThemeConfiguration(value: unknown): value is ThemeConfiguration {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ThemeConfiguration>;
  return Boolean(
    candidate.light &&
    candidate.dark &&
    candidate.typography &&
    candidate.shape &&
    typeof candidate.shadow === "number" &&
    typeof candidate.pattern === "string" &&
    typeof candidate.patternOpacity === "number",
  );
}

function encodeConfiguration(configuration: ThemeConfiguration) {
  const bytes = new TextEncoder().encode(JSON.stringify(configuration));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return window.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeConfiguration(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
  return isThemeConfiguration(parsed) ? parsed : null;
}

function cssFor(configuration: ThemeConfiguration) {
  const shared = `  --gummy-font-interface: ${fontStacks[configuration.typography.interface]};
  --gummy-type-scale: ${configuration.typography.scale};
  --gummy-radius-scale: ${configuration.shape.radius};
  --gummy-border-width: ${configuration.shape.border}px;
  --gummy-shadow-strength: ${configuration.shadow};
  --gummy-pattern: ${configuration.pattern};
  --gummy-pattern-opacity: ${configuration.patternOpacity};`;
  const modeTokens = (mode: ThemeMode) => {
    const colors = configuration[mode];
    return `  --canvas: ${colors.canvas};
  --ink: ${colors.ink};
  --fruit-raspberry-core: ${colors.raspberry};
  --fruit-grape-core: ${colors.grape};
  --fruit-lime-core: ${colors.lime};
  --fruit-tangerine-core: ${colors.tangerine};
  --fruit-aqua-core: ${colors.aqua};
  --chart-1: ${colors.raspberry};
  --chart-2: ${colors.grape};
  --chart-3: ${colors.lime};
  --chart-4: ${colors.tangerine};
  --chart-5: ${colors.aqua};`;
  };
  return `:root {
${shared}
${modeTokens("light")}
}

:root[data-theme="dark"] {
${modeTokens("dark")}
}`;
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="theme-builder__range">
      <span>{label}</span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      <output>{value}{suffix}</output>
    </label>
  );
}

export function ThemeBuilder() {
  const [configuration, setConfiguration] = React.useState(defaults);
  const [mode, setMode] = React.useState<ThemeMode>("light");
  const [shareStatus, setShareStatus] = React.useState("Copy share link");
  const [loadMessage, setLoadMessage] = React.useState("");

  React.useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get("theme");
    if (!encoded) return;
    let timeout: number | undefined;
    try {
      const decoded = decodeConfiguration(encoded);
      if (decoded) {
        timeout = window.setTimeout(() => {
          setConfiguration(decoded);
          setLoadMessage("Shared configuration loaded.");
        });
      }
    } catch {
      timeout = window.setTimeout(() => {
        setLoadMessage("The shared configuration was invalid, so the default theme is shown.");
      });
    }
    return () => window.clearTimeout(timeout);
  }, []);

  const colors = configuration[mode];
  const css = cssFor(configuration);
  const previewStyle = {
    "--canvas": colors.canvas,
    "--ink": colors.ink,
    "--fruit-raspberry-core": colors.raspberry,
    "--fruit-grape-core": colors.grape,
    "--fruit-lime-core": colors.lime,
    "--fruit-tangerine-core": colors.tangerine,
    "--fruit-aqua-core": colors.aqua,
    "--theme-preview-font": fontStacks[configuration.typography.interface],
    "--theme-preview-scale": configuration.typography.scale,
    "--theme-preview-radius": configuration.shape.radius,
    "--theme-preview-border": `${configuration.shape.border}px`,
    "--theme-preview-shadow": configuration.shadow,
    "--theme-preview-pattern-opacity": configuration.patternOpacity,
  } as React.CSSProperties;

  function updateModeColor(name: keyof ThemeConfiguration["light"], value: string) {
    setConfiguration((current) => ({
      ...current,
      [mode]: { ...current[mode], [name]: value },
    }));
  }

  async function copyShareLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("theme", encodeConfiguration(configuration));
    await navigator.clipboard.writeText(url.toString());
    window.history.replaceState(null, "", url);
    setShareStatus("Link copied");
    window.setTimeout(() => setShareStatus("Copy share link"), 1600);
  }

  return (
    <div className="theme-builder">
      <aside className="theme-builder__controls" aria-label="Theme controls">
        <div className="theme-builder__mode" role="group" aria-label="Edit colour mode">
          {(["light", "dark"] as const).map((candidate) => (
            <button
              key={candidate}
              type="button"
              aria-pressed={mode === candidate}
              onClick={() => setMode(candidate)}
            >
              {candidate}
            </button>
          ))}
        </div>

        <fieldset>
          <legend>{mode} colours</legend>
          {(Object.keys(colorLabels) as Array<keyof typeof colorLabels>).map((name) => (
            <label className="theme-builder__color" key={name}>
              <span>{colorLabels[name]}</span>
              <input
                type="color"
                value={colors[name]}
                onChange={(event) => updateModeColor(name, event.currentTarget.value)}
              />
              <code>{colors[name]}</code>
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Typography</legend>
          <label className="theme-builder__select">
            <span>Interface family</span>
            <select
              value={configuration.typography.interface}
              onChange={(event) => setConfiguration((current) => ({
                ...current,
                typography: {
                  ...current.typography,
                  interface: event.currentTarget.value as ThemeConfiguration["typography"]["interface"],
                },
              }))}
            >
              <option value="system">System grotesk</option>
              <option value="humanist">Humanist</option>
              <option value="geometric">Geometric</option>
            </select>
          </label>
          <RangeControl
            label="Type scale"
            value={configuration.typography.scale}
            min={0.88}
            max={1.2}
            step={0.02}
            onChange={(scale) => setConfiguration((current) => ({
              ...current,
              typography: { ...current.typography, scale },
            }))}
          />
        </fieldset>

        <fieldset>
          <legend>Shape, border, and shadow</legend>
          <RangeControl
            label="Shape"
            value={configuration.shape.radius}
            min={0.65}
            max={1.5}
            step={0.05}
            onChange={(radius) => setConfiguration((current) => ({
              ...current,
              shape: { ...current.shape, radius },
            }))}
          />
          <RangeControl
            label="Border"
            value={configuration.shape.border}
            min={0}
            max={3}
            step={0.5}
            suffix="px"
            onChange={(border) => setConfiguration((current) => ({
              ...current,
              shape: { ...current.shape, border },
            }))}
          />
          <RangeControl
            label="Shadow"
            value={configuration.shadow}
            min={0}
            max={1.8}
            step={0.1}
            onChange={(shadow) => setConfiguration((current) => ({ ...current, shadow }))}
          />
        </fieldset>

        <fieldset>
          <legend>Pattern</legend>
          <label className="theme-builder__select">
            <span>Canvas pattern</span>
            <select
              value={configuration.pattern}
              onChange={(event) => setConfiguration((current) => ({
                ...current,
                pattern: event.currentTarget.value as Pattern,
              }))}
            >
              <option value="none">None</option>
              <option value="dots">Dots</option>
              <option value="grid">Grid</option>
              <option value="waves">Waves</option>
            </select>
          </label>
          <RangeControl
            label="Pattern opacity"
            value={configuration.patternOpacity}
            min={0}
            max={0.4}
            step={0.02}
            onChange={(patternOpacity) => setConfiguration((current) => ({ ...current, patternOpacity }))}
          />
        </fieldset>

        <div className="theme-builder__actions">
          <button type="button" onClick={() => setConfiguration(defaults)}>Reset all</button>
          <button type="button" onClick={copyShareLink}>{shareStatus}</button>
        </div>
        {loadMessage ? <p className="theme-builder__status" role="status">{loadMessage}</p> : null}
      </aside>

      <section
        className={`theme-builder__preview theme-builder__preview--${configuration.pattern}`}
        data-theme={mode}
        style={previewStyle}
        aria-label={`${mode} theme preview`}
      >
        <div className="theme-builder__preview-heading">
          <p>Live system preview · {mode}</p>
          <h2>Release decisions, made visible.</h2>
          <span>Colour, type, shape, borders, shadows, patterns, and charts update together.</span>
        </div>
        <div className="theme-builder__preview-actions">
          <GummyButton>Publish release</GummyButton>
          <GummyButton variant="secondary">Review</GummyButton>
        </div>
        <div className="theme-builder__preview-status">
          <GummyBadge variant="success" dot motion="none">Ready</GummyBadge>
          <GummyBadge variant="warning" motion="none">Review</GummyBadge>
          <GummySwitch label="Weekly digest" defaultChecked />
        </div>
        <GummyCard>
          <GummyCardHeader>
            <GummyCardTitle>Release health</GummyCardTitle>
            <GummyCardDescription>Five checks completed, one review remaining.</GummyCardDescription>
          </GummyCardHeader>
          <GummyCardContent>
            <GummyProgress label="Verification progress" value={84} />
            <div className="theme-builder__chart" role="img" aria-label="Five-colour chart palette preview">
              {(["raspberry", "grape", "lime", "tangerine", "aqua"] as const).map((name, index) => (
                <span key={name} style={{ height: `${34 + index * 10}%`, background: colors[name] }} />
              ))}
            </div>
          </GummyCardContent>
          <GummyCardFooter>Updated from the same exported tokens.</GummyCardFooter>
        </GummyCard>
      </section>

      <section className="theme-builder__output" aria-labelledby="theme-output-title">
        <div>
          <div>
            <strong id="theme-output-title">Installable CSS theme</strong>
            <span>Includes light/dark colour roles, type, shape, border, shadow, pattern, and chart tokens.</span>
          </div>
          <CopyTextButton value={css} label="Copy CSS" />
        </div>
        <pre><code>{css}</code></pre>
        <div className="theme-builder__install">
          <strong>Install the foundation</strong>
          <code>npx shadcn@latest add https://gummyui.dev/r/gummy-base.json</code>
          <CopyTextButton
            value="npx shadcn@latest add https://gummyui.dev/r/gummy-base.json"
            label="Copy install command"
          />
        </div>
      </section>
    </div>
  );
}
