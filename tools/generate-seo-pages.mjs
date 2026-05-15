import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(siteDir, "script.js");
const contentPath = path.join(siteDir, "site", "content", "marketing.en-GB.json");
const coveragePath = path.join(siteDir, "site", "data", "test-centre-coverage.en-GB.json");
const today = new Date().toISOString().slice(0, 10);
const SITE_URL = "https://drivest.uk";
const ogImage = `${SITE_URL}/assets/drivest-wordmark-preview.png`;
const ICON_VERSION = "2026-05-15-favicon-solid";

const basePageTargets = [
  { page: "home", output: "index.html", canonical: `${SITE_URL}/` },
  { page: "features", output: path.join("features", "index.html"), canonical: `${SITE_URL}/features` },
  { page: "pricing", output: path.join("pricing", "index.html"), canonical: `${SITE_URL}/pricing` },
  { page: "download", output: path.join("download", "index.html"), canonical: `${SITE_URL}/download` },
  { page: "start", output: path.join("start", "index.html"), canonical: `${SITE_URL}/start` },
  { page: "faq", output: path.join("faq", "index.html"), canonical: `${SITE_URL}/faq` },
  { page: "theory", output: path.join("theory-test-preparation", "index.html"), canonical: `${SITE_URL}/theory-test-preparation` },
  { page: "centres", output: path.join("driving-test-centres", "index.html"), canonical: `${SITE_URL}/driving-test-centres` },
  { page: "instructors", output: path.join("driving-instructors", "index.html"), canonical: `${SITE_URL}/driving-instructors` }
];

const baseRedirectTargets = [
  { output: "features.html", destination: "/features" },
  { output: "pricing.html", destination: "/pricing" },
  { output: "download.html", destination: "/download" },
  { output: "contact.html", destination: "/contact" },
  { output: "access-request.html", destination: "/access-request" },
  { output: "instructor-apply.html", destination: "/instructor-apply" },
  { output: path.join("how-it-works", "index.html"), destination: "/start" },
  { output: "faq.html", destination: "/faq" },
  { output: "terms.html", destination: "/terms" },
  { output: "privacypolicy.html", destination: "/privacy" }
];

