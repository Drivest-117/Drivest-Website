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
  const customTargets = buildCustomPageTargets(marketing, coverage);
  const redirectTargets = [...baseRedirectTargets, ...buildCentreRedirectTargets(coverage)];
  const sitemapUrls = [...baseSitemapUrls, ...buildCentreSitemapUrls(coverage), ...customTargets.map((target) => target.canonical)];

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

  for (const target of customTargets) {
    const renderer = loadRenderer(scriptSource, target.bodyPage, target.centreId);
    const appHtml = `${renderer.renderShellStart(marketing)}${renderCustomPage(target, renderer, marketing, coverage)}${renderer.renderShellEnd(marketing)}`.trim();
    const jsonLd = buildCustomStructuredData(target, marketing, coverage);
    const html = renderDocument({
      appHtml,
      canonical: target.canonical,
      centreId: target.centreId,
      description: target.description,
      jsonLd,
      page: target.bodyPage,
      title: target.title
    });
    await writeSiteFile(target.output, html);
  }

  for (const target of redirectTargets) {
    await writeSiteFile(target.output, renderRedirect(target.destination));
  }

  await Promise.all([
    writeSiteFile("robots.txt", renderRobots()),
    writeSiteFile("sitemap.xml", renderSitemap(sitemapUrls)),
    writeSiteFile("manifest.webmanifest", renderManifest(marketing)),
    writeSiteFile("404.html", render404Page(scriptSource, marketing, coverage))
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
  <meta name="application-name" content="Drivest" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${ogImage}" />
  <meta name="theme-color" content="#111827" />
  <link rel="icon" href="/assets/favicon-wheel.ico" />
  <link rel="apple-touch-icon" href="/assets/favicon-wheel.png" />
  <link rel="manifest" href="/manifest.webmanifest" />
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

function buildStructuredData(page, canonical, title, description, marketing, centreId = "", overrides = {}) {
  const centre = findCentre(marketing.testCentreCoverage, centreId);
  const pageType =
    overrides.pageType ||
    (page === "faq"
      ? "FAQPage"
      : page === "centre-detail"
        ? "AboutPage"
      : ["features", "theory", "centres", "instructors"].includes(page)
        ? "CollectionPage"
        : "WebPage");
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
      email: "admin@drivest.uk",
      areaServed: "GB",
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "admin@drivest.uk",
          areaServed: "GB",
          availableLanguage: ["en", "cy"]
        }
      ]
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

  if (page === "centres" && marketing.testCentreCoverage?.summary && !overrides.skipCentresDataset) {
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

function buildCustomPageTargets(marketing, coverage) {
  const targets = [];
  const brand = marketing.ui?.brand || "Drivest";
  if (marketing.contactPage?.title) {
    targets.push({
      kind: "contact",
      bodyPage: "contact",
      output: path.join("contact", "index.html"),
      canonical: "https://www.drivest.uk/contact",
      title: brandDocumentTitle(marketing.pageSeo?.contact?.title || marketing.contactPage.title, brand),
      description: marketing.pageSeo?.contact?.description || marketing.contactPage.intro || marketing.seo.description,
      data: marketing.contactPage
    });
  }

  for (const item of marketing.seoLandingPages?.theoryIntentPages || []) {
    if (!item?.slug || !item?.title || !item?.description) continue;
    targets.push({
      kind: "theory-intent",
      bodyPage: "theory",
      output: path.join(item.slug, "index.html"),
      canonical: `https://www.drivest.uk/${item.slug}`,
      title: brandDocumentTitle(item.seoTitle || item.title, brand),
      description: item.description,
      data: item
    });
  }

  for (const item of marketing.seoLandingPages?.centreRegionPages || []) {
    if (!item?.slug || !item?.title || !item?.description) continue;
    targets.push({
      kind: "centre-region",
      bodyPage: "centres",
      output: path.join("driving-test-centres", item.slug, "index.html"),
      canonical: `https://www.drivest.uk/driving-test-centres/${item.slug}`,
      title: brandDocumentTitle(item.seoTitle || item.title, brand),
      description: item.description,
      data: item
    });
  }

  return targets;
}

function brandDocumentTitle(title, brand) {
  if (!title) return brand;
  return title.includes(`| ${brand}`) ? title : `${title} | ${brand}`;
}

function renderCustomPage(target, renderer, marketing, coverage) {
  switch (target.kind) {
    case "contact":
      return renderContactPage(target.data, renderer, marketing, coverage);
    case "theory-intent":
      return renderTheoryIntentPage(target.data, renderer, marketing);
    case "centre-region":
      return renderCentreRegionPage(target.data, renderer, marketing, coverage);
    default:
      return "";
  }
}

function buildCustomStructuredData(target, marketing, coverage) {
  switch (target.kind) {
    case "contact":
      return buildStructuredData("contact", target.canonical, target.title, target.description, marketing, "", {
        pageType: "ContactPage",
        skipCentresDataset: true
      });
    case "theory-intent": {
      const data = buildStructuredData("theory", target.canonical, target.title, target.description, marketing, "", {
        pageType: "CollectionPage"
      });
      data.push({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: target.title,
        itemListElement: (target.data.modules || []).map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title
        }))
      });
      return data;
    }
    case "centre-region": {
      const centres = selectCentresForRegion(target.data, coverage);
      const data = buildStructuredData("centres", target.canonical, target.title, target.description, marketing, "", {
        pageType: "CollectionPage",
        skipCentresDataset: true
      });
      data.push({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: target.title,
        itemListElement: centres.map((centre, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${centre.name} (${centre.routeCount} routes)`,
          url: `https://www.drivest.uk${centre.url || `/driving-test-centres/${centre.id}`}`
        }))
      });
      return data;
    }
    default:
      return [];
  }
}

