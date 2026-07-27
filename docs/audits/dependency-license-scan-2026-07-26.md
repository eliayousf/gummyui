# Public dependency licence scan — 26 July 2026

## Scope and result

`license-checker` inspected the installed public application dependency tree
again after the 27 July 2026 patch-level dependency refresh. The command used
`--excludePrivatePackages`; the private workspace root separately declares its
existing MIT licence explicitly.

| Detected expression | Packages |
| --- | ---: |
| MIT | 483 |
| Apache-2.0 | 32 |
| ISC | 19 |
| BSD-2-Clause | 13 |
| MPL-2.0 | 6 |
| BSD-3-Clause | 6 |
| MIT OR Apache-2.0 | 4 |
| CC0-1.0 | 3 |
| MIT-0 | 2 |
| BlueOak-1.0.0 | 2 |
| LGPL-3.0-or-later | 1 |
| Apache-2.0 AND LGPL-3.0-or-later AND MIT | 1 |
| Python-2.0 | 1 |
| CC-BY-4.0 | 1 |
| 0BSD | 1 |

The non-routine expressions resolve to:

- `@img/sharp-libvips-darwin-arm64` — LGPL-3.0-or-later;
- `@img/sharp-wasm32` — Apache-2.0 AND LGPL-3.0-or-later AND MIT;
- `argparse` — Python-2.0; and
- `caniuse-lite` — CC-BY-4.0.

The Sharp/libvips packages are transitive build tooling, not Gummy UI public
component source. This inventory is evidence of detection, not legal approval.
Before a public release, counsel or an approved licence-compliance owner must
confirm notice, attribution, source-offer, and distribution obligations against
the actual shipped artifacts. The production artifact boundary scan must be
repeated on the approved release.

## Separate security result

`npm audit --audit-level=moderate` reported zero vulnerabilities after the
final dependency refresh. Gitleaks scanned approximately 12.52 MB with the
repository configuration and reported no leaks. These are point-in-time local
results, not production verification.
