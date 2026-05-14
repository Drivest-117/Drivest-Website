# DrivestWeb Master

Last updated: 12 May 2026

## Purpose

This file is the internal website-specific master document for the `DrivestWeb` repository.

It is intentionally separate from external handoff files such as:

- `c:\Users\ferro\Downloads\master.md`
- `c:\Users\ferro\Downloads\drivest_website_gap_analysis_2026-05-09.md`
- `c:\Users\ferro\Downloads\translation_handoff_2026-04-25_modernized_20260506.zip`

Those external source files may keep changing over time. This file records what the website currently contains and how it is structured.

## Scope

This document covers:

- the current website pages and routes
- the shared rendering architecture
- the website content model
- the legal and FAQ state exposed on the website
- the major changes already implemented in this repo

This document does not replace the product-wide app master file. It only describes the website layer.

## Current Repo Status

As of 12 May 2026, this repository contains website updates that include:

- expanded marketing copy aligned to the current app
- updated Terms, Privacy, and FAQ website content
- a new `Getting Started` website flow for learners and instructors
- removal of the homepage `Join the waitlist` CTA
- mobile navigation and a persistent website preparation CTA
- future learner driver positioning across homepage, start flow, pricing, and FAQ
- stronger static metadata for marketing page titles, descriptions, and sharing
- screenshot-backed product proof pulled from the live app UI
- a mobile proof carousel path for feature screenshots and tighter proof copy hierarchy
- stronger homepage hero and pricing hierarchy for product and plan comparison sections
- a lighter `site-runtime.js` client bundle for pre-rendered pages
- searchable and filterable live driving-test-centre directory controls
- intrinsic image dimensions and higher-priority hero image loading across generated pages
- a structured `/access-request` paid-plan request flow instead of raw pricing-page mailto CTAs
- generator-owned legacy centre redirects for underscore and hyphen alias paths
- a refreshed browser icon set for tabs, bookmarks, manifest installs, and touch icons
- a new `Contact, trust, and coverage methodology` page
- theory-intent landing pages and regional driving-test-centre hub pages
- AI crawl discovery files including `robots.txt`, `llm.txt`, `llms.txt`, and `llms-full.txt`
- a branded `404.html`, generated `manifest.webmanifest`, and refreshed `sitemap.xml`

Important status note:

- the `Getting Started` page and new CTA routing are currently present in the local repo state
- they should be deployed after review if they are intended to go live

## Website Architecture

The website is a mostly static marketing site with shared rendering logic.

### Core files

- `script.js`
  - shared renderer for the dynamic marketing pages
  - reads structured content from JSON
  - renders `home`, `features`, `pricing`, `faq`, and `start`
- `styles.css`
  - shared global styling for the marketing pages
- `site-runtime.js`
  - lightweight client bundle for nav, reveal animations, carousel behaviour, and centre-directory filtering on generated pages
- `site/content/marketing.en-GB.json`
  - main website content source for marketing copy, pricing, FAQ, and footer labels
- `site/data/test-centre-coverage.en-GB.json`
  - generated coverage dataset used for public driving-test-centre pages
- `tools/generate-seo-pages.mjs`
  - static generator for page shells, centre pages, redirects, crawl files, sitemap, and manifest
- `tools/build_browser_icons.py`
  - deterministic browser-icon builder that crops the standalone brand mark from the wordmark source, exports size-specific transparent favicons for tabs with a stronger 16px render, and exports white-tile app icons for touch/PWA contexts
- `tools/verify-generated-site.mjs`
  - executable verification for generated runtime references, paid-plan request flow, and legacy centre redirects
- `tools/extract_route_corpus_coverage.py`
  - route-corpus coverage extractor for the public centre dataset
- `tests/test_extract_route_corpus_coverage.py`
  - regression coverage for route-corpus aliasing, filtering, validation shaping, and summary metrics

### Rendering model

The marketing pages are generated statically from the shared renderer and content model.

`script.js` remains the source renderer used by the generator.
`site-runtime.js` is the lighter browser bundle loaded by generated pages for interactive behaviour only.

Examples:

- `index.html` -> `data-page="home"`
- `features.html` -> `data-page="features"`
- `pricing.html` -> `data-page="pricing"`
- `faq.html` and `faq/index.html` -> `data-page="faq"`
- `start/index.html` -> `data-page="start"`

### Legal page model

Legal pages are not rendered from the JSON model. They are standalone HTML documents:

- `terms/index.html`
- `privacy/index.html`

Legacy mirrored paths also exist:

- `terms.html`
- `privacypolicy.html`

These should be kept aligned with the directory-based legal routes.

### Other page

- `coming-soon.html`
  - simple redirect back to `/index.html`

## Current Public Routes In This Repo

### Marketing pages

