import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const siteDir = path.resolve(process.cwd(), "DrivestWeb");
const scriptPath = path.join(siteDir, "script.js");
const contentPath = path.join(siteDir, "site", "content", "marketing.en-GB.json");
const today = new Date().toISOString().slice(0, 10);
const ogImage = "https://www.drivest.uk/assets/drivest-wordmark-preview.png";

const pageTargets = [
  { page: "home", output: "index.html", canonical: "https://www.drivest.uk/" },
  { page: "features", output: path.join("features", "index.html"), canonical: "https://www.drivest.uk/features" },
  { page: "pricing", output: path.join("pricing", "index.html"), canonical: "https://www.drivest.uk/pricing" },
  { page: "start", output: path.join("start", "index.html"), canonical: "https://www.drivest.uk/start" },
  { page: "faq", output: path.join("faq", "index.html"), canonical: "https://www.drivest.uk/faq" },
  { page: "theory", output: path.join("theory-test-preparation", "index.html"), canonical: "https://www.drivest.uk/theory-test-preparation" },
  { page: "centres", output: path.join("driving-test-centres", "index.html"), canonical: "https://www.drivest.uk/driving-test-centres" },
  { page: "instructors", output: path.join("driving-instructors", "index.html"), canonical: "https://www.drivest.uk/driving-instructors" }
];

const redirectTargets = [
  { output: "features.html", destination: "/features" },
  { output: "pricing.html", destination: "/pricing" },
  { output: path.join("how-it-works", "index.html"), destination: "/start" },
  { output: "faq.html", destination: "/faq" },
  { output: "terms.html", destination: "/terms" },
  { output: "privacypolicy.html", destination: "/privacy" }
];

const sitemapUrls = [
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
  const [scriptSource, rawContent] = await Promise.all([
    fs.readFile(scriptPath, "utf8"),
    fs.readFile(contentPath, "utf8")
  ]);
  const marketing = JSON.parse(rawContent);

  for (const target of pageTargets) {
    const renderer = loadRenderer(scriptSource, target.page);
    const title = renderer.pageTitle(target.page, marketing);
    const description = renderer.pageDescription(target.page, marketing);
    const appHtml = `${renderer.renderShellStart(marketing)}${renderer.renderPage(target.page, marketing)}${renderer.renderShellEnd(marketing)}`.trim();
    const jsonLd = buildStructuredData(target.page, target.canonical, title, description, marketing);
    const html = renderDocument({
      appHtml,
      canonical: target.canonical,
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
    writeSiteFile("sitemap.xml", renderSitemap())
  ]);
}

function loadRenderer(source, page) {
  const sandbox = {
    console,
    document: {
      body: { dataset: { page } },
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

function renderDocument({ appHtml, canonical, description, jsonLd, page, title }) {
  const ldScripts = jsonLd
    .map(
      (item) =>
        `  <script type="application/ld+json">\n${escapeScriptJson(JSON.stringify(item, null, 2))}\n  </script>`
    )
    .join("\n");

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
<body data-page="${page}">
  <div id="app">
${indent(appHtml, 4)}
  </div>
  <script type="module" src="/script.js"></script>
</body>
</html>
`;
}

function buildStructuredData(page, canonical, title, description, marketing) {
  const pageType =
    page === "faq"
      ? "FAQPage"
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
    data.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
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
      ]
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

function renderSitemap() {
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
