const CONTENT_URL = "/site/content/marketing.en-GB.json";
const COVERAGE_URL = "/site/data/test-centre-coverage.en-GB.json";

const PATHS = {
  home: "/",
  features: "/features",
  pricing: "/pricing",
  start: "/start",
  faq: "/faq",
  contact: "/contact",
  theory: "/theory-test-preparation",
  centres: "/driving-test-centres",
  instructors: "/driving-instructors",
  terms: "/terms",
  privacy: "/privacy"
};

const PHOTO_URLS = {
  hero: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1400&q=80",
  learn: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
  route: "https://images.unsplash.com/photo-1471479917193-f00955256257?auto=format&fit=crop&w=1200&q=80",
  confidence: "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1200&q=80",
  theory: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
  practice: "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1200&q=80",
  navigation: "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=80",
  map: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80",
  roadsigns: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  school: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
  appHighwayQuiz: "/assets/app-highway-quiz.jpeg",
  appHomeArabic: "/assets/app-home-arabic.jpeg",
  appHomeLearner: "/assets/app-home-learner.jpeg",
  appHomeWelsh: "/assets/app-home-welsh.jpeg",
  appInstructorAvailability: "/assets/app-instructor-availability.jpeg",
  appInstructorBookings: "/assets/app-instructor-bookings.jpeg",
  appInstructorHub: "/assets/app-instructor-hub.jpeg",
  appNavigationOverview: "/assets/app-navigation-overview.jpeg",
  appNavigationSearch: "/assets/app-navigation-search.jpeg",
  appParkingDestination: "/assets/app-parking-destination.jpeg",
  appParkingSignQuiz: "/assets/app-parking-sign-quiz.jpeg",
  appPracticeCentres: "/assets/app-practice-centres.jpeg",
  appTheoryChinese: "/assets/app-theory-chinese.jpeg",
  appTheoryMastery: "/assets/app-theory-mastery.jpeg",
  appTheoryQuizEnglish: "/assets/app-theory-quiz-english.jpeg",
  appTheoryQuizWelsh: "/assets/app-theory-quiz-welsh.jpeg"
};

const page = document.body.dataset.page;
const app = document.getElementById("app");

if (!page || !app) {
  finalizePageChrome();
} else if (app.children.length || app.textContent.trim()) {
  finalizePageChrome();
} else {
  init().catch(() => {
    if (!app.children.length && !app.textContent.trim()) {
      app.innerHTML = '<main class="container"><section class="section"><p>Unable to load content.</p></section></main>';
    }
    finalizePageChrome();
  });
}

async function init() {
  const [contentResponse, coverageResponse] = await Promise.all([
    fetch(CONTENT_URL),
    fetch(COVERAGE_URL).catch(() => null)
  ]);
  const m = await contentResponse.json();
  const coverage = coverageResponse ? await coverageResponse.json().catch(() => null) : null;
  if (coverage) m.testCentreCoverage = coverage;

  document.title = pageTitle(page, m);
  setDescription(pageDescription(page, m));

  app.innerHTML = `
    ${renderShellStart(m)}
    ${renderPage(page, m)}
    ${renderShellEnd(m)}
  `;

  finalizePageChrome();
}

function finalizePageChrome() {
  const yearNode = document.getElementById("year");
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());
  setupAnimations();
  setupProofCarousels();
  setActiveNav();
  setupMobileNav();
}

function pageTitle(currentPage, m, centreId = document.body.dataset.centreId) {
  if (currentPage === "centre-detail") {
    const centre = coverageCentreById(m?.testCentreCoverage, centreId);
    if (centre) return `${centre.name} driving test routes and practice | ${m.ui.brand}`;
  }
  if (currentPage === "home") return m.seo.title;
  if (m.pageSeo?.[currentPage]?.title) return `${m.pageSeo[currentPage].title} | ${m.ui.brand}`;
  const map = {
    features: m.ui.nav.features,
    pricing: m.ui.nav.pricing,
    start: m.ui.nav.gettingStarted,
    faq: m.ui.nav.faq,
    "centre-detail": "Driving test centre practice",
    terms: footerLabel(m, "terms") || "Terms",
    privacy: footerLabel(m, "privacy") || "Privacy"
  };
  return `${map[currentPage] || m.seo.title} | ${m.ui.brand}`;
}

function pageDescription(currentPage, m, centreId = document.body.dataset.centreId) {
  if (currentPage === "centre-detail") {
    const centre = coverageCentreById(m?.testCentreCoverage, centreId);
    if (centre) {
      return `Practice ${formatNumber(centre.routeCount)} Drivest routes around ${centre.name}. Average route ${formatMetricValue(centre.averageDistanceKm, 1)} km and ${formatMetricValue(centre.averageDurationMinutes, 1)} minutes with ${difficultySummaryText(centre.dominantDifficulty)}.`;
    }
  }
  if (currentPage === "home") return m.seo.description;
  if (currentPage === "centres") {
    const summary = coverageSummary(m);
    if (summary) {
      return `Browse ${formatNumber(summary.centres)} UK driving test centres currently live in Drivest, covering ${formatNumber(summary.routes)} reconstructed practice routes with off-route alerts, offline packs, and road feature prompts.`;
    }
  }
  if (m.pageSeo?.[currentPage]?.description) return m.pageSeo[currentPage].description;

  const descriptions = {
    features:
      "Explore Drivest features for learner and future learner drivers, instructors, and newer drivers: theory in 32 languages, practice routes, lesson bookings, parking support, and calmer navigation.",
    pricing:
      "Compare Drivest pricing for free learning, selected-centre practice routes, navigation access, and the annual bundle for learner and future learner drivers.",
    start:
      "See how future learners, learner drivers, and instructors can get started with Drivest using the right onboarding path, language setup, and next steps.",
    faq:
      "Read common Drivest questions about theory preparation, reconstructed practice routes, instructor bookings, parking guidance, subscriptions, privacy, and legal positioning."
  };

  return descriptions[currentPage] || m.seo.description;
}

function setDescription(value) {
  let node = document.querySelector('meta[name="description"]');
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("name", "description");
    document.head.appendChild(node);
  }
  node.setAttribute("content", value);
}

function renderShellStart(m) {
  return `
    <div class="bg-orb bg-orb-a" aria-hidden="true"></div>
    <div class="bg-orb bg-orb-b" aria-hidden="true"></div>
    <header class="site-header">
      <div class="container nav-wrap">
        <a class="brand" href="${PATHS.home}" aria-label="${escapeAttr(m.ui.brand)} home">
          <img src="/assets/drivest-wordmark.png" alt="${escapeHtml(m.ui.brand)}" />
        </a>
        <nav class="nav-links site-nav" aria-label="Primary navigation">
          ${renderPrimaryNavLinks(m)}
        </nav>
        <div class="nav-actions">
          ${button(m.ui.actions.prepare, startHref("learner"), "primary", "header-cta")}
          <button
            class="nav-toggle"
            type="button"
            aria-expanded="false"
            aria-controls="mobile-menu"
            aria-label="${escapeAttr(m.ui.actions.menu)}"
            data-open-label="${escapeAttr(m.ui.actions.menu)}"
            data-close-label="${escapeAttr(m.ui.actions.closeMenu)}"
          >
            <span class="sr-only nav-toggle-label">${escapeHtml(m.ui.actions.menu)}</span>
            <span class="nav-toggle-box" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>
      <div id="mobile-menu" class="mobile-menu" hidden>
        <div class="container mobile-menu-inner">
          <nav class="mobile-nav site-nav" aria-label="Mobile navigation">
            ${renderPrimaryNavLinks(m)}
          </nav>
          <div class="mobile-menu-cta-row">
            ${button(m.ui.actions.prepare, startHref("learner"), "primary", "mobile-menu-cta")}
            ${button(m.hero.primaryCtas[1], startHref("instructor"), "secondary", "mobile-menu-secondary")}
          </div>
        </div>
      </div>
    </header>
    <main class="container main-content">
  `;
}

