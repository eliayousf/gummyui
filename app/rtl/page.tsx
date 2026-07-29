import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";
import { GummyDirection } from "../components/ui/GummyDirection";
import { GummyPagination, GummyPaginationItem, GummyPaginationLink, GummyPaginationNext, GummyPaginationPrevious } from "../components/ui/GummyPagination";
import { GummySlider, GummySliderControl, GummySliderLabel, GummySliderThumb, GummySliderValue } from "../components/ui/GummySlider";

export const metadata: Metadata = {
  title: "Gummy UI RTL support · Direction and keyboard behavior",
  description: "Review logical layout, mixed-direction content, mirrored controls, keyboard behavior, and publication requirements for right-to-left Gummy UI products.",
  alternates: { canonical: "/rtl" },
};

export default function RtlPage() {
  return (
    <PublicTextPage
      eyebrow="Direction is behavior"
      title="RTL is part of the component contract."
      lede="Gummy UI uses logical properties, native dir boundaries, and Base UI direction context so geometry and key meaning move together."
    >
      <section>
        <h2>Live scoped example</h2>
        <GummyDirection direction="rtl" className="rtl-proof">
          <h3>إعدادات مساحة العمل</h3>
          <p>تظل القراءة هادئة بينما تنتقل الحواف والأسهم مع اتجاه المحتوى.</p>
          <GummySlider defaultValue={65}>
            <GummySliderLabel>حجم الفريق <GummySliderValue /></GummySliderLabel>
            <GummySliderControl><GummySliderThumb aria-label="حجم الفريق" /></GummySliderControl>
          </GummySlider>
          <GummyPagination label="صفحات النتائج">
            <GummyPaginationItem><GummyPaginationPrevious href="#rtl-example" /></GummyPaginationItem>
            <GummyPaginationItem><GummyPaginationLink href="#rtl-example" current>١</GummyPaginationLink></GummyPaginationItem>
            <GummyPaginationItem><GummyPaginationLink href="#rtl-example">٢</GummyPaginationLink></GummyPaginationItem>
            <GummyPaginationItem><GummyPaginationNext href="#rtl-example" /></GummyPaginationItem>
          </GummyPagination>
        </GummyDirection>
      </section>
      <section>
        <h2>Implementation guidance</h2>
        <ul>
          <li>Set the document direction at the root; use scoped Direction only for genuine mixed-direction content.</li>
          <li>Use inline/block logical CSS properties instead of left/right layout rules.</li>
          <li>Mirror directional icons and keyboard deltas, not culturally neutral symbols.</li>
          <li>Keep verification codes and other inherently LTR data in an explicit inner boundary.</li>
        </ul>
      </section>
      <section>
        <h2>Direction is more than mirrored spacing</h2>
        <p>
          A right-to-left page needs the correct document direction so inline
          start and end, text alignment, scroll position, disclosure motion,
          and directional keyboard behavior share one context. Individual
          strings still keep their own Unicode direction, which matters for
          mixed Arabic or Hebrew text containing URLs, email addresses, code,
          prices, dates, and identifiers. Isolate those values rather than
          forcing the whole interface back to left-to-right.
        </p>
        <p>
          Product teams should review the meaning of icons instead of applying
          a blanket horizontal flip. Back and forward arrows usually follow
          reading direction; media playback, check marks, clocks, and brand
          marks generally do not. Charts and timelines need a decision based on
          the data model. Visual movement, focus order, DOM order, and spoken
          reading order must remain coherent after that decision.
        </p>
      </section>
      <section>
        <h2>What to verify before publishing an RTL locale</h2>
        <p>
          Exercise navigation, overlays, tables, forms, validation, calendars,
          sliders, pagination, carousels, breadcrumbs, and mixed-direction
          account data with native readers. Test keyboard arrows, home and end,
          zoom, narrow screens, dark mode, reduced motion, forced colours, and
          long translated labels. Transactional email and hosted identity or
          payment screens need the same scrutiny as the main site.
        </p>
        <p>
          Gummy UI’s logical styles and direction-aware components provide a
          foundation, not certification of a consuming application. English is
          currently the only published site language. Persian, Hebrew, and
          Arabic remain fail-closed until their complete dictionaries, rendered
          pages, terminology, metadata, bidirectional behavior, and
          founder-review records pass the publication gates described on the
          language-status page.
        </p>
      </section>
    </PublicTextPage>
  );
}
