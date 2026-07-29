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
      <section>
        <h2>A simple framing workflow</h2>
        <ol>
          <li>Choose a screenshot you are permitted to use and check it contains no unintended personal, account, analytics, payment, or confidential information.</li>
          <li>Adjust the frame material, canvas, padding, and corner radius while watching the live browser preview.</li>
          <li>Check that text and controls in the screenshot remain legible at the size where the exported image will be published.</li>
          <li>Export the PNG, inspect the resulting file locally, then close or reload the page to release the temporary preview reference.</li>
        </ol>
        <p>
          The exported image includes the pixels visible inside the chosen
          screenshot. Framing does not redact, blur, crop, optimize, or verify
          their content. Prepare any privacy redaction in an appropriate local
          image editor before opening the file here.
        </p>
      </section>
      <section>
        <h2>Browser and output limits</h2>
        <p>
          Very large source images can exceed a browser or device’s available
          canvas memory, especially on mobile. If preview or export fails, use
          a smaller local source rather than repeatedly selecting confidential
          material. Colour profiles, font rendering, and pixel density can also
          differ between the original application, the browser canvas, and a
          later publishing service.
        </p>
        <p>
          The studio is a convenience tool, not a hosted asset library. It does
          not keep projects, synchronize settings, produce share links, remove
          metadata from the original file, or upload finished images. Save the
          exported PNG to a location you control and apply your normal naming,
          review, backup, brand, and publication process.
        </p>
      </section>
    </PublicTextPage>
  );
}