function renderShellEnd(m) {
  const supportEmail = String(m.footer.contact || "").replace(/^Contact:\s*/i, "");
  const footerExtras = (m.footer.links || [])
    .map((l) => {
      const href = resolveFooterHref(l);
      return { href, label: l.label };
    })
    .filter((link, index, all) => {
      if ([PATHS.features, PATHS.pricing, PATHS.start, PATHS.faq].includes(link.href)) return false;
      return all.findIndex((candidate) => candidate.href === link.href) === index;
    });
  return `
    </main>
    ${renderMobileCtaBar(m)}
    <footer class="site-footer">
      <div class="container footer-wrap">
        <div class="footer-brand-col">
          <img class="footer-logo" src="/assets/drivest-wordmark.png" alt="${escapeHtml(m.ui.brand)}" />
          <p class="footer-summary">${escapeHtml(coverageLineText(m))}</p>
          <p class="footer-muted">${escapeHtml(m.hero.trustLine)}</p>
          <p class="footer-contact"><a href="mailto:${escapeAttr(supportEmail)}">${escapeHtml(m.footer.contact)}</a></p>
          <small>&copy; <span id="year"></span> ${escapeHtml(m.ui.brand)}</small>
        </div>
        <div class="footer-col">
          <h4>Explore</h4>
          <div class="footer-links">
            <a href="${PATHS.features}">${escapeHtml(m.ui.nav.features)}</a>
            <a href="${PATHS.pricing}">${escapeHtml(m.ui.nav.pricing)}</a>
            <a href="${PATHS.start}">${escapeHtml(m.ui.nav.gettingStarted)}</a>
            <a href="${PATHS.faq}">${escapeHtml(m.ui.nav.faq)}</a>
            ${footerExtras
              .map((link) => {
                const external = link.href.startsWith("http") || link.href.startsWith("mailto:");
                const attrs = external ? ' target="_blank" rel="noreferrer"' : "";
                return `<a href="${escapeAttr(link.href)}"${attrs}>${escapeHtml(link.label)}</a>`;
              })
              .join("")}
          </div>
        </div>
        <div class="footer-col">
          <h4>Built for drivers</h4>
          <ul class="footer-list">
            ${m.threeTabs.tabs.map((t) => `<li>${escapeHtml(t.title)}: ${escapeHtml(t.line1)}</li>`).join("")}
          </ul>
        </div>
      </div>
    </footer>
  `;
}

function renderPage(currentPage, m) {
  switch (currentPage) {
    case "features":
      return renderFeatures(m);
    case "pricing":
      return renderPricing(m);
    case "start":
      return renderStart(m);
    case "faq":
      return renderFaq(m);
    case "theory":
    case "centres":
    case "instructors":
      return renderHubPage(currentPage, m);
    case "centre-detail":
      return renderCentreDetailPage(m, coverageCentreById(m?.testCentreCoverage, document.body.dataset.centreId));
    case "home":
    default:
      return renderHome(m);
  }
}

