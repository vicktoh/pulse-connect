# Design System: PULSE Community

**Project:** PULSE Summit 2026 — Community Submissions (`thepulsesummit.org/community`)
**Owner:** International Budget Partnership (IBP) Nigeria
**Source of truth for:** Tailwind v4 theme tokens (`src/app/globals.css`) and the shadcn component layer (`src/components/ui/`)

---

## 1. Visual Theme & Atmosphere

**Institutional, editorial, and evidence-first.** The interface reads like a serious civic publication rather than a social feed — closer to a policy journal's web edition than to a startup product page.

Three qualities define the mood:

- **Grounded authority.** Deep navy anchors every masthead surface: the top of the hero, every sidebar card header, the modal header, the footer. Wherever the institution speaks, the background goes dark. Wherever a citizen speaks, the background is paper-white. That inversion is the core visual argument of the page.
- **Dense but never cramped.** Content sits on a narrow 1100px measure with generous internal padding (20–26px inside cards). The feed is intentionally text-heavy — testimony is the product — so density is managed through rhythm and typographic contrast rather than through whitespace alone.
- **Quiet warmth against cool structure.** The palette is overwhelmingly cool (navy, slate, pale blue-greys), and a single warm amber breaks through only on calls to action and the debt sector. Warmth is rationed, which is what makes it read as an invitation rather than as decoration.

A three-colour gradient hairline — red, amber, blue — caps every dark surface. It functions as the system's signature: a 3px accent stripe that says "this block is authored by IBP."

---

## 2. Color Palette & Roles

### Institutional Navies

| Descriptive Name | Hex | Role |
| --- | --- | --- |
| Midnight Charter Navy | `#001F40` | The deepest institutional surface. Hero background, sidebar and modal headers, footer. The colour of the organisation speaking. |
| Deep Ministry Navy | `#002D5C` | Reserved secondary dark for hover and pressed states on navy surfaces. |
| Signal Navy | `#004080` | The primary brand blue and the Education sector marker. Left rail on IBP responses, active link colour, focus rings. |
| Lifted Navy | `#1A5694` | The lightest navy; used only as the terminal stop of the signature gradient stripe. |

### Warm Accent

| Descriptive Name | Hex | Role |
| --- | --- | --- |
| Civic Amber | `#F0A030` | The single call-to-action colour. Every primary button, the hero eyebrow label, and the Debt sector marker. Always paired with Midnight Charter Navy text — never with white. |
| Burnished Amber | `#D4860A` | Hover state for amber buttons and the text colour of the "Under Review" status pill. |

### Status & Sector Signals

| Descriptive Name | Hex | Role |
| --- | --- | --- |
| Alarm Red | `#E03020` | Health sector marker and the opening stop of the gradient stripe. Signals urgency, never error. |
| Verification Green | `#16A34A` | Guideline checkmarks and the "Cited by IBP" status pill. Signals confirmed, published, endorsed. |
| Clear Water Cyan | `#0891B2` | WASH (Water, Sanitation and Hygiene) sector marker. |
| Advocacy Violet | `#7C3AED` | Social Protection sector marker. |

Sector colours are load-bearing, not decorative. Each appears in exactly four places for a given submission: the 4px left rail on the card, the avatar tile fill, the sector tag pill, and the sidebar activity bar. Consistency across those four surfaces is what lets a reader scan the feed by sector without reading a word.

### Paper & Ink

| Descriptive Name | Hex | Role |
| --- | --- | --- |
| Document White | `#FFFFFF` | Card, nav, and modal body surfaces. Every piece of citizen testimony sits on it. |
| Cool Paper | `#F6F9FC` | The page canvas behind the feed. A barely-there blue tint that makes white cards lift without shadow. |
| Pressed Paper | `#EEF3F9` | Recessed surfaces: neutral tags, the privacy note, the "Received" status pill, and unfilled bar tracks. |
| Deep Ink | `#0C1F38` | Primary body and heading text. Navy-tinted black, never neutral black. |
| Considered Grey | `#5A6B85` | Secondary prose: submission bodies, guidelines, card descriptions. |
| Quiet Grey | `#8A98B0` | Tertiary metadata: dates, role lines, form hints, counts, placeholders. |
| Hairline | `#DDE6F0` | Default borders and dividers between sections. |
| Defined Hairline | `#CDD9E8` | Interactive borders: filter pills, form inputs, support buttons — anything the user can act on. |

The two-tier border system is deliberate. A lighter hairline means "this is a boundary"; the heavier one means "this is a control."

### Muted Dark-Surface Text

On Midnight Charter Navy, body copy drops to a desaturated slate-blue (`#6A86A8`) and labels drop further (`#445E7A`, and `#2A3E58` in the footer). These are not accessibility oversights but deliberate recessive tones for supporting copy; all primary text on navy remains pure white.

---

## 3. Typography Rules

**Two families, sharply divided by function.**

- **Fraunces** (variable serif, optical sizing) carries every heading, every stat number, and — most distinctively — the "What I observed" testimony itself. Weights 400 and 600 only. Its italic 400 appears exactly once, on the hero's emphasised clause, rendered in Civic Amber.
- **Inter** carries everything else: body prose, labels, buttons, metadata, form fields. Weights range 300–800, but the workhorses are 400 (prose), 600 (emphasis), 700 (labels), and 800 (buttons and eyebrows).

