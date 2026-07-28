# Production mobile Lighthouse recheck

Lighthouse 13.4.1 targeted `https://gummyui.dev/` in three sequential,
storage-isolated mobile runs on 28 July 2026. The host was Headless Chrome 150;
Lighthouse used its simulated mobile throttle and a 412 × 823 viewport at
1.75 device scale.

| Run | Fetch time (UTC) | Performance | Accessibility | Best practices | SEO | FCP | LCP | Speed Index | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 2026-07-28T22:55:07.810Z | 93 | 100 | 100 | 100 | 1.456 s | 2.731 s | 3.892 s | 125 ms | 0 |
| 2 | 2026-07-28T22:55:23.994Z | 99 | 100 | 100 | 100 | 1.066 s | 2.266 s | 1.066 s | 34 ms | 0 |
| 3 | 2026-07-28T22:55:37.789Z | 99 | 100 | 100 | 100 | 1.051 s | 2.251 s | 1.051 s | 12 ms | 0 |
| Median | — | **99** | **100** | **100** | **100** | **1.066 s** | **2.266 s** | **1.066 s** | **34 ms** | **0** |

The raw working reports were:

- `/private/tmp/gummyui-live-baseline.88WylF/mobile-1.json`, SHA-256
  `33ff510ed2f02a8669321391e2311d26d2ba3f94d617fb43ea5e9640db19da6b`;
- `/private/tmp/gummyui-live-baseline.88WylF/mobile-2.json`, SHA-256
  `f82c1725eea0bce525b2686de32d68b4608f4f7f2e96b4a6c5c02a170b7e7dbb`; and
- `/private/tmp/gummyui-live-baseline.88WylF/mobile-3.json`, SHA-256
  `1553ccf28e5cc39071360c9c08f70ccdd32c286a928dd35c3cc4fabf4849edfb`.

The temporary paths identify the operator-session originals rather than
durable repository artifacts. The hashes make later custody or copying
verifiable. This is homepage lab evidence, not field data or a full-site
performance result.
