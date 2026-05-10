const CONTENT_URL = "/site/content/marketing.en-GB.json";

const PATHS = {
  home: "/index.html",
  features: "/features.html",
  pricing: "/pricing.html",
  start: "/start",
  faq: "/faq",
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
  school: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80"
};

const page = document.body.dataset.page;
const app = document.getElementById("app");

if (!page || !app) {
  const yearNode = document.getElementById("year");
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());
} else {
  init().catch(() => {
    app.innerHTML = '<main class="container"><section class="section"><p>Unable to load content.</p></section></main>';
  });
}

async function init() {
  const response = await fetch(CONTENT_URL, { cache: "no-store" });
  const m = await response.json();

  document.title = pageTitle(page, m);
  setDescription(m.seo.description);

  app.innerHTML = `
    ${renderShellStart(m)}
    ${renderPage(page, m)}
    ${renderShellEnd(m)}
  `;

  const yearNode = document.getElementById("year");
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());
  setupAnimations();
  setActiveNav();
}

function pageTitle(currentPage, m) {
  if (currentPage === "home") return m.seo.title;
  if (currentPage === "faq" && m.faqHeader?.seoTitle) return m.faqHeader.seoTitle;
  const map = {
    features: m.ui.nav.features,
    pricing: m.ui.nav.pricing,
    start: m.ui.nav.gettingStarted,
    faq: m.ui.nav.faq,
    terms: footerLabel(m, "terms") || "Terms",
    privacy: footerLabel(m, "privacy") || "Privacy"
  };
  return `${m.ui.brand} | ${map[currentPage] || m.seo.title}`;
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
  const termsText = footerLabel(m, "terms");
  const privacyText = footerLabel(m, "privacy");
  return `
    <div class="bg-orb bg-orb-a" aria-hidden="true"></div>
    <div class="bg-orb bg-orb-b" aria-hidden="true"></div>
    <header class="site-header">
      <div class="container nav-wrap">
        <a class="brand" href="${PATHS.home}">
          <img src="/assets/drivest-wordmark.png" alt="${escapeHtml(m.ui.brand)}" />
        </a>
        <nav class="nav-links">
          <a data-nav="features" href="${PATHS.features}">${escapeHtml(m.ui.nav.features)}</a>
          <a data-nav="pricing" href="${PATHS.pricing}">${escapeHtml(m.ui.nav.pricing)}</a>
          <a data-nav="start" href="${PATHS.start}">${escapeHtml(m.ui.nav.gettingStarted)}</a>
          <a data-nav="faq" href="${PATHS.faq}">${escapeHtml(m.ui.nav.faq)}</a>
          ${termsText ? `<a data-nav="terms" href="${PATHS.terms}">${escapeHtml(termsText)}</a>` : ""}
          ${privacyText ? `<a data-nav="privacy" href="${PATHS.privacy}">${escapeHtml(privacyText)}</a>` : ""}
        </nav>
      </div>
    </header>
    <main class="container main-content">
  `;
}

