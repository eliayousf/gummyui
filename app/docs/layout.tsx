/* eslint-disable @next/next/no-css-tags -- React 19 stylesheet precedence keeps this form stylesheet off unrelated Vinext routes. */
export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link rel="stylesheet" href="/styles/gummy-form-controls.css" precedence="gummy-docs" />
      {children}
    </>
  );
}
