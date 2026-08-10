import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveSiteEnvironment } from "./site-environment.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const coveragePath = path.join(siteDir, "site", "data", "test-centre-coverage.en-GB.json");
const ignoreDirs = new Set([".git", "site", "tools", "node_modules"]);
const failures = [];
const iconVersion = "2026-05-15-favicon-solid";
const siteEnv = resolveSiteEnvironment(process.env);

const coverage = JSON.parse(await fs.readFile(coveragePath, "utf8"));
const allHtmlFiles = await collectHtmlFiles(siteDir);

for (const relativePath of allHtmlFiles) {
  const content = await readSiteFile(relativePath);
  if (content.includes("/script.js")) {
    failures.push(`${relativePath} still references /script.js.`);
  }

  const isRedirect = content.includes('<meta http-equiv="refresh"');
  if (!isRedirect && !content.includes('/site-runtime.js')) {
    failures.push(`${relativePath} is missing /site-runtime.js.`);
  }
}

const pricingHtml = await readSiteFile("pricing/index.html");
assertMissing(pricingHtml, "pricing/index.html", "mailto:admin@drivest.uk?subject=Drivest");
[
  "/access-request?plan=selected-centre-practice",
  "/access-request?plan=navigation",
  "/access-request?plan=annual-bundle"
].forEach((target) => assertIncludes(pricingHtml, "pricing/index.html", target));

const accessRequestHtml = await readSiteFile("access-request/index.html");
[
  "data-access-request-form",
  "data-access-request-plan",
  "data-access-request-preview",
  "Create learner request"
].forEach((marker) => assertIncludes(accessRequestHtml, "access-request/index.html", marker));

const instructorApplyHtml = await readSiteFile("instructor-apply/index.html");
[
  "data-instructor-apply-form",
  "data-instructor-apply-preview",
  "Create instructor application"
].forEach((marker) => assertIncludes(instructorApplyHtml, "instructor-apply/index.html", marker));

const downloadHtml = await readSiteFile("download/index.html");
[
  "Get Drivest for iPhone",
  "Drivest is now live on the Apple App Store for iPhone.",
  "/access-request?plan=free-learning",
  "/instructor-apply"
].forEach((marker) => assertIncludes(downloadHtml, "download/index.html", marker));
assertMissing(downloadHtml, "download/index.html", "Expected from 15 May 2026");

const coverageDirectoryHtml = await readSiteFile("driving-test-centres/index.html");
[
  "data-coverage-directory",
  "data-coverage-search",
  "data-coverage-min-routes",
  "data-coverage-status"
].forEach((marker) => assertIncludes(coverageDirectoryHtml, "driving-test-centres/index.html", marker));

for (const relativePath of ["index.html", "pricing/index.html", "download/index.html", "access-request/index.html", "instructor-apply/index.html", "privacy/index.html", "terms/index.html"]) {
  const content = await readSiteFile(relativePath);
  assertIncludes(content, relativePath, versionedIcon("/favicon.ico"));
  assertIncludes(content, relativePath, versionedIcon("/favicon-32x32.png"));
  assertIncludes(content, relativePath, versionedIcon("/favicon-16x16.png"));
  assertIncludes(content, relativePath, versionedIcon("/apple-touch-icon.png"));
  assertIncludes(content, relativePath, versionedIcon("/manifest.webmanifest"));
  assertMissing(content, relativePath, '/assets/favicon-wheel.ico');
}

for (const relativePath of ["terms/index.html", "privacy/index.html", "contact/index.html", "404.html"]) {
  const content = await readSiteFile(relativePath);
  assertIncludes(content, relativePath, "/site-runtime.js");
}

const expectedRobotsMeta = `content="${siteEnv.robotsMeta}"`;
for (const relativePath of [
  "index.html",
  "pricing/index.html",
  "download/index.html",
  "contact/index.html",
  "access-request/index.html",
  "instructor-apply/index.html",
  "terms/index.html",
  "privacy/index.html"
]) {
  const content = await readSiteFile(relativePath);
  assertIncludes(content, relativePath, expectedRobotsMeta);
}

const manifest = await readSiteFile("manifest.webmanifest");
[
  versionedIcon("/android-chrome-192x192.png"),
  versionedIcon("/android-chrome-512x512.png")
].forEach((marker) => assertIncludes(manifest, "manifest.webmanifest", marker));
assertMissing(manifest, "manifest.webmanifest", "/assets/app-icon.png");

