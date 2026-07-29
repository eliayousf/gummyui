/* eslint-disable @next/next/no-css-tags -- React 19 stylesheet precedence keeps the inspector shell route-scoped in Vinext. */
export default function ComponentDetailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link
        rel="stylesheet"
        href="/styles/component-inspector.css"
        precedence="gummy-component-inspector"
      />
      {children}
    </>
  );
}
