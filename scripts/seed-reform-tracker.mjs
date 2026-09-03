/**
 * Seeds demonstration Reform Signals and their editorial synthesis into an existing event.
 *
 * Usage:
 *   node scripts/seed-reform-tracker.mjs --event PULSE55 --confirm
 *   node scripts/seed-reform-tracker.mjs --event PULSE55 --synthesis-only --confirm
 *
 * The deterministic `sample-reform-*` ids make the script safe to re-run while
 * ensuring it never overwrites rapporteur-created commitments.
 */
import { applicationDefault, initializeApp } from "firebase-admin/app"
import { FieldValue, getFirestore } from "firebase-admin/firestore"

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "pulse-connect-9ab4c"
const args = new Set(process.argv.slice(2))
const eventFlagIndex = process.argv.indexOf("--event")
const EVENT_ID = eventFlagIndex >= 0 ? process.argv[eventFlagIndex + 1]?.trim().toUpperCase() : ""
const SYNTHESIS_ONLY = args.has("--synthesis-only")

if (!EVENT_ID || !args.has("--confirm")) {
  console.error("Usage: node scripts/seed-reform-tracker.mjs --event EVENT_CODE [--synthesis-only] --confirm")
  process.exit(1)
}

const SIGNALS = [
  {
    id: "sample-reform-health-01",
    lab: "health",
    signalNumber: 1,
    signalCode: "",
    problem: "Primary healthcare funding releases are not consistently published at LGA and facility level, leaving communities unable to compare approved funds with what actually arrived.",
    publicChange: "Residents can see, by LGA and facility, how much PHC funding was approved, released and received each quarter.",
    signalType: "committed-action",
    statement: "Publish quarterly PHC fund-release data by LGA",
    leadActor: "Federal Ministry of Health and Social Welfare, NPHCDA and state health ministries",
    confirmationStatus: "yes",
    confirmationNote: "The commitment was read back in the lab and recorded as confirmed by the responsible public actors.",
    intendedOutcome: "First public quarterly PHC release dashboard published",
    milestoneDate: "2026-12-15",
    evidenceOfProgress: "A public dashboard link and downloadable LGA-level release file",
    trackerReadiness: "ready",
    readBackConfirmed: true,
    outstandingItems: "Confirm the common facility identifier used across participating states.",
    headline: true,
    predictionSummary: { promptId: "sample-health-prediction", stalled: 8, progressing: 24, completed: 8, total: 40 },
  },
  {
    id: "sample-reform-water-01",
    lab: "water",
    signalNumber: 1,
    signalCode: "",
    problem: "Communities cannot easily tell whether delayed rural water schemes are held up by funding releases, procurement or contractor performance.",
    publicChange: "People can check the funding, procurement stage, contractor and delivery status of every priority rural water scheme.",
    signalType: "reform-opportunity",
    statement: "Disclose delivery status for stalled rural water schemes",
    leadActor: "Federal and state water ministries, RUWASSA agencies and procurement authorities",
    confirmationStatus: "requires-confirmation",
    confirmationNote: "Publication format is agreed in principle; named owners still require executive confirmation.",
    intendedOutcome: "Priority scheme status register published in a reusable format",
    milestoneDate: "2027-01-31",
    evidenceOfProgress: "A scheme register showing appropriation, release, procurement stage and expected completion date",
    trackerReadiness: "ready",
    readBackConfirmed: true,
    outstandingItems: "Confirm which agency will maintain the consolidated register.",
    headline: true,
    predictionSummary: { promptId: "sample-water-prediction", stalled: 17, progressing: 18, completed: 5, total: 40 },
  },
  {
    id: "sample-reform-education-01",
    lab: "education",
    signalNumber: 1,
    signalCode: "",
    problem: "Education budgets rarely show how allocations affect girls, children with disabilities and learners in underserved communities.",
    publicChange: "Citizens can see who benefits from education spending and whether allocations reduce gender and access gaps.",
    signalType: "advocacy-priority",
    statement: "Adopt a gender-responsive education budget framework",
    leadActor: "Federal and state education ministries, finance ministries and legislative education committees",
    confirmationStatus: "yes",
    confirmationNote: "Lab actors confirmed a pilot framework and a first review cycle.",
    intendedOutcome: "Pilot framework applied to the next education budget call circular",
    milestoneDate: "2027-03-01",
    evidenceOfProgress: "Published budget call circular with gender and inclusion markers",
    trackerReadiness: "ready",
    readBackConfirmed: true,
    outstandingItems: "Agree the minimum indicators for disability inclusion.",
    headline: true,
    predictionSummary: { promptId: "sample-education-prediction", stalled: 6, progressing: 26, completed: 8, total: 40 },
  },
  {
    id: "sample-reform-social-01",
    lab: "social-protection",
    signalNumber: 1,
    signalCode: "",
    problem: "Outdated beneficiary registers can exclude newly vulnerable households while continuing payments against records that are no longer valid.",
    publicChange: "Eligible households can verify and correct their records through a transparent annual community validation process.",
    signalType: "committed-action",
    statement: "Revalidate cash-transfer beneficiary registers annually",
    leadActor: "National Social Investment Programme Agency and state social protection offices",
    confirmationStatus: "yes",
    confirmationNote: "Annual validation was confirmed as the first practical action.",
    intendedOutcome: "Community validation completed in an initial group of pilot LGAs",
    milestoneDate: "2027-02-28",
    evidenceOfProgress: "Published validation protocol, pilot LGA list and summary of corrected records",
    trackerReadiness: "ready",
    readBackConfirmed: true,
    outstandingItems: "Publish a grievance route for households excluded during validation.",
    headline: true,
    predictionSummary: { promptId: "sample-social-prediction", stalled: 9, progressing: 20, completed: 11, total: 40 },
  },
  {
    id: "sample-reform-debt-01",
    lab: "debt-accountability",
    signalNumber: 1,
    signalCode: "",
    problem: "Published debt information does not consistently connect each loan to the project financed, delivery milestones and results experienced by citizens.",
    publicChange: "Citizens and journalists can trace each major public loan from approval and disbursement to a named project and measurable outcome.",
    signalType: "evidence-gap",
    statement: "Link every major public loan to project-level outcomes",
    leadActor: "Debt Management Office, finance ministries and implementing MDAs",
    confirmationStatus: "requires-confirmation",
    confirmationNote: "Data fields are agreed; publication responsibility and update frequency still require confirmation.",
    intendedOutcome: "A project-level debt disclosure prototype published for public review",
    milestoneDate: "2027-04-30",
    evidenceOfProgress: "Downloadable loan-to-project dataset with implementing agency, location, disbursement and milestone fields",
    trackerReadiness: "ready",
    readBackConfirmed: true,
    outstandingItems: "Agree the threshold for loans included in the first release.",
    headline: true,
    predictionSummary: { promptId: "sample-debt-prediction", stalled: 19, progressing: 17, completed: 4, total: 40 },
  },
]