function renderHome(m) {
  return `
    <section class="hero section reveal">
      <div class="hero-grid">
        <div class="hero-copy">
          ${m.hero.positioningLine ? `<p class="eyebrow">${escapeHtml(m.hero.positioningLine)}</p>` : ""}
          <h1>${escapeHtml(m.hero.headline)}</h1>
          <p class="hero-lead">${escapeHtml(m.hero.subhead)}</p>
          <div class="btn-row hero-primary-actions">
            ${button(m.hero.primaryCtas[0], startHref("learner"), "primary")}
            ${button(m.hero.primaryCtas[1], startHref("instructor"), "secondary")}
          </div>
          <div class="btn-row hero-secondary-actions">
            ${button(m.hero.secondaryCtas[0], PATHS.pricing, "secondary")}
            ${button(m.hero.secondaryCtas[1], "#how-it-works", "secondary")}
          </div>
          ${renderHeroProofGrid(m)}
          <div class="hero-trust-stack">
            <p class="trust hero-trust-primary">${escapeHtml(m.hero.trustLine)}</p>
            ${coverageLineText(m) ? `<p class="trust hero-trust-secondary">${escapeHtml(coverageLineText(m))}</p>` : ""}
          </div>
          <div class="pill-row">${renderPills(m.press.usp)}</div>
        </div>
        <div class="hero-visual reveal-item">${renderHeroShowcase(m)}</div>
      </div>
    </section>

    <section class="section reveal">
      <h2>${escapeHtml(m.threeTabs.title)}</h2>
      <div class="grid three-up">
        ${m.threeTabs.tabs
          .map(
            (t) => `
          <article class="card reveal-item">
            ${renderJourneyScene(t)}
            <h3 class="tab-title">${renderTabIcon(t.title)}${escapeHtml(t.title)}</h3>
            <p>${escapeHtml(t.line1)}</p>
            <p>${escapeHtml(t.line2)}</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>

    ${renderHomeStartSplit(m.startPaths)}

    ${renderHomeModulesSection(m.homeModules)}

    ${renderProductProofSection(m.productProof)}

    ${renderAudienceSection(m.audienceTracks)}

    ${renderLinkCardsSection(m.searchIntentLinks)}

    <section class="section reveal">
      <h2>${escapeHtml(m.why.title)}</h2>
      ${bulletList(m.why.bullets)}
    </section>

    <section class="section reveal">
      <h2>${escapeHtml(m.ui.sections.coreFeatures)}</h2>
      ${renderFeatureCards(m.coreUsps)}
    </section>

    ${renderLanguageSupportSection(m.languageSupport)}

    <section id="how-it-works" class="section reveal">
      <h2>${escapeHtml(m.howItWorks.title)}</h2>
      <div class="grid two-up">
        ${m.howItWorks.steps
          .map(
            (s) => `
          <article class="card reveal-item">
            <div class="card-photo">
              <img src="${stepPhotoByTitle(s.title)}" alt="${escapeAttr(s.title)} visual" loading="lazy" />
            </div>
            <h3>${escapeHtml(s.title)}</h3>
            <p>${escapeHtml(s.text)}</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>

    ${renderSafetySection(m)}
  `;
}

function renderFeatures(m) {
  const featuresTitle = m.pageSeo?.features?.title || m.ui.nav.features;
  return `
    <section class="section reveal feature-hero">
      <div class="feature-hero-grid">
        <div>
          <h1>${escapeHtml(featuresTitle)}</h1>
          <p>${escapeHtml(m.hero.subhead)}</p>
        </div>
        <div class="feature-photo">
          <img src="${PHOTO_URLS.appNavigationOverview}" alt="Drivest navigation overview screen" loading="lazy" />
        </div>
      </div>
    </section>

    <section class="section reveal">
      ${renderFeatureCards(m.coreUsps)}
    </section>

    ${renderHomeModulesSection(m.homeModules)}

    ${renderAudienceSection(m.audienceTracks)}

    ${renderFeatureGroups(m.featureGroups)}

    ${renderProductProofSection(m.productProof)}

    ${renderLinkCardsSection(m.searchIntentLinks)}

    ${renderLanguageSupportSection(m.languageSupport)}

    <section class="section reveal">
      <h2>${escapeHtml(m.howItWorks.title)}</h2>
      <div class="grid two-up">
        ${m.howItWorks.steps
          .map(
            (s) => `
          <article class="card reveal-item">
            <h3>${escapeHtml(s.title)}</h3>
            <p>${escapeHtml(s.text)}</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>

    ${renderInfoSection(m.pricing.marketplace)}

    <section class="section reveal">
      <h2>${escapeHtml(m.safety.title)}</h2>
      ${bulletList(m.safety.bullets)}
    </section>
  `;
}

function renderStart(m) {
  return `
    <section class="section reveal feature-hero">
      <div class="feature-hero-grid">
        <div>
          <h1>${escapeHtml(m.startPaths.title)}</h1>
          <p>${escapeHtml(m.startPaths.intro)}</p>
        </div>
        <div class="feature-photo">
          <img src="${PHOTO_URLS.appHomeLearner}" alt="Drivest learner home screen" loading="lazy" />
        </div>
      </div>
    </section>

    ${renderStartPathsSection(m.startPaths)}

    ${renderLanguageSupportSection(m.languageSupport)}

    <section class="section reveal">
      <h2>${escapeHtml(m.howItWorks.title)}</h2>
      <div class="grid two-up">
        ${m.howItWorks.steps
          .map(
            (s) => `
          <article class="card reveal-item">
            <h3>${escapeHtml(s.title)}</h3>
            <p>${escapeHtml(s.text)}</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>

    ${renderAudienceSection(m.audienceTracks)}
  `;
}

function renderPricing(m) {
  const pricingTitle = m.pageSeo?.pricing?.title || m.pricing.title;
  return `
    <section class="section reveal feature-hero pricing-hero">
      <div class="feature-hero-grid pricing-hero-grid">
        <div class="pricing-hero-copy">
          <p class="eyebrow">Free first, upgrade by stage</p>
          <h1>${escapeHtml(pricingTitle)}</h1>
          <p class="hero-lead">${escapeHtml(m.pricing.intro || m.pricing.disclaimer)}</p>
          ${m.pricing.comparePills?.length ? `<div class="pill-row pricing-pill-row">${renderPills(m.pricing.comparePills)}</div>` : ""}
          <p class="trust hero-trust-secondary">${escapeHtml(m.pricing.disclaimer)}</p>
        </div>
        <div class="pricing-hero-side reveal-item">
          ${renderPricingSummaryPanel(m.pricing)}
        </div>
      </div>
    </section>

    <section class="section reveal">
      <div class="pricing-grid">
        ${m.pricing.plans
          .map(
            (p) => `
          <article class="card reveal-item price-card${p.featured ? " price-card-featured" : ""}">
            <div class="price-card-top">
              <div>
                ${p.tag ? `<p class="price-plan-tag">${escapeHtml(p.tag)}</p>` : ""}
                <h3>${escapeHtml(p.name)}</h3>
              </div>
              ${p.featured ? `<span class="price-featured-chip">Recommended</span>` : ""}
            </div>
            <p class="price">${escapeHtml(p.price)}</p>
            ${p.billing ? `<p class="price-billing">${escapeHtml(p.billing)}</p>` : ""}
            ${p.summary ? `<p class="price-summary">${escapeHtml(p.summary)}</p>` : ""}
            ${p.subLine ? `<p class="price-subline">${escapeHtml(p.subLine)}</p>` : ""}
            ${bulletList(p.bullets)}
            <div class="btn-row price-card-actions">
              ${button(p.cta, p.href || startHref("learner"), "primary")}
              ${p.secondaryCta ? button(p.secondaryCta, p.secondaryHref || PATHS.features, "secondary") : ""}
            </div>
          </article>
        `
          )
          .join("")}
      </div>
      <p class="note">${escapeHtml(m.pricing.disclaimer)}</p>
    </section>

    ${renderInfoSection(m.pricing.marketplace)}

    ${renderPricingAppGallery(m.pricing.appGallery)}
  `;
}

function renderFaq(m) {
  const faqTitle = m.pageSeo?.faq?.title || m.faqHeader?.title || m.ui.nav.faq;
  const faqMeta = m.faqHeader
    ? `<p class="doc-meta">${escapeHtml(m.faqHeader.app)}<br />${escapeHtml(m.faqHeader.version)}<br />${escapeHtml(m.faqHeader.updated)}</p>`
    : "";
  return `
    <section class="section reveal">
      <h1>${escapeHtml(faqTitle)}</h1>
      ${faqMeta}
      <div class="faq-list">
        ${m.faq
          .map(
            (it) => `
          <article class="faq-item reveal-item">
            <h2>${escapeHtml(it.q)}</h2>
            <p>${escapeHtml(it.a)}</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderHubPage(pageKey, m) {
  const hub = m.hubPages?.[pageKey];
  if (!hub) return renderHome(m);
  const photo = hubPagePhoto(pageKey);

  return `
    <section class="section reveal feature-hero">
      <div class="feature-hero-grid">
        <div>
          <h1>${escapeHtml(hub.title)}</h1>
          <p>${escapeHtml(hub.intro)}</p>
        </div>
        <div class="feature-photo">
          <img src="${escapeAttr(photo.src)}" alt="${escapeAttr(photo.alt)}" loading="lazy" />
        </div>
      </div>
    </section>

    ${hub.summary ? `
      <section class="section reveal">
        <div class="panel reveal-item">
          <p class="panel-title">${escapeHtml(hub.summary.title)}</p>
          <p>${escapeHtml(hub.summary.text)}</p>
        </div>
      </section>
    ` : ""}

    ${(hub.sections || []).map((section) => renderCardGridSection(section)).join("")}

    ${pageKey === "centres" ? renderCoverageDirectorySection(m) : ""}

    ${hub.showLanguageSupport ? renderLanguageSupportSection(m.languageSupport) : ""}

    ${(hub.infoSections || []).map((section) => renderInfoSection(section)).join("")}

    ${renderLinkCardsSection(hub.related)}
  `;
}

function renderFeatureCards(items) {
  return `
    <div class="grid three-up">
      ${items
        .map(
          (it) => `
        <article class="card reveal-item">
          <h3 class="tab-title">${renderFeatureIcon(it.title)}${escapeHtml(it.title)}</h3>
          <p>${escapeHtml(it.text)}</p>
        </article>
      `
        )
        .join("")}
    </div>
  `;
}

function renderProofCarousel(items, config) {
  if (!items?.length) return "";
  const {
    idPrefix,
    label,
    trackClass,
    cardClass,
    phoneClass,
    copyClass
  } = config;
  const total = items.length;

  return `
    <div class="proof-carousel" data-carousel data-carousel-label="${escapeAttr(label)}">
      <div id="${escapeAttr(idPrefix)}-track" class="grid ${escapeAttr(trackClass)} proof-carousel-track" data-carousel-track tabindex="0">
        ${items
          .map(
            (item, index) => `
          <article class="card reveal-item ${escapeAttr(cardClass)}" data-carousel-slide aria-label="${escapeAttr(`${label} ${index + 1} of ${total}`)}">
            ${renderPhoneShot(item.image, item.alt, item.caption || "", `phone-shot-proof ${phoneClass}`)}
            <div class="${escapeAttr(copyClass)}">
              ${item.badge ? `<span class="tile-badge">${escapeHtml(item.badge)}</span>` : ""}
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.text)}</p>
            </div>
          </article>
        `
          )
          .join("")}
      </div>
      ${total > 1 ? `
        <div class="proof-carousel-controls reveal-item">
          <button type="button" class="proof-carousel-nav" data-carousel-prev aria-controls="${escapeAttr(idPrefix)}-track" aria-label="Show previous ${escapeAttr(label.toLowerCase())} card">
            <span aria-hidden="true">&#8592;</span>
            <span class="sr-only">Previous</span>
          </button>
          <div class="proof-carousel-meta">
            <div class="proof-carousel-status" aria-live="polite">
              <span class="proof-carousel-count" data-carousel-count>1 / ${total}</span>
              <span class="proof-carousel-title" data-carousel-title>${escapeHtml(items[0].title)}</span>
            </div>
            <div class="proof-carousel-dots" aria-label="${escapeAttr(label)} slide navigation">
              ${items
                .map(
                  (_, index) => `
                <button
                  type="button"
                  class="proof-carousel-dot${index === 0 ? " active" : ""}"
                  data-carousel-dot
                  data-target-index="${index}"
                  aria-controls="${escapeAttr(idPrefix)}-track"
                  aria-label="Show ${escapeAttr(label.toLowerCase())} card ${index + 1} of ${total}"
                  aria-pressed="${index === 0 ? "true" : "false"}"
                >
                  <span class="sr-only">${escapeHtml(`${label} card ${index + 1}`)}</span>
                </button>
              `
                )
                .join("")}
            </div>
          </div>
          <button type="button" class="proof-carousel-nav" data-carousel-next aria-controls="${escapeAttr(idPrefix)}-track" aria-label="Show next ${escapeAttr(label.toLowerCase())} card">
            <span aria-hidden="true">&#8594;</span>
            <span class="sr-only">Next</span>
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

function renderProductProofSection(config) {
  if (!config?.items?.length) return "";
  return `
    <section class="section reveal">
      <h2>${escapeHtml(config.title)}</h2>
      ${config.intro ? `<p class="section-intro">${escapeHtml(config.intro)}</p>` : ""}
      ${renderProofCarousel(config.items, {
        idPrefix: "product-proof",
        label: "Product proof",
        trackClass: "product-proof-grid",
        cardClass: "product-proof-card",
        phoneClass: "product-proof-phone",
        copyClass: "product-proof-copy"
      })}
    </section>
  `;
}

function renderSafetySection(m) {
  if (!m?.safety?.title) return "";
  const safetyItems = [
    {
      title: "Parking destination flow",
      text: "Compare nearby parking from the destination first, with clearer source cues and a free-first filter.",
      image: PHOTO_URLS.appParkingDestination,
      alt: "Drivest parking destination screen showing council and OSM parking source options."
    },
    {
      title: "Parking sign awareness",
      text: "Parking sign practice stays inside theory revision before arrival-time guidance takes over.",
      image: PHOTO_URLS.appParkingSignQuiz,
      alt: "Drivest parking sign quiz screen showing on-street parking question practice."
    }
  ];
  return `
    <section class="section reveal">
      <h2>${escapeHtml(m.safety.title)}</h2>
      ${renderProofCarousel(safetyItems, {
        idPrefix: "safety-proof",
        label: "Safety proof",
        trackClass: "safety-proof-grid",
        cardClass: "safety-proof-card",
        phoneClass: "safety-proof-phone",
        copyClass: "safety-proof-copy"
      })}
      ${bulletList(m.safety.bullets)}
      <div class="panel reveal-item">
        <p class="panel-title">${escapeHtml(m.ui.sections.onArrival)}</p>
        <p>${escapeHtml(m.safety.arrivalAdvisory[0])}</p>
        <p>${escapeHtml(m.safety.arrivalAdvisory[1])}</p>
      </div>
    </section>
  `;
}

function renderCardGridSection(section) {
  if (!section?.items?.length) return "";
  return `
    <section class="section reveal">
      <h2>${escapeHtml(section.title)}</h2>
      ${section.intro ? `<p class="section-intro">${escapeHtml(section.intro)}</p>` : ""}
      ${renderFeatureCards(section.items)}
    </section>
  `;
}

function renderHomeModulesSection(config) {
  if (!config?.groups?.length) return "";
  return `
    <section class="section reveal">
      <h2>${escapeHtml(config.title)}</h2>
      ${config.intro ? `<p class="section-intro">${escapeHtml(config.intro)}</p>` : ""}
      ${config.summary ? `
        <div class="panel reveal-item">
          <p class="panel-title">${escapeHtml(config.summary.title)}</p>
          <p>${escapeHtml(config.summary.text)}</p>
        </div>
      ` : ""}
      <div class="grid two-up">
        ${config.groups
          .map(
            (group) => `
          <article class="card reveal-item">
            <h3>${escapeHtml(group.title)}</h3>
            <div class="grid two-up compact-grid">
              ${(group.items || [])
                .map(
                  (item) => `
                <div class="module-tile">
                  <div class="module-tile-head">
                    <span class="tab-title">${renderFeatureIcon(item.title)}${escapeHtml(item.title)}</span>
                    ${item.badge ? `<span class="tile-badge">${escapeHtml(item.badge)}</span>` : ""}
                  </div>
                  <p>${escapeHtml(item.text)}</p>
                </div>
              `
                )
                .join("")}
            </div>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderAudienceSection(config) {
  if (!config?.items?.length) return "";
  return `
    <section class="section reveal">
      <h2>${escapeHtml(config.title)}</h2>
      ${config.intro ? `<p class="section-intro">${escapeHtml(config.intro)}</p>` : ""}
      <div class="grid two-up">
        ${config.items
          .map(
            (item) => `
          <article class="card reveal-item">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
            ${bulletList(item.bullets)}
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderStartPathsSection(config) {
  if (!config?.paths?.length) return "";
  return `
    <section class="section reveal">
      ${config.summary ? `
        <div class="panel reveal-item">
          <p class="panel-title">${escapeHtml(config.summary.title)}</p>
          <p>${escapeHtml(config.summary.text)}</p>
        </div>
      ` : ""}
      <div class="grid two-up">
        ${config.paths
          .map(
            (path) => `
          <article id="${escapeAttr(path.id)}" class="card reveal-item anchor-target">
            <h3 class="tab-title">${renderFeatureIcon(path.title)}${escapeHtml(path.title)}</h3>
            <p>${escapeHtml(path.text)}</p>
            ${bulletList(path.bullets)}
            ${path.cta ? `<div class="btn-row">${button(path.cta, path.href || PATHS.home, "secondary")}</div>` : ""}
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderFeatureGroups(groups) {
  if (!groups?.length) return "";
  return groups
    .map(
      (group) => `
    <section class="section reveal">
      <h2>${escapeHtml(group.title)}</h2>
      ${group.intro ? `<p class="section-intro">${escapeHtml(group.intro)}</p>` : ""}
      ${renderFeatureCards(group.items || [])}
    </section>
  `
    )
    .join("");
}

function renderMobileCtaBar(m) {
  if (!["home", "features", "pricing", "faq", "theory", "centres", "instructors"].includes(page)) return "";
  return `
    <div class="mobile-cta-bar">
      <div class="container mobile-cta-wrap">
        <p class="mobile-cta-copy">${escapeHtml(m.hero.positioningLine || m.ui.actions.prepare)}</p>
        ${button(m.ui.actions.prepare, startHref("learner"), "primary", "mobile-cta-link")}
      </div>
    </div>
  `;
}

function renderLinkCardsSection(config) {
  if (!config?.items?.length) return "";
  return `
    <section class="section reveal">
      <h2>${escapeHtml(config.title)}</h2>
      ${config.intro ? `<p class="section-intro">${escapeHtml(config.intro)}</p>` : ""}
      <div class="grid two-up">
        ${config.items
          .map(
            (item) => `
          <article class="card reveal-item">
            <h3 class="tab-title">${renderFeatureIcon(item.title)}${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
            ${bulletList(item.bullets)}
            ${item.cta ? `<div class="btn-row">${button(item.cta, item.href || PATHS.home, "secondary")}</div>` : ""}
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderPricingAppGallery(config) {
  if (!config?.items?.length) return "";
  return `
    <section class="section reveal">
      <h2>${escapeHtml(config.title)}</h2>
      ${config.intro ? `<p class="section-intro">${escapeHtml(config.intro)}</p>` : ""}
      <div class="app-module-grid">
        ${config.items
          .map(
            (item) => `
          <article class="app-module-card reveal-item">
            ${renderModuleScene(item)}
            <div class="app-module-body">
              <h3 class="tab-title">${renderFeatureIcon(item.title)}${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.text)}</p>
            </div>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderHeroShowcase(m) {
  const summary = coverageSummary(m);
  return `
    <div class="hero-showcase">
      <div class="hero-stat-strip">
        ${renderShowcaseStat("32", "languages")}
        ${renderShowcaseStat(formatNumber(summary?.centres || 340), "test centres")}
        ${renderShowcaseStat(formatNumber(summary?.routes || 3000), "practice routes")}
      </div>
      <div class="hero-showcase-grid">
        <div class="hero-phone-cluster">
          ${renderPhoneShot(
            PHOTO_URLS.appHomeLearner,
            "Drivest learner home screen showing theory, practice, navigation, and find instructor modules.",
            "Learner home screen",
            "phone-shot-hero phone-shot-home",
            "eager"
          )}
          <div class="hero-phone-float">
            ${renderPhoneShot(
              PHOTO_URLS.appTheoryMastery,
              "Drivest theory mastery screen showing learn, quiz, and mock progression.",
              "Theory mastery flow",
              "phone-shot-hero phone-shot-theory",
              "eager"
            )}
          </div>
        </div>
        <div class="hero-story-stack">
          <article class="hero-story-card">
            <span class="hero-story-tag">Before lessons</span>
            <h3>Start earlier with theory preparation</h3>
            <p>Future learners can begin theory, Highway Code, traffic signs, and fines preparation before practical lessons begin.</p>
          </article>
          <article class="hero-story-card hero-story-card-accent">
            <span class="hero-story-tag">When learning moves on road</span>
            <h3>Turn preparation into lessons, routes, and bookings</h3>
            <p>Practice routes, instructor discovery, lesson booking, parking support, and calmer navigation become the next layer of support.</p>
          </article>
          <div class="hero-legal-note">
            <span class="hero-legal-dot" aria-hidden="true"></span>
            <p>${escapeHtml(m.hero.trustLine)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCoverageDirectorySection(m) {
  const config = m.liveCoverage;
  const coverage = m.testCentreCoverage;
  const summary = coverageSummary(m);
  const groups = coverageGroups(coverage);
  const topCentres = coverageTopCentres(coverage, 12);
  const aliasCount = Number(coverage?.summary?.aliasCount) || 0;
  const excludedCount = Number(coverage?.summary?.excludedCount) || 0;
  const aliasText = `${formatNumber(aliasCount)} duplicate slug variant${aliasCount === 1 ? " is" : "s are"} collapsed into canonical centre page${aliasCount === 1 ? "" : "s"}.`;
  if (!config || !summary || !groups.length) return "";

  return `
    <section class="section reveal">
      <h2>${escapeHtml(config.title)}</h2>
      ${config.intro ? `<p class="section-intro">${escapeHtml(config.intro)}</p>` : ""}
      <div class="coverage-stat-grid">
        <article class="card reveal-item">
          <p class="panel-title">Centres listed</p>
          <p class="coverage-stat-value">${escapeHtml(formatNumber(summary.centres))}</p>
          <p>Only centres with more than ${escapeHtml(String(summary.threshold))} routes are included.</p>
        </article>
        <article class="card reveal-item">
          <p class="panel-title">Routes represented</p>
          <p class="coverage-stat-value">${escapeHtml(formatNumber(summary.routes))}</p>
          <p>These are the current routes attached to the centres included in this directory.</p>
        </article>
        <article class="card reveal-item">
          <p class="panel-title">Average route length</p>
          <p class="coverage-stat-value">${escapeHtml(formatMetricValue(summary.averageDistanceKm, 1))} km</p>
          <p>Typical published routes sit inside a realistic lesson-length practice window.</p>
        </article>
        <article class="card reveal-item">
          <p class="panel-title">Average guided time</p>
          <p class="coverage-stat-value">${escapeHtml(formatMetricValue(summary.averageDurationMinutes, 1))} min</p>
          <p>Average route quality across the public corpus is ${escapeHtml(formatMetricValue(summary.averageQualityScore, 3))}.</p>
        </article>
      </div>
      <div class="panel reveal-item">
        <p class="panel-title">${escapeHtml(config.summaryTitle)}</p>
        <p>${escapeHtml(config.summaryText)}</p>
        <p class="coverage-summary-note">${escapeHtml(formatNumber(excludedCount))} temporary, backup, or broken centre variants are excluded from the public layer, and ${escapeHtml(aliasText)}</p>
        ${config.note ? `<p class="coverage-summary-note">${escapeHtml(config.note)}</p>` : ""}
      </div>
    </section>

    <section class="section reveal">
      <h2>${escapeHtml(config.topCentresTitle)}</h2>
      <div class="grid three-up">
        ${topCentres
          .map(
            (centre) => `
          <article class="card reveal-item">
            <h3><a class="centre-link" href="${escapeAttr(centreHref(centre))}">${escapeHtml(centre.name)}</a></h3>
            <p class="coverage-route-count">${escapeHtml(formatNumber(centre.routeCount))} routes</p>
            <p>Average route: ${escapeHtml(formatMetricValue(centre.averageDistanceKm, 1))} km over ${escapeHtml(formatMetricValue(centre.averageDurationMinutes, 1))} minutes.</p>
            <a class="text-link" href="${escapeAttr(centreHref(centre))}">View centre practice page</a>
          </article>
        `
          )
          .join("")}
      </div>
    </section>

    <section class="section reveal">
      <h2>${escapeHtml(config.directoryTitle)}</h2>
      <div class="coverage-letter-grid">
        ${groups
          .map(
            (group) => `
          <article class="card reveal-item coverage-letter-card">
            <div class="coverage-letter-head">
              <h3>${escapeHtml(group.letter)}</h3>
              <span class="tile-badge">${escapeHtml(formatNumber(group.centres.length))} centres</span>
            </div>
            <ul class="coverage-centre-list">
              ${group.centres
                .map(
                  (centre) => `
                <li class="coverage-centre-item">
                  <a class="coverage-centre-link" href="${escapeAttr(centreHref(centre))}">
                    <span>${escapeHtml(centre.name)}</span>
                    <strong>${escapeHtml(formatNumber(centre.routeCount))}</strong>
                  </a>
                </li>
              `
                )
                .join("")}
            </ul>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderCentreDetailPage(m, centre) {
  if (!centre) {
    return `
      <section class="section reveal">
        <h1>Driving test centre practice</h1>
        <p>This centre is not currently available in the public Drivest route layer.</p>
      </section>
      ${renderLinkCardsSection(m.hubPages?.centres?.related)}
    `;
  }

  const difficultyList = renderCountList(
    centre.difficultyCounts,
    (key) => `${toDisplayLabel(key)} difficulty`
  );
  const familyList = renderCountList(centre.routeFamilyCounts, (key) => toDisplayLabel(key));
  const topRoads = centre.topRoads || [];
  const topZones = centre.topZones || [];
  const sampleRoutes = centre.sampleRoutes || [];
  const nearbyCentres = nearestCoverageCentres(m.testCentreCoverage, centre, 6);
  const challengeBullets = centreChallengeBullets(centre);
  const validation = centre.validation || {};
  const hintCoverage = typeof validation.hintCoverageRatio === "number" ? `${Math.round(validation.hintCoverageRatio * 100)}%` : "Not stated";
  const rangeText = `${formatMetricValue(centre.minDistanceKm, 1)}-${formatMetricValue(centre.maxDistanceKm, 1)} km and ${formatMetricValue(centre.minDurationMinutes, 1)}-${formatMetricValue(centre.maxDurationMinutes, 1)} minutes`;
  const generatedAtText = coverageGeneratedAtText(m.testCentreCoverage);

  return `
    <section class="section reveal feature-hero">
      <div class="feature-hero-grid">
        <div>
          <p class="eyebrow">Selected-centre practice</p>
          <h1>${escapeHtml(centre.name)} driving test routes and practice</h1>
          <p>Practice around ${escapeHtml(centre.name)} with ${escapeHtml(formatNumber(centre.routeCount))} Drivest routes currently above the public threshold. The set averages ${escapeHtml(formatMetricValue(centre.averageDistanceKm, 1))} km and ${escapeHtml(formatMetricValue(centre.averageDurationMinutes, 1))} minutes, with ${escapeHtml(difficultySummaryText(centre.dominantDifficulty))} in the current public set.</p>
          <div class="pill-row">
            <span class="pill">${escapeHtml(formatNumber(centre.routeCount))} routes</span>
            <span class="pill">${escapeHtml(formatMetricValue(centre.averageDistanceKm, 1))} km average</span>
            <span class="pill">${escapeHtml(formatMetricValue(centre.averageDurationMinutes, 1))} min average</span>
            <span class="pill">Quality ${escapeHtml(formatMetricValue(centre.averageQualityScore, 3))}</span>
          </div>
        </div>
        <div class="panel reveal-item">
          <p class="panel-title">At a glance</p>
          <ul class="detail-list">
            <li>Published because this centre has more than ${escapeHtml(String(coverageSummary(m)?.threshold || 2))} routes.</li>
            <li>Typical route range: ${escapeHtml(rangeText)}.</li>
            <li>${escapeHtml(formatNumber(validation.selected || centre.routeCount))} routes selected from ${escapeHtml(formatNumber(validation.candidates || 0))} route candidates in the current validation file.</li>
            <li>Hint-road coverage in the current validation file: ${escapeHtml(hintCoverage)}.</li>
            ${generatedAtText ? `<li>Public coverage file generated: ${escapeHtml(generatedAtText)}.</li>` : ""}
          </ul>
        </div>
      </div>
    </section>

    <section class="section reveal">
      <div class="coverage-stat-grid">
        <article class="card reveal-item">
          <p class="panel-title">Practice routes</p>
          <p class="coverage-stat-value">${escapeHtml(formatNumber(centre.routeCount))}</p>
          <p>Only this centre's public route set is counted here.</p>
        </article>
        <article class="card reveal-item">
          <p class="panel-title">Distance range</p>
          <p class="coverage-stat-value">${escapeHtml(formatMetricValue(centre.minDistanceKm, 1))}-${escapeHtml(formatMetricValue(centre.maxDistanceKm, 1))} km</p>
          <p>Useful for judging whether the local practice set leans shorter or longer.</p>
        </article>
        <article class="card reveal-item">
          <p class="panel-title">Time range</p>
          <p class="coverage-stat-value">${escapeHtml(formatMetricValue(centre.minDurationMinutes, 1))}-${escapeHtml(formatMetricValue(centre.maxDurationMinutes, 1))} min</p>
          <p>Based on the estimated guided duration attached to each route.</p>
        </article>
        <article class="card reveal-item">
          <p class="panel-title">Source route files</p>
          <p class="coverage-stat-value">${escapeHtml(formatNumber(centre.sourcePdfCount || 0))}</p>
          <p>Distinct route-source files contributing to the current centre page.</p>
        </article>
      </div>
    </section>

    <section class="section reveal">
      <div class="grid two-up">
        <article class="card reveal-item">
          <h2>Difficulty and route shape mix</h2>
          <div class="detail-subsection">
            <h3>Difficulty</h3>
            <ul class="detail-list">${difficultyList}</ul>
          </div>
          <div class="detail-subsection">
            <h3>Route families</h3>
            <ul class="detail-list">${familyList}</ul>
          </div>
        </article>
        <article class="card reveal-item">
          <h2>Roads and zones covered</h2>
          <div class="detail-subsection">
            <h3>Most repeated roads</h3>
            <div class="tag-cloud">
              ${topRoads.map((road) => `<span class="pill">${escapeHtml(road.name)} (${escapeHtml(formatNumber(road.count))})</span>`).join("")}
            </div>
          </div>
          <div class="detail-subsection">
            <h3>Route zones</h3>
            <div class="tag-cloud">
              ${topZones.map((zone) => `<span class="pill">${escapeHtml(toDisplayLabel(zone.name))} (${escapeHtml(formatNumber(zone.count))})</span>`).join("")}
            </div>
          </div>
        </article>
        <article class="card reveal-item">
          <h2>Validation profile</h2>
          <ul class="detail-list">
            <li>${escapeHtml(formatNumber(validation.validated || 0))} validated routes in the current validation report.</li>
            <li>${escapeHtml(formatNumber(validation.selected || centre.routeCount))} selected routes in the public practice set.</li>
            <li>${escapeHtml(formatNumber(validation.matchedHintRoads || 0))} matched hint roads recorded for this centre.</li>
            <li>Hint-road coverage ratio: ${escapeHtml(hintCoverage)}.</li>
          </ul>
        </article>
        <article class="card reveal-item">
          <h2>Common local practice signals</h2>
          <ul class="detail-list">
            ${challengeBullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
        <article class="card reveal-item">
          <h2>Important positioning</h2>
          <ul class="detail-list">
            <li>Routes are reconstructed or generated for learning support and are not official DVSA routes.</li>
            <li>Learners must always follow live road signs, markings, instructions, and traffic law.</li>
            <li>Navigation, route, and parking outputs remain advisory only and can be incomplete or delayed.</li>
          </ul>
        </article>
      </div>
    </section>

    <section class="section reveal">
      <div class="grid two-up">
        <article class="card reveal-item">
          <h2>Nearby covered centres</h2>
          <p class="section-intro">Use nearby-centre pages when you want a broader local practice comparison without leaving the current area completely.</p>
          ${nearbyCentres.length
            ? `
              <ul class="coverage-centre-list">
                ${nearbyCentres
                  .map(
                    (item) => `
                  <li class="coverage-centre-item">
                    <a class="coverage-centre-link" href="${escapeAttr(centreHref(item))}">
                      <span>${escapeHtml(item.name)}${item.distanceKm != null ? ` · ${escapeHtml(formatMetricValue(item.distanceKm, 1))} km away` : ""}</span>
                      <strong>${escapeHtml(formatNumber(item.routeCount))}</strong>
                    </a>
                  </li>
                `
                  )
                  .join("")}
              </ul>
            `
            : "<p>No nearby covered centres are available from the current public coordinate layer.</p>"}
        </article>
        <article class="card reveal-item">
          <h2>Before arrival and after practice</h2>
          <ul class="detail-list">
            <li>Use the selected-centre practice page to judge route depth before committing lesson time around ${escapeHtml(centre.name)}.</li>
            <li>Allow extra time for arrival and still confirm any live signs, markings, or parking restrictions around the area.</li>
            <li>If you practise across more than one nearby centre, compare route-count depth and route shape mix instead of assuming all centres behave the same.</li>
            <li>Keep theory, instructor, and calmer navigation pages linked so local practice stays part of the wider learner journey.</li>
          </ul>
        </article>
      </div>
    </section>

    <section class="section reveal">
      <h2>Sample practice routes for ${escapeHtml(centre.name)}</h2>
      <p class="section-intro">These routes are the highest-quality examples currently attached to this centre in the public data layer.</p>
      <div class="grid three-up">
        ${sampleRoutes
          .map(
            (route) => `
          <article class="card reveal-item">
            <h3>${escapeHtml(route.name || "Practice route")}</h3>
            <p class="coverage-route-count">${escapeHtml(formatMetricValue(route.distanceKm, 1))} km</p>
            <p>${escapeHtml(formatMetricValue(route.durationMinutes, 1))} minutes, ${escapeHtml(toDisplayLabel(route.difficultyLevel))} difficulty, quality ${escapeHtml(formatMetricValue(route.qualityScore, 3))}.</p>
            <p>${escapeHtml(toDisplayLabel(route.routeFamily))} route family with ${escapeHtml(formatNumber((route.routeZones || []).length))} named zone markers.</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>

    ${renderLinkCardsSection(m.hubPages?.centres?.related)}
  `;
}

function renderCountList(counts, labelBuilder) {
  const entries = Object.entries(counts || {});
  if (!entries.length) return "<li>No count summary available for this centre yet.</li>";
  return entries
    .sort((a, b) => {
      if ((b[1] || 0) !== (a[1] || 0)) return (b[1] || 0) - (a[1] || 0);
      return String(a[0] || "").localeCompare(String(b[0] || ""), "en-GB");
    })
    .map(
      ([key, value]) =>
        `<li>${escapeHtml(formatNumber(value))} routes in the ${escapeHtml(labelBuilder(key))} category.</li>`
    )
    .join("");
}

function renderShowcaseStat(value, label) {
  return `
    <div class="hero-stat-card">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

function renderHeroProofGrid(m) {
  const summary = coverageSummary(m);
  const thresholdText = summary ? `Only centres with more than ${summary.threshold} routes appear in the live public layer.` : m.hero.coverageLine || "";
  const coverageHeadline = summary
    ? `${formatNumber(summary.centres)} live centres · ${formatNumber(summary.routes)} routes`
    : coverageLineText(m);

  return `
    <div class="hero-proof-grid">
      <article class="hero-proof-card">
        <span class="hero-proof-label">Live coverage</span>
        <strong>${escapeHtml(coverageHeadline)}</strong>
        <p>${escapeHtml(thresholdText)}</p>
      </article>
      <article class="hero-proof-card hero-proof-card-accent">
        <span class="hero-proof-label">Platform scope</span>
        <strong>One learner platform from theory to independent driving</strong>
        <p>${escapeHtml(m.press.oneLiner)}</p>
      </article>
    </div>
  `;
}

function renderPricingSummaryPanel(pricing) {
  if (!pricing?.plans?.length) return "";
  return `
    <div class="panel pricing-summary-panel">
      <p class="panel-title">How the plans step up</p>
      <div class="pricing-summary-stack">
        ${pricing.plans
          .map(
            (plan) => `
          <div class="pricing-summary-row${plan.featured ? " pricing-summary-row-featured" : ""}">
            <div>
              <strong>${escapeHtml(plan.name)}</strong>
              <p>${escapeHtml(plan.summary || plan.subLine || "")}</p>
            </div>
            <span>${escapeHtml(plan.price)}</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderPhoneShot(src, alt, caption, extraClass = "", loading = "lazy") {
  return `
    <figure class="phone-shot ${escapeAttr(extraClass)}">
      <div class="phone-shot-frame">
        <img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="${escapeAttr(loading)}" />
      </div>
      ${caption ? `<figcaption class="phone-shot-caption">${escapeHtml(caption)}</figcaption>` : ""}
    </figure>
  `;
}

function renderJourneyScene(tab) {
  const meta = journeySceneMeta(tab.title);
  return `
    <div class="journey-scene ${escapeAttr(meta.className)}">
      <div class="journey-scene-head">
        <span class="journey-stage">${escapeHtml(meta.stage)}</span>
        <span class="journey-metric">${escapeHtml(meta.metric)}</span>
      </div>
      <div class="journey-chip-row">
        ${meta.chips.map((chip) => `<span class="journey-chip">${escapeHtml(chip)}</span>`).join("")}
      </div>
    </div>
  `;
}

function journeySceneMeta(title) {
  const t = String(title).toLowerCase();
  if (t.includes("theory")) {
    return {
      className: "journey-scene-theory",
      stage: "Before lessons",
      metric: "32 languages",
      chips: ["Theory", "Highway Code", "English cross-check"]
    };
  }
  if (t.includes("practice")) {
    return {
      className: "journey-scene-practice",
      stage: "During lessons",
      metric: "Selected centre",
      chips: ["Route repeat", "Off-route alerts", "Offline packs"]
    };
  }
  return {
    className: "journey-scene-navigation",
    stage: "Beyond the test",
    metric: "Calmer routes",
    chips: ["Parking support", "Road prompts", "Voice modes"]
  };
}

function renderHomeStartSplit(config) {
  if (!config?.paths?.length) return "";
  return `
    <section class="section reveal">
      <h2>Choose your route into Drivest</h2>
      <p class="section-intro">${escapeHtml(config.summary?.text || config.intro || "")}</p>
      <div class="grid two-up">
        ${config.paths
          .map(
            (path) => `
          <article class="card reveal-item path-card">
            <div class="path-card-top">
              <span class="path-tag">${escapeHtml(path.id === "instructor" ? "Instructor path" : "Learner path")}</span>
              <span class="path-topline">${escapeHtml(path.id === "instructor" ? "Profile, bookings, linked learners" : "Preparation, practice, navigation")}</span>
            </div>
            <h3 class="tab-title">${renderFeatureIcon(path.title)}${escapeHtml(path.title)}</h3>
            <p>${escapeHtml(path.text)}</p>
            <div class="path-step-list">
              ${(path.bullets || [])
                .slice(0, 3)
                .map(
                  (bullet, index) => `
                <div class="path-step">
                  <span class="path-step-num">${index + 1}</span>
                  <p>${escapeHtml(bullet)}</p>
                </div>
              `
                )
                .join("")}
            </div>
            <div class="btn-row">
              ${button(path.id === "instructor" ? "See instructor start" : "See learner start", startHref(path.id), "primary")}
              ${path.cta ? button(path.cta, path.href || PATHS.home, "secondary") : ""}
            </div>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderModuleScene(item) {
  const meta = moduleSceneMeta(item.title);
  return `
    <div class="app-module-scene ${escapeAttr(meta.className)}">
      <div class="app-module-scene-head">
        <span class="app-module-scene-badge">${escapeHtml(meta.badge)}</span>
        ${renderFeatureIcon(item.title)}
      </div>
      <p class="app-module-scene-title">${escapeHtml(item.title)}</p>
      <div class="app-module-scene-pills">
        ${meta.pills.map((pill) => `<span class="app-module-scene-pill">${escapeHtml(pill)}</span>`).join("")}
      </div>
    </div>
  `;
}

function moduleSceneMeta(title) {
  const t = String(title).toLowerCase();
  if (t.includes("theory")) {
    return {
      className: "module-scene-theory",
      badge: "32 languages",
      pills: ["Question view", "English cross-check", "Theory prep"]
    };
  }
  if (t.includes("practice")) {
    return {
      className: "module-scene-practice",
      badge: "Selected-centre routes",
      pills: ["Route repeat", "Off-route alert", "Offline support"]
    };
  }
  if (t.includes("navigation")) {
    return {
      className: "module-scene-navigation",
      badge: "Calmer guidance",
      pills: ["Road prompts", "Voice modes", "Confidence-led"]
    };
  }
  if (t.includes("parking")) {
    return {
      className: "module-scene-parking",
      badge: "Before arrival",
      pills: ["Parking options", "Source confidence", "Check live signs"]
    };
  }
  if (t.includes("instructor")) {
    return {
      className: "module-scene-instructor",
      badge: "Independent instructors",
      pills: ["Profiles", "Availability", "Reviews"]
    };
  }
  return {
    className: "module-scene-bookings",
    badge: "Lesson flow",
    pills: ["Requests", "Payment state", "Cancellations"]
  };
}

function renderInfoSection(info) {
  if (!info?.title) return "";
  return `
    <section class="section reveal">
      <div class="panel reveal-item">
        <h2>${escapeHtml(info.title)}</h2>
        ${info.text ? `<p>${escapeHtml(info.text)}</p>` : ""}
        ${bulletList(info.bullets)}
        ${info.pills?.length ? `<div class="pill-row">${renderPills(info.pills)}</div>` : ""}
      </div>
    </section>
  `;
}

function coverageSummary(m) {
  const summary = m?.testCentreCoverage?.summary;
  if (!summary) return null;
  return {
    centres: Number(summary.centres) || 0,
    routes: Number(summary.routes) || 0,
    threshold: Number(m.testCentreCoverage?.filter?.routeCountGreaterThan) || 2,
    averageRoutesPerCentre: Number(summary.averageRoutesPerCentre) || 0,
    averageDistanceKm: Number(summary.averageRouteDistanceKm) || 0,
    averageDurationMinutes: Number(summary.averageRouteDurationMinutes) || 0,
    averageQualityScore: Number(summary.averageQualityScore) || 0
  };
}

function coverageGeneratedAtText(coverage) {
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

function coverageLineText(m) {
  const summary = coverageSummary(m);
  if (!summary) return m.hero.coverageLine || m.hero.subhead;
  return `${formatNumber(summary.centres)} UK test centres currently live with more than ${summary.threshold} routes. ${formatNumber(summary.routes)} practice routes across the UK.`;
}

function coverageCentreById(coverage, centreId) {
  if (!coverage || !centreId) return null;
  return (coverage.centres || []).find((centre) => centre.id === centreId) || null;
}

function centreHref(centre) {
  if (typeof centre === "object" && centre?.url) return centre.url;
  const id = typeof centre === "string" ? centre : centre?.id;
  return `${PATHS.centres}/${id}`;
}

function nearestCoverageCentres(coverage, centre, limit = 6) {
  const source = centre?.coordinates;
  if (!source?.lat || !source?.lon) return [];
  return (coverage?.centres || [])
    .filter((candidate) => candidate.id !== centre.id && candidate.coordinates?.lat && candidate.coordinates?.lon)
    .map((candidate) => ({
      ...candidate,
      distanceKm: haversineKm(source, candidate.coordinates)
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

function haversineKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians((b.lat || 0) - (a.lat || 0));
  const dLon = degreesToRadians((b.lon || 0) - (a.lon || 0));
  const lat1 = degreesToRadians(a.lat || 0);
  const lat2 = degreesToRadians(b.lat || 0);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function centreChallengeBullets(centre) {
  const bullets = [];
  const hardRoutes = Number(centre?.difficultyCounts?.hard) || 0;
  const mediumRoutes = Number(centre?.difficultyCounts?.medium) || 0;
  if (hardRoutes > mediumRoutes) {
    bullets.push(`The current public set leans harder than medium-only local practice, with ${formatNumber(hardRoutes)} hard routes visible.`);
  }
  const sharpTurns = Number(centre?.validationFlagCounts?.sharp_turns_present) || 0;
  if (sharpTurns > 0) {
    bullets.push(`Sharp-turn markers appear in ${formatNumber(sharpTurns)} routes in the current public set.`);
  }
  const dominantFamily = Object.entries(centre?.routeFamilyCounts || {})
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))[0];
  if (dominantFamily?.[0]) {
    bullets.push(`${toDisplayLabel(dominantFamily[0])} route families dominate the current public set, which usually means repeated decision density rather than one simple loop.`);
  }
  const roads = (centre?.topRoads || []).slice(0, 3).map((road) => road.name).filter(Boolean);
  if (roads.length) {
    bullets.push(`Most repeated roads in the current public set include ${roads.join(", ")}.`);
  }
  const zones = (centre?.topZones || []).slice(0, 3).map((zone) => toDisplayLabel(zone.name)).filter(Boolean);
  if (zones.length) {
    bullets.push(`Route repetition is strongest across ${zones.join(", ")} coverage zones in the current public layer.`);
  }
  return bullets.length ? bullets.slice(0, 4) : ["The current public set gives a structured local practice layer rather than one generic centre description."];
}

function coverageGroups(coverage) {
  const centres = coverage?.centres || [];
  const map = new Map();
  centres.forEach((centre) => {
    const letter = String(centre.name || "").trim().charAt(0).toUpperCase() || "#";
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter).push(centre);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0], "en-GB"))
    .map(([letter, centres]) => ({ letter, centres }));
}

function coverageTopCentres(coverage, limit) {
  const centres = (coverage?.centres || []).slice();
  return centres
    .sort((a, b) => {
      if ((b.routeCount || 0) !== (a.routeCount || 0)) return (b.routeCount || 0) - (a.routeCount || 0);
      return String(a.name || "").localeCompare(String(b.name || ""), "en-GB");
    })
    .slice(0, limit);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-GB").format(Number(value) || 0);
}

function formatMetricValue(value, digits = 1) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";
  return numericValue.toFixed(digits);
}

function difficultySummaryText(value) {
  const key = String(value || "").toLowerCase();
  if (key === "hard") return "a hard-skewed route mix";
  if (key === "medium") return "a mostly medium-difficulty route mix";
  if (key === "easy") return "an easier-skewed route mix";
  return "mixed difficulty coverage";
}

function toDisplayLabel(value) {
  return String(value || "")
    .replace(/[_:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function renderLanguageSupportSection(info) {
  if (!info?.title) return "";
  return `
    <section class="section reveal">
      <div class="language-proof panel reveal-item">
        <div class="language-proof-copy">
          <h2>${escapeHtml(info.title)}</h2>
          ${info.text ? `<p>${escapeHtml(info.text)}</p>` : ""}
          ${bulletList(info.bullets)}
          ${info.pills?.length ? `<div class="pill-row">${renderPills(info.pills)}</div>` : ""}
        </div>
        <div class="language-proof-visual">
          ${renderPhoneShot(
            PHOTO_URLS.appTheoryChinese,
            "Theory question screen in Simplified Chinese with English UK option visible.",
            "Theory question with English cross-check",
            "phone-shot-proof"
          )}
          <div class="language-proof-side">
            ${renderPhoneShot(
              PHOTO_URLS.appHomeWelsh,
              "Welsh Drivest home screen showing translated module labels.",
              "Welsh-translated home screen",
              "phone-shot-proof phone-shot-proof-sm"
            )}
            ${renderPhoneShot(
              PHOTO_URLS.appTheoryQuizEnglish,
              "Theory question screen with English UK available beside Welsh.",
              "English cross-check inside theory flow",
              "phone-shot-proof phone-shot-proof-sm"
            )}
            <div class="language-proof-note">
              Users can study in a preferred language, including Welsh and Arabic, then open English (UK) on the same question to compare wording before answering.
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function stepPhotoByTitle(title) {
  const t = String(title).toLowerCase();
  if (t.includes("learner") || t.includes("stage")) return PHOTO_URLS.appHomeLearner;
  if (t.includes("instructor")) return PHOTO_URLS.appInstructorHub;
  if (t.includes("language")) return PHOTO_URLS.appTheoryQuizWelsh;
  if (t.includes("book")) return PHOTO_URLS.appInstructorBookings;
  if (t.includes("progress") || t.includes("review")) return PHOTO_URLS.appInstructorHub;
  if (t.includes("mode")) return PHOTO_URLS.appHomeLearner;
  if (t.includes("centre")) return PHOTO_URLS.appPracticeCentres;
  if (t.includes("destination")) return PHOTO_URLS.appParkingDestination;
  if (t.includes("prompt")) return PHOTO_URLS.appNavigationOverview;
  return PHOTO_URLS.appTheoryMastery;
}

function hubPagePhoto(pageKey) {
  switch (pageKey) {
    case "theory":
      return {
        src: PHOTO_URLS.appTheoryMastery,
        alt: "Drivest theory mastery screen"
      };
    case "centres":
      return {
        src: PHOTO_URLS.appPracticeCentres,
        alt: "Drivest practice centre search screen"
      };
    case "instructors":
      return {
        src: PHOTO_URLS.appInstructorHub,
        alt: "Drivest Instructor Hub screen"
      };
    default:
      return {
        src: PHOTO_URLS.route,
        alt: "Drivest app feature overview"
      };
  }
}

function renderPills(items) {
  return (items || []).map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("");
}

function activeNavKey(currentPage = page) {
  switch (currentPage) {
    case "theory":
    case "centres":
    case "instructors":
    case "centre-detail":
      return "features";
    default:
      return currentPage;
  }
}

function renderPrimaryNavLinks(m) {
  const links = [
    { key: "features", href: PATHS.features, label: m.ui.nav.features },
    { key: "pricing", href: PATHS.pricing, label: m.ui.nav.pricing },
    { key: "start", href: PATHS.start, label: m.ui.nav.gettingStarted },
    { key: "faq", href: PATHS.faq, label: m.ui.nav.faq }
  ];
  const currentNavKey = activeNavKey();
  const termsText = footerLabel(m, "terms");
  const privacyText = footerLabel(m, "privacy");
  if (termsText) links.push({ key: "terms", href: PATHS.terms, label: termsText });
  if (privacyText) links.push({ key: "privacy", href: PATHS.privacy, label: privacyText });

  return links
    .map((link) => {
      const active = link.key === currentNavKey;
      return `<a class="nav-link${active ? " active" : ""}" data-nav="${escapeAttr(link.key)}" href="${escapeAttr(link.href)}"${active ? ' aria-current="page"' : ""}>${escapeHtml(link.label)}</a>`;
    })
    .join("");
}

function renderTabIcon(title) {
  const t = String(title).toLowerCase();
  if (t.includes("theory")) return iconBadge("book");
  if (t.includes("practice")) return iconBadge("route");
  return iconBadge("nav");
}

function renderFeatureIcon(title) {
  const t = String(title).toLowerCase();
  if (t.includes("language")) return iconBadge("globe");
  if (t.includes("quiz") || t.includes("mock")) return iconBadge("book");
  if (t.includes("instructor") || t.includes("marketplace") || t.includes("learner")) return iconBadge("people");
  if (t.includes("availability")) return iconBadge("card");
  if (t.includes("analytics") || t.includes("progress")) return iconBadge("chart");
  if (t.includes("payment") || t.includes("booking") || t.includes("subscription")) return iconBadge("card");
  if (t.includes("bookmark")) return iconBadge("book");
  if (t.includes("parking")) return iconBadge("car");
  if (t.includes("notification")) return iconBadge("bell");
  if (t.includes("highway") || t.includes("sign") || t.includes("theory")) return iconBadge("book");
  if (t.includes("navigation")) return iconBadge("nav");
  if (t.includes("practice")) return iconBadge("route");
  if (t.includes("hazard") || t.includes("fine")) return iconBadge("alert");
  if (t.includes("coverage")) return iconBadge("pin");
  if (t.includes("route")) return iconBadge("route");
  if (t.includes("off-route")) return iconBadge("alert");
  if (t.includes("prompt")) return iconBadge("nav");
  if (t.includes("stress")) return iconBadge("leaf");
  if (t.includes("confidence")) return iconBadge("shield");
  if (t.includes("offline")) return iconBadge("download");
  return iconBadge("spark");
}

function iconBadge(type) {
  const icons = {
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h11a2 2 0 0 1 2 2v12H8a2 2 0 0 0-2 2V4z"/><path d="M6 20a2 2 0 0 1 2-2h11"/></svg>',
    route: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18c5 0 2-8 8-8"/></svg>',
    nav: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 18-7-4-7 4 7-18z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18"/><path d="M12 3a15 15 0 0 0 0 18"/></svg>',
    people: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1"/><circle cx="10" cy="8" r="3"/><path d="M20 19v-1a4 4 0 0 0-3-3.87"/><path d="M16 5.13a3 3 0 0 1 0 5.74"/></svg>',
    chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16"/><path d="M7 16v-5"/><path d="M12 16V8"/><path d="M17 16v-8"/></svg>',
    card: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg>',
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h12"/><path d="M8 17V11a4 4 0 1 1 8 0v6"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16l1.5-5h11L19 16"/><path d="M4 16h16v3H4z"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2L12 3z"/><path d="M12 9v5"/><circle cx="12" cy="17" r="1"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4c-8 0-14 4-14 10a6 6 0 0 0 6 6c6 0 8-6 8-16z"/><path d="M10 14c2-2 4-3 7-4"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"/><path d="M8 10l4 4 4-4"/><path d="M5 20h14"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3z"/></svg>'
  };
  return `<span class="icon-chip">${icons[type] || icons.spark}</span>`;
}

function setupAnimations() {
  const nodes = document.querySelectorAll(".reveal, .reveal-item");
  if (!nodes.length) return;

  nodes.forEach((node) => node.classList.add("pre-reveal"));
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.01, rootMargin: "0px 0px -8% 0px" }
  );

  nodes.forEach((node) => observer.observe(node));
}

function setupProofCarousels() {
  const carousels = document.querySelectorAll("[data-carousel]");
  if (!carousels.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  carousels.forEach((carousel) => {
    const track = carousel.querySelector("[data-carousel-track]");
    const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
    const prev = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");
    const dots = Array.from(carousel.querySelectorAll("[data-carousel-dot]"));
    const count = carousel.querySelector("[data-carousel-count]");
    const title = carousel.querySelector("[data-carousel-title]");
    const mobileMedia = window.matchMedia("(max-width: 760px)");
    if (!track || slides.length < 2) return;

    let currentIndex = 0;
    let ticking = false;

    const isMobile = () => mobileMedia.matches;
    const maxIndex = slides.length - 1;

    const syncButtons = () => {
      if (prev) prev.disabled = !isMobile() || currentIndex <= 0;
      if (next) next.disabled = !isMobile() || currentIndex >= maxIndex;
      if (count) count.textContent = `${currentIndex + 1} / ${slides.length}`;
      if (title) {
        const heading = slides[currentIndex].querySelector("h3");
        title.textContent = heading ? heading.textContent.trim() : `${currentIndex + 1}`;
      }
      dots.forEach((dot, index) => {
        const active = index === currentIndex;
        dot.classList.toggle("active", active);
        dot.setAttribute("aria-pressed", active ? "true" : "false");
      });
    };

    const nearestIndex = () => {
      const left = track.scrollLeft;
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      slides.forEach((slide, index) => {
        const distance = Math.abs(slide.offsetLeft - left);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      return bestIndex;
    };

    const goTo = (targetIndex, instant = false) => {
      currentIndex = Math.max(0, Math.min(maxIndex, targetIndex));
      if (isMobile()) {
        slides[currentIndex].scrollIntoView({
          behavior: reduceMotion || instant ? "auto" : "smooth",
          block: "nearest",
          inline: "start"
        });
      }
      syncButtons();
    };

    if (prev) prev.addEventListener("click", () => goTo(currentIndex - 1));
    if (next) next.addEventListener("click", () => goTo(currentIndex + 1));

    dots.forEach((dot) => {
      dot.addEventListener("click", () => goTo(Number(dot.dataset.targetIndex || 0)));
    });

    track.addEventListener("keydown", (event) => {
      if (!isMobile()) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(currentIndex - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(currentIndex + 1);
      }
    });

    track.addEventListener("scroll", () => {
      if (!isMobile() || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        currentIndex = nearestIndex();
        syncButtons();
        ticking = false;
      });
    });

    const handleMediaChange = (event) => {
      if (event.matches) {
        goTo(currentIndex, true);
      } else {
        currentIndex = 0;
        track.scrollLeft = 0;
        syncButtons();
      }
    };

    if (typeof mobileMedia.addEventListener === "function") {
      mobileMedia.addEventListener("change", handleMediaChange);
    } else if (typeof mobileMedia.addListener === "function") {
      mobileMedia.addListener(handleMediaChange);
    }

    syncButtons();
  });
}

function setActiveNav() {
  const current = activeNavKey();
  if (!current || current === "home") return;
  document.querySelectorAll(`.site-nav a[data-nav="${current}"]`).forEach((link) => {
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
  });
}

function setupMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("mobile-menu");
  if (!toggle || !menu) return;

  const label = toggle.querySelector(".nav-toggle-label");
  const openLabel = toggle.dataset.openLabel || "Menu";
  const closeLabel = toggle.dataset.closeLabel || "Close menu";

  const setOpen = (isOpen) => {
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? closeLabel : openLabel);
    if (label) label.textContent = isOpen ? closeLabel : openLabel;
    menu.hidden = !isOpen;
    document.body.classList.toggle("nav-open", isOpen);
  };

  setOpen(false);

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  const desktopMedia = window.matchMedia("(min-width: 761px)");
  const handleDesktopSwitch = (event) => {
    if (event.matches) setOpen(false);
  };

  if (typeof desktopMedia.addEventListener === "function") {
    desktopMedia.addEventListener("change", handleDesktopSwitch);
  } else if (typeof desktopMedia.addListener === "function") {
    desktopMedia.addListener(handleDesktopSwitch);
  }
}

function startHref(role) {
  return `${PATHS.start}#${role}`;
}

function footerLabel(m, key) {
  const hit = footerLink(m, key);
  return hit ? hit.label : "";
}

function resolveFooterHref(link) {
  const raw = String(link.url || "");
  const url = raw.toLowerCase();
  if (url.includes("drivest.uk/theory-test-preparation")) return PATHS.theory;
  if (url.includes("drivest.uk/driving-test-centres")) return PATHS.centres;
  if (url.includes("drivest.uk/driving-instructors")) return PATHS.instructors;
  if (url.includes("drivest.uk/terms")) return PATHS.terms;
  if (url.includes("drivest.uk/privacy")) return PATHS.privacy;
  if (url.includes("drivest.uk/faq")) return PATHS.faq;
  return raw;
}

function footerLink(m, key) {
  const links = m.footer.links || [];
  return links.find((l) => String(l.url || "").toLowerCase().includes(`drivest.uk/${key}`)) || null;
}

function button(label, href, variant, extraClass = "") {
  if (!label || !href) return "";
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const attrs = external ? ' target="_blank" rel="noreferrer"' : "";
  const classes = `btn btn-${variant}${extraClass ? ` ${extraClass}` : ""}`;
  return `<a class="${classes}" href="${escapeAttr(href)}"${attrs}>${escapeHtml(label)}</a>`;
}

function bulletList(items) {
  if (!items?.length) return "";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
