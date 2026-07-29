import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { request } from "node:http";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const nextBinary = path.join(root, "node_modules", "next", "dist", "bin", "next");

const expectedSecurityHeaders = {
  "content-security-policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join("; "),
  "permissions-policy":
    "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security":
    "max-age=63072000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

const publicRoutes = [
  "/",
  "/pricing",
  "/commercial-license",
  "/refund",
  "/terms",
  "/privacy",
  "/subprocessors",
  "/robots.txt",
  "/sitemap.xml",
];

const sensitiveRoutes = [
  "/sign-in",
  "/account",
  "/checkout",
  "/downloads/not-a-grant",
  "/api/health",
];

const requiredSitemapPaths = [
  "/pricing",
  "/commercial-license",
  "/refund",
  "/terms",
  "/privacy",
  "/subprocessors",
  "/pro",
  "/blocks",
  "/templates",
  "/design-kit",
];

const forbiddenSitemapPaths = [
  "/sign-in",
  "/account",
  "/checkout",
  "/blocks/about/origin-ribbon",
  "/templates/relay-forge/preview",
];

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function getOpenPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Could not allocate a native Next verification port."));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForHttp(url, child, timeoutMilliseconds = 30_000) {
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error("Native Next server exited before it became ready.");
    }
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the native Next production server.");
}

async function terminate(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const closed = new Promise((resolve) => child.once("close", resolve));
  child.kill("SIGTERM");
  const timer = setTimeout(() => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
    }
  }, 5_000);
  await closed;
  clearTimeout(timer);
}

async function requestWithHost(url, host) {
  const target = new URL(url);
  return await new Promise((resolve, reject) => {
    const clientRequest = request({
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      method: "GET",
      headers: { host },
    }, (response) => {
      response.resume();
      response.once("end", () => {
        resolve({
          status: response.statusCode,
          location: response.headers.location ?? null,
        });
      });
    });
    clientRequest.once("error", reject);
    clientRequest.end();
  });
}

function verifySecurityHeaders(route, response) {
  for (const [name, expected] of Object.entries(expectedSecurityHeaders)) {
    invariant(
      response.headers.get(name) === expected,
      `${route} returned an invalid ${name} header.`,
    );
  }
}

function verifyIndexableHtml(route, html) {
  invariant(
    html.includes(`<link rel="canonical" href="https://gummyui.dev${route}"/>`),
    `${route} did not emit its production canonical URL.`,
  );
  invariant(
    !/<meta\s+name="robots"\s+content="[^"]*noindex/iu.test(html),
    `${route} unexpectedly emitted a noindex directive.`,
  );
}

await access(path.join(root, ".next", "BUILD_ID"));
await access(nextBinary);

const port = await getOpenPort();
const origin = `http://127.0.0.1:${port}`;
const child = spawn(
  process.execPath,
  [nextBinary, "start", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    cwd: root,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      STRIPE_CHECKOUT_ENABLED: "false",
      WORKOS_CLIENT_ID: "",
      WORKOS_API_KEY: "",
      WORKOS_COOKIE_PASSWORD: "",
      WORKOS_REDIRECT_URI: "",
      NEXT_PUBLIC_WORKOS_REDIRECT_URI: "",
      GUMMYUI_ORIGIN: "",
    },
    stdio: ["ignore", "ignore", "ignore"],
  },
);

try {
  await waitForHttp(`${origin}/`, child);

  for (const route of publicRoutes) {
    const response = await fetch(`${origin}${route}`, { redirect: "manual" });
    invariant(response.status === 200, `${route} returned ${response.status}.`);
    verifySecurityHeaders(route, response);
  }

  for (const route of sensitiveRoutes) {
    const response = await fetch(`${origin}${route}`, { redirect: "manual" });
    invariant(response.status < 500, `${route} returned ${response.status}.`);
    verifySecurityHeaders(route, response);
    invariant(
      response.headers.get("cache-control") === "private, no-store",
      `${route} did not return private, no-store.`,
    );
    invariant(
      response.headers.get("x-robots-tag")
        === "noindex, nofollow, noarchive",
      `${route} did not return the private X-Robots-Tag policy.`,
    );
  }

  for (const host of ["www.gummyui.dev", "gummyui.vercel.app"]) {
    const response = await requestWithHost(
      `${origin}/pricing?from=alternate`,
      host,
    );
    invariant(
      response.status === 308,
      `${host} did not return the permanent canonical-host redirect.`,
    );
    invariant(
      response.location === "https://gummyui.dev/pricing?from=alternate",
      `${host} did not preserve the path and query on the canonical redirect.`,
    );
  }

  for (const host of ["wwwXgummyuiYdev", "gummyuiXvercelYapp"]) {
    const response = await requestWithHost(`${origin}/pricing`, host);
    invariant(
      response.status === 200,
      `${host} incorrectly matched a canonical-host redirect pattern.`,
    );
  }

  for (const route of [
    "/pricing",
    "/commercial-license",
    "/refund",
    "/terms",
    "/privacy",
    "/subprocessors",
  ]) {
    const html = await (await fetch(`${origin}${route}`)).text();
    verifyIndexableHtml(route, html);
  }

  const signInHtml = await (await fetch(`${origin}/sign-in`)).text();
  invariant(
    /<meta\s+name="robots"\s+content="[^"]*noindex/iu.test(signInHtml),
    "/sign-in did not emit a noindex document directive.",
  );

  const legacyBlockHtml = await (
    await fetch(`${origin}/blocks/about/origin-ribbon`)
  ).text();
  invariant(
    legacyBlockHtml.includes(
      '<link rel="canonical" href="https://gummyui.dev/blocks/about"/>',
    ),
    "Legacy block detail did not canonicalize to consolidated category discovery.",
  );
  invariant(
    /<meta\s+name="robots"\s+content="[^"]*noindex[^"]*follow/iu.test(
      legacyBlockHtml,
    ),
    "Legacy block detail did not emit the noindex,follow document directive.",
  );

  const robots = await (await fetch(`${origin}/robots.txt`)).text();
  for (const route of requiredSitemapPaths) {
    invariant(
      !robots.includes(`Disallow: ${route}\n`),
      `robots.txt still disallows the public route ${route}.`,
    );
  }
  for (const route of ["/api/", "/auth/", "/account", "/checkout", "/downloads/"]) {
    invariant(
      robots.includes(`Disallow: ${route}`),
      `robots.txt does not disallow ${route}.`,
    );
  }

  const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
  for (const route of requiredSitemapPaths) {
    invariant(
      sitemap.includes(`<loc>https://gummyui.dev${route}</loc>`),
      `sitemap.xml omits ${route}.`,
    );
  }
  for (const route of forbiddenSitemapPaths) {
    invariant(
      !sitemap.includes(`<loc>https://gummyui.dev${route}</loc>`),
      `sitemap.xml exposes private or noindex route ${route}.`,
    );
  }

  console.log(JSON.stringify({
    nativeNextProduction: "passed",
    publicRoutes: publicRoutes.length,
    sensitiveRoutes: sensitiveRoutes.length,
    securityHeaders: Object.keys(expectedSecurityHeaders).length,
    sitemapRequiredPaths: requiredSitemapPaths.length,
    alternateHostRedirects: 2,
    lookalikeHostRejections: 2,
  }, null, 2));
} finally {
  await terminate(child);
}
