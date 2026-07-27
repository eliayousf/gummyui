import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";
import { ThemeBuilder } from "../components/ThemeBuilder";

export const metadata: Metadata = {
  title: "Gummy UI theme builder · Light, dark, type, shape and charts",
  description: "Build, preview, share, copy, and install a complete browser-local Gummy UI theme across colour, typography, shape, borders, shadows, patterns, and charts.",
  alternates: { canonical: "/themes" },
};

export default function ThemesPage() {
  return (
    <PublicTextPage
      eyebrow="Browser-local theme tool"
      title="Shape the whole system."
      lede="Tune light and dark colour, typography, shape, borders, shadows, patterns, and chart roles without changing component behavior. The builder stays in your browser, creates a shareable URL, and exports plain CSS."
    >
      <ThemeBuilder />
      <section>
        <h2>Theme contract</h2>
        <p>Semantic canvas, surface, ink, line, focus, and status roles remain stable. Fruit families provide material identity, while components derive their light, rim, depth, and shadow values from the shared system.</p>
      </section>
    </PublicTextPage>
  );
}
