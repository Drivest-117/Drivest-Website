const page = document.body.dataset.page || "";

finalizePageChrome();

function finalizePageChrome() {
  const yearNode = document.getElementById("year");
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());
  setupAnimations();
  setupFeatureShowcases();
  setupProofCarousels();
  setActiveNav();
  setupBackNav();
  setupMobileNav();
  setupCoverageDirectory();
  setupAccessRequestForm();
  setupInstructorApplyForm();
}

function activeNavKey(currentPage = page) {
  if (currentPage === "centre-detail") return "";
  return currentPage;
}

function setActiveNav() {
  const links = document.querySelectorAll(".site-nav a[data-nav]");
  if (!links.length) return;

  links.forEach((link) => {
    link.classList.remove("active");
    link.removeAttribute("aria-current");
  });

  const current = activeNavKey();
  if (!current) return;

  document.querySelectorAll(`.site-nav a[data-nav="${current}"]`).forEach((link) => {
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
  });
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

  // Keep the first viewport crisp on load instead of fading the hero in late.
  nodes.forEach((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      node.classList.add("is-visible");
      return;
    }
    observer.observe(node);
  });
}

function setupFeatureShowcases() {
  const scenes = Array.from(document.querySelectorAll("[data-feature-scene]"));
  if (!scenes.length) return;

  const desktopMedia = window.matchMedia("(min-width: 981px)");
  const reduceMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  let ticking = false;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const resetScene = (scene) => {
    scene.style.removeProperty("--scene-progress");
    scene.querySelectorAll("[data-scene-point]").forEach((point) => {
      point.style.removeProperty("--point-progress");
      point.classList.remove("is-active", "is-past");
    });
    scene.querySelectorAll("[data-scene-tag]").forEach((tag) => {
      tag.classList.remove("is-active", "is-past");
    });
  };

  const applySceneState = (scene, progress) => {
    const points = Array.from(scene.querySelectorAll("[data-scene-point]"));
    const tags = Array.from(scene.querySelectorAll("[data-scene-tag]"));
    const pointCount = points.length;
    if (!pointCount) return;

    const activeIndex = clamp(Math.floor(progress * pointCount), 0, pointCount - 1);
    scene.style.setProperty("--scene-progress", progress.toFixed(4));

    points.forEach((point, index) => {
      const segment = 1 / pointCount;
      const start = index * segment;
      const end = Math.min(1, start + segment * 0.92);
      const local = clamp((progress - start) / Math.max(0.0001, end - start), 0, 1);
      point.style.setProperty("--point-progress", local.toFixed(4));
      point.classList.toggle("is-active", index === activeIndex);
      point.classList.toggle("is-past", index < activeIndex);
    });

    tags.forEach((tag, index) => {
      tag.classList.toggle("is-active", index === activeIndex);
      tag.classList.toggle("is-past", index < activeIndex);
    });
  };

  const updateScenes = () => {
    ticking = false;
    const interactive = desktopMedia.matches && !reduceMotionMedia.matches;
    document.body.classList.toggle("feature-scenes-ready", interactive);

    if (!interactive) {
      scenes.forEach(resetScene);
      return;
    }

    const viewportHeight = Math.max(window.innerHeight, 1);
    const startOffset = 148;
    const endOffset = Math.min(viewportHeight * 0.42, 360);
    scenes.forEach((scene) => {
      const rect = scene.getBoundingClientRect();
      const distance = Math.max(rect.height - startOffset - endOffset, viewportHeight * 0.45);
      const travelled = startOffset - rect.top;
      const progress = clamp(travelled / distance, 0, 1);
      applySceneState(scene, progress);
    });
  };

  const queueUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScenes);
  };

  const handleMediaChange = () => queueUpdate();

  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);

  if (typeof desktopMedia.addEventListener === "function") {
    desktopMedia.addEventListener("change", handleMediaChange);
    reduceMotionMedia.addEventListener("change", handleMediaChange);
  } else {
    desktopMedia.addListener(handleMediaChange);
    reduceMotionMedia.addListener(handleMediaChange);
  }

  updateScenes();
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

function setupMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("mobile-menu");
  if (!toggle || !menu) return;

  const label = toggle.querySelector(".nav-toggle-label");
  const openLabel = toggle.dataset.openLabel || "Menu";
  const closeLabel = toggle.dataset.closeLabel || "Close menu";
  const mainContent = document.querySelector(".main-content");
  const mobileCtaBar = document.querySelector(".mobile-cta-bar");
  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const setBackgroundInteractivity = (isDisabled) => {
    [mainContent, mobileCtaBar].forEach((node) => {
      if (!node || !("inert" in node)) return;
      node.inert = isDisabled;
    });
  };

  const getFocusableNodes = () =>
    [toggle, ...Array.from(menu.querySelectorAll(focusableSelector)).filter((node) => !node.hasAttribute("disabled"))];

  const setOpen = (isOpen) => {
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? closeLabel : openLabel);
    if (label) label.textContent = isOpen ? closeLabel : openLabel;
    menu.hidden = !isOpen;
    document.body.classList.toggle("nav-open", isOpen);
    setBackgroundInteractivity(isOpen);

    if (isOpen) {
      const [, firstMenuNode] = getFocusableNodes();
      if (firstMenuNode) requestAnimationFrame(() => firstMenuNode.focus());
    } else if (menu.contains(document.activeElement)) {
      toggle.focus();
    }
  };

  setOpen(false);

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("click", (event) => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (!isOpen) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (toggle.contains(target) || menu.contains(target)) return;
    setOpen(false);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
    if (event.key !== "Tab" || toggle.getAttribute("aria-expanded") !== "true") return;

    const nodes = getFocusableNodes();
    if (!nodes.length) return;

    const firstNode = nodes[0];
    const lastNode = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === firstNode) {
      event.preventDefault();
      lastNode.focus();
    } else if (!event.shiftKey && document.activeElement === lastNode) {
      event.preventDefault();
      firstNode.focus();
    }
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

function setupBackNav() {
  const links = document.querySelectorAll("[data-nav-back]");
  if (!links.length) return;

  let canUseHistory = false;
  try {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    const sameOrigin = referrer && referrer.origin === window.location.origin;
    const differentPage =
      sameOrigin &&
      (referrer.pathname !== window.location.pathname ||
        referrer.search !== window.location.search ||
        referrer.hash !== window.location.hash);
    canUseHistory = Boolean(differentPage && window.history.length > 1);
  } catch {
    canUseHistory = false;
  }

  links.forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    link.dataset.historyBack = canUseHistory ? "true" : "false";
    if (canUseHistory) {
      link.classList.remove("is-disabled");
      link.removeAttribute("aria-disabled");
      link.removeAttribute("tabindex");
    } else {
      link.classList.add("is-disabled");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
    }

    if (!canUseHistory || link.dataset.backNavBound === "true") return;
    link.dataset.backNavBound = "true";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.history.back();
    });
  });
}

