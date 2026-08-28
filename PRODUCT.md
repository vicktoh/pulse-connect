# Product: PULSE Community

> Synthesized from README.md, DESIGN.md, firestore.rules and the component tree.
> Not from an interview. Correct anything that misreads the intent.

**Register:** product (with one brand-register surface: the hero band)

The board, the submit flow, the filters and the moderation queue are task surfaces
where design serves the work. The hero band above them is the one place design is
doing persuasion, so it is allowed a single orchestrated entrance. Nothing below
the hero gets page-load choreography: a reader arriving at the feed is reading,
not watching.

## Product purpose

`thepulsesummit.org/community` is the public submissions board for PULSE Summit
2026, run by International Budget Partnership (IBP) Nigeria. People who have seen
a public finance breakdown up close put it on record. IBP moderates and publishes.
The strongest accounts shape the next PULSE cycle.

The unit of value is **testimony**: one person's first-person observation of where
money did not reach people, plus what changed it or could.

## Users

- **The contributor.** A programme officer, health worker, community monitor, or
  civil servant in Nigeria. Often on a mid-range Android phone, often on a
  constrained connection. Has two minutes and some hesitation about whether their
  account belongs here. The submit flow's job is to reduce that hesitation and
  make the handoff to IBP feel like it landed somewhere serious.
- **The reader.** Someone scanning the board for accounts in their sector,
  looking for corroboration or precedent. Scans by sector colour before reading
  a word.
- **The corroborator.** A reader who recognises what they are reading and presses
  "I have seen this too." This is the only public gesture the product offers a
  non-submitter, so it carries disproportionate weight.
- **The moderator.** IBP staff at `/admin`, working a queue. Wants throughput and
  certainty that a decision was recorded, not delight.

## Brand and tone

Institutional, editorial, evidence-first. Closer to a policy journal's web
edition than to a social feed. The core visual argument, from DESIGN.md: where
the institution speaks the surface goes navy, where a citizen speaks it is
paper-white.

Copy is plain, unhurried, and never performs urgency. "We will review what you
have shared" is the register, not "You're all set!"

## Anti-references

- Social feeds. No likes, no vanity counters, no engagement mechanics. "I have
  seen this too" is corroboration, not applause, and must never animate like a
  heart button: no particles, no confetti, no burst.
- SaaS product marketing. No hero-metric template, no gradient text, no glass.
- Celebration patterns on submission. The account is under review, not approved.
  Motion at that moment should read as "received and recorded", not "congrats".

## Strategic principles

1. **Never state something false while loading.** DESIGN.md's em-dash rule for
   stats generalises: a board that flashes "0 experiences shared" before
   correcting itself has made a claim about the world. Loading states show
   absence, never zero.
2. **Sector colour is load-bearing.** It appears in exactly four places per
   submission and means one thing. Motion may carry it but never invents it.
3. **Alarm Red signals urgency, never error.** Error states stay colourless.
4. **Verification Green means confirmed, published, endorsed.** A pending
   submission must never be marked with it.
5. **Elevation signals interaction, not hierarchy.** The resting page is flat.
   Motion follows the same rule: it responds to what a person did, or it reports
   a change in state. It does not decorate.
6. **The rules are the enforcement layer.** Nothing in the UI, animated or
   otherwise, may imply a guarantee that `firestore.rules` does not make.

## Constraints

- Next.js 16, React 19, Tailwind v4, shadcn on Base UI, Firestore. No animation
  library in `package.json`, and adding one for this is not warranted: CSS plus
  the existing `tw-animate-css` covers it.
- Mid-range Android on a slow connection is the performance target. Composited
  properties only, bounded effect areas, no motion that delays interactivity.
- `prefers-reduced-motion` is honoured globally, not per-component.
