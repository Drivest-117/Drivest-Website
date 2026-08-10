# Drivest SEO Implementation Backlog - 2026-06-17

## Scope

This backlog turns the earlier SEO, legal, and IP review into a concrete implementation plan for the current Drivest public site.

Primary acquisition wedge:

- Multilingual theory preparation
- Selected-centre practice routes
- Calmer post-pass and new-driver support

Supporting, not leading:

- Instructor marketplace pages
- General navigation positioning

Hard constraints:

- Do not use competitor names anywhere on the public site.
- Do not imply DVSA, government, or official approval.
- Do not describe routes as official, predicted, or real test routes.
- Do not use best, safest, or similar superiority claims unless provable.
- Do not use third-party brands, marks, copy, screenshots, or data without clearance.

This is a risk-screened plan, not a guarantee that no third party could ever complain or sue.

## Edit Locations

Edit source, not generated HTML.

- Source copy and page definitions: [site/content/marketing.en-GB.json](site/content/marketing.en-GB.json)
- Page generation and schema logic: [tools/generate-seo-pages.mjs](tools/generate-seo-pages.mjs)
- Post-build verification: [tools/verify-generated-site.mjs](tools/verify-generated-site.mjs)

Generated outputs affected:

- Core marketing pages under `/`
- Theory intent pages under `/mock-theory-test`, `/road-signs-test`, `/highway-code-test`, `/hazard-perception-test`, and current language pages
- Centre hub, current region hubs, and centre-detail pages under `/driving-test-centres`

## Current Technical Notes

- The site already generates `SoftwareApplication`, `BreadcrumbList`, `OfferCatalog`, `FAQPage`, and `ItemList` schema in different places.
- The site currently has 453 centre directories, including 129 underscore-style alias directories alongside hyphenated canonicals.
- Redirect pages are HTML meta-refresh stubs today. If hosting allows, these should become real `301` redirects.

## P0 Backlog

- Reposition the homepage, features page, pricing page, and theory hub around multilingual theory plus selected-centre practice.
- De-risk `/driving-instructors` so it stops sounding stronger than current marketplace proof.
- Strengthen `/theory-test-preparation` as the main theory hub with better internal links to mock tests, signs, Highway Code, hazard positioning, and language pages.
- Strengthen `/driving-test-centres` as the main practice hub with clearer coverage wording and stronger links into region hubs and centre pages.
- Add FAQ content plus `FAQPage` schema to theory hub, centre hub, and pricing.
- Replace or qualify copy that can imply official routes, route prediction, generic sat-nav replacement, or broad instructor liquidity.
- Clean redirect and canonical hygiene for underscore centre aliases.

## P1 Backlog

- Launch the first post-pass SEO cluster around new-driver confidence and calmer routing.
- Expand theory language landing pages selectively, only for supported languages with product proof and worthwhile demand.
- Add more region hubs where Drivest already has several public centre pages in one metro area.
- Add FAQ blocks to top centre pages and region hubs.

## P2 Backlog

- Expand post-pass cluster once initial pages rank and convert.
- Expand region hubs further after coverage depth and internal-link support are in place.
- Add editorial content around learner stage transitions if product evidence is strong enough.

## Page-by-Page Rewrite Plan

### Core Pages

| Priority | Route | Source | Proposed title | Proposed description |
| --- | --- | --- | --- | --- |
| P0 | `/` | `seo.title`, `seo.description`, hero and search-intent copy | `UK theory test prep in 32 languages and test-centre practice routes | Drivest UK` | `Prepare for the UK theory test in your preferred language, practise around your chosen driving test centre, and build calmer driving confidence with Drivest.` |
| P0 | `/features` | `pageSeo.features`, feature sections | `Theory prep, selected-centre practice, and new-driver support | Drivest UK` | `Explore Drivest features for multilingual theory revision, selected-centre practice routes, instructor workflows where enabled, and calmer support after passing.` |
| P0 | `/pricing` | `pageSeo.pricing`, pricing blocks | `Drivest pricing for theory prep and selected-centre practice | Drivest UK` | `Compare free theory preparation, selected-centre practice pricing, and annual learner options for routes, navigation support, and post-pass confidence.` |
| P0 | `/start` | `pageSeo.start`, onboarding sections | `How Drivest works for learner drivers and instructors | Drivest UK` | `See how learners start with theory, move into selected-centre practice, and use instructor and driving support features at the right stage.` |
| P0 | `/faq` | `pageSeo.faq`, FAQ entries | `Drivest FAQ for theory prep, practice routes, and pricing | Drivest UK` | `Read answers about multilingual theory preparation, practice-route coverage, pricing, learner access, instructor onboarding, and public-site positioning.` |
| P0 | `/driving-instructors` | `pageSeo.instructors`, instructors hub copy | `Independent driving instructors and Instructor Hub | Drivest UK` | `Browse instructor information, lesson-request flows, and Instructor Hub features where enabled, or apply to join Drivest as an instructor.` |
| P0 | `/download` | `pageSeo.download`, download page copy | `Download Drivest for iPhone on the App Store | Drivest UK` | `Download Drivest for iPhone from the Apple App Store, then use the website to review pricing, theory preparation, and route coverage.` |
| P1 | `/contact` | `pageSeo.contact`, contact page copy | `Contact Drivest and review coverage methodology | Drivest UK` | `Find Drivest contact details, current website support routes, and public notes on route coverage and legal positioning.` |

