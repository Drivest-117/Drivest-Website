import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { productionSiteUrl, resolveSiteEnvironment } from "./site-environment.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignoreDirs = new Set([".git", ".vercel", "audit-shots", "node_modules", "output", "site", "test-results", "tools"]);
const productionUrl = productionSiteUrl();
const siteEnv = resolveSiteEnvironment(process.env);
const auxiliaryFiles = ["llm.txt", "llms.txt", "llms-full.txt", "robots.txt", "sitemap.xml"];

await applyEnvironment();

async function applyEnvironment() {
  const htmlFiles = await collectHtmlFiles(siteDir);
  const targets = new Set([...htmlFiles, ...auxiliaryFiles]);

  for (const relativePath of targets) {
    await rewriteFile(relativePath);
  }

  console.log(`Applied ${siteEnv.name} site environment using ${siteEnv.siteUrl}.`);
}

async function collectHtmlFiles(rootDir, relativeDir = "") {
  const currentDir = path.join(rootDir, relativeDir);
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      files.push(...(await collectHtmlFiles(rootDir, path.join(relativeDir, entry.name))));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    files.push(path.join(relativeDir, entry.name).replace(/\\/g, "/"));
  }

  return files;
}

async function rewriteFile(relativePath) {
  const absolutePath = path.join(siteDir, relativePath);
  let content;

  try {
    content = await fs.readFile(absolutePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return;
    throw error;
  }

  let next = content.replaceAll(productionUrl, siteEnv.siteUrl);

  if (relativePath.endsWith(".html")) {
    next = next.replace(
      /<meta name="robots" content="[^"]*" \/>/g,
      `<meta name="robots" content="${siteEnv.robotsMeta}" />`
    );
  }

  if (relativePath === "robots.txt" && !siteEnv.isProduction) {
    next = `User-agent: *\nDisallow: /\n`;
  }

  if (next !== content) {
    await fs.writeFile(absolutePath, next, "utf8");
  }
}
