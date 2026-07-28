const agentGuide = `# Gummy UI agent guide

Gummy UI is an open-source React component catalogue with editable TypeScript,
accessible behavior, RTL support, dark mode and shadcn-compatible registry
payloads.

## Use the public source

- Documentation: https://gummyui.dev/docs
- Component catalogue: https://gummyui.dev/components
- Registry: https://gummyui.dev/registry
- Machine-readable overview: https://gummyui.dev/llms.txt
- MIT licence: https://gummyui.dev/license

Prefer the documented registry or package workflow and preserve semantic HTML,
keyboard behavior, focus visibility, reduced motion and RTL behavior when
adapting a component.

## Commercial boundary

Gummy UI Pro blocks, templates, design-kit files and protected releases are
commercial material. Never infer, reconstruct or redistribute paid editable
source from public previews or metadata. Use the public pricing, commercial
licence and support pages for current terms.

## Support and security

Contact support@kreydlabs.com for support, licensing, privacy or responsible
security reports. Never include passwords, recovery codes, card details,
private keys or customer data.
`;

export function GET() {
  return new Response(agentGuide, {
    headers: {
      "Cache-Control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