### Theory Cluster

| Priority | Route | Source | Proposed title | Proposed description |
| --- | --- | --- | --- | --- |
| P0 | `/theory-test-preparation` | `pageSeo.theory`, `hubPages.theory` | `UK theory test preparation in 32 languages | Drivest UK` | `Prepare for the UK driving theory test with mock tests, road signs, Highway Code revision, and same-question English Peek across 32 supported languages.` |
| P0 | `/mock-theory-test` | `seoLandingPages.theoryIntentPages[]` | `Mock theory test practice in 32 languages | Drivest UK` | `Practise mock theory tests in your preferred language, then compare the English wording on the same question inside Drivest.` |
| P0 | `/road-signs-test` | `seoLandingPages.theoryIntentPages[]` | `Road signs test revision for UK learner drivers | Drivest UK` | `Revise UK road signs and traffic signs inside Drivest alongside theory questions, Highway Code study, and multilingual preparation.` |
| P0 | `/highway-code-test` | `seoLandingPages.theoryIntentPages[]` | `Highway Code revision and theory prep | Drivest UK` | `Study Highway Code guidance alongside theory questions, road signs, and multilingual revision inside the wider Drivest learner journey.` |
| P0 | `/hazard-perception-test` | `seoLandingPages.theoryIntentPages[]` | `Hazard perception test preparation | Drivest UK` | `See how hazard perception fits into Drivest's broader learner revision journey alongside theory, road signs, and Highway Code study.` |
| P0 | `/driving-theory-test-in-urdu` | `seoLandingPages.theoryIntentPages[]` | `UK driving theory test in Urdu | Drivest UK` | `Prepare for the UK driving theory test in Urdu with topic quizzes, mock tests, road signs, Highway Code study, and same-question English Peek.` |
| P0 | `/driving-theory-test-in-arabic` | `seoLandingPages.theoryIntentPages[]` | `UK driving theory test in Arabic | Drivest UK` | `Prepare for the UK driving theory test in Arabic with multilingual theory support, mock tests, road signs, and English Peek on the same question.` |
| P0 | `/driving-theory-test-in-welsh` | `seoLandingPages.theoryIntentPages[]` | `UK driving theory test in Welsh | Drivest UK` | `Prepare for the UK driving theory test in Welsh with theory revision, mock tests, road signs, and the option to compare English wording in the same flow.` |

### Centres Cluster

| Priority | Route | Source | Proposed title | Proposed description |
| --- | --- | --- | --- | --- |
| P0 | `/driving-test-centres` | `pageSeo.centres`, `hubPages.centres` | `UK driving test centres and practice routes | Drivest UK` | `Browse driving test centres in Drivest's public coverage dataset, compare route coverage, and practise reconstructed local routes around your chosen centre.` |
| P0 | `/driving-test-centres/london` | `seoLandingPages.centreRegionPages[]` | `London driving test centres and practice routes | Drivest UK` | `Compare London driving test centres currently published on Drivest and move into the exact centre page you want to practise around.` |
| P0 | `/driving-test-centres/manchester` | `seoLandingPages.centreRegionPages[]` | `Manchester driving test centres and practice routes | Drivest UK` | `Compare Manchester-area driving test centres currently published on Drivest and review route coverage before choosing a centre page.` |
| P0 | `/driving-test-centres/birmingham` | `seoLandingPages.centreRegionPages[]` | `Birmingham driving test centres and practice routes | Drivest UK` | `Compare Birmingham driving test centres currently published on Drivest and review route-count depth before moving into a centre page.` |
| P0 | `/driving-test-centres/{centre}` | centre-detail template in generator | `{Centre name} driving test centre practice routes | Drivest UK` | `See current Drivest practice coverage for {Centre name}, compare nearby centres, and use reconstructed local routes for familiarity only.` |

