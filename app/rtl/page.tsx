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
    </PublicTextPage>
  );
}
