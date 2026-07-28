/* eslint-disable @next/next/no-css-tags -- React 19 stylesheet precedence keeps this generated stylesheet route-scoped in Vinext. */
export default function ComponentsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link rel="stylesheet" href="/styles/component-docs.css" precedence="gummy-components" />
      {children}
    </>
  );
}
