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
        <h3>Review before export</h3>
        <p>
          Start with semantic roles, not isolated swatches: canvas and ink must
          support long-form reading, focus must remain unmistakable, and status
          colours must work alongside text or icons. Compare both colour modes
          with realistic labels, validation, disabled controls, dense cards,
          charts, and keyboard focus. Then check narrow screens, 200% zoom,
          RTL, forced colours, and reduced motion before copying the CSS into a
          product. A shared builder URL records a design direction; it is not a
          substitute for testing the actual content and component states your
          customers will use. Save one shared URL as the review baseline,
          compare the exported token diff in version control, and record why
          any semantic role changed before shipping the theme.
        </p>
      </section>
    </PublicTextPage>
  );
}
