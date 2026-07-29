import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const evidenceName = "browser-production-2026-07-27";
const evidenceDirectory = join(root, "docs", "audits", "evidence", evidenceName);
const chromeCandidates = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const publicRoutes = [
  "/",
  "/docs",
  "/docs/nextjs",
  "/docs/vite",
  "/components",
  "/components/accordion",
  "/themes",
  "/studio",
  "/community",
  "/rtl",
  "/registry",
  "/blog",
  "/changelog",
  "/pro",
  "/blocks",
  "/blocks/about",
  "/blocks/about/origin-ribbon",
  "/templates",
  "/templates/relay-forge",
  "/design-kit",
  "/pricing",
  "/accessibility",
  "/security",
  "/support",
  "/contact",
  "/privacy",
  "/terms",
  "/license",
  "/commercial-license",
  "/refund",
  "/locales",
  "/mcp",
];

const legacyNoindexRoutes = new Map([
  ["/blocks/about/origin-ribbon", "/blocks/about"],
]);

const sensitiveRoutes = [
  "/sign-in",
  "/checkout",
  "/account",
  "/account/purchases",
  "/account/licences",
  "/account/downloads",
  "/account/billing",
  "/account/team",
  "/account/team/members",
  "/account/team/invitations",
  "/account/profile",
  "/account/security",
  "/account/privacy",
  "/account/privacy/export",
  "/account/privacy/deletion",
];

const representativeAxeRoutes = [
  "/",
  "/docs",
  "/components/accordion",
  "/themes",
  "/rtl",
  "/sign-in",
  "/account",
];

const screenshotScenarios = [
  {
    id: "home-desktop-light",
    route: "/",
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    colourScheme: "light",
    reducedMotion: "no-preference",
  },
  {
    id: "home-desktop-dark",
    route: "/",
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    colourScheme: "dark",
    reducedMotion: "no-preference",
  },
  {
    id: "home-mobile-320",
    route: "/",
    width: 320,
    height: 800,
    deviceScaleFactor: 1,
    colourScheme: "light",
    reducedMotion: "no-preference",
  },
  {
    id: "component-200-percent-equivalent-reflow",
    route: "/components/accordion",
    width: 320,
    height: 800,
    deviceScaleFactor: 2,
    colourScheme: "light",
    reducedMotion: "no-preference",
  },
  {
    id: "rtl-mobile",
    route: "/rtl",
    width: 320,
    height: 800,
    deviceScaleFactor: 1,
    colourScheme: "light",
    reducedMotion: "no-preference",
  },
  {
    id: "component-reduced-motion",
    route: "/components/accordion",
    width: 768,
    height: 900,
    deviceScaleFactor: 1,
    colourScheme: "light",
    reducedMotion: "reduce",
  },
  {
    id: "account-fail-closed-mobile",
    route: "/account",
    width: 320,
    height: 800,
    deviceScaleFactor: 1,
    colourScheme: "light",
    reducedMotion: "reduce",
  },
];

const sourceRoots = [
  "app",
  "lib",
  "worker",
  "scripts",
];
const sourceFiles = [
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "vite.config.ts",
  "tsconfig.json",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function terminateChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const closed = new Promise((resolve) => child.once("close", resolve));
  child.kill("SIGTERM");
  const graceful = await Promise.race([
    closed.then(() => true),
    wait(5_000).then(() => false),
  ]);
  if (!graceful && child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await closed;
  }
}

async function removeProfileDirectory(profileDirectory) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(profileDirectory, { recursive: true, force: true });
      return;
    } catch (error) {
      if (!["EBUSY", "ENOTEMPTY", "EPERM"].includes(error.code) || attempt === 4) {
        throw error;
      }
      await wait(100 * (attempt + 1));
    }
  }
}

async function findChrome() {
  for (const candidate of chromeCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next supported system Chrome location.
    }
  }
  throw new Error(
    "System Chrome was not found. Set CHROME_BIN to a Chrome or Chromium executable.",
  );
}

async function getOpenPort() {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.unref();
    server.on("error", rejectPort);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        rejectPort(new Error("Could not allocate a local QA port."));
        return;
      }
      server.close(() => resolvePort(address.port));
    });
  });
}

async function waitForHttp(url, timeoutMilliseconds = 30_000) {
  const deadline = Date.now() + timeoutMilliseconds;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status > 0) {
        return response;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(
    `Timed out waiting for ${url}: ${lastError instanceof Error ? lastError.message : "no response"}`,
  );
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
}