- `/index.html`
- `/features.html`
- `/pricing.html`
- `/access-request`
- `/faq`
- `/start`
- `/contact`
- `/theory-test-preparation`
- `/driving-test-centres`
- `/driving-instructors`

### SEO landing pages

- `/mock-theory-test`
- `/hazard-perception-test`
- `/road-signs-test`
- `/highway-code-test`
- `/driving-theory-test-in-urdu`
- `/driving-theory-test-in-arabic`
- `/driving-theory-test-in-welsh`
- `/driving-test-centres/london`
- `/driving-test-centres/manchester`
- `/driving-test-centres/birmingham`

### Legal pages

- `/terms`
- `/privacy`

### Legacy mirror pages

- `/faq.html`
- `/terms.html`
- `/privacypolicy.html`

## Navigation Structure

Current main website navigation is designed around:

- Features
- Pricing
- Getting Started
- FAQ
- Terms and Conditions
- Privacy Policy

Footer navigation also links to the core marketing and legal routes.

Marketing pages now also expose:

- a mobile menu for smaller screens
- a persistent `Start preparing` CTA for learner and future learner driver preparation

## Current Website Positioning

The website currently positions Drivest as a broader future-learner-to-new-driver and instructor-support platform, not only a route-practice app.

Current platform story on the website includes:

- future learner driver preparation before practical lessons begin
- theory learning support
- practical route preparation
- calmer new-driver navigation
- instructor discovery and marketplace flows
- bookings and secure lesson payments
- analytics and progress tracking
- parking support
- role-based onboarding

## Pitch Deck Signals Captured

The investor deck at `c:\Users\ferro\Downloads\Drivest_Pitch_Deck.pdf` adds a few strong public-positioning signals worth reusing on the website:

- integrated platform for learner drivers to practise, navigate, and build confidence
- one platform from first lesson to independent driving
- learner-first navigation aimed at cognitive ease rather than fastest-route bias
- 3,000+ practice routes already generated across UK-wide test-centre coverage

Some deck material should stay out of public website copy unless explicitly needed:

- fundraising targets
- internal AI operations/process slides
- speculative multi-country rollout sequencing

For public pages, keep the website's stronger legal and advisory wording even when the deck uses shorter investor shorthand.

## Key Website Messaging Now Reflected

### 1. Theory in 32 languages

The website now explicitly states that users can study theory content in 32 languages and peek into English to cross-check the same question.

### 1a. Future learner positioning

The website now explicitly positions Drivest for future learner drivers as well as active learners.

Current headline positioning includes:

- `For learner and future learner driver preparation.`
- `Real-world driving, lessons, bookings, and navigation must follow UK legal requirements.`

This message appears across:

- hero copy
- feature copy
- FAQ
- legal footer language

### 2. Reconstructed routes

The website avoids describing routes as official driving test routes.

Current wording uses:

- reconstructed practice routes
- selected-centre practice routes
- learning and practice support only

### 3. Audience split

The website now clearly supports two audiences:

- learners
- instructors

This is shown in both feature content and onboarding/start content.

### 4. App home screen alignment

The website now reflects the visible app home screen modules and role/stage framing more accurately.

Current documented home screen areas include:

- Theory
- Practice
- Navigation
- Find Instructor
- Traffic Signs
- Highway Code
- Hazard Perception as coming soon
- Fines and Penalties

The website also mentions:

- current mode
- confidence score
- continue-where-you-left-off behavior

## Current Pages And Their Purpose

### Home

Primary purpose:

- introduce Drivest as a multi-stage driving support platform
- direct users into learner or instructor journeys
- summarize the app home screen and major feature groups

Current homepage includes:

- hero section
- app-style hero product preview instead of a generic photo-led hero
- learner and instructor primary CTAs
- three stage journey cards for Theory, Practice, and Navigation
- a route-into-Drivest split for learner and instructor starts
- home screen module section
- audience split section
- language support section
- getting started summary
- safety guidance

### Features

Primary purpose:

- show the wider platform feature set in a more structured way

Current features page includes:

- marketing overview
- platform highlights
- home modules
- audience tracks
- feature groups
- language support
- getting started summary
- instructor marketplace summary
- safety section

### Pricing

Primary purpose:

- explain current product plans and marketplace terms

Current pricing plans shown:

- Free Learning
- Selected-Centre Practice at `GBP 12.99 / month`
- Navigation at `GBP 19.99 / year`
- Annual Bundle at `GBP 29.99 / year`

Pricing page also includes:

- subscription disclaimer
- instructor marketplace fee and cancellation window summary
- a `What you get in the app` gallery for Theory, Practice, Navigation, Parking, Find Instructor, and Book Lessons
- app-themed module preview cards instead of generic stock photography
- paid-plan CTAs that route into `/access-request` with the plan preselected

## Current Visual Direction

