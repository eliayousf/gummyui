import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../../components/PublicTextPage";

export const metadata: Metadata = {
  title: "Submit to the Gummy UI showcase",
  description: "Evidence, attribution, and permission requirements for future Gummy UI community showcase submissions, including the pre-launch review gate.",
  alternates: { canonical: "/community/submit" },
  robots: { index: true, follow: true },
};

export default function CommunitySubmitPage() {
  return (
    <PublicTextPage
      eyebrow="Showcase submission guidance"
      title="Bring a working product and permission."
      lede="The review standard is public now. The submission channel will open only after the founder approves a monitored contact destination and names its owner."
    >
      <section>
        <h2>What a submission will require</h2>
        <ol>
          <li>A public URL that reviewers can inspect without an account.</li>
          <li>The product name and a factual description of how Gummy UI is used.</li>
          <li>The submitter’s name, relationship to the product, and authority to grant publication permission.</li>
          <li>Explicit permission to publish the product name, URL, description, and supplied imagery.</li>
          <li>Confirmation that supplied copy and imagery contain no confidential data or unlicensed third-party material.</li>
        </ol>
      </section>
      <section>
        <h2>What review does not imply</h2>
        <p>Showcase inclusion will not be a certification of accessibility, security, compatibility, performance, commercial success, or endorsement. Any factual claim must be independently evidenced and narrowly attributed.</p>
      </section>
      <section>
        <h2>Submission status</h2>
        <p>Submissions are not yet accepted because there is no approved, monitored intake address or named response owner. This avoids collecting personal data into an unattended channel.</p>
        <p><Link href="/support">Review the current support status</Link> or return to the <Link href="/community">showcase</Link>.</p>
      </section>
    </PublicTextPage>
  );
}