async function hashPaths(paths) {
  const files = [];
  for (const path of paths) {
    try {
      const details = await stat(path);
      if (details.isDirectory()) {
        files.push(...await listFiles(path));
      } else if (details.isFile()) {
        files.push(path);
      }
    } catch {
      // Optional source roots do not affect the fingerprint when absent.
    }
  }
  files.sort();
  const digest = createHash("sha256");
  for (const file of files) {
    const content = await readFile(file);
    digest.update(relative(root, file));
    digest.update("\0");
    digest.update(content);
    digest.update("\0");
  }
  return { fileCount: files.length, sha256: digest.digest("hex") };
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolveConnection, rejectConnection) => {
      this.socket.addEventListener("open", resolveConnection, { once: true });
      this.socket.addEventListener("error", rejectConnection, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) {
          return;
        }
        this.pending.delete(message.id);
        if (message.error) {
          pending.reject(
            new Error(`${pending.method}: ${message.error.message}`),
          );
        } else {
          pending.resolve(message.result);
        }
        return;
      }
      const listeners = this.listeners.get(message.method) ?? [];
      for (const listener of listeners) {
        listener(message.params);
      }
    });
    this.socket.addEventListener("close", () => {
      for (const pending of this.pending.values()) {
        pending.reject(new Error(`CDP connection closed during ${pending.method}.`));
      }
      this.pending.clear();
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolveCommand, rejectCommand) => {
      this.pending.set(id, {
        method,
        resolve: resolveCommand,
        reject: rejectCommand,
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
    return () => {
      this.listeners.set(
        method,
        (this.listeners.get(method) ?? []).filter((candidate) => candidate !== listener),
      );
    };
  }

  once(method, timeoutMilliseconds = 15_000) {
    return new Promise((resolveEvent, rejectEvent) => {
      const timeout = setTimeout(() => {
        remove();
        rejectEvent(new Error(`Timed out waiting for CDP event ${method}.`));
      }, timeoutMilliseconds);
      const remove = this.on(method, (params) => {
        clearTimeout(timeout);
        remove();
        resolveEvent(params);
      });
    });
  }

  close() {
    this.socket?.close();
  }
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    const detail =
      result.exceptionDetails.exception?.description
      ?? result.exceptionDetails.text
      ?? "Unknown Runtime.evaluate exception";
    throw new Error(detail);
  }
  return result.result.value;
}

async function configureEnvironment(
  client,
  {
    width,
    height,
    deviceScaleFactor = 1,
    colourScheme = "light",
    reducedMotion = "no-preference",
  },
) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    mobile: false,
    width,
    height,
    deviceScaleFactor,
    screenWidth: width,
    screenHeight: height,
  });
  await client.send("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [
      { name: "prefers-color-scheme", value: colourScheme },
      { name: "prefers-reduced-motion", value: reducedMotion },
      { name: "forced-colors", value: "none" },
    ],
  });
}

async function navigate(client, url) {
  const loaded = client.once("Page.loadEventFired");
  const navigation = await client.send("Page.navigate", { url });
  if (navigation.errorText) {
    throw new Error(`Navigation failed for ${url}: ${navigation.errorText}`);
  }
  await loaded;
  await evaluate(
    client,
    `Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise((resolve) => setTimeout(resolve, 3000))
    ]).then(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))`,
  );
}

