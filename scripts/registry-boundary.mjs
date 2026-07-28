import { lstat, realpath } from "node:fs/promises";
import path from "node:path";

const publicSourceRoots = [
  path.join("app", "components", "ui"),
  path.join("app", "components", "radix"),
  path.join("app", "styles"),
];
const publicTargetRoots = ["app", "components"];

function isContained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function assertSafeRegistryItemName(name) {
  if (typeof name !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`Unsafe registry item name: ${String(name)}`);
  }
}

export function resolveRegistryTarget(root, target) {
  if (typeof target !== "string" || path.isAbsolute(target)) {
    throw new Error(`Registry target must be a relative public path: ${String(target)}`);
  }
  const normalized = path.normalize(target);
  const firstSegment = normalized.split(path.sep)[0];
  if (!publicTargetRoots.includes(firstSegment)) {
    throw new Error(`Registry target is outside the install allowlist: ${target}`);
  }
  const resolved = path.resolve(root, normalized);
  if (!isContained(path.resolve(root), resolved)) {
    throw new Error(`Registry target escapes its destination: ${target}`);
  }
  return resolved;
}

export async function resolvePublicRegistrySource(projectRoot, source) {
  if (typeof source !== "string" || path.isAbsolute(source)) {
    throw new Error(`Registry source must be a relative public path: ${String(source)}`);
  }
  const normalized = path.normalize(source);
  const candidate = path.resolve(projectRoot, normalized);
  const allowed = publicSourceRoots.some((root) =>
    isContained(path.resolve(projectRoot, root), candidate),
  );
  if (!allowed) {
    throw new Error(`Registry source is outside the public source allowlist: ${source}`);
  }
  const metadata = await lstat(candidate);
  if (metadata.isSymbolicLink() || !metadata.isFile()) {
    throw new Error(`Registry source must be a regular non-symlink file: ${source}`);
  }
  const canonicalProjectRoot = await realpath(projectRoot);
  const canonicalSource = await realpath(candidate);
  if (!isContained(canonicalProjectRoot, canonicalSource)) {
    throw new Error(`Registry source resolves outside the public repository: ${source}`);
  }
  return canonicalSource;
}
