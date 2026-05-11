import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(siteDir, "script.js");
const contentPath = path.join(siteDir, "site", "content", "marketing.en-GB.json");
const coveragePath = path.join(siteDir, "site", "data", "test-centre-coverage.en-GB.json");
const today = new Date().toISOString().slice(0, 10);
const ogImage = "https://www.drivest.uk/assets/drivest-wordmark-preview.png";

const basePageTargets = [
  { page: "home", output: "index.html", canonical: "https://www.drivest.uk/" },
  { page: "features", output: path.join("features", "index.html"), canonical: "https://www.drivest.uk/features" },
  { page: "pricing", output: path.join("pricing", "index.html"), canonical: "https://www.drivest.uk/pricing" },
  { page: "start", output: path.join("start", "index.html"), canonical: "https://www.drivest.uk/start" },
  { page: "faq", output: path.join("faq", "index.html"), canonical: "https://www.drivest.uk/faq" },
  { page: "theory", output: path.join("theory-test-preparation", "index.html"), canonical: "https://www.drivest.uk/theory-test-preparation" },
  { page: "centres", output: path.join("driving-test-centres", "index.html"), canonical: "https://www.drivest.uk/driving-test-centres" },
  { page: "instructors", output: path.join("driving-instructors", "index.html"), canonical: "https://www.drivest.uk/driving-instructors" }
];

const baseRedirectTargets = [
  { output: "features.html", destination: "/features" },
  { output: "pricing.html", destination: "/pricing" },
  { output: path.join("how-it-works", "index.html"), destination: "/start" },
  { output: "faq.html", destination: "/faq" },
  { output: "terms.html", destination: "/terms" },
  { output: "privacypolicy.html", destination: "/privacy" }
];

const baseSitemapUrls = [
  "https://www.drivest.uk/",
  "https://www.drivest.uk/features",
  "https://www.drivest.uk/pricing",
  "https://www.drivest.uk/start",
  "https://www.drivest.uk/faq",
  "https://www.drivest.uk/theory-test-preparation",
  "https://www.drivest.uk/driving-test-centres",
  "https://www.drivest.uk/driving-instructors",
  "https://www.drivest.uk/terms",
  "https://www.drivest.uk/privacy"
];

await build();

async function build() {
  const [scriptSource, rawContent, rawCoverage] = await Promise.all([
    fs.readFile(scriptPath, "utf8"),
    fs.readFile(contentPath, "utf8"),
    fs.readFile(coveragePath, "utf8")
  ]);
  const marketing = JSON.parse(rawContent);
  const coverage = JSON.parse(rawCoverage);
  marketing.testCentreCoverage = coverage;
  const pageTargets = [...basePageTargets, ...buildCentrePageTargets(coverage)];
  const redirectTargets = [...baseRedirectTargets, ...buildCentreRedirectTargets(coverage)];
  const sitemapUrls = [...baseSitemapUrls, ...buildCentreSitemapUrls(coverage)];

  for (const target of pageTargets) {
    const renderer = loadRenderer(scriptSource, target.page, target.centreId);
    const title = renderer.pageTitle(target.page, marketing, target.centreId);
    const description = renderer.pageDescription(target.page, marketing, target.centreId);
    const appHtml = `${renderer.renderShellStart(marketing)}${renderer.renderPage(target.page, marketing)}${renderer.renderShellEnd(marketing)}`.trim();
    const jsonLd = buildStructuredData(target.page, target.canonical, title, description, marketing, target.centreId);
    const html = renderDocument({
      appHtml,
      canonical: target.canonical,
      centreId: target.centreId,
      description,
      jsonLd,
      page: target.page,
      title
    });
    await writeSiteFile(target.output, html);
  }

  for (const target of redirectTargets) {
    await writeSiteFile(target.output, renderRedirect(target.destination));
  }

  await Promise.all([
    writeSiteFile("robots.txt", renderRobots()),
    writeSiteFile("sitemap.xml", renderSitemap(sitemapUrls))
  ]);
}

function loadRenderer(source, page, centreId = "") {
  const sandbox = {
    console,
    document: {
      body: { dataset: { page, centreId } },
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ setAttribute() {} }),
      head: { appendChild() {} }
    },
    fetch: async () => ({ json: async () => ({}) }),
    window: {
      matchMedia: () => ({
        matches: false,
        addEventListener() {},
        addListener() {}
      })
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox;
}