async function inspectPage(client) {
  return evaluate(
    client,
    `(() => {
      const root = document.documentElement;
      const body = document.body;
      const h1 = document.querySelector("h1");
      const main = document.querySelector("main");
      const canonical = document.querySelector('link[rel="canonical"]');
      const robots = document.querySelector('meta[name="robots"]');
      const beyondViewport = [...document.querySelectorAll("*")]
        .filter((element) => {
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden") return false;
          const rect = element.getBoundingClientRect();
          if (!rect.width || !rect.height) return false;
          return rect.right > innerWidth + 1 || rect.left < -1;
        })
        .slice(0, 12)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id || null,
            className: typeof element.className === "string" ? element.className : null,
            left: Math.round(rect.left * 100) / 100,
            right: Math.round(rect.right * 100) / 100,
            width: Math.round(rect.width * 100) / 100,
          };
        });
      const intrinsicOverflow = [...document.querySelectorAll("*")]
        .filter((element) => {
          const style = getComputedStyle(element);
          return element.scrollWidth > element.clientWidth + 1
            && !["auto", "scroll", "hidden", "clip"].includes(style.overflowX);
        })
        .slice(0, 20)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className: typeof element.className === "string" ? element.className : null,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          overflowX: getComputedStyle(element).overflowX,
          text: element.childElementCount === 0
            ? element.textContent?.trim().replace(/\\s+/g, " ").slice(0, 180)
            : null,
        }));
      const rtlScopes = [...document.querySelectorAll('[dir="rtl"]')].map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === "string" ? element.className : null,
        attributeDirection: element.getAttribute("dir"),
        computedDirection: getComputedStyle(element).direction,
        language: element.getAttribute("lang"),
      }));
      const palette = {
        canvas: getComputedStyle(root).getPropertyValue("--canvas").trim(),
        bodyBackground: getComputedStyle(body).backgroundColor,
        bodyColour: getComputedStyle(body).color,
      };
      const siteHeader = document.querySelector(".site-header");
      const headerItems = siteHeader
        ? [...siteHeader.children]
          .filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none"
              && style.visibility !== "hidden"
              && rect.width > 0
              && rect.height > 0;
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName.toLowerCase(),
              className: typeof element.className === "string" ? element.className : null,
              left: rect.left,
              right: rect.right,
              top: rect.top,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height,
            };
          })
        : [];
      const headerCollisions = [];
      for (let leftIndex = 0; leftIndex < headerItems.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < headerItems.length; rightIndex += 1) {
          const left = headerItems[leftIndex];
          const right = headerItems[rightIndex];
          const horizontalIntersection = Math.min(left.right, right.right) - Math.max(left.left, right.left);
          const verticalIntersection = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);
          if (horizontalIntersection > 1 && verticalIntersection > 1) {
            headerCollisions.push({
              left: left.className || left.tag,
              right: right.className || right.tag,
              horizontalIntersection,
              verticalIntersection,
            });
          }
        }
      }
      const overflowIsolation = root.scrollWidth > root.clientWidth + 1
        ? (() => {
          const measureWithOverride = (css) => {
            const style = document.createElement("style");
            style.textContent = css;
            document.head.append(style);
            const measurement = root.scrollWidth;
            style.remove();
            return measurement;
          };
          const pseudoStyle = document.createElement("style");
          pseudoStyle.textContent = ".qa-no-pseudo::before,.qa-no-pseudo::after{display:none!important}";
          document.head.append(pseudoStyle);
          const pseudoContributors = [];
          for (const element of document.querySelectorAll("*")) {
            const before = getComputedStyle(element, "::before");
            const after = getComputedStyle(element, "::after");
            if (before.content === "none" && after.content === "none") continue;
            element.classList.add("qa-no-pseudo");
            const widthWithoutPseudos = root.scrollWidth;
            element.classList.remove("qa-no-pseudo");
            if (widthWithoutPseudos < root.scrollWidth) {
              pseudoContributors.push({
                tag: element.tagName.toLowerCase(),
                id: element.id || null,
                className: typeof element.className === "string" ? element.className : null,
                widthWithoutPseudos,
              });
            }
          }
          pseudoStyle.remove();
          return {
            withoutAllPseudos: measureWithOverride("*::before,*::after{display:none!important}"),
            withoutTransforms: measureWithOverride("*{transform:none!important}"),
            withoutShadows: measureWithOverride("*{box-shadow:none!important;filter:none!important}"),
            pseudoContributors,
          };
        })()
        : null;
      return {
        url: location.href,
        title: document.title,
        h1: h1?.textContent?.trim() ?? null,
        canonical: canonical?.href ?? null,
        robots: robots?.content ?? null,
        lang: root.lang || null,
        rootDirectionAttribute: root.getAttribute("dir"),
        rootComputedDirection: getComputedStyle(root).direction,
        rtlScopes,
        theme: root.dataset.theme ?? null,
        palette,
        viewport: {
          innerWidth,
          innerHeight,
          devicePixelRatio,
          visualViewportWidth: visualViewport?.width ?? null,
          visualViewportScale: visualViewport?.scale ?? null,
        },
        document: {
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          bodyScrollWidth: body.scrollWidth,
          hasHorizontalOverflow: root.scrollWidth > root.clientWidth + 1,
          beyondViewport,
          intrinsicOverflow,
          overflowIsolation,
        },
        landmarks: {
          main: Boolean(main),
          header: Boolean(document.querySelector("header")),
          nav: document.querySelectorAll("nav").length,
          footer: Boolean(document.querySelector("footer")),
        },
        headerGeometry: {
          items: headerItems,
          collisions: headerCollisions,
        },
        bodyTextCharacters: body.innerText.trim().length,
      };
    })()`,
  );
}

