import type { Metadata } from "next";
import { ComponentLab } from "../ComponentLab";

/* eslint-disable @next/next/no-css-tags -- React 19 stylesheet precedence keeps the workbench presentation styles on the lab route. */

export const metadata: Metadata = {
  title: "Canonical Component Lab · Gummy UI",
  description: "Live states and composition evidence for all 57 Gummy UI component categories.",
  robots: { index: false, follow: true },
};

export default function ComponentLabPage() {
  return (
    <>
      <link rel="stylesheet" href="/styles/component-lab.css" precedence="gummy-component-lab" />
      <ComponentLab />
    </>
  );
}
