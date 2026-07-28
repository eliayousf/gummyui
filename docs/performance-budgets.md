# Performance budgets

These local budgets are release gates, not production Core Web Vitals claims.
`npm run performance:budget` reads the exact production client manifest and
checks the transitive gzip cost of representative interactive entries.

| Surface | Client JavaScript gzip budget |
|---|---:|
| Shared site chrome | 95 KB |
| Marketing composition | 165 KB |
| Documentation | 155 KB |
| Component detail inspector | 220 KB |
| Complete Component Lab | 250 KB |
| Theme builder | 185 KB |
| Browser-local frame studio | 130 KB |

Additional gates:

- no individual client JavaScript chunk above 450 KB uncompressed;
- no shared compiled CSS file above 220 KB uncompressed;
- route-scoped CSS remains below 12 KB for the inspector, 6 KB each for frame
  studio and Radix state compatibility, 40 KB for form controls, and 80 KB for
  the complete primitive set;
- Component Lab art-direction studies total no more than 800 KB and no single
  study exceeds 220 KB;
- the 1200 × 630 social image remains below 1 MB; and
- the existing artifact-boundary gate rejects client source maps.

Before launch, production field or controlled-lab evidence must additionally
record LCP, INP, CLS, total transfer, and DOM size for the home, documentation,
component detail, catalogue, and account surfaces on desktop and mobile. These
local bundle budgets do not substitute for that production evidence.
