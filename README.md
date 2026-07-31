# PULSE Community

The community submissions board for [PULSE Summit 2026](https://thepulsesummit.org) —
International Budget Partnership Nigeria. People who have seen a public finance
breakdown up close put it on record; IBP moderates and publishes; the strongest
accounts shape the next PULSE cycle.

Next.js 16 · React 19 · Tailwind v4 · shadcn (Base UI) · Firestore

- **[DESIGN.md](DESIGN.md)** is the design system source of truth.
- **[firestore.rules](firestore.rules)** is the entire security enforcement layer.

## Getting started

```bash
npm install
npm run dev
```

Copy `env.example` to `.env.local` and fill in the Firebase web config
(Console → Project settings → General → Your apps). None of those values are
secrets — the web API key is a project identifier, and every access decision is
made by `firestore.rules`.

## Firebase setup

These steps are done once per project. The Firestore database for
`pulse-connect-9ab4c` already exists in `europe-west1`.

1. **Enable Authentication** in the Firebase Console, then turn on the
   **Anonymous** and **Email/Password** providers. Anonymous auth is what
   deduplicates "I have seen this too" and stamps submissions; email/password is
   for moderators only.
2. **Create a moderator account** under Authentication → Users.
3. **Grant it the moderation claim:**
   ```bash
   npm run admin:claim -- moderator@example.org
   ```
   They must sign out and back in for the claim to take effect. Revoke with
   `-- moderator@example.org --revoke`.
4. **Deploy rules and indexes:**
   ```bash
   npx firebase deploy --only firestore:rules,firestore:indexes
   ```
5. **Seed the founding submissions** (idempotent, safe to re-run):
   ```bash
   npm run seed
   ```

## Working locally against emulators

Exercises the full submit → moderate → publish loop without touching live data.
Requires JDK 21+ (`brew install openjdk@21`).

```bash
npm run emulators        # terminal 1
npm run dev:emulators    # terminal 2
```

Seed the emulator by prefixing the seed script:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed
```

## Security rules

The rules are the enforcement layer — `/admin` only hides controls, it does not
protect data. Run the suite before changing them:

```bash
npm run rules:test
```

It covers read gating, submission validation, contact-email privacy, the support
toggle (including double-support, double-withdrawal and counter-inflation
attempts), and the moderation whitelist.

Two constraints shape the data model:

- **A submitter's email is never in a publicly readable document.** Rules gate
  whole documents, not fields, so the email lives in
  `submissionContacts/{submissionId}`, readable only by an admin, and is written
  in the same atomic batch as the submission.
- **The support count is validatable without Cloud Functions.** Each ±1 change
  must be accompanied, in the same batch, by the matching
  `supports/{submissionId}_{uid}` ledger document appearing or disappearing.

## Data model

| Collection | Read | Write |
| --- | --- | --- |
| `submissions` | Public when `moderation == "approved"`; admin sees all | Public create (forced to `pending`); support ±1; admin moderation |
| `submissionContacts` | Admin only | Create-once alongside a submission |
| `supports` | Own documents only | Create/delete own ledger entry |

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server against live Firestore |
| `npm run dev:emulators` | Dev server against local emulators |
| `npm run emulators` | Firestore + Auth emulators |
| `npm run rules:test` | Security rules suite |
| `npm run seed` | Seed the founding submissions |
| `npm run admin:claim -- <email>` | Grant/revoke the moderation claim |