function renderContactPage(config, renderer, marketing, coverage) {
  const supportEmail = String(marketing.footer.contact || "admin@drivest.uk").replace(/^Contact:\s*/i, "");
  const generatedAt = coverageGeneratedAtLabel(coverage);
  return `
    <section class="section reveal feature-hero">
      <div class="feature-hero-grid">
        <div>
          <p class="eyebrow">Support and trust</p>
          <h1>${escapeHtml(config.title)}</h1>
          <p>${escapeHtml(config.intro)}</p>
          <div class="pill-row">
            <span class="pill">Support: ${escapeHtml(supportEmail)}</span>
            ${generatedAt ? `<span class="pill">Coverage file: ${escapeHtml(generatedAt)}</span>` : ""}
          </div>
        </div>
        <div class="feature-photo">
          <img src="/assets/app-instructor-hub.jpeg" alt="Drivest Instructor Hub screen" loading="lazy" />
        </div>
      </div>
    </section>

    <section class="section reveal">
      <div class="grid two-up">
        ${(config.cards || [])
          .map(
            (card) => `
          <article class="card reveal-item">
            <h2>${escapeHtml(card.title)}</h2>
            ${card.text ? `<p>${escapeHtml(card.text)}</p>` : ""}
            ${renderer.bulletList(card.bullets)}
          </article>
        `
          )
          .join("")}
      </div>
    </section>

    ${renderer.renderInfoSection({
      title: "Public route-coverage freshness",
      text: generatedAt
        ? `The current public route-coverage file used by this website was generated on ${generatedAt}. Refresh the site pages when the route corpus changes so coverage claims stay current.`
        : "Refresh the site pages whenever the route corpus changes so coverage claims stay current.",
      bullets: [
        "Only centres with more than 2 routes are visible in the public directory",
        "Duplicate, temporary, backup, and broken variants are excluded from the public layer",
        "Route, navigation, and parking outputs remain advisory only"
      ]
    })}

    ${renderer.renderLinkCardsSection({
      title: "Go back into the product journey",
      intro: "Support and trust pages should still connect cleanly back into the core learner and instructor intents.",
      items: [
        {
          title: "Theory test preparation",
          text: "Start with theory, mock tests, road signs, Highway Code, and multilingual revision.",
          href: "/theory-test-preparation",
          cta: "View theory prep"
        },
        {
          title: "Driving test centre practice",
          text: "Browse live centre coverage and move into the exact selected-centre page you need.",
          href: "/driving-test-centres",
          cta: "View centres"
        },
        {
          title: "Find driving instructors",
          text: "See how instructor search, bookings, and Instructor Hub fit into the same product story.",
          href: "/driving-instructors",
          cta: "View instructor search"
        },
        {
          title: "FAQ and legal pages",
          text: "Read the public FAQ, Terms, and Privacy pages for current legal positioning and support wording.",
          href: "/faq",
          cta: "View FAQ"
        }
      ]
    })}
  `;
}

