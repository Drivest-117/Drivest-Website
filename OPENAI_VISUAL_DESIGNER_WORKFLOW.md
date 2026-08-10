# OpenAI Visual Designer Workflow for Drivest

This is the strongest first-party OpenAI workflow available for upgrading the Drivest website without relying on Codex for the concept phase.

Recommended stack:

1. Use OpenAI's `Visual Designer` GPT for art direction and layout direction.
2. Approve one direction.
3. Feed the approved direction into an implementation agent for production code.

This document gives you the exact prompts and review rubric.

## Goal

Redesign the public Drivest website so it feels more premium, modern, visual, and intentionally designed while keeping legal-safe product claims.

Priority pages:

1. Home page
2. Features page

Secondary pages:

1. Driving test centres
2. Driving instructors
3. Pricing

## Non-Negotiable Constraints

Use these constraints in every design conversation:

- Do not mention competitors by name.
- Do not imply Drivest is affiliated with DVSA.
- Do not imply Drivest routes are official test routes.
- Do not claim the product is "best", "most accurate", "guaranteed", or similar.
- Instructor marketplace wording must stay conditional:
  - `where enabled`
  - `availability varies by area`
- Navigation, sign-scanning, route, and parking support must read as advisory.
- Keep real app screenshots as anchor assets where possible.
- Reduce text density materially.
- Preserve a high-trust feel.

## What To Upload Into Visual Designer

Upload these reference assets if available:

1. Current live site screenshots:
   - home
   - features
   - driving test centres
   - driving instructors
   - pricing
2. Product/app screenshots:
   - learner home
   - theory screen
   - practice centre list
   - navigation screen
   - instructor hub screen
3. Brand assets:
   - Drivest logo
   - favicon/app icon
4. Optional reference:
   - selected pitch slides that reflect the intended tone, not expansion or investor-only content

## Master Prompt for Visual Designer

Paste this into OpenAI Visual Designer:

```text
Design a premium public website direction for Drivest, a UK learner-driver platform.

Primary objective:
Create a significantly better visual direction for the public marketing website so it feels premium, modern, calm, high-trust, and intentionally designed rather than generic or overly text-heavy.

Business/product context:
- Drivest supports learner drivers and newer drivers in the UK
- It brings together theory prep, selected-centre practice routes, calmer first independent driving support, and instructor flows where enabled
- The iPhone app is already live
- The audience includes future learners, current learner drivers, and newer post-pass drivers

Brand feeling:
- confident
- clear
- calm
- high-trust
- modern
- premium
- helpful, not noisy

What is wrong with the current site:
- too word-heavy
- too card-heavy
- not enough visual hierarchy
- not enough memorable composition
- feels improved but not yet truly premium

What I want from you:
- 3 distinct homepage visual directions
- 2 distinct features-page visual directions
- each direction should look like a polished product-marketing website, not a generic SaaS template
- keep app screenshots as core proof assets
- make the layout more visual and less copy-dependent
- reduce repetition
- create stronger section rhythm and contrast

Hard legal/product constraints:
- do not mention competitors
- do not imply DVSA affiliation
- do not imply official test routes
- do not use unverifiable claims like “best”, “most accurate”, or “guaranteed”
- instructor marketplace language must remain conditional: “where enabled”, “availability varies by area”
- route, sign-scanning, parking, and navigation support must read as advisory

Output format:
For each direction provide:
1. Direction name
2. Creative rationale
3. Visual style
4. Typography direction
5. Colour strategy
6. Homepage hero concept
7. Homepage section order
8. Features page section order
9. What to remove from the current site
10. What to simplify
11. What proof/trust modules to keep
12. Mobile behaviour
13. Why this direction is stronger than the current site

Important:
- focus on home and features first
- use less copy
- avoid generic purple-on-white SaaS aesthetics
- make the design feel like a premium consumer product brand
- keep the design grounded in the actual Drivest product
```

## Follow-Up Prompt After Initial Concepts

After Visual Designer gives you directions, use this:

```text
Take the strongest direction and refine it into an implementation-ready concept.

I want:
- a clearer homepage wireframe
- a clearer features-page wireframe
- exact hero structure
- exact section order
- what each section is trying to communicate
- where screenshots should be placed
- where trust/proof modules should be placed
- what copy should be cut entirely
- what copy should become short labels instead of paragraphs
- recommended mobile layout behaviour

Keep all prior legal/product constraints.

The result should be specific enough that a front-end implementation agent can build it.
```

## Selection Rubric

Choose the direction that scores best on these criteria:

1. Feels premium and distinctive, not generic.
2. Reduces text density without making the product confusing.
3. Uses screenshots as trust anchors.
4. Makes Drivest feel like one connected journey.
5. Avoids overclaiming.
6. Works on mobile as well as desktop.
7. Gives the homepage a memorable hero and strong visual rhythm.

## Implementation Prompt

Once one direction is approved, use this prompt with the implementation agent:

```text
Implement the approved Drivest marketing design direction in the production website codebase.

Inputs:
- approved visual direction from OpenAI Visual Designer
- current Drivest site codebase
- real Drivest screenshots
- legal-safe copy constraints

Primary goals:
- rebuild home and features first
- materially reduce text density
- improve hierarchy, composition, spacing, contrast, and rhythm
- make the site feel more premium and visual
- preserve the existing legal-safe claim boundaries
- keep internal links and SEO-critical structure sensible

Hard constraints:
- do not add competitor references
- do not imply DVSA affiliation
- do not imply official routes
- do not add unverifiable superiority claims
- keep instructor marketplace claims conditional
- keep navigation/parking/sign-scanning claims advisory

Implementation expectations:
- responsive desktop and mobile layouts
- stronger hero treatment
- fewer repetitive cards
- more deliberate section contrast
- real screenshots used where possible
- cleaner CTA hierarchy
- maintain production readiness

Before final release:
- run validation checks
- regenerate any static pages if required
- verify the key public pages
```

## Best Practical Workflow

1. Open Visual Designer in ChatGPT.
2. Upload the current Drivest screenshots and selected product shots.
3. Paste the `Master Prompt for Visual Designer`.
4. Review the three homepage directions and two features directions.
5. Pick one direction only.
6. Paste the `Follow-Up Prompt After Initial Concepts`.
7. Approve the refined direction.
8. Hand the result to the implementation agent using the `Implementation Prompt`.

## Recommendation

If you want the strongest outcome:

- do not ask for full site redesign first
- do `home` and `features` first
- let that establish the visual language
- then roll the same system into centres, instructors, and pricing

This gives the best chance of getting a genuinely better result instead of a larger, noisier rewrite.
