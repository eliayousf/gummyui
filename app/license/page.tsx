import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";

export const metadata: Metadata = {
  title: "MIT licence for the public Gummy UI component source",
  description: "Read the MIT licence covering the public Gummy UI component catalogue and the explicit boundary separating future paid blocks, templates, and design assets.",
  alternates: { canonical: "/license" },
};

export default function LicensePage() {
  return (
    <PublicTextPage
      eyebrow="Open-source boundary"
      title="The public component source is MIT licensed."
      lede="The licence applies to source in the public Gummy UI repository. It does not grant access to separate paid block, template, design-kit, release, or entitlement assets."
    >
      <section>
        <h2>MIT License</h2>
        <pre><code>{`Copyright (c) 2026 Gummy UI contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}</code></pre>
      </section>
      <section>
        <h2>Pro boundary</h2>
        <p>No commercial Pro licence terms are published in this baseline. Seat rights, permitted use, update periods, support, refunds, and organisation terms require founder approval and appropriate legal review.</p>
      </section>
    </PublicTextPage>
  );
}