function renderTheoryIntentPage(config, renderer, marketing) {
  return `
    <section class="section reveal feature-hero">
      <div class="feature-hero-grid">
        <div>
          ${config.eyebrow ? `<p class="eyebrow">${escapeHtml(config.eyebrow)}</p>` : ""}
          <h1>${escapeHtml(config.title)}</h1>
          <p>${escapeHtml(config.intro)}</p>
          ${config.highlights?.length ? `<div class="pill-row">${renderer.renderPills(config.highlights)}</div>` : ""}
        </div>
        <div class="feature-photo">
          <img src="${escapeHtml(config.image)}" alt="${escapeHtml(config.imageAlt)}" loading="lazy" />
        </div>
      </div>
    </section>

    <section class="section reveal">
      <div class="panel reveal-item">
        <p class="panel-title">${escapeHtml(config.summaryTitle)}</p>
        <p>${escapeHtml(config.summaryText)}</p>
        ${renderer.bulletList(config.highlights)}
      </div>
    </section>

    <section class="section reveal">
      <h2>What this page maps to in Drivest</h2>
      ${renderer.renderFeatureCards(config.modules || [])}
    </section>

    ${renderer.renderLanguageSupportSection(marketing.languageSupport)}

    ${renderer.renderLinkCardsSection(marketing.hubPages?.theory?.related)}
  `;
}