function renderDocument({ appHtml, canonical, centreId, description, jsonLd, page, title }) {
  const ldScripts = jsonLd
    .map(
      (item) =>
        `  <script type="application/ld+json">\n${escapeScriptJson(JSON.stringify(item, null, 2))}\n  </script>`
    )
    .join("\n");
  const bodyAttrs = [`data-page="${page}"`];
  if (centreId) bodyAttrs.push(`data-centre-id="${escapeHtml(centreId)}"`);

  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:locale" content="en_GB" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:alt" content="Drivest wordmark preview" />
  <meta property="og:site_name" content="Drivest" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${ogImage}" />
  <meta name="theme-color" content="#111827" />
  <link rel="icon" href="/assets/favicon-wheel.ico" />
  <link rel="apple-touch-icon" href="/assets/favicon-wheel.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Merriweather:wght@700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
${ldScripts}
</head>
<body ${bodyAttrs.join(" ")}>
  <div id="app">
${indent(appHtml, 4)}
  </div>
  <script type="module" src="/script.js"></script>
</body>
</html>
`;
}

function buildStructuredData(page, canonical, title, description, marketing, centreId = "") {
  const centre = findCentre(marketing.testCentreCoverage, centreId);
  const pageType =
    page === "faq"
      ? "FAQPage"
      : page === "centre-detail"
        ? "AboutPage"
      : ["features", "theory", "centres", "instructors"].includes(page)
        ? "CollectionPage"
        : "WebPage";
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://www.drivest.uk/#organization",
      name: marketing.ui.brand,
      url: "https://www.drivest.uk/",
      logo: {
        "@type": "ImageObject",
        url: "https://www.drivest.uk/assets/drivest-wordmark-preview.png"
      },
      email: "admin@drivest.uk"
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://www.drivest.uk/#website",
      url: "https://www.drivest.uk/",
      name: marketing.ui.brand,
      description: marketing.seo.description,
      publisher: { "@id": "https://www.drivest.uk/#organization" },
      inLanguage: "en-GB"
    },
    {
      "@context": "https://schema.org",
      "@type": pageType,
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: title,
      description,
      isPartOf: { "@id": "https://www.drivest.uk/#website" },
      about: { "@id": "https://www.drivest.uk/#organization" },
      inLanguage: "en-GB"
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": "https://www.drivest.uk/#app",
      name: marketing.ui.brand,
      applicationCategory: "EducationalApplication",
      operatingSystem: "iOS, Android",
      description: marketing.seo.description,
      featureList: marketing.press.usp,
      inLanguage: "en-GB",
      provider: { "@id": "https://www.drivest.uk/#organization" }
    }
  ];

  if (page !== "home") {
    const itemListElement =
      page === "centre-detail" && centre
        ? [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://www.drivest.uk/"
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Driving test centres",
              item: "https://www.drivest.uk/driving-test-centres"
            },
            {
              "@type": "ListItem",
              position: 3,
              name: centre.name,
              item: canonical
            }
          ]
        : [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://www.drivest.uk/"
            },
            {
              "@type": "ListItem",
              position: 2,
              name: title.split(" | ")[0],
              item: canonical
            }
          ];

    data.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement
    });
  }

  if (page === "faq") {
    data.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: marketing.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a
        }
      }))
    });
  }

  if (page === "pricing") {
    data.push({
      "@context": "https://schema.org",
      "@type": "OfferCatalog",
      name: "Drivest pricing",
      itemListElement: marketing.pricing.plans.map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        priceCurrency: "GBP",
        price: extractPrice(plan.price),
        description: [plan.subLine, ...(plan.bullets || [])].filter(Boolean).join(" "),
        url: canonical
      }))
    });
  }

  if (page === "centres" && marketing.testCentreCoverage?.summary) {
    const centres = (marketing.testCentreCoverage.centres || []).slice();
    data.push({
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Drivest covered driving test centres",
      description: `Driving test centres currently live in Drivest with more than ${marketing.testCentreCoverage.filter?.routeCountGreaterThan || 2} routes.`,
      creator: { "@id": "https://www.drivest.uk/#organization" },
      includedInDataCatalog: { "@id": "https://www.drivest.uk/#website" },
      measurementTechnique: "Route corpus filter: publish only centres with more than 2 routes and exclude temporary, duplicate, and broken variants",
      distribution: {
        "@type": "DataDownload",
        encodingFormat: "text/html",
        contentUrl: canonical
      }
    });
    data.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Top covered driving test centres in Drivest",
      itemListElement: centres
        .sort((a, b) => {
          if ((b.routeCount || 0) !== (a.routeCount || 0)) return (b.routeCount || 0) - (a.routeCount || 0);
          return String(a.name || "").localeCompare(String(b.name || ""), "en-GB");
        })
        .slice(0, 20)
        .map((centre, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${centre.name} (${centre.routeCount} routes)`
        }))
    });
  }

  if (page === "centre-detail" && centre) {
    data.push({
      "@context": "https://schema.org",
      "@type": "Place",
      "@id": `${canonical}#place`,
      name: centre.name,
      geo: centre.coordinates
        ? {
            "@type": "GeoCoordinates",
            latitude: centre.coordinates.lat,
            longitude: centre.coordinates.lon
          }
        : undefined
    });
    data.push({
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: `Drivest practice routes for ${centre.name}`,
      description,
      creator: { "@id": "https://www.drivest.uk/#organization" },
      includedInDataCatalog: { "@id": "https://www.drivest.uk/#website" },
      spatialCoverage: { "@id": `${canonical}#place` },
      measurementTechnique: "Derived from Drivest route corpus with public threshold Route Count > 2",
      distribution: {
        "@type": "DataDownload",
        encodingFormat: "text/html",
        contentUrl: canonical
      }
    });
    data.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${centre.name} sample practice routes`,
      itemListElement: (centre.sampleRoutes || []).map((route, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${route.name} (${route.distanceKm} km, ${route.durationMinutes} minutes)`
      }))
    });
  }

  return data;
}