Notes for centre-detail pages:

- Keep the current title pattern.
- Tighten the description so every centre page states learning-only positioning.
- Add a short FAQ block and schema to the highest-traffic centre pages first.

## New Pages To Add

### Post-Pass and New-Driver Cluster

Add through `seoLandingPages.theoryIntentPages` style support or a new `seoLandingPages.postPassPages` block in the generator.

| Priority | Proposed route | Purpose |
| --- | --- | --- |
| P1 | `/driving-after-passing-test` | Broad post-pass confidence hub |
| P1 | `/new-driver-navigation` | Narrow page for calmer routing and journey planning |
| P1 | `/parking-help-for-new-drivers` | Parking support page tied to destination-first parking |
| P1 | `/low-stress-route-planning` | Route-choice page that avoids generic sat-nav language |
| P2 | `/first-solo-drive` | Confidence content for first independent journeys |

Positioning rules for this cluster:

- Frame these as confidence and planning support for new drivers.
- Do not claim Drivest is a general sat-nav replacement.
- Do not claim safest routes.
- Keep live-road and legal-responsibility reminders visible.

### Selective Language Expansion

Do not create 32 thin pages.

First candidate pages, only if the language is already truly supported in-product:

| Priority | Proposed route |
| --- | --- |
| P1 | `/driving-theory-test-in-punjabi` |
| P1 | `/driving-theory-test-in-gujarati` |
| P1 | `/driving-theory-test-in-french` |
| P1 | `/driving-theory-test-in-simplified-chinese` |

Gate before launch:

- Supported in-product today
- Original screenshots or proof assets available
- Enough unique copy to avoid thin duplication

### Region Hub Expansion

Add only where Drivest already has multiple public centre pages in the same metro area.

Initial candidates from current centre inventory:

| Priority | Proposed route | Existing centre evidence |
| --- | --- | --- |
| P1 | `/driving-test-centres/liverpool` | `garston-liverpool`, `speke-liverpool`, `st-helens-liverpool`, `southport-liverpool` |
| P1 | `/driving-test-centres/bristol` | `bristol-avonmouth`, `bristol-brislington`, `bristol-kingswood` |
| P1 | `/driving-test-centres/glasgow` | `glasgow-anniesland`, `glasgow-baillieston`, `glasgow-shieldhall` |
| P1 | `/driving-test-centres/edinburgh` | `edinburgh-currie`, `edinburgh-musselburgh` |
| P1 | `/driving-test-centres/leicester` | `leicester-cannock-street`, `leicester-wigston` |
| P1 | `/driving-test-centres/nottingham` | `nottingham-chilwell`, `nottingham-colwick` |
| P1 | `/driving-test-centres/sheffield` | `sheffield-handsworth`, `sheffield-middlewood` |

## Internal Linking Plan

### Homepage

- Keep `/theory-test-preparation` and `/driving-test-centres` as the two strongest crawl and conversion paths.
- Reduce the relative prominence of `/driving-instructors` in hero-adjacent copy.
- Add direct text links from the homepage to `/mock-theory-test`, `/road-signs-test`, and one or two language pages.

### Theory Hub

- Add a visible sub-navigation block linking to:
  - `/mock-theory-test`
  - `/road-signs-test`
  - `/highway-code-test`
  - `/hazard-perception-test`
  - Current language pages
- Add contextual links from theory sections into `/driving-test-centres` and `/pricing`.
- Add a short "next step after theory" block above the footer, not just in generic related cards.

### Theory Intent Pages

- Add cross-links between sibling pages so mock, road signs, Highway Code, hazard positioning, and language pages reinforce each other.
- Add one prominent link back to `/theory-test-preparation`.
- Keep one next-step link to `/driving-test-centres`.

### Centres Hub

- Add a visible region-hub strip for London, Manchester, Birmingham, then new region hubs as they launch.
- Add stronger text links into theory and pricing using descriptive anchor text, not generic "learn more".
- Make coverage wording date-aware, for example `current public coverage` or `coverage published on this site`.

### Region Hubs