async function inspectReducedMotion(client) {
  return evaluate(
    client,
    `(() => {
      const parseTime = (value) => value.endsWith("ms")
        ? Number.parseFloat(value)
        : Number.parseFloat(value) * 1000;
      let maximumAnimationMilliseconds = 0;
      let maximumTransitionMilliseconds = 0;
      const offenders = [];
      for (const element of document.querySelectorAll("*")) {
        const style = getComputedStyle(element);
        const animationDurations = style.animationDuration.split(",").map((value) => parseTime(value.trim()));
        const transitionDurations = style.transitionDuration.split(",").map((value) => parseTime(value.trim()));
        const animationMaximum = Math.max(0, ...animationDurations.filter(Number.isFinite));
        const transitionMaximum = Math.max(0, ...transitionDurations.filter(Number.isFinite));
        maximumAnimationMilliseconds = Math.max(maximumAnimationMilliseconds, animationMaximum);
        maximumTransitionMilliseconds = Math.max(maximumTransitionMilliseconds, transitionMaximum);
        if (animationMaximum > 1 || transitionMaximum > 1) {
          offenders.push({
            tag: element.tagName.toLowerCase(),
            id: element.id || null,
            className: typeof element.className === "string" ? element.className : null,
            animationMilliseconds: animationMaximum,
            transitionMilliseconds: transitionMaximum,
          });
          if (offenders.length >= 12) break;
        }
      }
      return {
        mediaMatches: matchMedia("(prefers-reduced-motion: reduce)").matches,
        maximumAnimationMilliseconds,
        maximumTransitionMilliseconds,
        offenders,
      };
    })()`,
  );
}

async function captureScreenshot(client, filename) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const bytes = Buffer.from(result.data, "base64");
  const path = join(evidenceDirectory, filename);
  await writeFile(path, bytes);
  return {
    file: relative(root, path),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function axProperty(node, name) {
  return node.properties?.find((property) => property.name === name)?.value?.value;
}

async function inspectAccessibilityTree(client) {
  const tree = await client.send("Accessibility.getFullAXTree");
  const nodes = tree.nodes.filter((node) => !node.ignored);
  const roles = {};
  const interactiveRoles = new Set([
    "button",
    "checkbox",
    "combobox",
    "link",
    "menuitem",
    "radio",
    "slider",
    "switch",
    "tab",
    "textbox",
  ]);
  const unnamedInteractiveNodes = [];
  for (const node of nodes) {
    const role = node.role?.value ?? "unknown";
    roles[role] = (roles[role] ?? 0) + 1;
    if (
      interactiveRoles.has(role)
      && axProperty(node, "focusable") === true
      && !(node.name?.value ?? "").trim()
    ) {
      unnamedInteractiveNodes.push({
        nodeId: node.nodeId,
        role,
        backendDOMNodeId: node.backendDOMNodeId ?? null,
      });
    }
  }
  return {
    nodeCount: nodes.length,
    roles,
    unnamedInteractiveNodes,
    landmarkCounts: {
      banner: roles.banner ?? 0,
      navigation: roles.navigation ?? 0,
      main: roles.main ?? 0,
      contentinfo: roles.contentinfo ?? 0,
    },
    namedControls: nodes
      .filter((node) => interactiveRoles.has(node.role?.value))
      .slice(0, 40)
      .map((node) => ({
        role: node.role?.value,
        name: node.name?.value ?? "",
        focusable: axProperty(node, "focusable") === true,
      })),
  };
}

async function runAxe(client, axeSource) {
  await evaluate(client, `${axeSource}\n//# sourceURL=axe-core-browser-qa.js`);
  const result = await evaluate(
    client,
    `axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
      },
      resultTypes: ["violations", "incomplete"]
    }).then((result) => ({
      testEngine: result.testEngine,
      testEnvironment: result.testEnvironment,
      testRunner: result.testRunner,
      violations: result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map((node) => ({
          impact: node.impact,
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary
        }))
      })),
      incomplete: result.incomplete.map((item) => ({
        id: item.id,
        impact: item.impact,
        nodes: item.nodes.map((node) => ({
          impact: node.impact,
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary
        }))
      }))
    }))`,
  );
  return {
    ...result,
    seriousOrCritical: result.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    ),
  };
}

async function dispatchKey(client, key, { shift = false } = {}) {
  const keyCode = key === "Tab" ? 9 : key === "Enter" ? 13 : 0;
  const modifiers = shift ? 8 : 0;
  await client.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key,
    code: key,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
    modifiers,
  });
  await client.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code: key,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
    modifiers,
  });
}