The website is no longer only copy-updated. It now also uses more product-shaped presentation in key conversion areas.

Current visual direction includes:

- real app screenshots in the homepage hero, using the shared Arabic home screen and Chinese theory screen
- stage cards instead of generic photos for Theory, Practice, and Navigation
- route-based learner and instructor entry cards on the homepage
- multilingual proof cards that show translated UI and the English cross-check behavior
- mobile-friendly proof carousel handling for feature screenshots
- app-themed module scenes on the pricing page where screenshots have not yet been provided
- stronger visual separation between core pricing plans and supporting plan detail
- searchable live-centre browse controls layered onto the public coverage directory

This means the website now leans more heavily on Drivest-specific UI storytelling and less on generic lifestyle or car stock imagery.

### Access Request

Primary purpose:

- prepare structured paid-plan support requests without dropping users into a blank email draft

Current route:

- `/access-request`

Current behaviour includes:

- preselected pricing-plan query support from pricing-page CTAs
- required centre or nearby-area capture for centre-dependent paid plans
- prepared email subject and request-body preview
- copy-to-clipboard and direct email-app fallback actions

### FAQ

Primary purpose:

- answer public-facing product, legal, subscription, routing, language, data, and dispute questions

Current FAQ header metadata:

- `Drivest Limited`
- `Version 3.0`
- `Last updated: 24 March 2026`

FAQ topics currently include:

- what Drivest provides
- DVSA affiliation clarification
- routes not being official test routes
- 32-language theory support and English cross-checking
- advisory-only driving and parking wording
- subscription models
- instructor bookings and cancellation policy
- instructor verification limits
- data collection and location handling
- disputes and deletion requests

### Getting Started

Primary purpose:

- give role-specific website start steps for learners and instructors

Current route:

- `/start`

Current anchored paths:

- `/start#learner`
- `/start#instructor`

Current intent:

- homepage `Start as learner` routes to learner start steps
- homepage `Join as instructor` routes to instructor start steps

Current learner flow summary includes:

- learner account setup
- stage selection
- legal and safety acknowledgement
- language selection
- analytics, notification, and location choices
- progression into theory, practice, instructor discovery, and navigation

Current instructor flow summary includes:

- instructor account creation
- professional legal flow and agreement
- public profile and availability setup
- Instructor Hub usage
- bookings, payments, reviews, disputes, and learner insight workflows

## Legal State Reflected On The Website

The website legal pages were aligned to the legal handoff bundle that was supplied during this update cycle.

Website legal metadata currently shown:

- `Version 3.0`
- `Last updated: 24 March 2026`

Important note:

- this is the legal document version/date shown on the website
- it is not the deployment date

Current legal positioning includes:

- Drivest is an independent product
- Drivest is not affiliated with DVSA or government authorities
- routes are reconstructed/generated and not official test routes
- parking guidance is advisory only
- marketplace instructors are independent
- cancellation and payout logic are platform-mediated, not school-operated

## Source Of Truth Notes

### Main website content source

For the dynamic marketing site, the primary content source is:

- `site/content/marketing.en-GB.json`

This file currently drives:

- SEO title and description
- navigation labels
- hero copy
- home module content
- screenshot-backed product proof content
- audience track content
- language support content
- feature group content
- getting started content
- pricing content
- FAQ content
- trust/contact content
- theory-intent and regional SEO landing-page content
- footer labels and links

### Legal source handling

Legal page content is manually maintained in the standalone HTML files. If legal text changes, update both:

- directory route pages
- legacy mirror pages

At minimum, keep these pairs aligned:

- `terms/index.html` and `terms.html`
- `privacy/index.html` and `privacypolicy.html`

## Major Website Changes Implemented In This Repo

### Completed content alignment

- repositioned the website from a narrow route-practice story to a broader learner/instructor/new-driver platform story
- added clearer learner and instructor audience framing
- added the 32-language theory message with English cross-checking
- aligned home screen website content with visible app modules
- added screenshot-backed proof for theory mastery, centre search, low-stress routing, parking flow, Welsh UI, and instructor operations
- updated pricing copy to the current plan structure
- updated legal and FAQ content to the latest supplied public website versions

### CTA and routing changes

- removed `Join the waitlist` from the homepage CTA row
- replaced homepage primary CTA destinations with role-based website routes
- added a new `Getting Started` page and route
- added anchored learner and instructor start sections
- added theory-intent SEO pages and regional centre hub pages
- added a branded contact/trust page and branded 404 page

### Legal and compliance messaging changes

- reinforced advisory-only language for driving and parking
- clarified reconstructed routes wording
- kept independent instructor positioning visible
- added public coverage-methodology wording and dataset freshness context

### Technical polish