function renderCentreRegionPage(config, renderer, marketing, coverage) {
  const centres = selectCentresForRegion(config, coverage);
  const summary = summariseCentreList(centres);
  const topRoads = aggregateRoadCounts(centres, 12);
  const familyCounts = aggregateCountMaps(centres.map((centre) => centre.routeFamilyCounts || {}));
  const generatedAt = coverageGeneratedAtLabel(coverage);

  return `
    <section class="section reveal feature-hero">
      <div class="feature-hero-grid">
        <div>
          ${config.eyebrow ? `<p class="eyebrow">${escapeHtml(config.eyebrow)}</p>` : ""}
          <h1>${escapeHtml(config.title)}</h1>
          <p>${escapeHtml(config.intro)}</p>
          <div class="pill-row">
            <span class="pill">${escapeHtml(renderer.formatNumber(summary.centres))} centres</span>
            <span class="pill">${escapeHtml(renderer.formatNumber(summary.routes))} routes</span>
            <span class="pill">${escapeHtml(renderer.formatMetricValue(summary.averageDistanceKm, 1))} km avg</span>
            <span class="pill">${escapeHtml(renderer.formatMetricValue(summary.averageDurationMinutes, 1))} min avg</span>
          </div>
        </div>
        <div class="feature-photo">
          <img src="/assets/app-practice-centres.jpeg" alt="Drivest practice centre search screen" loading="lazy" />
        </div>
      </div>
    </section>

    <section class="section reveal">
      <div class="panel reveal-item">
        <p class="panel-title">Why this regional hub exists</p>
        <p>${escapeHtml(config.intro)}</p>
        ${renderer.bulletList(config.highlights)}
        ${generatedAt ? `<p class="coverage-summary-note">Current public coverage file generated: ${escapeHtml(generatedAt)}.</p>` : ""}
      </div>
    </section>

    <section class="section reveal">
      <div class="coverage-stat-grid">
        <article class="card reveal-item">
          <p class="panel-title">Centres listed</p>
          <p class="coverage-stat-value">${escapeHtml(renderer.formatNumber(summary.centres))}</p>
          <p>Only centres currently visible in this regional public layer are counted.</p>
        </article>
        <article class="card reveal-item">
          <p class="panel-title">Routes represented</p>
          <p class="coverage-stat-value">${escapeHtml(renderer.formatNumber(summary.routes))}</p>
          <p>These are the current public routes attached to the region's centre pages.</p>
        </article>
        <article class="card reveal-item">
          <p class="panel-title">Average route length</p>
          <p class="coverage-stat-value">${escapeHtml(renderer.formatMetricValue(summary.averageDistanceKm, 1))} km</p>
          <p>Average distance across the region's current public route set.</p>
        </article>
        <article class="card reveal-item">
          <p class="panel-title">Average guided time</p>
          <p class="coverage-stat-value">${escapeHtml(renderer.formatMetricValue(summary.averageDurationMinutes, 1))} min</p>
          <p>Average guided duration across the current public route set.</p>
        </article>
      </div>
    </section>

    <section class="section reveal">
      <h2>Centres currently live in this regional hub</h2>
      <div class="grid three-up">
        ${centres
          .map(
            (centre) => `
          <article class="card reveal-item">
            <h3><a class="centre-link" href="${escapeHtml(centre.url)}">${escapeHtml(centre.name)}</a></h3>
            <p class="coverage-route-count">${escapeHtml(renderer.formatNumber(centre.routeCount))} routes</p>
            <p>Average route: ${escapeHtml(renderer.formatMetricValue(centre.averageDistanceKm, 1))} km over ${escapeHtml(renderer.formatMetricValue(centre.averageDurationMinutes, 1))} minutes.</p>
            <a class="text-link" href="${escapeHtml(centre.url)}">View centre practice page</a>
          </article>
        `
          )
          .join("")}
      </div>
    </section>

    <section class="section reveal">
      <div class="grid two-up">
        <article class="card reveal-item">
          <h2>Most repeated roads across the current public set</h2>
          <div class="tag-cloud">
            ${topRoads.map((road) => `<span class="pill">${escapeHtml(road.name)} (${escapeHtml(renderer.formatNumber(road.count))})</span>`).join("")}
          </div>
        </article>
        <article class="card reveal-item">
          <h2>Route family mix across this region</h2>
          <ul class="detail-list">
            ${Object.entries(familyCounts)
              .sort((a, b) => (b[1] || 0) - (a[1] || 0))
              .map(
                ([key, value]) =>
                  `<li>${escapeHtml(renderer.formatNumber(value))} routes in the ${escapeHtml(renderer.toDisplayLabel(key))} family.</li>`
              )
              .join("")}
          </ul>
        </article>
      </div>
    </section>

    ${renderer.renderInfoSection({
      title: "Important route positioning",
      text: "Regional hub pages still follow the same legal positioning as centre-detail pages.",
      bullets: [
        "Routes are reconstructed or generated for learning support and are not official DVSA routes.",
        "Learners must always follow live road signs, markings, instructions, and traffic law.",
        "Navigation, route, and parking outputs remain advisory only and can be incomplete or delayed."
      ]
    })}

    ${renderer.renderLinkCardsSection(marketing.hubPages?.centres?.related)}
  `;
}