function setupCoverageDirectory() {
  const root = document.querySelector("[data-coverage-directory]");
  if (!root) return;

  const search = root.querySelector("[data-coverage-search]");
  const minRoutes = root.querySelector("[data-coverage-min-routes]");
  const reset = root.querySelector("[data-coverage-reset]");
  const status = root.querySelector("[data-coverage-status]");
  const directoryGrid = document.querySelector(".coverage-letter-grid");
  const formatter = new Intl.NumberFormat("en-GB");
  const groups = Array.from(document.querySelectorAll("[data-coverage-group]")).map((group) => ({
    node: group,
    countNode: group.querySelector("[data-coverage-group-count]"),
    items: Array.from(group.querySelectorAll("[data-coverage-item]"))
  }));

  if (!groups.length || !directoryGrid) return;

  const totalCentres = groups.reduce((sum, group) => sum + group.items.length, 0);
  const totalGroups = groups.length;
  const defaultMin = minRoutes?.options?.[0]?.value || "0";
  let activeLetter = String(groups[0]?.node.dataset.coverageLetter || "");

  let browser = directoryGrid.previousElementSibling;
  if (!browser || !browser.matches("[data-coverage-browser]")) {
    browser = document.createElement("div");
    browser.className = "coverage-directory-browser reveal-item";
    browser.setAttribute("data-coverage-browser", "");
    browser.innerHTML = `
      <div class="coverage-directory-browser-head">
        <p class="panel-title">Browse by letter</p>
        <p class="coverage-directory-browser-copy">Choose a letter to keep results compact. When filters are active, only matching letters stay in the rail.</p>
      </div>
      <div class="coverage-letter-pills" data-coverage-pills></div>
    `;
    directoryGrid.before(browser);
  }

  const pillRail = browser.querySelector("[data-coverage-pills]");
  if (pillRail && !pillRail.children.length) {
    groups.forEach((group) => {
      const letter = String(group.node.dataset.coverageLetter || "").trim();
      if (!letter) return;
      group.letter = letter;
      group.node.id = group.node.id || `coverage-group-${letter.toLowerCase()}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "coverage-letter-pill";
      button.setAttribute("data-coverage-letter-pill", letter);
      button.innerHTML = `
        <span>${letter}</span>
        <strong>${formatter.format(group.items.length)}</strong>
      `;
      group.pill = button;
      group.pillCount = button.querySelector("strong");
      button.addEventListener("click", () => {
        activeLetter = letter;
        applyFilters();
        requestAnimationFrame(() => {
          group.node.scrollIntoView({ block: "start", behavior: "smooth" });
        });
      });
      pillRail.appendChild(button);
    });
  } else {
    groups.forEach((group) => {
      group.letter = String(group.node.dataset.coverageLetter || "").trim();
      group.pill = pillRail?.querySelector(`[data-coverage-letter-pill="${group.letter}"]`) || null;
      group.pillCount = group.pill?.querySelector("strong") || null;
      group.node.id = group.node.id || `coverage-group-${group.letter.toLowerCase()}`;
    });
  }

  const pluralize = (value, single, plural) => (value === 1 ? single : plural);
  const currentMin = () => Number(minRoutes?.value || defaultMin || 0);
  const isFiltered = () => Boolean(String(search?.value || "").trim()) || currentMin() > Number(defaultMin || 0);

  const updateStatus = (visibleCentres, visibleGroups) => {
    if (!status) return;

    const rawTerm = String(search?.value || "").trim();
    const min = currentMin();
    const atDefault = !rawTerm && min === Number(defaultMin || 0);

    if (reset) reset.disabled = atDefault;

    if (atDefault) {
      status.textContent = `Showing all ${formatter.format(totalCentres)} covered centres across ${formatter.format(totalGroups)} letter groups.`;
      return;
    }

    if (visibleCentres === 0) {
      status.textContent = "No covered centres match the current search and route filter.";
      return;
    }

    const details = [
      `Showing ${formatter.format(visibleCentres)} ${pluralize(visibleCentres, "covered centre", "covered centres")}`,
      `across ${formatter.format(visibleGroups)} ${pluralize(visibleGroups, "letter group", "letter groups")}`
    ];

    if (rawTerm) details.push(`matching "${rawTerm}"`);
    if (min > 0) details.push(`with ${formatter.format(min)} or more routes`);

    status.textContent = `${details.join(" ")}.`;
  };

  const applyFilters = () => {
    const term = String(search?.value || "").trim().toLowerCase();
    const min = currentMin();
    const filteredMode = isFiltered();
    let visibleCentres = 0;
    let visibleGroups = 0;
    let firstVisibleLetter = "";

    groups.forEach((group) => {
      let visibleInGroup = 0;

      group.items.forEach((item) => {
        const name = String(item.dataset.centreName || "");
        const routes = Number(item.dataset.centreRoutes || 0);
        const matches = (!term || name.includes(term)) && routes >= min;
        item.hidden = !matches;
        if (matches) visibleInGroup += 1;
      });

      if (!firstVisibleLetter && visibleInGroup > 0) {
        firstVisibleLetter = group.letter;
      }

      if (group.countNode) group.countNode.textContent = formatter.format(visibleInGroup);
      if (group.pillCount) group.pillCount.textContent = formatter.format(visibleInGroup);
      if (group.pill) {
        group.pill.hidden = filteredMode ? visibleInGroup === 0 : false;
      }

      group.node.hidden = visibleInGroup === 0;
      if (visibleInGroup > 0) visibleGroups += 1;
      visibleCentres += visibleInGroup;
    });

    if (firstVisibleLetter && !groups.some((group) => group.letter === activeLetter && !group.node.hidden)) {
      activeLetter = firstVisibleLetter;
    }

    groups.forEach((group) => {
      const visible = !group.node.hidden;
      const focusedMatch = group.letter === activeLetter;
      group.node.hidden = !visible || !focusedMatch;
      group.node.classList.toggle("is-focused", visible && focusedMatch);
      if (group.pill) {
        group.pill.classList.toggle("is-active", visible && focusedMatch);
        group.pill.disabled = !visible;
      }
    });

    updateStatus(visibleCentres, visibleGroups);
  };

  if (search) search.addEventListener("input", applyFilters);
  if (minRoutes) minRoutes.addEventListener("change", applyFilters);
  if (reset) {
    reset.addEventListener("click", () => {
      if (search) search.value = "";
      if (minRoutes) minRoutes.value = defaultMin;
      applyFilters();
      if (search) search.focus();
    });
  }

  applyFilters();
  root.setAttribute("data-coverage-ready", "");
}

function setupAccessRequestForm() {
  const form = document.querySelector("[data-access-request-form]");
  if (!form) return;

  const planSelect = form.querySelector("[data-access-request-plan]");
  const centreInput = form.querySelector("[data-access-request-centre]");
  const centreNote = form.querySelector("[data-access-request-centre-note]");
  const status = form.querySelector("[data-access-request-status]");
  const preview = form.querySelector("[data-access-request-preview]");
  const subjectNode = form.querySelector("[data-access-request-subject]");
  const bodyNode = form.querySelector("[data-access-request-body]");
  const mailtoLink = form.querySelector("[data-access-request-mailto]");
  const copyButton = form.querySelector("[data-access-request-copy]");
  const copyStatus = form.querySelector("[data-access-request-copy-status]");
  const supportEmail = String(form.dataset.supportEmail || "admin@drivest.uk").trim();
  if (!planSelect || !centreInput) return;

  const planOptions = Array.from(planSelect.options).filter((option) => option.value);

  const findPlanOption = (value) => planOptions.find((option) => option.value === value) || null;

  const selectedPlan = () => findPlanOption(planSelect.value);

  const updateCentreRequirement = () => {
    const plan = selectedPlan();
    if (!plan) {
      centreInput.required = false;
      if (centreNote) {
        centreNote.textContent = "Choose an access option to see whether an exact centre or nearby area should be included.";
      }
      return;
    }

    const planName = plan.dataset.planName || plan.textContent.trim();
    const requiresCentre = plan.dataset.planRequiresCentre === "true";
    centreInput.required = requiresCentre;
    if (centreNote) {
      centreNote.textContent = requiresCentre
        ? `${planName} works better when the exact centre or nearby area is included here.`
        : `${planName} does not require a centre, but you can still include one if location matters to the request.`;
    }
  };

  const prepareRequest = () => {
    const plan = selectedPlan();
    if (!plan) return null;

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const stage = String(formData.get("stage") || "").trim();
    const centre = String(formData.get("centre") || "").trim();
    const timing = String(formData.get("timing") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const planName = plan.dataset.planName || plan.textContent.trim();
    const planPrice = plan.dataset.planPrice || "";
    const subjectBase = plan.dataset.planSubject || "Drivest access request";
    const requiresCentre = plan.dataset.planRequiresCentre === "true";
    const subject = requiresCentre && centre ? `${subjectBase} - ${centre}` : subjectBase;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Plan: ${planName}`,
      `Price shown on site: ${planPrice || "Not listed"}`,
      `Driving stage: ${stage}`,
      `Preferred start timing: ${timing}`,
      `Selected centre or area: ${centre || "Not specified"}`,
      "",
      "Extra context:",
      message || "None provided"
    ].join("\n");

    return {
      centre,
      requiresCentre,
      subject,
      body
    };
  };

  const query = new URLSearchParams(window.location.search);
  const planFromQuery = String(query.get("plan") || "").trim();
  const centreFromQuery = String(query.get("centre") || "").trim();
  if (planFromQuery && findPlanOption(planFromQuery)) planSelect.value = planFromQuery;
  if (centreFromQuery) centreInput.value = centreFromQuery;
  updateCentreRequirement();

  const invalidatePreview = () => {
    if (preview && !preview.hidden) preview.hidden = true;
    if (copyStatus) copyStatus.textContent = "";
    if (status) status.textContent = "Request details changed. Create the request again to refresh the draft.";
  };

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    const eventName = field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventName, invalidatePreview);
  });

  planSelect.addEventListener("change", () => {
    updateCentreRequirement();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateCentreRequirement();
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;

    const plan = selectedPlan();
    if (!plan) {
      if (status) status.textContent = "Choose an access option before creating the request.";
      planSelect.focus();
      return;
    }

    const request = prepareRequest();
    if (!request) return;
    if (request.requiresCentre && !request.centre) {
      if (status) status.textContent = "Add the exact centre or nearby area for this paid plan.";
      centreInput.focus();
      return;
    }

    if (subjectNode) subjectNode.textContent = request.subject;
    if (bodyNode) bodyNode.textContent = request.body;
    if (mailtoLink) {
      mailtoLink.href = `mailto:${supportEmail}?subject=${encodeURIComponent(request.subject)}&body=${encodeURIComponent(request.body)}`;
    }
    if (preview) preview.hidden = false;
    if (status) status.textContent = "Your request is ready. Continue in email or copy the details below.";
    if (copyStatus) copyStatus.textContent = "";
  });

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const request = prepareRequest();
      if (!request) {
        if (copyStatus) copyStatus.textContent = "Create the request first so there is text to copy.";
        return;
      }
      if (!navigator.clipboard?.writeText) {
        if (copyStatus) copyStatus.textContent = "Clipboard copy is not available in this browser. Use the prepared text below.";
        return;
      }

      try {
        await navigator.clipboard.writeText(`Subject: ${request.subject}\n\n${request.body}`);
        if (copyStatus) copyStatus.textContent = "Request details copied. You can paste them into any email app.";
      } catch (error) {
        if (copyStatus) copyStatus.textContent = "Clipboard copy failed. Use the prepared text below instead.";
      }
    });
  }
}

