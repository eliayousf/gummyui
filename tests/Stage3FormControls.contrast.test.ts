import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Oklch = [lightness: number, chroma: number, hue: number];

function parseOklch(value: string): Oklch {
  const match = value.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!match) throw new Error(`Invalid OKLCH token: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance([lightness, chroma, hue]: Oklch) {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;
  const [red, green, blue] = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => Math.min(1, Math.max(0, channel)));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first: Oklch, second: Oklch) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function block(css: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  if (!match) throw new Error(`Missing CSS block: ${selector}`);
  return match[1];
}

function token(css: string, selector: string, name: string) {
  const match = block(css, selector).match(
    new RegExp(`${name}:\\s*(oklch\\([^;]+)`),
  );
  if (!match) throw new Error(`Missing ${name} in ${selector}`);
  return parseOklch(match[1]);
}

describe("Stage 3 form readable-layer contrast", () => {
  it("keeps editing text above WCAG AA on stable planes in light and dark themes", async () => {
    const theme = await readFile(
      resolve(process.cwd(), "app/styles/gummy-theme.css"),
      "utf8",
    );
    const forms = await readFile(
      resolve(process.cwd(), "app/styles/gummy-form-controls.css"),
      "utf8",
    );
    const pairs = [
      [
        token(theme, ":root", "--ink"),
        token(forms, ":root", "--gummy-form-plane"),
        "light editing plane",
      ],
      [
        token(theme, ':root[data-theme="dark"]', "--ink"),
        token(forms, ':root[data-theme="dark"]', "--gummy-form-plane"),
        "dark editing plane",
      ],
    ] as const;

    for (const [foreground, background, label] of pairs) {
      expect(contrastRatio(foreground, background), label).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it("keeps compact checked marks above WCAG AA against the lime selected plane", async () => {
    const theme = await readFile(
      resolve(process.cwd(), "app/styles/gummy-theme.css"),
      "utf8",
    );
    const mark = parseOklch("oklch(0.22 0.07 309)");
    const selectedPlane = token(theme, ":root", "--fruit-lime-light");
    expect(contrastRatio(mark, selectedPlane)).toBeGreaterThanOrEqual(4.5);
  });
});