- added route-corpus-based public centre coverage extraction and canonical alias cleanup
- generated `site/data/test-centre-coverage.en-GB.json` from the route output corpus
- added regression tests for route-corpus coverage aliasing, filtering, and summary extraction
- expanded the static generator to emit crawl-discovery files and refreshed sitemap output
- added `robots.txt`, `llm.txt`, `llms.txt`, and `llms-full.txt`
- split generated-page runtime behaviour into `site-runtime.js` instead of shipping the full renderer to the browser
- added live-centre directory search and minimum-route filtering on `/driving-test-centres`
- replaced raw paid-plan mailto CTAs with a generated `/access-request` flow and browser-side draft preparation
- moved legacy centre alias redirects into the generator for both underscore and hyphen path variants
- added intrinsic image dimensions and stronger hero image loading hints to generated page images
- added `manifest.webmanifest` to generated pages
- rebuilt the browser favicon, touch icon, and manifest icon set around the standalone steering-wheel locator mark, with size-specific transparent favicons for tabs and white-tile icons for touch/PWA use
- stopped above-the-fold reveal fades from washing out the first viewport and top-aligned the desktop homepage hero
- widened the homepage main container on large desktops and trimmed the hero phone stack so the 2K-width first fold breathes properly
- top-aligned the desktop product-proof and safety-proof cards and reduced their phone rail width so lower sections stop showing giant empty text columns
- tightened the homepage hero for shorter desktop viewports by shrinking the phone stack and reducing first-fold vertical load
- simplified the shorter-desktop homepage hero further by dropping the overlapping secondary phone and compressing proof-card density
- compressed the shorter-desktop homepage hero again with smaller headline scale, smaller device rail, and hidden pill row to expose more of the first fold
- reduced the laptop-height homepage hero to a true first-fold variant by removing duplicate secondary CTAs, proof/trust blocks, the second story card, and the legal note while shrinking and cropping the remaining device preview
- added a shorter-desktop compact mode for homepage product-proof, language-proof, and safety-proof sections so tall app screenshots no longer create giant empty text columns below the fold
- tightened the homepage desktop UI rhythm further by reducing section spacing, turning lower proof cards into compact horizontal media cards, and rebuilding the language section as a tighter screenshot collage for shorter desktop heights
- prepared a permanent non-www to www redirect rule in `vercel.json`
- improved mobile screenshot proof presentation and tightened homepage and pricing hierarchy

## Maintenance Notes

When future changes arrive, use this order:

1. Check whether the change affects marketing copy, legal copy, or both.
2. Update `site/content/marketing.en-GB.json` first for marketing pages.
3. Update `script.js` if a new section, route, data attribute, or rendering behavior is needed.
4. Update `site-runtime.js` when generated pages need new browser-side interaction or nav behavior.
5. Regenerate static outputs if the change affects generated pages, crawl files, sitemap, or centre coverage data.
6. Update `terms/index.html` and `privacy/index.html` for legal changes.
7. Mirror legal changes into `terms.html` and `privacypolicy.html`.
8. Update `DrivestWeb Master.md` in the same change whenever repo behavior, routes, messaging, or generated assets materially change.
9. Verify JSON parsing and `node --check script.js`.
10. Verify `node --check site-runtime.js`.
11. Run `python tools\build_browser_icons.py` when the browser icon or wordmark source changes.
12. Run `node tools\generate-seo-pages.mjs` when generated outputs or redirects changed.
13. Run `node tools\verify-generated-site.mjs` after regeneration.
14. Run `python -m unittest discover -s tests -p "test_*.py" -v` when touching route-corpus extraction or coverage generation logic.
15. Confirm whether changes are only local or also deployed live.

## Verification Commands

Useful local checks:

```powershell
Get-Content -Raw 'site\content\marketing.en-GB.json' | ConvertFrom-Json | Out-Null
node --check script.js
node --check site-runtime.js
node --check tools\generate-seo-pages.mjs
node --check tools\verify-generated-site.mjs
python -m py_compile tools\build_browser_icons.py
python -m py_compile tools\extract_route_corpus_coverage.py tests\test_extract_route_corpus_coverage.py
python tools\build_browser_icons.py
node tools\generate-seo-pages.mjs
node tools\verify-generated-site.mjs
python -m unittest discover -s tests -p "test_*.py" -v
python tools\extract_route_corpus_coverage.py --help
git status --short --branch
```

## External Inputs Used During This Update Cycle

The current website direction was informed by these external files:

- `c:\Users\ferro\Downloads\drivest_website_gap_analysis_2026-05-09.md`
- `c:\Users\ferro\Downloads\Drivest_Pitch_Deck.pdf`
- `c:\Users\ferro\Downloads\translation_handoff_2026-04-25_modernized_20260506.zip`
- `c:\Users\ferro\Downloads\master.md`

These files are not the website source of truth. They are reference inputs used to drive website updates.
