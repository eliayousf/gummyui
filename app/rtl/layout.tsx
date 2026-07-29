/* eslint-disable @next/next/no-css-tags -- React 19 stylesheet precedence keeps primitive examples route-scoped in Vinext. */
export default function RtlLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link rel="stylesheet" href="/styles/rtl-components.css" precedence="gummy-rtl" />
      {children}
    </>
  );
}