function setupInstructorApplyForm() {
  const form = document.querySelector("[data-instructor-apply-form]");
  if (!form) return;

  const status = form.querySelector("[data-instructor-apply-status]");
  const preview = form.querySelector("[data-instructor-apply-preview]");
  const subjectNode = form.querySelector("[data-instructor-apply-subject]");
  const bodyNode = form.querySelector("[data-instructor-apply-body]");
  const mailtoLink = form.querySelector("[data-instructor-apply-mailto]");
  const copyButton = form.querySelector("[data-instructor-apply-copy]");
  const copyStatus = form.querySelector("[data-instructor-apply-copy-status]");
  const supportEmail = String(form.dataset.supportEmail || "admin@drivest.uk").trim();

  const prepareApplication = () => {
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const stage = String(formData.get("stage") || "").trim();
    const area = String(formData.get("area") || "").trim();
    const transmission = String(formData.get("transmission") || "").trim();
    const timing = String(formData.get("timing") || "").trim();
    const readiness = String(formData.get("readiness") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const subject = area ? `Drivest instructor application - ${area}` : "Drivest instructor application";
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Instructor stage: ${stage}`,
      `Teaching area: ${area}`,
      `Lesson type: ${transmission}`,
      `Preferred onboarding timing: ${timing}`,
      `Readiness: ${readiness}`,
      "",
      "Extra context:",
      message || "None provided"
    ].join("\n");

    return { subject, body };
  };

  const invalidatePreview = () => {
    if (preview && !preview.hidden) preview.hidden = true;
    if (copyStatus) copyStatus.textContent = "";
    if (status) status.textContent = "Application details changed. Create the application again to refresh the draft.";
  };

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    const eventName = field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventName, invalidatePreview);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;

    const application = prepareApplication();
    if (subjectNode) subjectNode.textContent = application.subject;
    if (bodyNode) bodyNode.textContent = application.body;
    if (mailtoLink) {
      mailtoLink.href = `mailto:${supportEmail}?subject=${encodeURIComponent(application.subject)}&body=${encodeURIComponent(application.body)}`;
    }
    if (preview) preview.hidden = false;
    if (status) status.textContent = "Your instructor application is ready. Continue in email or copy the details below.";
    if (copyStatus) copyStatus.textContent = "";
  });

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const application = prepareApplication();
      if (!navigator.clipboard?.writeText) {
        if (copyStatus) copyStatus.textContent = "Clipboard copy is not available in this browser. Use the prepared text below.";
        return;
      }

      try {
        await navigator.clipboard.writeText(`Subject: ${application.subject}\n\n${application.body}`);
        if (copyStatus) copyStatus.textContent = "Application details copied. You can paste them into any email app.";
      } catch (error) {
        if (copyStatus) copyStatus.textContent = "Clipboard copy failed. Use the prepared text below instead.";
      }
    });
  }
}