const SYNTHESIS = [
  {
    id: "cross-lab-01",
    kind: "cross-lab",
    order: 1,
    eyebrow: "Traceability",
    title: "Make every naira traceable to the last mile.",
    summary: "Across health, water, education and debt, the recurring demand is the same: connect public money to a place, a service and the people meant to benefit.",
    action: "Publish reusable records that join allocation, release, delivery location and result.",
    labIds: ["health", "water", "education", "debt-accountability"],
    commitmentIds: ["sample-reform-health-01", "sample-reform-water-01", "sample-reform-education-01", "sample-reform-debt-01"],
    evidence: ["PHC releases by LGA and facility", "Water schemes linked to procurement and delivery status", "Loans connected to named projects and outcomes"],
  },
  {
    id: "cross-lab-02",
    kind: "cross-lab",
    order: 2,
    eyebrow: "Delivery",
    title: "Publish delivery, not just allocation.",
    summary: "A budget line or loan approval is only the beginning. The signals ask institutions to show where implementation sits, what is blocked and when the public should expect movement.",
    action: "Track a first milestone, current delivery stage and expected completion date for every reform.",
    labIds: ["health", "water", "education", "social-protection", "debt-accountability"],
    commitmentIds: SIGNALS.map((signal) => signal.id),
    evidence: ["Quarterly release dashboard", "Scheme status register", "Pilot frameworks and validation cycles", "Project-level debt disclosure"],
  },
  {
    id: "cross-lab-03",
    kind: "cross-lab",
    order: 3,
    eyebrow: "Public value",
    title: "Measure reform through people’s experience.",
    summary: "The strongest shared measure is not whether an agency completed a process, but whether residents can see, access, verify or correct the public service that process was meant to improve.",
    action: "Write outcomes in public language and test them against a visible change in people’s lives.",
    labIds: ["health", "water", "education", "social-protection", "debt-accountability"],
    commitmentIds: SIGNALS.map((signal) => signal.id),
    evidence: ["Residents see what reached facilities", "Communities see why schemes stall", "Households verify and correct beneficiary records"],
  },
  {
    id: "cross-lab-04",
    kind: "cross-lab",
    order: 4,
    eyebrow: "Ownership",
    title: "Name the owner and the first proof point.",
    summary: "Momentum becomes credible when each signal names the institutions that must act, the first dated milestone and the evidence that will show whether anything changed.",
    action: "No signal goes live without a lead actor, milestone and observable proof of progress.",
    labIds: ["health", "water", "education", "social-protection", "debt-accountability"],
    commitmentIds: SIGNALS.map((signal) => signal.id),
    evidence: ["A responsible institution for every signal", "A dated milestone between December 2026 and April 2027", "A public artefact as evidence"],
  },
  {
    id: "cross-lab-05",
    kind: "cross-lab",
    order: 5,
    eyebrow: "Inclusion",
    title: "Build accountability with a correction route.",
    summary: "Transparency becomes useful when excluded people can challenge the record. Education and social protection make this explicit; the same principle strengthens every public dataset in the tracker.",
    action: "Pair publication with inclusion markers, public review and a route to correct missing or inaccurate records.",
    labIds: ["education", "social-protection", "health", "water", "debt-accountability"],
    commitmentIds: ["sample-reform-education-01", "sample-reform-social-01", "sample-reform-health-01", "sample-reform-water-01", "sample-reform-debt-01"],
    evidence: ["Gender and disability markers in education budgets", "Community validation of beneficiary records", "Public review of the loan-to-project prototype"],
  },
  {
    id: "lab-health",
    kind: "lab-theme",
    order: 1,
    eyebrow: "Health Lab",
    title: "Last-mile funding visibility",
    summary: "Make PHC funding releases visible at the LGA and facility where services are delivered.",
    action: "Follow approved funds through release to receipt.",
    labIds: ["health"],
    commitmentIds: ["sample-reform-health-01"],
    evidence: ["Quarterly LGA and facility release data"],
  },
  {
    id: "lab-water",
    kind: "lab-theme",
    order: 2,
    eyebrow: "Water Lab",
    title: "Bottleneck visibility",
    summary: "Show whether stalled schemes are blocked by funding, procurement or contractor delivery.",
    action: "Expose the stage, owner and expected completion date.",
    labIds: ["water"],
    commitmentIds: ["sample-reform-water-01"],
    evidence: ["Reusable rural water scheme status register"],
  },
  {
    id: "lab-education",
    kind: "lab-theme",
    order: 3,
    eyebrow: "Education Lab",
    title: "Equity by design",
    summary: "Make the distributional effect of education spending visible for underserved learners.",
    action: "Embed gender, disability and access markers in budgets.",
    labIds: ["education"],
    commitmentIds: ["sample-reform-education-01"],
    evidence: ["Inclusive budget call circular"],
  },
  {
    id: "lab-social-protection",
    kind: "lab-theme",
    order: 4,
    eyebrow: "Social Protection Lab",
    title: "A living social register",
    summary: "Keep beneficiary records current and give eligible households a transparent correction route.",
    action: "Validate registers annually with communities.",
    labIds: ["social-protection"],
    commitmentIds: ["sample-reform-social-01"],
    evidence: ["Published validation protocol and corrected-record summary"],
  },
  {
    id: "lab-debt-accountability",
    kind: "lab-theme",
    order: 5,
    eyebrow: "Debt & Accountability Lab",
    title: "Finance-to-outcome traceability",
    summary: "Connect each major loan to the project, location, milestones and public result it finances.",
    action: "Publish a reusable loan-to-project record.",
    labIds: ["debt-accountability"],
    commitmentIds: ["sample-reform-debt-01"],
    evidence: ["Project-level debt disclosure dataset"],
  },
]