async function inspectFocus(client) {
  return evaluate(
    client,
    `(() => {
      const element = document.activeElement;
      if (!element) return null;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const name = element.getAttribute("aria-label")
        || element.textContent?.trim().replace(/\\s+/g, " ").slice(0, 160)
        || element.getAttribute("title")
        || element.getAttribute("alt")
        || null;
      const focusVisible = element.matches(":focus-visible");
      const matchingFocusRules = [];
      const inspectRules = (rules) => {
        for (const rule of rules) {
          if ("cssRules" in rule) {
            inspectRules(rule.cssRules);
          }
          if (!("selectorText" in rule) || !rule.selectorText.includes(":focus-visible")) {
            continue;
          }
          for (const selector of rule.selectorText.split(",")) {
            const candidate = selector.trim();
            try {
              for (const matched of document.querySelectorAll(candidate)) {
                if (
                  matched === element
                  || matched.contains(element)
                  || element.contains(matched)
                ) {
                  matchingFocusRules.push(candidate);
                }
              }
            } catch {
              // Ignore selectors not supported by the running Chrome build.
            }
          }
        }
      };
      for (const sheet of document.styleSheets) {
        try {
          inspectRules(sheet.cssRules);
        } catch {
          // Cross-origin sheets cannot be inspected; all production CSS is same-origin.
        }
      }
      const outlineVisible = style.outlineStyle !== "none"
        && style.outlineStyle !== "hidden"
        && Number.parseFloat(style.outlineWidth) > 0;
      const boxShadowVisible = style.boxShadow !== "none";
      const textDecorationVisible = style.textDecorationLine.includes("underline");
      const transformedIntoView = element.classList.contains("skip-link")
        && style.transform !== "none";
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        className: typeof element.className === "string" ? element.className : null,
        role: element.getAttribute("role"),
        name,
        href: element instanceof HTMLAnchorElement ? element.getAttribute("href") : null,
        focusVisible,
        visualIndicator: focusVisible && (
          outlineVisible
          || boxShadowVisible
          || textDecorationVisible
          || transformedIntoView
          || matchingFocusRules.length > 0
        ),
        matchingFocusRules: [...new Set(matchingFocusRules)],
        style: {
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          boxShadow: style.boxShadow,
          textDecorationLine: style.textDecorationLine,
          transform: style.transform,
        },
        rectangle: {
          left: Math.round(rect.left * 100) / 100,
          top: Math.round(rect.top * 100) / 100,
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
        },
      };
    })()`,
  );
}

async function runKeyboardTraversal(client, baseUrl) {
  await configureEnvironment(client, {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    colourScheme: "light",
    reducedMotion: "no-preference",
  });
  await navigate(client, `${baseUrl}/`);
  await evaluate(client, "document.activeElement?.blur()");
  const forward = [];
  for (let index = 0; index < 28; index += 1) {
    await dispatchKey(client, "Tab");
    forward.push(await inspectFocus(client));
  }
  const backward = [];
  for (let index = 0; index < 8; index += 1) {
    await dispatchKey(client, "Tab", { shift: true });
    backward.push(await inspectFocus(client));
  }

  await navigate(client, `${baseUrl}/components/accordion`);
  await evaluate(client, "document.activeElement?.blur()");
  const componentForward = [];
  for (let index = 0; index < 34; index += 1) {
    await dispatchKey(client, "Tab");
    componentForward.push(await inspectFocus(client));
  }

  const serialise = (entry) =>
    [entry?.tag, entry?.id, entry?.className, entry?.name, entry?.href].join("|");
  const forwardUnique = new Set(forward.map(serialise)).size;
  const componentUnique = new Set(componentForward.map(serialise)).size;
  const focusVisibleFailures = [...forward, ...componentForward].filter(
    (entry) => entry?.focusVisible !== true || entry?.visualIndicator !== true,
  );
  return {
    home: {
      forward,
      backward,
      forwardUnique,
      returnedBackward: backward.length > 0 && serialise(backward.at(-1)) !== serialise(forward.at(-1)),
      firstFocusIsSkipLink: forward[0]?.className?.split(" ").includes("skip-link") ?? false,
    },
    component: {
      forward: componentForward,
      forwardUnique: componentUnique,
    },
    focusVisibleFailures,
    noTrap:
      forwardUnique >= 20
      && componentUnique >= 20
      && backward.length === 8,
  };
}

async function fetchEvidence(baseUrl, route, options = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    redirect: "manual",
    ...options,
  });
  const body = Buffer.from(await response.arrayBuffer());
  return {
    route,
    method: options.method ?? "GET",
    status: response.status,
    contentType: response.headers.get("content-type"),
    cacheControl: response.headers.get("cache-control"),
    xRobotsTag: response.headers.get("x-robots-tag"),
    location: response.headers.get("location"),
    bytes: body.length,
    bodySha256: sha256(body),
  };
}

