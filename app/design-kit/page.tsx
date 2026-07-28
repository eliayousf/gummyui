import type { Metadata } from "next";
import { PublicTextPage } from "../components/PublicTextPage";
import {
  proDesignKitDefinitionCount,
  proDesignKitExpectedMaterialization,
  proDesignKitExternalMaterialization,
  proDesignKitLastObservedMaterializerVersion,
  proDesignKitManualQa,
  proDesignKitMaterializerVersion,
} from "../data/pro-catalogue";

export const metadata: Metadata = {
  title: "Gummy UI Pro design kit status",
  description:
    "Review the implementation, Figma materialization, manual review, export, checksum, protected delivery, backup, and release status of the Gummy UI Pro design kit.",
  alternates: { canonical: "/design-kit" },
  robots: { index: true, follow: true },
};

export default function DesignKitPage() {
  return (
    <PublicTextPage
      eyebrow={`Private Pro implementation · v${proDesignKitMaterializerVersion}`}
      title="The code-aligned local materializer is implemented, not released."
      lede={`The deterministic v${proDesignKitMaterializerVersion} payload contains ${proDesignKitDefinitionCount} source-aligned contracts, ${proDesignKitExpectedMaterialization.componentSets} editable component sets and ${proDesignKitExpectedMaterialization.editableVariants.toLocaleString("en-US")} editable variants, including ${proDesignKitExpectedMaterialization.editablePatternVariants.toLocaleString("en-US")} pattern variants. Only v${proDesignKitLastObservedMaterializerVersion} has been run in the live file; current-version founder review and export remain pending.`}
    >
      <section>
        <h2>Release contract</h2>
        <p>A real release must include useful code-aligned components and patterns, light and dark variables, states, properties, responsive and auto-layout guidance, token annotations, documentation, version notes, checksums, clean export verification, protected delivery, backup, and restore evidence.</p>
      </section>
      <section>
        <h2>Current boundary</h2>
        <p>External materialization is <strong>{proDesignKitExternalMaterialization}</strong> and manual QA is <strong>{proDesignKitManualQa}</strong>. Editable design source belongs only in the private Pro repository. The public site may later publish founder-reviewed screenshots and boundary-safe metadata, never the paid design file or reconstructable source.</p>
      </section>
    </PublicTextPage>
  );
}