async function main() {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID })
  const db = getFirestore()
  const eventRef = db.collection("events").doc(EVENT_ID)
  const eventSnapshot = await eventRef.get()

  if (!eventSnapshot.exists) throw new Error(`Event ${EVENT_ID} does not exist.`)

  const batch = db.batch()
  if (!SYNTHESIS_ONLY) {
    for (const { id, ...signal } of SIGNALS) {
      const ref = eventRef.collection("commitments").doc(id)
      const existing = await ref.get()
      batch.set(ref, {
        ...signal,
        status: "published",
        revision: 1,
        actualStatus: null,
        evidenceNote: "",
        evidenceSources: [],
        publishedAt: FieldValue.serverTimestamp(),
        verifiedAt: null,
        createdAt: existing.exists ? existing.get("createdAt") : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
  }

  for (const { id, ...point } of SYNTHESIS) {
    const ref = eventRef.collection("synthesis").doc(id)
    const existing = await ref.get()
    batch.set(ref, {
      ...point,
      status: "published",
      createdAt: existing.exists ? existing.get("createdAt") : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()
  console.log(`Seeded ${SYNTHESIS_ONLY ? 0 : SIGNALS.length} Reform Signals and ${SYNTHESIS.length} synthesis points into ${PROJECT_ID}/${EVENT_ID}.`)
  if (!SYNTHESIS_ONLY) for (const signal of SIGNALS) console.log(`  ${signal.lab.padEnd(19)} ${signal.statement}`)
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("Reform Tracker seed failed:", error.message)
    process.exit(1)
  },
)