function evaluateChecks(evidence) {
  const routeFailures = evidence.routes.filter(
    (route) =>
      route.response.status !== 200
      || !route.response.contentType?.includes("text/html")
      || !route.page.title
      || !route.page.h1
      || route.page.bodyTextCharacters < 80
      || route.page.document.hasHorizontalOverflow
      || route.page.headerGeometry.collisions.length > 0,
  );
  const sensitiveFailures = evidence.sensitiveRoutes.filter(
    (route) =>
      route.response.status !== 200
      || !route.response.cacheControl?.includes("private")
      || !route.response.cacheControl?.includes("no-store")
      || !route.response.xRobotsTag?.includes("noindex")
      || !route.page.robots?.includes("noindex")
      || route.page.document.hasHorizontalOverflow
      || route.page.headerGeometry.collisions.length > 0,
  );
  const legacyNoindexFailures = evidence.routes.filter((route) => {
    const canonicalPath = legacyNoindexRoutes.get(route.route);
    if (!canonicalPath) return false;
    return !route.page.robots?.includes("noindex")
      || route.page.robots?.includes("nofollow")
      || route.page.canonical !== `https://gummyui.dev${canonicalPath}`;
  });
  const endpointFailures = evidence.sensitiveEndpoints.filter(
    (endpoint) =>
      endpoint.response.status !== endpoint.expectedStatus
      || !endpoint.response.cacheControl?.includes("private")
      || !endpoint.response.cacheControl?.includes("no-store")
      || !endpoint.response.xRobotsTag?.includes("noindex"),
  );
  const axeFailures = evidence.axe.filter(
    (entry) => entry.result.seriousOrCritical.length > 0,
  );
  const accessibilityTreeFailures = evidence.accessibilityTrees.filter(
    (entry) =>
      entry.tree.unnamedInteractiveNodes.length > 0
      || entry.tree.landmarkCounts.main !== 1,
  );
  const scenarioFailures = evidence.scenarios.filter(
    (scenario) =>
      scenario.page.document.hasHorizontalOverflow
      || scenario.page.headerGeometry.collisions.length > 0
      || scenario.page.viewport.innerWidth !== scenario.width
      || scenario.page.viewport.devicePixelRatio !== scenario.deviceScaleFactor
      || scenario.page.theme !== scenario.colourScheme
      || (
        scenario.reducedMotion === "reduce"
        && (
          scenario.reducedMotionEvidence.mediaMatches !== true
          || scenario.reducedMotionEvidence.maximumAnimationMilliseconds > 1
          || scenario.reducedMotionEvidence.maximumTransitionMilliseconds > 1
        )
      ),
  );

  const rtlScenario = evidence.scenarios.find((scenario) => scenario.id === "rtl-mobile");
  const rtlFailure =
    !rtlScenario
    || rtlScenario.page.rootComputedDirection !== "ltr"
    || rtlScenario.page.rtlScopes.length < 1
    || rtlScenario.page.rtlScopes.some((scope) => scope.computedDirection !== "rtl");
  const light = evidence.scenarios.find((scenario) => scenario.id === "home-desktop-light");
  const dark = evidence.scenarios.find((scenario) => scenario.id === "home-desktop-dark");
  const darkModeFailure =
    !light
    || !dark
    || light.page.palette.bodyBackground === dark.page.palette.bodyBackground
    || light.page.palette.bodyColour === dark.page.palette.bodyColour;

  return {
    passed:
      routeFailures.length === 0
      && legacyNoindexFailures.length === 0
      && sensitiveFailures.length === 0
      && endpointFailures.length === 0
      && axeFailures.length === 0
      && accessibilityTreeFailures.length === 0
      && scenarioFailures.length === 0
      && evidence.keyboard.noTrap
      && evidence.keyboard.focusVisibleFailures.length === 0
      && !rtlFailure
      && !darkModeFailure
      && evidence.runtimeErrors.length === 0,
    routeFailures: routeFailures.map((failure) => failure.route),
    legacyNoindexFailures: legacyNoindexFailures.map(
      (failure) => failure.route,
    ),
    sensitiveFailures: sensitiveFailures.map((failure) => failure.route),
    endpointFailures: endpointFailures.map((failure) => `${failure.method} ${failure.route}`),
    axeFailures: axeFailures.map((failure) => failure.route),
    accessibilityTreeFailures: accessibilityTreeFailures.map((failure) => failure.route),
    scenarioFailures: scenarioFailures.map((failure) => failure.id),
    keyboardNoTrap: evidence.keyboard.noTrap,
    focusVisibleFailureCount: evidence.keyboard.focusVisibleFailures.length,
    rtlSemanticsPassed: !rtlFailure,
    darkModePassed: !darkModeFailure,
    runtimeErrorCount: evidence.runtimeErrors.length,
  };
}

