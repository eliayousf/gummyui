import type { Metadata } from "next";
import { GummyFrameStudio } from "../components/GummyFrameStudio";
import { PublicTextPage } from "../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Gummy frame studio · Browser-local screenshot tool",
  description: "Frame screenshots with configurable Gummy UI gel material, canvas, padding, and radius, then export a PNG entirely in the browser without uploading images.",
  alternates: { canonical: "/studio" },
};

export default function StudioPage() {
  return (
    <PublicTextPage
      eyebrow="Browser-local utility"
      title="Give the screenshot a little pressure."
      lede="Choose an image, tune its material frame and canvas, then export a PNG. Image bytes never leave this browser."
    >
      <GummyFrameStudio />
      <section>
        <h2>Privacy by construction</h2>
        <p>The studio uses a temporary browser object URL for preview and the browser Canvas API for export. It has no upload endpoint, network request, account requirement, or server-side image storage.</p>
      </section>
    </PublicTextPage>
  );
}
