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
  const linearRgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => Math.min(1, Math.max(0, channel)));

  return (
    0.2126 * linearRgb[0] +
    0.7152 * linearRgb[1] +
    0.0722 * linearRgb[2]
  );
}

function contrastRatio(first: Oklch, second: Oklch) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function tokenFromBlock(css: string, selector: string, token: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`));
  if (!block) throw new Error(`Missing CSS block: ${selector}`);
  const value = block[1].match(new RegExp(`${token}:\\s*(oklch\\([^;]+)`));
  if (!value) throw new Error(`Missing ${token} in ${selector}`);
  return parseOklch(value[1]);
}

describe("GummyButton colour contrast", () => {
  it("keeps label text above WCAG AA against every fruit-colour core", async () => {
    const css = await readFile(
      resolve(process.cwd(), "app/styles/gummy-button.css"),
      "utf8",
    );
    const label = tokenFromBlock(css, ".gummy-button", "--gummy-label");
    const selectors = [
      ".gummy-button",
      '.gummy-button[data-variant="secondary"]',
      '.gummy-button[data-variant="success"]',
      '.gummy-button[data-variant="warning"]',
      '.gummy-button[data-variant="info"]',
    ];

    for (const selector of selectors) {
      const core = tokenFromBlock(css, selector, "--gummy-core");
      expect(contrastRatio(label, core), selector).toBeGreaterThanOrEqual(4.5);
    }
  });
});