**The signature move:** first-person observation is set in the serif at 16px, while the analytical follow-up ("what changed it") drops to Inter at 13.5px in Considered Grey. Lived testimony is typographically elevated above commentary. This inversion of the usual hierarchy is the most important rule in the system — do not normalise it.

**Letterforms and spacing:**

- Headings run tight (1.1 line-height) and are never uppercased.
- Small labels — eyebrows, section labels, status pills, tags, buttons — are uppercased, heavily tracked (0.10em–0.22em), and set at 10–12px in weight 700–800. The wider the tracking, the higher the label sits in the hierarchy: the hero eyebrow uses 0.22em, ordinary field labels use 0.04em.
- Body prose is comfortable at 1.6–1.75 line-height. Testimony sits tighter at 1.5 because the serif already carries air.

---

## 4. Component Stylings

### Buttons

- **Primary (Civic Amber):** Fully pill-shaped, filled amber with Midnight Charter Navy text, uppercase, weight 800, tracked at 0.14em. Padding is generous and horizontal (14px × 32px on the hero). No border, no shadow. Hover darkens to Burnished Amber. This is the only button style permitted to initiate a submission.
- **Filter pills:** Pill-shaped, white fill, 1.5px Defined Hairline border, 12px weight-600 grey label. Hovering shifts border and text to Signal Navy. When active, the pill inverts to a solid fill — Midnight Charter Navy for general filters, the sector's own colour for sector filters. The Debt pill is the one exception that keeps navy text on its amber fill.
- **Support ("I have seen this too"):** Pill-shaped outline button carrying a live count. Once engaged it fills with a 7% Signal Navy wash, adopts a navy border and navy label, and its glyph flips from `+` to `✓` with the copy shifting to past tense.

### Cards & Containers

- **Submission cards:** Subtly rounded corners (12px) on Document White, hairline border, and a **4px full-height sector rail** flush to the left edge. Flat at rest; on hover a whisper-soft navy-tinted shadow lifts them (`0 4px 16px rgba(0,64,128,.08)`). Internal padding is asymmetric — 26px on the left to clear the rail, 22px elsewhere.
- **Sidebar cards:** Same 12px radius and hairline border, but headed by a Midnight Charter Navy block carrying the gradient stripe. Title in white Fraunces, subtitle in recessive slate.
- **IBP response block:** Nested inside the submission card as a distinct quotation surface — 4% Signal Navy wash, a 3px solid navy left border, and corners rounded only on the right (`0 8px 8px 0`) so it reads as a margin annotation rather than a standalone card.
- **Avatar tiles:** 36px squares with softly rounded corners (8px) — deliberately *not* circles, so they read as document markers rather than as profile photos. Filled with the sector colour, initials in white Fraunces.
- **Status pills:** Fully pill-shaped, 10px uppercase weight-700 text on a 12%-opacity tint of their own colour. Received is neutral grey on Pressed Paper; Under Review is Burnished Amber; Cited by IBP is Verification Green.

### Inputs & Forms

- Gently rounded rectangles (10px), white fill, 1.5px Defined Hairline stroke, 12px × 16px padding, 14px Inter.
- **Focus:** the stroke becomes Signal Navy and a 3px 10%-opacity navy halo blooms outside it. No colour change to the fill.
- Labels sit above at 12px weight 700 in Deep Ink; optional qualifiers ("max 400 characters") trail in Quiet Grey at normal weight. Hints sit below at 11.5px in Quiet Grey and carry worked examples, not instructions.
- Textareas resize vertically only, from a 100px floor, at 1.65 line-height.

### App Icon

The favicon is the summit wordmark's **starburst** — ten rays radiating from a common centre, six in Civic Amber and four short ones in Alarm Red — set on a Midnight Charter Navy tile with softly rounded corners. Ray angles and radii are traced from the wordmark itself, but the stroke is optically widened (and widened further at 16px) so the burst still reads as a burst in a browser tab rather than collapsing into noise. The navy tile is deliberate: it holds contrast against both light and dark tab bars, where a transparent mark would not.

### Modal

Rounded at 16px, capped at 540px, entering with a short 250ms rise-and-fade on a decisive ease-out curve. The backdrop is a 60% navy-black wash with a 4px blur. Its header is a Midnight Charter Navy block with the gradient stripe; the close control is a translucent white circle in the top-right corner.

---

## 5. Layout Principles

- **Measure:** every band is full-bleed with `5vw` side padding, but content is centred within a **1100px maximum**. Nothing ever spans the full viewport width.
- **Grid:** the main region is a two-column grid — a fluid feed beside a fixed **320px** sidebar, separated by a 28px gutter. Below 900px the grid collapses to one column and the sidebar moves *above* the feed, so context precedes content on small screens.
- **Sticky layering:** the navigation bar pins at the top (64px tall), and the filter bar pins directly beneath it at `top: 64px`. The two form a persistent 2-tier control surface; z-indices are 100 and 90 respectively.
- **Horizontal banding:** the page is a stack of full-width bands — navy hero, white "how it works" strip, tinted control bar, paper canvas, navy footer. Each transition is marked by a hairline border, never by a gap.
- **Rhythm:** 16px between feed cards, 20px between sidebar cards, 20px between form fields, 8–10px inside dense metadata rows. Paired form fields (name/email, role/organisation) share a two-column grid with a 16px gutter that collapses to one column below 600px.
- **Shadow discipline:** the resting state of the entire page is flat. Elevation appears only on hover (cards) and for the modal. Depth signals interaction, not hierarchy.