const centreMap = new Map((coverage.centres || []).map((centre) => [centre.id, centre]));
for (const alias of coverage.aliases || []) {
  const canonical = centreMap.get(alias.canonicalId);
  if (!canonical) {
    failures.push(`Coverage alias ${alias.id} has no canonical centre match.`);
    continue;
  }

  const destination = canonical.url || `/driving-test-centres/${canonical.id}`;
  const legacyPaths = new Set([
    `driving-test-centres/${alias.id}/index.html`,
    `driving-test-centres/${hyphenatePathSegment(alias.id)}/index.html`
  ]);

  for (const relativePath of legacyPaths) {
    const content = await readSiteFile(relativePath);
    assertIncludes(content, relativePath, `content="0; url=${destination}"`);
    assertIncludes(content, relativePath, `window.location.replace("${destination}")`);
  }
}

let vercelConfig = null;
try {
  vercelConfig = JSON.parse(await readSiteFile("vercel.json"));
} catch (error) {
  failures.push(`vercel.json is missing or invalid JSON: ${error.message}`);
}

if (vercelConfig?.redirects) {
  for (const alias of coverage.aliases || []) {
    const canonical = centreMap.get(alias.canonicalId);
    if (!canonical) continue;

    const destination = canonical.url || `/driving-test-centres/${canonical.id}`;
    const expectedSources = new Set([
      `/driving-test-centres/${alias.id}`,
      `/driving-test-centres/${hyphenatePathSegment(alias.id)}`
    ]);

    for (const source of expectedSources) {
      const match = vercelConfig.redirects.find(
        (entry) => entry.source === source && entry.destination === destination && entry.permanent === true
      );
      if (!match) {
        failures.push(`vercel.json is missing permanent redirect ${source} -> ${destination}.`);
      }
    }
  }
}

const llmsIndex = await readSiteFile("llms.txt");
assertIncludes(llmsIndex, "llms.txt", `${siteEnv.siteUrl}/download`);
assertIncludes(llmsIndex, "llms.txt", `${siteEnv.siteUrl}/access-request`);
assertIncludes(llmsIndex, "llms.txt", `${siteEnv.siteUrl}/instructor-apply`);

const llmsFull = await readSiteFile("llms-full.txt");
assertIncludes(llmsFull, "llms-full.txt", `${siteEnv.siteUrl}/download`);
assertIncludes(llmsFull, "llms-full.txt", `${siteEnv.siteUrl}/access-request`);
assertIncludes(llmsFull, "llms-full.txt", `${siteEnv.siteUrl}/instructor-apply`);

const robotsTxt = await readSiteFile("robots.txt");
if (siteEnv.isProduction) {
  assertIncludes(robotsTxt, "robots.txt", "User-agent: *");
  assertIncludes(robotsTxt, "robots.txt", "Allow: /");
  assertIncludes(robotsTxt, "robots.txt", `Sitemap: ${siteEnv.siteUrl}/sitemap.xml`);
} else {
  assertIncludes(robotsTxt, "robots.txt", "User-agent: *");
  assertIncludes(robotsTxt, "robots.txt", "Disallow: /");
}

const sitemapXml = await readSiteFile("sitemap.xml");
assertIncludes(sitemapXml, "sitemap.xml", siteEnv.siteUrl);

const contactRedirect = await readSiteFile("contact.html");
assertIncludes(contactRedirect, "contact.html", 'content="0; url=/contact"');

const accessRequestRedirect = await readSiteFile("access-request.html");
assertIncludes(accessRequestRedirect, "access-request.html", 'content="0; url=/access-request"');

const instructorApplyRedirect = await readSiteFile("instructor-apply.html");
assertIncludes(instructorApplyRedirect, "instructor-apply.html", 'content="0; url=/instructor-apply"');

const downloadRedirect = await readSiteFile("download.html");
assertIncludes(downloadRedirect, "download.html", 'content="0; url=/download"');

if (failures.length) {
  console.error("Generated site verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Verified ${allHtmlFiles.length} HTML files, ${coverage.aliases?.length || 0} alias redirect families, and the launch/request flows.`
);

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

async function readSiteFile(relativePath) {
  try {
    return await fs.readFile(path.join(siteDir, relativePath), "utf8");
  } catch (error) {
    failures.push(`${relativePath} is missing.`);
    return "";
  }
}

function assertIncludes(content, relativePath, marker) {
  if (!content.includes(marker)) {
    failures.push(`${relativePath} is missing expected marker: ${marker}`);
  }
}

function assertMissing(content, relativePath, marker) {
  if (content.includes(marker)) {
    failures.push(`${relativePath} still contains disallowed marker: ${marker}`);
  }
}

function hyphenatePathSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function versionedIcon(assetPath) {
  return `${assetPath}?v=${iconVersion}`;
}
