import { access, appendFile, readFile } from "node:fs/promises";
import path from "node:path";

const target = path.join(
  process.cwd(),
  "node_modules",
  "brace-expansion",
  "dist",
  "commonjs",
  "index.js",
);
const compatibilityLine =
  "\n// Gummy UI compatibility: minimatch 3 expects the historic callable CommonJS export.\nmodule.exports = Object.assign(exports.expand, exports);\n";

try {
  await access(target);
  const source = await readFile(target, "utf8");
  if (!source.includes("module.exports = Object.assign(exports.expand, exports);")) {
    if (!source.includes("exports.expand = expand;")) {
      throw new Error("Installed brace-expansion package does not expose the expected patched expand function.");
    }
    await appendFile(target, compatibilityLine, "utf8");
    console.log("Applied the brace-expansion 5 CommonJS compatibility export.");
  }
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
    console.log("brace-expansion compatibility patch was not needed.");
  } else {
    throw error;
  }
}
