import type { Metadata } from "next";
import Link from "next/link";
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
        <p>Paid blocks, templates and design-kit files are proprietary and use the separate <Link href="/commercial-license">Gummy UI Pro commercial licence</Link>. Buying Pro does not change the MIT terms for public component source.</p>
      </section>
      <section>
        <h2>What this means in a product</h2>
        <p>
          You may install, inspect, change, combine, publish, and distribute the
          public component source, including in commercial software, subject to
          the notice requirement in the licence above. Keep a copy of the MIT
          notice with substantial portions of that source. Gummy UI does not
          require a runtime account, per-seat payment, attribution in the
          product interface, or permission to modify the public components.
        </p>
        <p>
          Your application, brand assets, copy, dependencies, and modifications
          may have additional obligations that this licence does not resolve.
          The software is supplied without warranty, and consuming teams remain
          responsible for testing their particular build, content, security,
          accessibility, and legal requirements. Registry access is a delivery
          convenience; the licence attaches to the copied public source, not to
          continued availability of this website.
        </p>
      </section>
    </PublicTextPage>
  );
}