function render404Page(scriptSource, marketing, coverage) {
  const renderer = loadRenderer(scriptSource, "home");
  const appHtml = `${renderer.renderShellStart(marketing)}
    <section class="section reveal feature-hero">
      <div class="feature-hero-grid">
        <div>
          <p class="eyebrow">404</p>
          <h1>That page is not available on the public Drivest site.</h1>
          <p>Use one of the main learner or instructor routes below to get back into the current public site structure.</p>
          <div class="btn-row">
            ${renderer.button("Start preparing", "/start#learner", "primary")}
            ${renderer.button("Go to homepage", "/", "secondary")}
          </div>
        </div>
        <div class="feature-photo">
          <img src="/assets/app-home-learner.jpeg" alt="Drivest learner home screen" loading="lazy" />
        </div>
      </div>
    </section>
    ${renderer.renderLinkCardsSection({
      title: "Popular public routes",
      intro: "Use the core public hubs to continue browsing the live site.",
      items: [
        {
          title: "Driving test centres",
          text: "Browse the current live centre directory and move into the exact centre page you need.",
          href: "/driving-test-centres",
          cta: "View centres"
        },
        {
          title: "Theory test preparation",
          text: "See theory, mock tests, road signs, Highway Code, and multilingual preparation.",
          href: "/theory-test-preparation",
          cta: "View theory prep"
        },
        {
          title: "Find driving instructors",
          text: "Explore instructor discovery, bookings, and Instructor Hub positioning.",
          href: "/driving-instructors",
          cta: "View instructor search"
        },
        {
          title: "Pricing and how Drivest works",
          text: "Review plans, learner onboarding, and instructor onboarding from the main marketing routes.",
          href: "/pricing",
          cta: "View pricing"
        }
      ]
    })}
  ${renderer.renderShellEnd(marketing)}`.trim();

  return renderNoIndexDocument({
    appHtml,
    canonical: "https://www.drivest.uk/404",
    description: "Drivest page not found.",
    page: "home",
    title: "404 | Drivest"
  });
}

function renderManifest(marketing) {
  return `${JSON.stringify(
    {
      name: marketing.ui.brand,
      short_name: marketing.ui.brand,
      description: marketing.seo.description,
      start_url: "/",
      display: "standalone",
      background_color: "#f3f4f8",
      theme_color: "#111827",
      icons: [
        {
          src: "/assets/favicon-wheel.png",
          sizes: "512x512",
          type: "image/png"
        },
        {
          src: "/assets/app-icon.png",
          sizes: "1024x1024",
          type: "image/png"
        }
      ]
    },
    null,
    2
  )}\n`;
}

function renderNoIndexDocument({ appHtml, canonical, description, page, title }) {
  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="noindex,follow" />
  <link rel="canonical" href="${canonical}" />
  <meta name="theme-color" content="#111827" />
  <link rel="icon" href="/assets/favicon-wheel.ico" />
  <link rel="apple-touch-icon" href="/assets/favicon-wheel.png" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Merriweather:wght@700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
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

function coverageGeneratedAtLabel(coverage) {
  const value = coverage?.generatedAt;
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function selectCentresForRegion(config, coverage) {
  const includeIds = new Set(config.includeIds || []);
  const slugIncludes = config.slugIncludes || [];
  const slugStartsWith = config.slugStartsWith || [];
  return (coverage?.centres || []).filter((centre) => {
    if (includeIds.has(centre.id)) return true;
    if (slugIncludes.some((value) => centre.slug?.includes(value))) return true;
    if (slugStartsWith.some((value) => centre.slug?.startsWith(value))) return true;
    return false;
  });
}

function summariseCentreList(centres) {
  if (!centres.length) {
    return {
      centres: 0,
      routes: 0,
      averageDistanceKm: 0,
      averageDurationMinutes: 0
    };
  }
  const totals = centres.reduce(
    (acc, centre) => {
      acc.centres += 1;
      acc.routes += Number(centre.routeCount) || 0;
      acc.distance += Number(centre.averageDistanceKm) || 0;
      acc.duration += Number(centre.averageDurationMinutes) || 0;
      return acc;
    },
    { centres: 0, routes: 0, distance: 0, duration: 0 }
  );

  return {
    centres: totals.centres,
    routes: totals.routes,
    averageDistanceKm: totals.distance / totals.centres,
    averageDurationMinutes: totals.duration / totals.centres
  };
}

function aggregateRoadCounts(centres, limit = 12) {
  const counts = new Map();
  for (const centre of centres) {
    for (const road of centre.topRoads || []) {
      const name = String(road.name || "").trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + (Number(road.count) || 0));
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en-GB"))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function aggregateCountMaps(countMaps) {
  const output = {};
  for (const map of countMaps) {
    for (const [key, value] of Object.entries(map || {})) {
      output[key] = (output[key] || 0) + (Number(value) || 0);
    }
  }
  return output;
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