function renderRedirect(destination) {
  const canonical = `https://www.drivest.uk${destination}`;
  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting...</title>
  <meta name="robots" content="noindex,follow" />
  <link rel="canonical" href="${canonical}" />
  <meta http-equiv="refresh" content="0; url=${destination}" />
  <script>window.location.replace(${JSON.stringify(destination)});</script>
</head>
<body>
  <p>Redirecting to <a href="${destination}">${destination}</a>...</p>
</body>
</html>
`;
}

function renderRobots() {
  return `User-agent: *
Allow: /

Sitemap: https://www.drivest.uk/sitemap.xml
`;
}

function renderSitemap(sitemapUrls) {
  const urls = sitemapUrls
    .map(
      (url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function buildCentrePageTargets(coverage) {
  return (coverage?.centres || []).map((centre) => ({
    page: "centre-detail",
    centreId: centre.id,
    output: outputPathForUrl(centre.url || `/driving-test-centres/${centre.id}`),
    canonical: `https://www.drivest.uk${centre.url || `/driving-test-centres/${centre.id}`}`
  }));
}

function buildCentreRedirectTargets(coverage) {
  const centres = coverage?.centres || [];
  const centreMap = new Map(centres.map((centre) => [centre.id, centre]));
  const slugRedirects = centres
    .map((centre) => {
      const legacyPath = `/driving-test-centres/${centre.id}`;
      if ((centre.url || legacyPath) === legacyPath) return null;
      return {
        output: outputPathForUrl(legacyPath),
        destination: centre.url
      };
    })
    .filter(Boolean);

  const aliasRedirects = (coverage?.aliases || [])
    .map((alias) => {
      const canonical = centreMap.get(alias.canonicalId);
      if (!canonical) return null;
      return {
        output: outputPathForUrl(`/driving-test-centres/${alias.id}`),
        destination: canonical.url || `/driving-test-centres/${canonical.id}`
      };
    })
    .filter(Boolean);

  return [...slugRedirects, ...aliasRedirects];
}

function buildCentreSitemapUrls(coverage) {
  return (coverage?.centres || []).map(
    (centre) => `https://www.drivest.uk${centre.url || `/driving-test-centres/${centre.id}`}`
  );
}

function findCentre(coverage, centreId) {
  return (coverage?.centres || []).find((centre) => centre.id === centreId) || null;
}

function outputPathForUrl(urlPath) {
  const parts = String(urlPath || "")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);
  return path.join(...parts, "index.html");
}

async function writeSiteFile(relativePath, content) {
  const fullPath = path.join(siteDir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, "utf8");
}

function indent(value, count) {
  const prefix = " ".repeat(count);
  return String(value)
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScriptJson(value) {
  return String(value).replace(/<\//g, "<\\/");
}

function extractPrice(value) {
  const match = String(value || "").match(/[0-9]+(?:\.[0-9]+)?/);
  return match ? match[0] : "0";
}
