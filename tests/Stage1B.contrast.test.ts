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

function directToken(css: string, selector: string, token: string) {
  const match = block(css, selector).match(new RegExp(`${token}:\\s*(oklch\\([^;]+)`));
  if (!match) throw new Error(`Missing ${token} in ${selector}`);
  return parseOklch(match[1]);
}

describe("Stage 1B readable-layer contrast", () => {
  it("keeps Input and Card text above WCAG AA on their stable cores", async () => {
    const css = await readFile(resolve(process.cwd(), "app/globals.css"), "utf8");
    const pairs = [
      [directToken(css, ".gummy-input", "--input-label"), directToken(css, ".gummy-input", "--input-core"), "Input"],
      [directToken(css, ".gummy-card", "--card-label"), directToken(css, ".gummy-card", "--card-core"), "Card"],
    ] as const;

    for (const [label, core, name] of pairs) {
      expect(contrastRatio(label, core), name).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps Badge labels above WCAG AA across all fruit cores", async () => {
    const css = [
      await readFile(resolve(process.cwd(), "app/styles/gummy-theme.css"), "utf8"),
      await readFile(resolve(process.cwd(), "app/globals.css"), "utf8"),
    ].join("\n");
    const label = directToken(css, ".gummy-badge", "--badge-label");
    const cores = [
      directToken(css, ".gummy-badge", "--badge-core"),
      directToken(css, ":root", "--fruit-raspberry-core"),
      directToken(css, ":root", "--fruit-grape-core"),
      directToken(css, ":root", "--fruit-lime-core"),
      directToken(css, ":root", "--fruit-tangerine-core"),
      directToken(css, ":root", "--fruit-aqua-core"),
    ];

    for (const [index, core] of cores.entries()) {
      expect(contrastRatio(label, core), `Badge core ${index}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