- Link up to `/driving-test-centres`.
- Link down to each centre page.
- Link sideways to theory hub and pricing.
- Add a short explanation of what makes a centre appear on the public site.

### Centre-Detail Pages

- Preserve links to nearby centres.
- Add one block for theory preparation and one block for pricing.
- Add a concise FAQ block:
  - Are these official routes?
  - How should I use these routes?
  - What happens if roads change?

### Pricing and Start

- Add descriptive internal links to theory, centres, download, and the new post-pass cluster once it exists.
- Keep instructor links present but secondary.

## Claim Replacements and Legal/IP Guardrails

Replace or qualify the following patterns across titles, meta descriptions, H1s, body copy, alt text, schema text, and CTA support copy.

| Avoid | Use instead |
| --- | --- |
| `official routes` | `reconstructed practice routes for learning support` |
| `real test routes` | `routes published for local familiarity and repetition` |
| `predicted test routes` | `practice routes around your chosen centre` |
| `safest route` | `low-stress route planning` or remove claim |
| `best driving instructor` | remove or replace with neutral service wording |
| `find UK driving instructors and book lessons` | `browse instructor information and request lessons where enabled` |
| `verified instructor` | only use if the exact verification process is explained next to the claim |
| `Drivest is in 32 languages` | `theory preparation is available in 32 supported languages` |
| `live routes` | `current public route coverage` |
| `available now` | use only where the feature, route, or download is actually live today |

Absolute rules:

- No competitor names in public copy, metadata, slugs, schema, or alt text.
- No DVSA logos, marks, or approval language unless expressly licensed and true.
- No reused third-party route descriptions, directory copy, screenshots, review text, or app-store copy.
- No comparative advertising unless legal has reviewed the exact wording.

## Schema and Technical Work

### Schema

- Keep current `SoftwareApplication` baseline.
- Keep current `BreadcrumbList` baseline.
- Keep current `OfferCatalog` on pricing.
- Add `FAQPage` schema to:
  - `/theory-test-preparation`
  - `/driving-test-centres`
  - `/pricing`
  - Top centre pages after FAQ content is added
- Keep `ItemList` on region hubs and centre pages.
- Use `CollectionPage` for new theory, post-pass, and region-hub style pages where appropriate.

### Redirect and Canonical Hygiene

- Replace HTML redirect stubs with host-level `301` redirects if deployment supports them.
- Keep hyphenated centre URLs as the only canonicals.
- Keep underscore alias paths out of the sitemap.
- Verify every redirect path points to the same canonical destination in both HTML and host config during transition.

### Snippet Quality

- Keep title tags focused on one primary topic.
- Remove vague mixed-intent titles that try to rank for theory, routes, instructors, and navigation all at once.
- Keep meta descriptions descriptive, not salesy.

## Implementation Order

1. Update `seo`, `pageSeo`, `hero`, `searchIntentLinks`, `hubPages`, and relevant landing-page blocks in `site/content/marketing.en-GB.json`.
2. Extend `tools/generate-seo-pages.mjs` for:
   - FAQ block support on theory hub, centres hub, pricing, and centre pages
   - Optional new post-pass landing-page type if needed
   - Cleaner redirect handling if host config can be generated from the same source
3. Regenerate the site.
4. Run `tools/verify-generated-site.mjs`.
5. Manually spot-check:
   - homepage
   - theory hub
   - one theory intent page
   - one language page
   - centres hub
   - one region hub
   - one centre-detail page
   - instructors page
   - pricing page
6. Deploy.
7. Resubmit sitemap and monitor indexed canonicals in Google Search Console.

## Acceptance Checklist

- Homepage clearly leads with multilingual theory plus selected-centre practice.
- Theory hub is the strongest internal SEO hub on the site.
- Centres hub and centre pages use independent learning-only route language everywhere.
- Instructor page no longer implies broad marketplace depth that the product cannot prove.
- Pricing is clear and claim-safe.
- New metadata does not use competitor names, official-route language, or unsupported superlatives.
- FAQ schema is present on the agreed pages.
- Canonicals point only to hyphenated centre URLs.
- Redirect alias handling is cleaner than the current meta-refresh-only state.

## Recommended Next Build Sprint

If implementation starts immediately, the first sprint should cover only P0:

- core metadata rewrites
- theory hub strengthening
- centres hub strengthening
- instructors page de-risking
- FAQ schema expansion
- redirect and canonical cleanup plan

After that, ship the first P1 batch:

- one post-pass hub
- two to four new language pages
- three new region hubs