const baseSitemapUrls = [
  `${SITE_URL}/`,
  `${SITE_URL}/features`,
  `${SITE_URL}/pricing`,
  `${SITE_URL}/download`,
  `${SITE_URL}/start`,
  `${SITE_URL}/faq`,
  `${SITE_URL}/theory-test-preparation`,
  `${SITE_URL}/driving-test-centres`,
  `${SITE_URL}/driving-instructors`,
  `${SITE_URL}/terms`,
  `${SITE_URL}/privacy`
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
    writeSiteFile("llm.txt", renderLlms(marketing, coverage)),
    writeSiteFile("llms.txt", renderLlms(marketing, coverage)),
    writeSiteFile("llms-full.txt", renderLlmsFull(marketing, coverage)),
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
  <link rel="icon" href="${iconAsset("/favicon.ico")}" />
  <link rel="icon" type="image/png" sizes="32x32" href="${iconAsset("/favicon-32x32.png")}" />
  <link rel="icon" type="image/png" sizes="16x16" href="${iconAsset("/favicon-16x16.png")}" />
  <link rel="apple-touch-icon" sizes="180x180" href="${iconAsset("/apple-touch-icon.png")}" />
  <link rel="manifest" href="${iconAsset("/manifest.webmanifest")}" />
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
  <script type="module" src="/site-runtime.js"></script>
</body>
</html>
`;
}

function buildStructuredData(page, canonical, title, description, marketing, centreId = "", overrides = {}) {
  const centre = findCentre(marketing.testCentreCoverage, centreId);
  const seoBrand = seoBrandTitle(marketing);
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
      "@id": `${SITE_URL}/#organization`,
      name: marketing.ui.brand,
      url: `${SITE_URL}/`,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/assets/drivest-wordmark-preview.png`
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
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: marketing.ui.brand,
      description: marketing.seo.description,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-GB"
    },
    {
      "@context": "https://schema.org",
      "@type": pageType,
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: title,
      description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-GB"
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: marketing.ui.brand,
      applicationCategory: "EducationalApplication",
      operatingSystem: "iOS, Android",
      description: marketing.seo.description,
      featureList: marketing.press.usp,
      inLanguage: "en-GB",
      provider: { "@id": `${SITE_URL}/#organization` }
    }
  ];

  if (seoBrand !== marketing.ui.brand) {
    data[0].alternateName = seoBrand;
    data[1].alternateName = seoBrand;
    data[3].alternateName = seoBrand;
  }

  if (page !== "home") {
    const itemListElement =
      page === "centre-detail" && centre
        ? [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `${SITE_URL}/`
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Driving test centres",
              item: `${SITE_URL}/driving-test-centres`
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
              item: `${SITE_URL}/`
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
      creator: { "@id": `${SITE_URL}/#organization` },
      includedInDataCatalog: { "@id": `${SITE_URL}/#website` },
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
      creator: { "@id": `${SITE_URL}/#organization` },
      includedInDataCatalog: { "@id": `${SITE_URL}/#website` },
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
  const brand = seoBrandTitle(marketing);
  if (marketing.contactPage?.title) {
    targets.push({
      kind: "contact",
      bodyPage: "contact",
      output: path.join("contact", "index.html"),
      canonical: `${SITE_URL}/contact`,
      title: brandDocumentTitle(marketing.pageSeo?.contact?.title || marketing.contactPage.title, brand),
      description: marketing.pageSeo?.contact?.description || marketing.contactPage.intro || marketing.seo.description,
      data: marketing.contactPage
    });
  }

  if (marketing.accessRequestPage?.title) {
    targets.push({
      kind: "access-request",
      bodyPage: "pricing",
      output: path.join("access-request", "index.html"),
      canonical: `${SITE_URL}/access-request`,
      title: brandDocumentTitle(marketing.pageSeo?.accessRequest?.title || marketing.accessRequestPage.title, brand),
      description: marketing.pageSeo?.accessRequest?.description || marketing.accessRequestPage.intro || marketing.seo.description,
      data: marketing.accessRequestPage
    });
  }

  if (marketing.instructorApplyPage?.title) {
    targets.push({
      kind: "instructor-apply",
      bodyPage: "instructors",
      output: path.join("instructor-apply", "index.html"),
      canonical: `${SITE_URL}/instructor-apply`,
      title: brandDocumentTitle(marketing.pageSeo?.instructorApply?.title || marketing.instructorApplyPage.title, brand),
      description: marketing.pageSeo?.instructorApply?.description || marketing.instructorApplyPage.intro || marketing.seo.description,
      data: marketing.instructorApplyPage
    });
  }

  for (const item of marketing.seoLandingPages?.theoryIntentPages || []) {
    if (!item?.slug || !item?.title || !item?.description) continue;
    targets.push({
      kind: "theory-intent",
      bodyPage: "theory",
      output: path.join(item.slug, "index.html"),
      canonical: `${SITE_URL}/${item.slug}`,
      title: brandDocumentTitle(item.seoTitle || item.title, brand),
      description: item.seoDescription || item.description,
      data: item
    });
  }

  for (const item of marketing.seoLandingPages?.centreRegionPages || []) {
    if (!item?.slug || !item?.title || !item?.description) continue;
    targets.push({
      kind: "centre-region",
      bodyPage: "centres",
      output: path.join("driving-test-centres", item.slug, "index.html"),
      canonical: `${SITE_URL}/driving-test-centres/${item.slug}`,
      title: brandDocumentTitle(item.seoTitle || item.title, brand),
      description: item.seoDescription || buildCentreRegionMetaDescription(item, coverage),
      data: item
    });
  }

  return targets;
}

function brandDocumentTitle(title, brand) {
  if (!title) return brand;
  return title.includes(`| ${brand}`) ? title : `${title} | ${brand}`;
}

function seoBrandTitle(marketing) {
  return marketing.seo?.brandTitle || marketing.ui?.brand || "Drivest";
}

function renderCustomPage(target, renderer, marketing, coverage) {
  switch (target.kind) {
    case "contact":
      return renderContactPage(target.data, renderer, marketing, coverage);
    case "access-request":
      return renderAccessRequestPage(target.data, renderer, marketing);
    case "instructor-apply":
      return renderInstructorApplyPage(target.data, renderer, marketing);
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
    case "access-request":
      return buildStructuredData("access-request", target.canonical, target.title, target.description, marketing, "", {
        pageType: "ContactPage",
        skipCentresDataset: true
      });
    case "instructor-apply":
      return buildStructuredData("instructors", target.canonical, target.title, target.description, marketing, "", {
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
          url: `${SITE_URL}${centre.url || `/driving-test-centres/${centre.id}`}`
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
          ${renderer.renderImg("/assets/app-instructor-hub.jpeg", "Drivest Instructor Hub screen", {
            loading: "eager",
            fetchPriority: "high",
            sizes: "(max-width: 980px) 92vw, 420px"
          })}
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

function renderAccessRequestPage(config, renderer, marketing) {
  const supportEmail = String(marketing.footer.contact || "admin@drivest.uk").replace(/^Contact:\s*/i, "");
  const requestablePlans = selectRequestablePlans(marketing);

  return `
    <section class="section reveal feature-hero pricing-hero">
      <div class="feature-hero-grid pricing-hero-grid">
        <div class="pricing-hero-copy">
          <p class="eyebrow">Learner access request</p>
          <h1>${escapeHtml(config.title)}</h1>
          <p class="hero-lead">${escapeHtml(config.intro)}</p>
          ${config.highlights?.length ? `<div class="pill-row pricing-pill-row">${renderer.renderPills(config.highlights)}</div>` : ""}
          <p class="trust hero-trust-secondary">Support inbox: ${escapeHtml(supportEmail)}</p>
        </div>
        <div class="pricing-hero-side reveal-item">
          <div class="panel pricing-summary-panel access-request-summary-panel">
            <p class="panel-title">Learner access options</p>
            <div class="pricing-summary-stack">
              ${requestablePlans
                .map(
                  (plan) => `
                <div class="pricing-summary-row${plan.featured ? " pricing-summary-row-featured" : ""}">
                  <div>
                    <strong>${escapeHtml(plan.name)}</strong>
                    <p>${escapeHtml(plan.summary || plan.subLine || plan.billing || "")}</p>
                  </div>
                  <span>${escapeHtml(plan.price)}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section reveal">
      <div class="grid access-request-grid">
        <article class="card reveal-item access-request-form-card">
          <h2>Create your request</h2>
          <p>Fill in the key details once, then continue in your email app with the learner-access draft already organised.</p>
          <form class="access-request-form" data-access-request-form data-support-email="${escapeHtml(supportEmail)}">
            <div class="access-request-field-grid">
              <label class="coverage-field">
                <span>Full name</span>
                <input class="coverage-control" type="text" name="name" autocomplete="name" required />
              </label>
              <label class="coverage-field">
                <span>Email address</span>
                <input class="coverage-control" type="email" name="email" autocomplete="email" required />
              </label>
            </div>

            <div class="access-request-field-grid">
              <label class="coverage-field">
                <span>Access route</span>
                <select class="coverage-control" name="plan" data-access-request-plan required>
                  <option value="">Choose an access option</option>
                  ${requestablePlans
                    .map(
                      (plan) => `
                    <option
                      value="${escapeHtml(plan.requestValue)}"
                      data-plan-name="${escapeHtml(plan.name)}"
                      data-plan-price="${escapeHtml(plan.price)}"
                      data-plan-subject="${escapeHtml(plan.requestSubject || `${marketing.ui.brand} access request`)}"
                      data-plan-requires-centre="${plan.requiresCentre ? "true" : "false"}"
                    >
                      ${escapeHtml(plan.name)} (${escapeHtml(plan.price)})
                    </option>
                  `
                    )
                    .join("")}
                </select>
              </label>
              <label class="coverage-field">
                <span>Driving stage</span>
                <select class="coverage-control" name="stage" required>
                  <option value="">Choose your current stage</option>
                  ${(config.stageOptions || [])
                    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
                    .join("")}
                </select>
              </label>
            </div>

            <div class="access-request-field-grid">
              <label class="coverage-field">
                <span>Selected test centre or nearby area</span>
                <input class="coverage-control" type="text" name="centre" data-access-request-centre autocomplete="off" />
              </label>
              <label class="coverage-field">
                <span>Preferred start timing</span>
                <select class="coverage-control" name="timing" required>
                  <option value="">Choose a timing preference</option>
                  ${(config.timingOptions || [])
                    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
                    .join("")}
                </select>
              </label>
            </div>

            <label class="coverage-field">
              <span>Extra context</span>
              <textarea
                class="coverage-control access-request-textarea"
                name="message"
                rows="6"
                placeholder="Tell support anything important about the centre, timing, or the plan you are comparing."
              ></textarea>
            </label>

            <p class="access-request-centre-note" data-access-request-centre-note aria-live="polite">
              Choose an access option to see whether an exact centre or nearby area should be included.
            </p>

            <div class="btn-row access-request-actions">
              <button class="btn btn-primary" type="submit">Create learner request</button>
              <a class="btn btn-secondary" href="mailto:${escapeHtml(supportEmail)}">Email support directly</a>
            </div>

            <p class="access-request-status" data-access-request-status aria-live="polite">
              Choose an access option and enter your details to create the request draft.
            </p>

            <div class="access-request-preview" data-access-request-preview hidden>
              <div class="access-request-preview-box">
                <p class="panel-title">Prepared subject</p>
                <p data-access-request-subject></p>
              </div>
              <div class="access-request-preview-box">
                <p class="panel-title">Prepared request body</p>
                <pre data-access-request-body></pre>
              </div>
              <div class="btn-row access-request-actions">
                <a class="btn btn-primary" href="#" data-access-request-mailto>Continue in email</a>
                <button class="btn btn-secondary" type="button" data-access-request-copy>Copy request details</button>
              </div>
              <p class="access-request-copy-status" data-access-request-copy-status aria-live="polite"></p>
            </div>
          </form>
        </article>

        <div class="access-request-side reveal-item">
          <article class="card">
            <h2>${escapeHtml(config.expectationTitle)}</h2>
            <p>${escapeHtml(config.expectationText)}</p>
            ${renderer.bulletList(config.expectationBullets)}
          </article>
          <article class="card">
            <h2>${escapeHtml(config.responseTitle)}</h2>
            ${renderer.bulletList(config.responseBullets)}
          </article>
        </div>
      </div>
    </section>

    ${renderer.renderLinkCardsSection({
      title: "Keep the request tied to the product journey",
      intro: "The learner-access page should still connect back to pricing, centre selection, and support context without making users start again.",
      items: [
        {
          title: "Back to pricing",
          text: "Return to the pricing page if you want to compare free learning, centre practice, navigation, and the annual bundle again.",
          href: "/pricing",
          cta: "Compare pricing"
        },
        {
          title: "Browse live centres",
          text: "Pick the exact centre you want before requesting practice or bundle access.",
          href: "/driving-test-centres",
          cta: "View centres"
        },
        {
          title: "Support and trust",
          text: "Use the contact page for support wording, legal identity references, and coverage methodology.",
          href: "/contact",
          cta: "View contact page"
        }
      ]
    })}
  `;
}

function selectRequestablePlans(marketing) {
  return (marketing.pricing?.plans || []).filter((plan) => plan.requestValue && plan.href);
}

function renderInstructorApplyPage(config, renderer, marketing) {
  const supportEmail = String(marketing.footer.contact || "admin@drivest.uk").replace(/^Contact:\s*/i, "");

  return `
    <section class="section reveal feature-hero pricing-hero">
      <div class="feature-hero-grid pricing-hero-grid">
        <div class="pricing-hero-copy">
          <p class="eyebrow">Instructor application</p>
          <h1>${escapeHtml(config.title)}</h1>
          <p class="hero-lead">${escapeHtml(config.intro)}</p>
          ${config.highlights?.length ? `<div class="pill-row pricing-pill-row">${renderer.renderPills(config.highlights)}</div>` : ""}
          <p class="trust hero-trust-secondary">Support inbox: ${escapeHtml(supportEmail)}</p>
        </div>
        <div class="pricing-hero-side reveal-item">
          <div class="panel pricing-summary-panel access-request-summary-panel">
            <p class="panel-title">What the application captures</p>
            <div class="pricing-summary-stack">
              <div class="pricing-summary-row">
                <div>
                  <strong>Teaching area</strong>
                  <p>So support can review the first market and local demand you want to cover.</p>
                </div>
                <span>Area</span>
              </div>
              <div class="pricing-summary-row">
                <div>
                  <strong>Lesson type</strong>
                  <p>Manual, automatic, or mixed delivery expectations before onboarding starts.</p>
                </div>
                <span>Type</span>
              </div>
              <div class="pricing-summary-row pricing-summary-row-featured">
                <div>
                  <strong>Onboarding timing</strong>
                  <p>Readiness, document stage, and whether this is immediate onboarding or early exploration.</p>
                </div>
                <span>Timing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section reveal">
      <div class="grid access-request-grid">
        <article class="card reveal-item access-request-form-card">
          <h2>Create your application</h2>
          <p>Fill in the key details once, then continue in your email app with the instructor-application draft already organised.</p>
          <form class="access-request-form" data-instructor-apply-form data-support-email="${escapeHtml(supportEmail)}">
            <div class="access-request-field-grid">
              <label class="coverage-field">
                <span>Full name</span>
                <input class="coverage-control" type="text" name="name" autocomplete="name" required />
              </label>
              <label class="coverage-field">
                <span>Email address</span>
                <input class="coverage-control" type="email" name="email" autocomplete="email" required />
              </label>
            </div>

            <div class="access-request-field-grid">
              <label class="coverage-field">
                <span>Phone number</span>
                <input class="coverage-control" type="tel" name="phone" autocomplete="tel" />
              </label>
              <label class="coverage-field">
                <span>Instructor stage</span>
                <select class="coverage-control" name="stage" required>
                  <option value="">Choose your instructor stage</option>
                  ${(config.stageOptions || [])
                    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
                    .join("")}
                </select>
              </label>
            </div>

            <div class="access-request-field-grid">
              <label class="coverage-field">
                <span>Teaching area or first launch area</span>
                <input class="coverage-control" type="text" name="area" autocomplete="address-level2" required />
              </label>
              <label class="coverage-field">
                <span>Lesson type</span>
                <select class="coverage-control" name="transmission" required>
                  <option value="">Choose your lesson type</option>
                  ${(config.transmissionOptions || [])
                    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
                    .join("")}
                </select>
              </label>
            </div>

            <div class="access-request-field-grid">
              <label class="coverage-field">
                <span>Preferred onboarding timing</span>
                <select class="coverage-control" name="timing" required>
                  <option value="">Choose a timing preference</option>
                  ${(config.timingOptions || [])
                    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
                    .join("")}
                </select>
              </label>
              <label class="coverage-field">
                <span>Readiness</span>
                <select class="coverage-control" name="readiness" required>
                  <option value="">Choose your readiness stage</option>
                  ${(config.readinessOptions || [])
                    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
                    .join("")}
                </select>
              </label>
            </div>

            <label class="coverage-field">
              <span>Extra context</span>
              <textarea
                class="coverage-control access-request-textarea"
                name="message"
                rows="6"
                placeholder="Tell support anything important about your teaching area, ADI or PDI status, documents, or rollout questions."
              ></textarea>
            </label>

            <div class="btn-row access-request-actions">
              <button class="btn btn-primary" type="submit">Create instructor application</button>
              <a class="btn btn-secondary" href="mailto:${escapeHtml(supportEmail)}">Email support directly</a>
            </div>

            <p class="access-request-status" data-instructor-apply-status aria-live="polite">
              Enter your details to create the application draft.
            </p>

            <div class="access-request-preview" data-instructor-apply-preview hidden>
              <div class="access-request-preview-box">
                <p class="panel-title">Prepared subject</p>
                <p data-instructor-apply-subject></p>
              </div>
              <div class="access-request-preview-box">
                <p class="panel-title">Prepared application body</p>
                <pre data-instructor-apply-body></pre>
              </div>
              <div class="btn-row access-request-actions">
                <a class="btn btn-primary" href="#" data-instructor-apply-mailto>Continue in email</a>
                <button class="btn btn-secondary" type="button" data-instructor-apply-copy>Copy application details</button>
              </div>
              <p class="access-request-copy-status" data-instructor-apply-copy-status aria-live="polite"></p>
            </div>
          </form>
        </article>

        <div class="access-request-side reveal-item">
          <article class="card">
            <h2>${escapeHtml(config.expectationTitle)}</h2>
            <p>${escapeHtml(config.expectationText)}</p>
            ${renderer.bulletList(config.expectationBullets)}
          </article>
          <article class="card">
            <h2>${escapeHtml(config.responseTitle)}</h2>
            ${renderer.bulletList(config.responseBullets)}
          </article>
        </div>
      </div>
    </section>

    ${renderer.renderLinkCardsSection({
      title: "Keep the application tied to the product journey",
      intro: "Instructor onboarding should still connect back to the public instructor story, support context, and the wider learner journey.",
      items: [
        {
          title: "Back to instructor overview",
          text: "Return to the instructor page if you want to review discovery, bookings, and Instructor Hub positioning again.",
          href: "/driving-instructors",
          cta: "View instructor overview"
        },
        {
          title: "Support and trust",
          text: "Use the contact page for support wording, legal identity references, and current product-status context.",
          href: "/contact",
          cta: "View contact page"
        },
        {
          title: "How Drivest works",
          text: "See the learner and instructor routes together before you commit to onboarding.",
          href: "/start",
          cta: "See how it works"
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
          ${renderer.renderImg(config.image, config.imageAlt, {
            loading: "eager",
            fetchPriority: "high",
            sizes: "(max-width: 980px) 92vw, 420px"
          })}
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
          ${renderer.renderImg("/assets/app-practice-centres.jpeg", "Drivest practice centre search screen", {
            loading: "eager",
            fetchPriority: "high",
            sizes: "(max-width: 980px) 92vw, 420px"
          })}
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
            ${renderer.button("Get the app", "/download", "primary")}
            ${renderer.button("Go to homepage", "/", "secondary")}
          </div>
        </div>
        <div class="feature-photo">
          ${renderer.renderImg("/assets/app-home-learner.jpeg", "Drivest learner home screen", {
            loading: "eager",
            fetchPriority: "high",
            sizes: "(max-width: 980px) 92vw, 420px"
          })}
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
    canonical: `${SITE_URL}/404`,
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
          src: iconAsset("/android-chrome-192x192.png"),
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: iconAsset("/android-chrome-512x512.png"),
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
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
  <link rel="icon" href="${iconAsset("/favicon.ico")}" />
  <link rel="icon" type="image/png" sizes="32x32" href="${iconAsset("/favicon-32x32.png")}" />
  <link rel="icon" type="image/png" sizes="16x16" href="${iconAsset("/favicon-16x16.png")}" />
  <link rel="apple-touch-icon" sizes="180x180" href="${iconAsset("/apple-touch-icon.png")}" />
  <link rel="manifest" href="${iconAsset("/manifest.webmanifest")}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Merriweather:wght@700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body data-page="${page}">
  <div id="app">
${indent(appHtml, 4)}
  </div>
  <script type="module" src="/site-runtime.js"></script>
</body>
</html>
`;
}

function renderRedirect(destination) {
  const canonical = `${SITE_URL}${destination}`;
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

function iconAsset(assetPath) {
  return `${assetPath}?v=${ICON_VERSION}`;
}

function renderRobots() {
  return `User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function renderLlms(marketing, coverage) {
  const summary = coverage?.summary || {};
  const coverageDate = coverageGeneratedAtLabel(coverage) || today;

  return `# ${marketing.ui.brand}

> ${marketing.press.oneLiner}

Drivest is a public UK learner-driver platform site. Canonical public content is published at ${SITE_URL}/. Practice routes are reconstructed or generated for learning only and are not official DVSA routes. Public coverage currently includes ${summary.centres || "UK"} test centres and ${summary.routes || "a broad set of"} practice routes. Coverage data shown on the site reflects the current corpus generated on ${coverageDate}.

## Core pages

- [Homepage](${SITE_URL}/): Product overview and public positioning.
- [Features](${SITE_URL}/features): Learner, navigation, parking, and instructor workflows.
- [Pricing](${SITE_URL}/pricing): Free and paid plan overview.
- [Get Drivest for iPhone](${SITE_URL}/download): Current iPhone launch status and direct download route.
- [Access request](${SITE_URL}/access-request): Structured learner-access request flow for free and paid routes.
- [Instructor apply](${SITE_URL}/instructor-apply): Structured instructor application flow.
- [Getting started](${SITE_URL}/start): Role-based onboarding paths for learners and instructors.

## Theory and learner preparation

- [Theory test preparation](${SITE_URL}/theory-test-preparation): Main theory learning hub with 32-language support.
- [Mock theory test](${SITE_URL}/mock-theory-test): Mock-test preparation page.
- [Hazard perception test](${SITE_URL}/hazard-perception-test): Hazard-perception preparation page.
- [Road signs test](${SITE_URL}/road-signs-test): Traffic-sign revision page.
- [Highway Code test](${SITE_URL}/highway-code-test): Highway Code revision page.
- [Driving theory test in Welsh](${SITE_URL}/driving-theory-test-in-welsh): Welsh-language learner page.
- [Driving theory test in Urdu](${SITE_URL}/driving-theory-test-in-urdu): Urdu-language learner page.
- [Driving theory test in Arabic](${SITE_URL}/driving-theory-test-in-arabic): Arabic-language learner page.

## Practice, navigation, and instructors

- [Driving test centres](${SITE_URL}/driving-test-centres): UK centre directory and practice-route overview.
- [London driving test centres](${SITE_URL}/driving-test-centres/london): London regional hub.
- [Manchester driving test centres](${SITE_URL}/driving-test-centres/manchester): Manchester regional hub.
- [Birmingham driving test centres](${SITE_URL}/driving-test-centres/birmingham): Birmingham regional hub.
- [Driving instructors](${SITE_URL}/driving-instructors): Instructor discovery and booking overview.

## Trust and support

- [FAQ](${SITE_URL}/faq): Product, pricing, and policy answers.
- [Contact](${SITE_URL}/contact): Support and coverage methodology.
- [Terms](${SITE_URL}/terms): Terms and conditions.
- [Privacy](${SITE_URL}/privacy): Privacy policy.
- [Sitemap](${SITE_URL}/sitemap.xml): Full public URL inventory.

## Optional

- [llms-full.txt](${SITE_URL}/llms-full.txt): Expanded LLM-readable summary of the public site.
`;
}

function renderLlmsFull(marketing, coverage) {
  const summary = coverage?.summary || {};
  const coverageDate = coverageGeneratedAtLabel(coverage) || today;

  return `# ${marketing.ui.brand}

> ${marketing.press.oneLiner}

Last updated: ${today}

This file is intended to give AI assistants and agentic tools a concise public-site summary without scraping every HTML page. Use the linked URLs as the canonical source for public claims, pricing, policy, and coverage detail.

## Interpretation notes

- Drivest serves future learners, learner drivers, and independent instructors in the UK.
- Theory preparation supports 32 languages, with English available for cross-checking the same question.
- Practice routes are reconstructed or generated for learning support only and are not official DVSA routes.
- The public coverage layer only includes test centres with more than 2 routes.
- Current coverage snapshot: ${summary.centres || "n/a"} centres, ${summary.routes || "n/a"} routes, ${summary.averageRoutesPerCentre || "n/a"} average routes per centre.
- Coverage data currently reflects the corpus generated on ${coverageDate}.
- Navigation and parking features are advisory product features and do not replace legal driving requirements or road-sign compliance.

## Primary product pages

- [Homepage](${SITE_URL}/): High-level product positioning and core calls to action.
- [Features](${SITE_URL}/features): Combined overview of theory, practice, navigation, parking, language support, and instructor operations.
- [Pricing](${SITE_URL}/pricing): Public pricing plans and bundle structure.
- [Get Drivest for iPhone](${SITE_URL}/download): Launch-status page and eventual direct App Store route.
- [Getting started](${SITE_URL}/start): Role-based onboarding flow for learners and instructors.

## Learner preparation

- [Theory test preparation](${SITE_URL}/theory-test-preparation): Main theory hub covering topic quizzes, mock tests, Highway Code, road signs, and penalties revision.
- [Mock theory test](${SITE_URL}/mock-theory-test): Mock-test intent page for search and assistant retrieval.
- [Hazard perception test](${SITE_URL}/hazard-perception-test): Hazard-perception intent page.
- [Road signs test](${SITE_URL}/road-signs-test): Sign-recognition intent page.
- [Highway Code test](${SITE_URL}/highway-code-test): Highway Code revision intent page.
- [Driving theory test in Welsh](${SITE_URL}/driving-theory-test-in-welsh): Welsh-language theory page.
- [Driving theory test in Urdu](${SITE_URL}/driving-theory-test-in-urdu): Urdu-language theory page.
- [Driving theory test in Arabic](${SITE_URL}/driving-theory-test-in-arabic): Arabic-language theory page.

## Practice, route coverage, and navigation

- [Driving test centres](${SITE_URL}/driving-test-centres): Public directory of included centres and practice-route coverage.
- [London driving test centres](${SITE_URL}/driving-test-centres/london): Regional hub for London-centre intent.
- [Manchester driving test centres](${SITE_URL}/driving-test-centres/manchester): Regional hub for Manchester-centre intent.
- [Birmingham driving test centres](${SITE_URL}/driving-test-centres/birmingham): Regional hub for Birmingham-centre intent.
- [Sitemap](${SITE_URL}/sitemap.xml): Full list of public pages, including individual centre pages.

## Instructor and commercial flows

- [Driving instructors](${SITE_URL}/driving-instructors): Instructor discovery, request, and booking overview.
- [Access request](${SITE_URL}/access-request): Structured learner-access page for free learning, selected-centre practice, navigation, and bundle access.
- [Instructor apply](${SITE_URL}/instructor-apply): Structured instructor application page for onboarding, rollout, and partnership enquiries.
- [Contact](${SITE_URL}/contact): Support contact details and public coverage methodology notes.
- [FAQ](${SITE_URL}/faq): Product and commercial clarification questions.

## Legal and policy

- [Terms](${SITE_URL}/terms): Terms and conditions.
- [Privacy](${SITE_URL}/privacy): Privacy policy.

## Optional

- [llms.txt](${SITE_URL}/llms.txt): Shorter index for quick retrieval.
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
    canonical: `${SITE_URL}${centre.url || `/driving-test-centres/${centre.id}`}`
  }));
}

function buildCentreRedirectTargets(coverage) {
  const centres = coverage?.centres || [];
  const centreMap = new Map(centres.map((centre) => [centre.id, centre]));
  const redirects = new Map();
  const addRedirect = (source, destination) => {
    const sourceKey = normaliseUrlPath(source);
    const destinationKey = normaliseUrlPath(destination);
    if (!sourceKey || !destinationKey || sourceKey === destinationKey) return;
    const output = outputPathForUrl(sourceKey);
    if (!redirects.has(output)) redirects.set(output, { output, destination: destinationKey });
  };

  for (const centre of centres) {
    const canonical = centre.url || `/driving-test-centres/${centre.id}`;
    const legacyPaths = new Set([
      `/driving-test-centres/${centre.id}`,
      centre.slug ? `/driving-test-centres/${centre.slug}` : "",
      `/driving-test-centres/${hyphenatePathSegment(centre.id)}`,
      centre.slug ? `/driving-test-centres/${hyphenatePathSegment(centre.slug)}` : ""
    ]);
    legacyPaths.forEach((source) => addRedirect(source, canonical));
  }

  for (const alias of coverage?.aliases || []) {
    const canonical = centreMap.get(alias.canonicalId);
    if (!canonical) continue;
    const destination = canonical.url || `/driving-test-centres/${canonical.id}`;
    const legacyPaths = new Set([
      `/driving-test-centres/${alias.id}`,
      `/driving-test-centres/${hyphenatePathSegment(alias.id)}`
    ]);
    legacyPaths.forEach((source) => addRedirect(source, destination));
  }

  return [...redirects.values()];
}

function normaliseUrlPath(urlPath) {
  const clean = `/${String(urlPath || "").replace(/^\/+|\/+$/g, "")}`;
  return clean === "/" ? "" : clean;
}

function hyphenatePathSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function buildCentreSitemapUrls(coverage) {
  return (coverage?.centres || []).map(
    (centre) => `${SITE_URL}${centre.url || `/driving-test-centres/${centre.id}`}`
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

function buildCentreRegionMetaDescription(config, coverage) {
  const centres = selectCentresForRegion(config, coverage);
  const summary = summariseCentreList(centres);
  if (!summary.centres || !summary.routes) return config.description;
  const label = centreRegionLabel(config);
  return `Browse ${formatInteger(summary.centres)} ${label} driving test centres currently live in Drivest, covering ${formatInteger(summary.routes)} practice routes with centre-by-centre route counts, average route lengths, and guided durations.`;
}

function centreRegionLabel(config) {
  const titleLabel = String(config?.title || "")
    .replace(/ driving test centres and practice routes$/i, "")
    .trim();
  if (titleLabel) return titleLabel;
  const slugLabel = String(config?.slug || "")
    .replace(/-/g, " ")
    .trim();
  return slugLabel || "UK";
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-GB").format(Number(value) || 0);
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