async function main() {
  await mkdir(evidenceDirectory, { recursive: true });
  const chromePath = await findChrome();
  const port = await getOpenPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const profileDirectory = await mkdtemp(join(tmpdir(), "gummyui-browser-qa-"));
  const serverLog = [];
  const chromeLog = [];
  let server;
  let chrome;
  let client;

  try {
    server = spawn(
      process.execPath,
      [join(root, "node_modules", "vinext", "dist", "cli.js"), "start", "--port", String(port), "--hostname", "127.0.0.1"],
      {
        cwd: root,
        env: {
          ...process.env,
          NODE_ENV: "production",
          WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout.on("data", (chunk) => serverLog.push(String(chunk)));
    server.stderr.on("data", (chunk) => serverLog.push(String(chunk)));
    await waitForHttp(`${baseUrl}/api/health`);

    chrome = spawn(
      chromePath,
      [
        "--headless=new",
        "--remote-debugging-address=127.0.0.1",
        "--remote-debugging-port=0",
        `--user-data-dir=${profileDirectory}`,
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-features=Translate,MediaRouter",
        "--disable-sync",
        "--metrics-recording-only",
        "--mute-audio",
        "about:blank",
      ],
      {
        cwd: root,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    chrome.stdout.on("data", (chunk) => chromeLog.push(String(chunk)));
    chrome.stderr.on("data", (chunk) => chromeLog.push(String(chunk)));

    const devtoolsPortFile = join(profileDirectory, "DevToolsActivePort");
    const deadline = Date.now() + 15_000;
    let devtoolsPort;
    while (Date.now() < deadline) {
      try {
        const content = await readFile(devtoolsPortFile, "utf8");
        devtoolsPort = Number.parseInt(content.split(/\r?\n/)[0], 10);
        if (Number.isFinite(devtoolsPort)) {
          break;
        }
      } catch {
        // Chrome writes the port file after its debugging endpoint is ready.
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 50));
    }
    if (!devtoolsPort) {
      throw new Error(`Chrome did not expose a CDP port: ${chromeLog.join("").slice(-2000)}`);
    }

    const versionResponse = await fetch(`http://127.0.0.1:${devtoolsPort}/json/version`);
    const chromeVersion = await versionResponse.json();
    const targetResponse = await fetch(
      `http://127.0.0.1:${devtoolsPort}/json/new?${encodeURIComponent("about:blank")}`,
      { method: "PUT" },
    );
    const target = await targetResponse.json();
    client = new CdpClient(target.webSocketDebuggerUrl);
    await client.connect();
    await Promise.all([
      client.send("Page.enable"),
      client.send("Runtime.enable"),
      client.send("Network.enable"),
      client.send("Log.enable"),
      client.send("Accessibility.enable"),
    ]);

    const runtimeErrors = [];
    const ignoredLocalOriginEvents = [];
    const recordRuntimeEvent = (event) => {
      const localMetadataOriginCsp =
        event.source === "security"
        && event.text.includes("https://gummyui.dev/favicon.svg")
        && event.text.includes("Content Security Policy");
      const browserFaviconFallback =
        event.source === "network"
        && event.text.includes("404")
        && event.url?.endsWith("/favicon.ico");
      if (localMetadataOriginCsp || browserFaviconFallback) {
        ignoredLocalOriginEvents.push(event);
      } else {
        runtimeErrors.push(event);
      }
    };
    client.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
      recordRuntimeEvent({
        kind: "exception",
        text: exceptionDetails.exception?.description ?? exceptionDetails.text,
        url: exceptionDetails.url || null,
        lineNumber: exceptionDetails.lineNumber ?? null,
        columnNumber: exceptionDetails.columnNumber ?? null,
      });
    });
    client.on("Log.entryAdded", ({ entry }) => {
      if (entry.level === "error") {
        recordRuntimeEvent({
          kind: "log",
          source: entry.source,
          text: entry.text,
          url: entry.url || null,
          lineNumber: entry.lineNumber ?? null,
        });
      }
    });

    const evidence = {
      schemaVersion: "1.0",
      evidenceType: "automated-local-production-browser-qa",
      generatedAt: new Date().toISOString(),
      limitations: [
        "This is automated local production-build evidence, not a deployed-origin test.",
        "The 200% check uses an equivalent 320 CSS-pixel reflow at devicePixelRatio 2 (640 physical pixels), not a manual browser-zoom inspection.",
        "Accessibility-tree and accessible-name checks are automated smoke evidence, not a human screen-reader walkthrough.",
        "Firefox, WebKit, touch hardware, and manual painted-contrast review remain outside this run.",
      ],
      runtime: {
        baseUrl,
        chromeExecutable: chromePath,
        chromeProduct: chromeVersion.Browser,
        chromeRevision: chromeVersion["WebKit-Version"],
        userAgent: chromeVersion["User-Agent"],
        protocolVersion: chromeVersion["Protocol-Version"],
        node: process.version,
      },
      fingerprints: {
        source: await hashPaths([
          ...sourceRoots.map((path) => join(root, path)),
          ...sourceFiles.map((path) => join(root, path)),
        ]),
        productionBuild: await hashPaths([join(root, "dist")]),
      },
      routes: [],
      sensitiveRoutes: [],
      sensitiveEndpoints: [],
      scenarios: [],
      axe: [],
      accessibilityTrees: [],
      keyboard: null,
      runtimeErrors,
      ignoredLocalOriginEvents,
      checks: null,
    };

    await configureEnvironment(client, {
      width: 320,
      height: 800,
      deviceScaleFactor: 1,
      colourScheme: "light",
      reducedMotion: "no-preference",
    });
    for (const route of publicRoutes) {
      const response = await fetchEvidence(baseUrl, route);
      await navigate(client, `${baseUrl}${route}`);
      const page = await inspectPage(client);
      evidence.routes.push({ route, response, page });
    }

    for (const route of sensitiveRoutes) {
      const response = await fetchEvidence(baseUrl, route);
      await navigate(client, `${baseUrl}${route}`);
      const page = await inspectPage(client);
      evidence.sensitiveRoutes.push({ route, response, page });
    }

    for (const endpoint of [
      { route: "/api/download-grants", method: "POST", expectedStatus: 404 },
      { route: "/downloads/invalid-browser-qa-grant", method: "GET", expectedStatus: 404 },
    ]) {
      evidence.sensitiveEndpoints.push({
        ...endpoint,
        response: await fetchEvidence(baseUrl, endpoint.route, { method: endpoint.method }),
      });
    }

    for (const scenario of screenshotScenarios) {
      await client.send("Storage.clearDataForOrigin", {
        origin: baseUrl,
        storageTypes: "local_storage",
      });
      await configureEnvironment(client, scenario);
      await navigate(client, `${baseUrl}${scenario.route}`);
      const page = await inspectPage(client);
      const reducedMotionEvidence = await inspectReducedMotion(client);
      const screenshot = await captureScreenshot(client, `${scenario.id}.png`);
      evidence.scenarios.push({
        ...scenario,
        page,
        reducedMotionEvidence,
        screenshot,
      });
    }

    const axeSource = await readFile(join(root, "node_modules", "axe-core", "axe.min.js"), "utf8");
    for (const route of representativeAxeRoutes) {
      await configureEnvironment(client, {
        width: route === "/account" ? 320 : 1280,
        height: 900,
        deviceScaleFactor: 1,
        colourScheme: "light",
        reducedMotion: "reduce",
      });
      await navigate(client, `${baseUrl}${route}`);
      evidence.axe.push({
        route,
        result: await runAxe(client, axeSource),
      });
    }

    for (const route of ["/", "/components/accordion", "/rtl", "/account"]) {
      await configureEnvironment(client, {
        width: route === "/account" ? 320 : 1280,
        height: 900,
        deviceScaleFactor: 1,
        colourScheme: "light",
        reducedMotion: "reduce",
      });
      await navigate(client, `${baseUrl}${route}`);
      evidence.accessibilityTrees.push({
        route,
        tree: await inspectAccessibilityTree(client),
      });
    }

    evidence.keyboard = await runKeyboardTraversal(client, baseUrl);
    evidence.ignoredLocalOriginEvents = Object.values(
      ignoredLocalOriginEvents.reduce((groups, event) => {
        const key = [
          event.kind,
          event.source ?? "",
          event.text,
        ].join("\0");
        const existing = groups[key] ?? {
          count: 0,
          kind: event.kind,
          source: event.source ?? null,
          text: event.text,
          exampleUrl: event.url ?? null,
        };
        existing.count += 1;
        groups[key] = existing;
        return groups;
      }, {}),
    );
    evidence.checks = evaluateChecks(evidence);

    const evidencePath = join(evidenceDirectory, `${evidenceName}.json`);
    const evidenceBytes = Buffer.from(`${JSON.stringify(evidence, null, 2)}\n`);
    await writeFile(evidencePath, evidenceBytes);

    const generatedFiles = (await listFiles(evidenceDirectory))
      .filter((path) => basename(path) !== `${evidenceName}.checksums.json`)
      .sort();
    const manifest = {
      schemaVersion: "1.0",
      algorithm: "SHA-256",
      generatedAt: evidence.generatedAt,
      entries: [],
    };
    for (const path of generatedFiles) {
      const bytes = await readFile(path);
      manifest.entries.push({
        file: relative(root, path),
        bytes: bytes.length,
        sha256: sha256(bytes),
      });
    }
    const manifestPath = join(evidenceDirectory, `${evidenceName}.checksums.json`);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    console.log(JSON.stringify({
      evidence: relative(root, evidencePath),
      checksums: relative(root, manifestPath),
      checks: evidence.checks,
    }, null, 2));

    if (!evidence.checks.passed) {
      process.exitCode = 1;
    }
  } finally {
    client?.close();
    await Promise.all([
      terminateChild(chrome),
      terminateChild(server),
    ]);
    await removeProfileDirectory(profileDirectory);
  }
}

await main();