function renderShellEnd(m) {
  const supportEmail = String(m.footer.contact || "").replace(/^Contact:\s*/i, "");
  return `
    </main>
    <footer class="site-footer">
      <div class="container footer-wrap">
        <div class="footer-brand-col">
          <img class="footer-logo" src="/assets/drivest-wordmark.png" alt="${escapeHtml(m.ui.brand)}" />
          <p class="footer-summary">${escapeHtml(m.hero.coverageLine || m.hero.subhead)}</p>
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
            ${m.footer.links
              .map((l) => {
                const href = resolveFooterHref(l);
                const external = href.startsWith("http") || href.startsWith("mailto:");
                const attrs = external ? ' target="_blank" rel="noreferrer"' : "";
                return `<a href="${escapeAttr(href)}"${attrs}>${escapeHtml(l.label)}</a>`;
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
          <h1>${escapeHtml(m.hero.headline)}</h1>
          <p>${escapeHtml(m.hero.subhead)}</p>
          <div class="btn-row">
            ${button(m.hero.primaryCtas[0], startHref("learner"), "primary")}
            ${button(m.hero.primaryCtas[1], startHref("instructor"), "secondary")}
          </div>
          <div class="btn-row">
            ${button(m.hero.secondaryCtas[0], PATHS.pricing, "secondary")}
            ${button(m.hero.secondaryCtas[1], "#how-it-works", "secondary")}
          </div>
          <p class="trust">${escapeHtml(m.hero.trustLine)}</p>
          ${m.hero.coverageLine ? `<p class="trust">${escapeHtml(m.hero.coverageLine)}</p>` : ""}
          <div class="pill-row">${renderPills(m.press.usp)}</div>
        </div>
        <div class="hero-visual reveal-item">
          <div class="hero-visual-photo">
            <img src="${PHOTO_URLS.hero}" alt="Driving route view" loading="lazy" />
          </div>
        </div>
      </div>
      <div class="panel reveal-item">
        <p class="panel-title">${escapeHtml(m.press.oneLiner)}</p>
        ${bulletList(m.press.usp)}
      </div>
    </section>

    <section class="section reveal">
      <h2>${escapeHtml(m.threeTabs.title)}</h2>
      <div class="grid three-up">
        ${m.threeTabs.tabs
          .map(
            (t) => `
          <article class="card reveal-item">
            <div class="card-photo">
              <img src="${tabPhotoByTitle(t.title)}" alt="${escapeAttr(t.title)} photo" loading="lazy" />
            </div>
            <h3 class="tab-title">${renderTabIcon(t.title)}${escapeHtml(t.title)}</h3>
            <p>${escapeHtml(t.line1)}</p>
            <p>${escapeHtml(t.line2)}</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>

    <section class="section reveal">
      <h2>Built for real journeys</h2>
      <div class="photo-band">
        <article class="photo-card reveal-item">
          <img src="${PHOTO_URLS.learn}" alt="Learner driver on road" loading="lazy" />
          <div class="photo-label">Learn with structure</div>
        </article>
        <article class="photo-card reveal-item">
          <img src="${PHOTO_URLS.route}" alt="Road route and navigation" loading="lazy" />
          <div class="photo-label">Practice with reconstructed routes</div>
        </article>
        <article class="photo-card reveal-item">
          <img src="${PHOTO_URLS.confidence}" alt="Confident new driver" loading="lazy" />
          <div class="photo-label">Drive with calmer guidance</div>
        </article>
      </div>
    </section>

    ${renderHomeModulesSection(m.homeModules)}

    ${renderAudienceSection(m.audienceTracks)}

    <section class="section reveal">
      <h2>${escapeHtml(m.why.title)}</h2>
      ${bulletList(m.why.bullets)}
    </section>

    <section class="section reveal">
      <h2>${escapeHtml(m.ui.sections.coreFeatures)}</h2>
      ${renderFeatureCards(m.coreUsps)}
    </section>

    ${renderInfoSection(m.languageSupport)}

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

    <section class="section reveal">
      <h2>${escapeHtml(m.safety.title)}</h2>
      <div class="mini-photo-row">
        <div class="mini-photo"><img src="${PHOTO_URLS.roadsigns}" alt="Road signs" loading="lazy" /></div>
        <div class="mini-photo"><img src="${PHOTO_URLS.school}" alt="School zone awareness" loading="lazy" /></div>
      </div>
      ${bulletList(m.safety.bullets)}
      <div class="panel reveal-item">
        <p class="panel-title">${escapeHtml(m.ui.sections.onArrival)}</p>
        <p>${escapeHtml(m.safety.arrivalAdvisory[0])}</p>
        <p>${escapeHtml(m.safety.arrivalAdvisory[1])}</p>
      </div>
    </section>
  `;
}

function renderFeatures(m) {
  return `
    <section class="section reveal feature-hero">
      <div class="feature-hero-grid">
        <div>
          <h1>${escapeHtml(m.ui.nav.features)}</h1>
          <p>${escapeHtml(m.hero.subhead)}</p>
        </div>
        <div class="feature-photo">
          <img src="${PHOTO_URLS.route}" alt="Navigation route experience" loading="lazy" />
        </div>
      </div>
    </section>

    <section class="section reveal">
      ${renderFeatureCards(m.coreUsps)}
    </section>

    ${renderHomeModulesSection(m.homeModules)}

    ${renderAudienceSection(m.audienceTracks)}

    ${renderFeatureGroups(m.featureGroups)}

    ${renderInfoSection(m.languageSupport)}

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
          <img src="${PHOTO_URLS.learn}" alt="Learner and instructor onboarding" loading="lazy" />
        </div>
      </div>
    </section>

    ${renderStartPathsSection(m.startPaths)}

    ${renderInfoSection(m.languageSupport)}

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
  return `
    <section class="section reveal feature-hero">
      <div class="feature-hero-grid">
        <div>
          <h1>${escapeHtml(m.pricing.title)}</h1>
          <p>${escapeHtml(m.pricing.disclaimer)}</p>
        </div>
        <div class="feature-photo">
          <img src="${PHOTO_URLS.learn}" alt="Driver training and pricing" loading="lazy" />
        </div>
      </div>
    </section>

    <section class="section reveal">
      <div class="grid three-up">
        ${m.pricing.plans
          .map(
            (p) => `
          <article class="card reveal-item">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="price">${escapeHtml(p.price)}</p>
            ${p.subLine ? `<p>${escapeHtml(p.subLine)}</p>` : ""}
            ${bulletList(p.bullets)}
            <div class="btn-row">
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
  const faqTitle = m.faqHeader?.title || m.ui.nav.faq;
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
            <h3>${escapeHtml(it.q)}</h3>
            <p>${escapeHtml(it.a)}</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
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
            <div class="app-module-media">
              <img src="${pricingModulePhotoByTitle(item.title)}" alt="${escapeAttr(item.title)}" loading="lazy" />
            </div>
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

function tabPhotoByTitle(title) {
  const t = String(title).toLowerCase();
  if (t.includes("theory")) return PHOTO_URLS.theory;
  if (t.includes("practice")) return PHOTO_URLS.practice;
  return PHOTO_URLS.navigation;
}

function stepPhotoByTitle(title) {
  const t = String(title).toLowerCase();
  if (t.includes("learner") || t.includes("instructor")) return PHOTO_URLS.learn;
  if (t.includes("language") || t.includes("stage")) return PHOTO_URLS.theory;
  if (t.includes("book")) return PHOTO_URLS.practice;
  if (t.includes("progress") || t.includes("review")) return PHOTO_URLS.confidence;
  if (t.includes("mode")) return PHOTO_URLS.confidence;
  if (t.includes("centre") || t.includes("destination")) return PHOTO_URLS.map;
  if (t.includes("prompt")) return PHOTO_URLS.navigation;
  return PHOTO_URLS.route;
}

function pricingModulePhotoByTitle(title) {
  const t = String(title).toLowerCase();
  if (t.includes("theory")) return PHOTO_URLS.theory;
  if (t.includes("practice")) return PHOTO_URLS.route;
  if (t.includes("navigation")) return PHOTO_URLS.navigation;
  if (t.includes("parking")) return PHOTO_URLS.roadsigns;
  if (t.includes("instructor")) return PHOTO_URLS.learn;
  if (t.includes("book")) return PHOTO_URLS.confidence;
  return PHOTO_URLS.hero;
}

function renderPills(items) {
  return (items || []).map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("");
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
  if (t.includes("instructor") || t.includes("marketplace") || t.includes("learner")) return iconBadge("people");
  if (t.includes("analytics") || t.includes("progress")) return iconBadge("chart");
  if (t.includes("payment") || t.includes("booking") || t.includes("subscription")) return iconBadge("card");
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
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  nodes.forEach((node) => observer.observe(node));
}

function setActiveNav() {
  const current = page;
  if (!current || current === "home") return;
  const link = document.querySelector(`.nav-links a[data-nav="${current}"]`);
  if (link) link.classList.add("active");
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
  if (url.includes("drivest.uk/terms")) return PATHS.terms;
  if (url.includes("drivest.uk/privacy")) return PATHS.privacy;
  if (url.includes("drivest.uk/faq")) return PATHS.faq;
  return raw;
}

function footerLink(m, key) {
  const links = m.footer.links || [];
  return links.find((l) => String(l.url || "").toLowerCase().includes(`drivest.uk/${key}`)) || null;
}

function button(label, href, variant) {
  if (!label || !href) return "";
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const attrs = external ? ' target="_blank" rel="noreferrer"' : "";
  return `<a class="btn btn-${variant}" href="${escapeAttr(href)}"${attrs}>${escapeHtml(label)}</a>`;
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
