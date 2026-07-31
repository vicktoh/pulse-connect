/**
 * Seeds the five founding submissions. Run with: npm run seed
 *
 * Uses firebase-admin on Application Default Credentials, which bypasses
 * security rules — that is why this script can write `moderation: "approved"`
 * and a non-zero `supportCount`, both of which firestore.rules forbid a public
 * client from doing.
 *
 * Idempotent: the document ids are deterministic (`seed-1` … `seed-6`, keeping
 * the numbers from the original hardcoded array for traceability), so
 * re-running restores a known state rather than duplicating.
 *
 * If ADC complains about a quota project:
 *   gcloud auth application-default set-quota-project pulse-connect-9ab4c
 */
import { applicationDefault, initializeApp } from "firebase-admin/app"
import { Timestamp, getFirestore } from "firebase-admin/firestore"

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "pulse-connect-9ab4c"

/**
 * Noon UTC, not midnight: the display string is formatted in the reader's
 * locale, and noon keeps the calendar day stable in every timezone on earth.
 */
function day(iso) {
  return Timestamp.fromDate(new Date(`${iso}T12:00:00.000Z`))
}

const SUBMISSIONS = [
  {
    id: "seed-1",
    name: "Chukwuemeka Obi",
    role: "Executive Director",
    org: "BudgetLab Nigeria",
    sector: "health",
    status: "cited",
    observed:
      "In Enugu State, PHC overhead funds approved in the 2024 budget were never released below state level. Facility staff received no operational funds for 9 consecutive months. Basic services continued only because staff worked without pay.",
    changed:
      "When our CSO published a monthly fund-release tracker and shared it with ward health committees, the state Ministry acknowledged the gap publicly for the first time. Partial releases began within 6 weeks.",
    supportCount: 47,
    createdAt: day("2026-07-12"),
    ibpResponse:
      "This scenario directly informs how we are structuring the Health Lab evidence brief. We are tracking similar patterns across states. If you are willing to present this as a case study on September 3, please contact the Secretariat.",
  },
  {
    id: "seed-2",
    name: "Maryam Salisu",
    role: "Programme Manager",
    org: "Community Action for Poverty Alleviation",
    sector: "social",
    status: "received",
    observed:
      "Cash transfer lists in Katsina LGAs were drawn up in 2022 and never updated. By 2025, 30% of listed beneficiaries had died or relocated, but payments continued to go to their old addresses, collected by unknown third parties.",
    changed:
      "A community verification exercise run jointly by our CSO and the LGA social development officer corrected 847 records in one cycle. The state government has since committed to annual re-verification.",
    supportCount: 38,
    createdAt: day("2026-07-08"),
    ibpResponse: null,
  },
  {
    id: "seed-3",
    name: "Ibrahim Tanko",
    role: "PhD Researcher",
    org: "Bayero University Kano",
    sector: "wash",
    status: "review",
    observed:
      'Rural water scheme capital votes in Kano State have been approved for three consecutive years, but procurement processes for the same contracts have been restarted from scratch each year due to "administrative issues." No borehole has been completed.',
    changed:
      "It is not clear what would resolve this without an independent procurement audit. The pattern suggests deliberate delay rather than capacity failure.",
    supportCount: 29,
    createdAt: day("2026-07-05"),
    ibpResponse: null,
  },
  {
    id: "seed-4",
    name: "Ngozi Okonkwo",
    role: "Programme Officer",
    org: "Concerned Citizens Initiative",
    sector: "education",
    status: "received",
    observed:
      "Capitation grants in Imo State reach school accounts but are controlled entirely by headteachers with no parent or community visibility. In 14 schools we monitored, less than 40% of funds were spent on the purposes stipulated.",
    changed:
      "In the 3 schools where PTAs were shown the grant allocation and asked to approve expenditure plans, utilisation improved to above 80% within one academic term.",
    supportCount: 22,
    createdAt: day("2026-07-03"),
    ibpResponse: null,
  },
  {
    id: "seed-6",
    name: "Funmilayo Adeyemo",
    role: "Economic Journalist",
    org: "The Cable Nigeria",
    sector: "debt",
    status: "received",
    observed:
      "Nigeria's annual debt service disclosure at federal level does not disaggregate by state-level project outcomes. Journalists cannot connect a specific loan to a specific road, hospital, or school, making accountability reporting almost impossible.",
    changed:
      "The Debt Management Office has a project-level database that it does not publish. A simple FOIA request we filed in 2024 produced partial data that allowed us to trace 3 specific loans to zero-outcome projects. Public disclosure would transform this.",
    supportCount: 31,
    createdAt: day("2026-06-29"),
    ibpResponse: null,
  },
]

async function main() {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID })
  const db = getFirestore()

  const batch = db.batch()
  for (const { id, ...data } of SUBMISSIONS) {
    batch.set(db.collection("submissions").doc(id), {
      ...data,
      moderation: "approved",
      // These were published with the platform, so publication is their creation.
      publishedAt: data.createdAt,
      authorUid: "seed",
    })
  }
  await batch.commit()

  // Deliberately NOT seeded:
  //  - `supports` ledger docs. The rules never assert that supportCount equals
  //    the ledger size, only that each *change* is accompanied by one. Writing
  //    167 ledger documents would buy nothing.
  //  - `submissionContacts`. These five records have no email on file, so the
  //    admin card must handle a missing contact rather than assume one.

  console.log(`Seeded ${SUBMISSIONS.length} submissions to ${PROJECT_ID}.`)
  for (const s of SUBMISSIONS) {
    console.log(`  ${s.id}  ${s.sector.padEnd(10)} ${s.createdAt.toDate().toISOString().slice(0, 10)}  ${s.name}`)
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("Seed failed:", error.message)
    process.exit(1)
  }
)
