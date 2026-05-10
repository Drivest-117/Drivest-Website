# DrivestWeb Master

Last updated: 10 May 2026

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

As of 10 May 2026, this repository contains website updates that include:

- expanded marketing copy aligned to the current app
- updated Terms, Privacy, and FAQ website content
- a new `Getting Started` website flow for learners and instructors
- removal of the homepage `Join the waitlist` CTA
- mobile navigation and a persistent website preparation CTA
- future learner driver positioning across homepage, start flow, pricing, and FAQ
- stronger static metadata for marketing page titles, descriptions, and sharing

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
- `site/content/marketing.en-GB.json`
  - main website content source for marketing copy, pricing, FAQ, and footer labels

### Rendering model

The marketing pages use lightweight HTML wrappers with a `data-page` attribute. `script.js` reads that page value and renders the page body using the shared JSON content.

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
- `/faq`
- `/start`

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

## Current Visual Direction

The website is no longer only copy-updated. It now also uses more product-shaped presentation in key conversion areas.

Current visual direction includes:

- real app screenshots in the homepage hero, using the shared Arabic home screen and Chinese theory screen
- stage cards instead of generic photos for Theory, Practice, and Navigation
- route-based learner and instructor entry cards on the homepage
- multilingual proof cards that show translated UI and the English cross-check behavior
- app-themed module scenes on the pricing page where screenshots have not yet been provided

This means the website now leans more heavily on Drivest-specific UI storytelling and less on generic lifestyle or car stock imagery.

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
- audience track content
- language support content
- feature group content
- getting started content
- pricing content
- FAQ content
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
- updated pricing copy to the current plan structure
- updated legal and FAQ content to the latest supplied public website versions

### CTA and routing changes

- removed `Join the waitlist` from the homepage CTA row
- replaced homepage primary CTA destinations with role-based website routes
- added a new `Getting Started` page and route
- added anchored learner and instructor start sections

### Legal and compliance messaging changes

- reinforced advisory-only language for driving and parking
- clarified reconstructed routes wording
- kept independent instructor positioning visible

## Maintenance Notes

When future changes arrive, use this order:

1. Check whether the change affects marketing copy, legal copy, or both.
2. Update `site/content/marketing.en-GB.json` first for marketing pages.
3. Update `script.js` only if a new section, route, or rendering behavior is needed.
4. Update `terms/index.html` and `privacy/index.html` for legal changes.
5. Mirror legal changes into `terms.html` and `privacypolicy.html`.
6. Verify JSON parsing and `node --check script.js`.
7. Confirm whether changes are only local or also deployed live.

## Verification Commands

Useful local checks:

```powershell
Get-Content -Raw 'site\content\marketing.en-GB.json' | ConvertFrom-Json | Out-Null
node --check script.js
git status --short --branch
```

## External Inputs Used During This Update Cycle

The current website direction was informed by these external files:

- `c:\Users\ferro\Downloads\drivest_website_gap_analysis_2026-05-09.md`
- `c:\Users\ferro\Downloads\translation_handoff_2026-04-25_modernized_20260506.zip`
- `c:\Users\ferro\Downloads\master.md`

These files are not the website source of truth. They are reference inputs used to drive website updates.
