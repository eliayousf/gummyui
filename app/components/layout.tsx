/* eslint-disable @next/next/no-css-tags -- React 19 stylesheet precedence keeps these large styles route-scoped in Vinext. */
export default function ComponentsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link rel="stylesheet" href="/styles/gummy-core-components.css" precedence="gummy-components" />
      <link rel="stylesheet" href="/styles/gummy-form-controls.css" precedence="gummy-components" />
      <link rel="stylesheet" href="/styles/gummy-primitives.css" precedence="gummy-components" />
      <link rel="stylesheet" href="/styles/gummy-radix-compat.css" precedence="gummy-components" />
      <link rel="stylesheet" href="/styles/component-inspector.css" precedence="gummy-components" />
      {children}
    </>
  );
}
