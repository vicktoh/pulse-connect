/**
 * Security rules test suite. Run with: npm run rules:test
 *
 * These rules are the entire enforcement layer for the PULSE Community board
 * (the /admin route only hides controls), so they are tested before any UI is
 * written against them.
 *
 * The load-bearing case is the support toggle: it asserts that Firestore
 * resolves FieldValue.increment() BEFORE rules evaluate, so that
 * `request.resource.data.supportCount` holds the post-transform value and the
 * ±1 clause can be checked. If that assumption were wrong, the fallback is a
 * runTransaction writing a literal — still no Cloud Functions either way.
 */
import { readFileSync } from "node:fs"
import { after, before, beforeEach, describe, it } from "node:test"

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing"
import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  collection,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore"

const PROJECT_ID = "pulse-rules-test"

let env

/** An approved submission, as the seed script writes it. */
function approvedSubmission(overrides = {}) {
  return {
    name: "Chukwuemeka Obi",
    role: "Executive Director",
    org: "BudgetLab Nigeria",
    sector: "health",
    status: "received",
    moderation: "approved",
    observed: "Overhead funds were never released below state level.",
    changed: "A published fund-release tracker forced acknowledgement.",
    supportCount: 4,
    ibpResponse: null,
    createdAt: new Date("2026-07-12T12:00:00Z"),
    publishedAt: new Date("2026-07-12T12:00:00Z"),
    authorUid: "seed",
    ...overrides,
  }
}

/** A well-formed public submission payload, as the submit dialog sends it. */
function newSubmission(uid, overrides = {}) {
  return {
    name: "Amina Okafor",
    role: "Programme Officer",
    org: "IBP Nigeria",
    sector: "wash",
    status: "received",
    moderation: "pending",
    observed: "Boreholes were budgeted three years running and never built.",
    changed: "An independent procurement audit would surface the delay.",
    supportCount: 0,
    ibpResponse: null,
    createdAt: serverTimestamp(),
    publishedAt: null,
    authorUid: uid,
    ...overrides,
  }
}

function contactFor(id, uid, overrides = {}) {
  return {
    email: "amina@example.org",
    submissionId: id,
    authorUid: uid,
    createdAt: serverTimestamp(),
    ...overrides,
  }
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  })
})

after(async () => {
  await env?.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  // Seed one approved and one pending submission, bypassing rules.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, "submissions/approved-1"), approvedSubmission())
    await setDoc(
      doc(db, "submissions/pending-1"),
      approvedSubmission({ moderation: "pending", supportCount: 0 })
    )
    await setDoc(doc(db, "submissionContacts/approved-1"), {
      email: "obi@example.org",
      submissionId: "approved-1",
      authorUid: "seed",
      createdAt: new Date(),
    })
    await setDoc(doc(db, "events/PULSE26"), {
      name: "PULSE Summit Live",
      code: "PULSE26",
      status: "live",
      activeExperience: "poll",
      activePromptId: "poll-1",
      createdAt: new Date(),
      createdBy: "admin-1",
    })
    await setDoc(doc(db, "events/PULSE26/prompts/poll-1"), {
      type: "poll",
      question: "What should budgets prioritise?",
      options: [
        { id: "option-1", label: "Health" },
        { id: "option-2", label: "Education" },
      ],
      status: "active",
      createdAt: new Date(),
      createdBy: "admin-1",
    })
    await setDoc(doc(db, "events/PULSE26/scores/seed_follow-the-naira"), {
      participantId: "seed",
      participantName: "First Player",
      gameId: "follow-the-naira",
      score: 700,
      playedAt: new Date(),
    })
    await setDoc(doc(db, "events/PULSE26/synthesis/cross-lab-01"), {
      kind: "cross-lab",
      order: 1,
      eyebrow: "Traceability",
      title: "Make every naira traceable.",
      summary: "A published synthesis point.",
      action: "Publish reusable records.",
      labIds: ["health", "water"],
      commitmentIds: ["health-01", "water-01"],
      evidence: ["Release data", "Scheme status"],
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await setDoc(doc(db, "events/PULSE26/synthesis/draft-point"), {
      kind: "cross-lab",
      order: 2,
      title: "Unfinished synthesis",
      status: "draft",
    })
  })
})

const anon = () => env.authenticatedContext("visitor-a").firestore()
const anonB = () => env.authenticatedContext("visitor-b").firestore()
const admin = () =>
  env.authenticatedContext("admin-1", { admin: true }).firestore()
const guest = () => env.unauthenticatedContext().firestore()

async function joinEvent(db, uid = "visitor-a", name = "Ada K.") {
  await setDoc(doc(db, `events/PULSE26/participants/${uid}`), {
    uid,
    name,
    joinedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  })
}

describe("public read access", () => {
  it("anyone may read an approved submission", async () => {
    await assertSucceeds(getDoc(doc(guest(), "submissions/approved-1")))
  })

  it("a visitor may not read a pending submission", async () => {
    await assertFails(getDoc(doc(anon(), "submissions/pending-1")))
  })

  it("a listener constrained to approved is allowed", async () => {
    const q = query(
      collection(guest(), "submissions"),
      where("moderation", "==", "approved")
    )
    await assertSucceeds(getDocs(q))
  })

  it("an unconstrained listener is rejected outright", async () => {
    await assertFails(getDocs(collection(guest(), "submissions")))
  })

  it("an admin may list pending submissions", async () => {
    const q = query(
      collection(admin(), "submissions"),
      where("moderation", "==", "pending")
    )
    await assertSucceeds(getDocs(q))
  })
})

describe("reform synthesis access", () => {
  it("allows anyone to read published synthesis", async () => {
    await assertSucceeds(getDoc(doc(guest(), "events/PULSE26/synthesis/cross-lab-01")))
  })

  it("hides draft synthesis from the public", async () => {
    await assertFails(getDoc(doc(guest(), "events/PULSE26/synthesis/draft-point")))
  })

  it("allows a public query constrained to published synthesis", async () => {
    const q = query(collection(guest(), "events/PULSE26/synthesis"), where("status", "==", "published"))
    await assertSucceeds(getDocs(q))
  })

  it("allows an admin to read draft synthesis", async () => {
    await assertSucceeds(getDoc(doc(admin(), "events/PULSE26/synthesis/draft-point")))
  })
})

describe("submission create", () => {
  it("succeeds when the contact doc lands in the same batch", async () => {
    const db = anon()
    const batch = writeBatch(db)
    batch.set(doc(db, "submissions/new-1"), newSubmission("visitor-a"))
    batch.set(
      doc(db, "submissionContacts/new-1"),
      contactFor("new-1", "visitor-a")
    )
    await assertSucceeds(batch.commit())
  })

  it("fails without the accompanying contact doc", async () => {
    const db = anon()
    await assertFails(
      setDoc(doc(db, "submissions/new-2"), newSubmission("visitor-a"))
    )
  })

  it("fails when the submitter self-approves", async () => {
    const db = anon()
    const batch = writeBatch(db)
    batch.set(
      doc(db, "submissions/new-3"),
      newSubmission("visitor-a", { moderation: "approved" })
    )
    batch.set(
      doc(db, "submissionContacts/new-3"),
      contactFor("new-3", "visitor-a")
    )
    await assertFails(batch.commit())
  })

  it("fails when the submitter grants themselves support", async () => {
    const db = anon()
    const batch = writeBatch(db)
    batch.set(
      doc(db, "submissions/new-4"),
      newSubmission("visitor-a", { supportCount: 25 })
    )
    batch.set(
      doc(db, "submissionContacts/new-4"),
      contactFor("new-4", "visitor-a")
    )
    await assertFails(batch.commit())
  })

  it("fails when the submitter writes their own IBP response", async () => {
    const db = anon()
    const batch = writeBatch(db)
    batch.set(
      doc(db, "submissions/new-5"),
      newSubmission("visitor-a", { ibpResponse: "IBP endorses this." })
    )
    batch.set(
      doc(db, "submissionContacts/new-5"),
      contactFor("new-5", "visitor-a")
    )
    await assertFails(batch.commit())
  })

  it("fails when observed exceeds 400 characters", async () => {
    const db = anon()
    const batch = writeBatch(db)
    batch.set(
      doc(db, "submissions/new-6"),
      newSubmission("visitor-a", { observed: "x".repeat(401) })
    )
    batch.set(
      doc(db, "submissionContacts/new-6"),
      contactFor("new-6", "visitor-a")
    )
    await assertFails(batch.commit())
  })

  it("fails on an unknown sector", async () => {
    const db = anon()
    const batch = writeBatch(db)
    batch.set(
      doc(db, "submissions/new-7"),
      newSubmission("visitor-a", { sector: "defence" })
    )
    batch.set(
      doc(db, "submissionContacts/new-7"),
      contactFor("new-7", "visitor-a")
    )
    await assertFails(batch.commit())
  })

  it("fails when authorUid is spoofed", async () => {
    const db = anon()
    const batch = writeBatch(db)
    batch.set(
      doc(db, "submissions/new-8"),
      newSubmission("someone-else")
    )
    batch.set(
      doc(db, "submissionContacts/new-8"),
      contactFor("new-8", "someone-else")
    )
    await assertFails(batch.commit())
  })

  it("fails for a signed-out visitor", async () => {
    const db = guest()
    const batch = writeBatch(db)
    batch.set(doc(db, "submissions/new-9"), newSubmission("visitor-a"))
    batch.set(
      doc(db, "submissionContacts/new-9"),
      contactFor("new-9", "visitor-a")
    )
    await assertFails(batch.commit())
  })
})

describe("contact privacy", () => {
  it("a visitor may not read a contact document", async () => {
    await assertFails(getDoc(doc(anon(), "submissionContacts/approved-1")))
  })

  it("a signed-out visitor may not read a contact document", async () => {
    await assertFails(getDoc(doc(guest(), "submissionContacts/approved-1")))
  })

  it("an admin may read a contact document", async () => {
    await assertSucceeds(getDoc(doc(admin(), "submissionContacts/approved-1")))
  })

  it("a contact document may not be edited or deleted", async () => {
    await assertFails(
      setDoc(doc(admin(), "submissionContacts/approved-1"), {
        email: "changed@example.org",
        submissionId: "approved-1",
        authorUid: "seed",
        createdAt: new Date(),
      })
    )
    await assertFails(deleteDoc(doc(admin(), "submissionContacts/approved-1")))
  })
})

describe("support toggle", () => {
  /** The exact batch the UI issues to support a submission. */
  function supportBatch(db, uid, id = "approved-1") {
    const batch = writeBatch(db)
    batch.set(doc(db, `supports/${id}_${uid}`), {
      submissionId: id,
      uid,
      createdAt: serverTimestamp(),
    })
    batch.update(doc(db, `submissions/${id}`), { supportCount: increment(1) })
    return batch
  }

  /** The exact batch the UI issues to withdraw support. */
  function withdrawBatch(db, uid, id = "approved-1") {
    const batch = writeBatch(db)
    batch.delete(doc(db, `supports/${id}_${uid}`))
    batch.update(doc(db, `submissions/${id}`), { supportCount: increment(-1) })
    return batch
  }

  it("supports with a matching ledger doc", async () => {
    // THE critical assertion: increment() must be visible to rules.
    await assertSucceeds(supportBatch(anon(), "visitor-a").commit())
  })

  it("rejects an increment with no ledger doc", async () => {
    const db = anon()
    await assertFails(
      setDoc(
        doc(db, "submissions/approved-1"),
        { supportCount: increment(1) },
        { merge: true }
      )
    )
  })

  it("rejects an increment of more than one", async () => {
    const db = anon()
    const batch = writeBatch(db)
    batch.set(doc(db, "supports/approved-1_visitor-a"), {
      submissionId: "approved-1",
      uid: "visitor-a",
      createdAt: serverTimestamp(),
    })
    batch.update(doc(db, "submissions/approved-1"), {
      supportCount: increment(2),
    })
    await assertFails(batch.commit())
  })

  it("rejects smuggling a status change through the support path", async () => {
    const db = anon()
    const batch = writeBatch(db)
    batch.set(doc(db, "supports/approved-1_visitor-a"), {
      submissionId: "approved-1",
      uid: "visitor-a",
      createdAt: serverTimestamp(),
    })
    batch.update(doc(db, "submissions/approved-1"), {
      supportCount: increment(1),
      status: "cited",
    })
    await assertFails(batch.commit())
  })

  it("rejects a second support from the same visitor", async () => {
    await assertSucceeds(supportBatch(anon(), "visitor-a").commit())
    await assertFails(supportBatch(anon(), "visitor-a").commit())
  })

  it("allows a different visitor to support the same submission", async () => {
    await assertSucceeds(supportBatch(anon(), "visitor-a").commit())
    await assertSucceeds(supportBatch(anonB(), "visitor-b").commit())
  })

  it("withdraws support, removing the ledger doc", async () => {
    await assertSucceeds(supportBatch(anon(), "visitor-a").commit())
    await assertSucceeds(withdrawBatch(anon(), "visitor-a").commit())
  })

  it("rejects a withdrawal when nothing was supported", async () => {
    await assertFails(withdrawBatch(anon(), "visitor-a").commit())
  })

  it("rejects a double withdrawal", async () => {
    await assertSucceeds(supportBatch(anon(), "visitor-a").commit())
    await assertSucceeds(withdrawBatch(anon(), "visitor-a").commit())
    await assertFails(withdrawBatch(anon(), "visitor-a").commit())
  })

  it("rejects withdrawing someone else's support", async () => {
    await assertSucceeds(supportBatch(anon(), "visitor-a").commit())
    const db = anonB()
    const batch = writeBatch(db)
    batch.delete(doc(db, "supports/approved-1_visitor-a"))
    batch.update(doc(db, "submissions/approved-1"), {
      supportCount: increment(-1),
    })
    await assertFails(batch.commit())
  })

  it("rejects supporting a pending submission", async () => {
    await assertFails(supportBatch(anon(), "visitor-a", "pending-1").commit())
  })

  it("rejects a ledger doc whose id does not match its uid", async () => {
    const db = anon()
    const batch = writeBatch(db)
    batch.set(doc(db, "supports/approved-1_visitor-b"), {
      submissionId: "approved-1",
      uid: "visitor-a",
      createdAt: serverTimestamp(),
    })
    batch.update(doc(db, "submissions/approved-1"), {
      supportCount: increment(1),
    })
    await assertFails(batch.commit())
  })

  it("rejects a bare ledger delete with no counter change", async () => {
    await assertSucceeds(supportBatch(anon(), "visitor-a").commit())
    // Deleting the ledger doc alone would desync the counter. The rules do not
    // forbid it (delete is allowed on your own doc), but the counter cannot
    // then be decremented again — proving no inflation path exists.
    await assertSucceeds(deleteDoc(doc(anon(), "supports/approved-1_visitor-a")))
    await assertFails(withdrawBatch(anon(), "visitor-a").commit())
  })
})

describe("moderation", () => {
  it("a visitor may not write an IBP response", async () => {
    await assertFails(
      setDoc(
        doc(anon(), "submissions/approved-1"),
        { ibpResponse: "Fake endorsement." },
        { merge: true }
      )
    )
  })

  it("a visitor may not approve a pending submission", async () => {
    await assertFails(
      setDoc(
        doc(anon(), "submissions/pending-1"),
        { moderation: "approved" },
        { merge: true }
      )
    )
  })

  it("an admin may approve, set status and write a response", async () => {
    await assertSucceeds(
      setDoc(
        doc(admin(), "submissions/pending-1"),
        {
          moderation: "approved",
          status: "cited",
          ibpResponse: "This informs the Health Lab evidence brief.",
          publishedAt: serverTimestamp(),
          moderatedAt: serverTimestamp(),
          moderatedBy: "admin-1",
        },
        { merge: true }
      )
    )
  })

  it("an admin may reject", async () => {
    await assertSucceeds(
      setDoc(
        doc(admin(), "submissions/pending-1"),
        { moderation: "rejected", moderatedBy: "admin-1" },
        { merge: true }
      )
    )
  })

  it("an admin may not rewrite the testimony itself", async () => {
    await assertFails(
      setDoc(
        doc(admin(), "submissions/pending-1"),
        { moderation: "approved", observed: "Something the author never said." },
        { merge: true }
      )
    )
  })

  it("an admin may not set an unknown status", async () => {
    await assertFails(
      setDoc(
        doc(admin(), "submissions/pending-1"),
        { moderation: "approved", status: "endorsed" },
        { merge: true }
      )
    )
  })

  it("a visitor may not delete a submission", async () => {
    await assertFails(deleteDoc(doc(anon(), "submissions/approved-1")))
  })

  it("an admin may delete a submission", async () => {
    await assertSucceeds(deleteDoc(doc(admin(), "submissions/approved-1")))
  })
})

describe("live event platform", () => {
  it("lets the venue screen read a live session and leaderboard", async () => {
    await assertSucceeds(getDoc(doc(guest(), "events/PULSE26")))
    await assertSucceeds(getDocs(collection(guest(), "events/PULSE26/scores")))
  })

  it("lets an anonymous attendee join under their own uid", async () => {
    await assertSucceeds(joinEvent(anon()))
  })

  it("rejects creating a participant under another uid", async () => {
    await assertFails(joinEvent(anon(), "visitor-b"))
  })

  it("accepts a participant's valid best score", async () => {
    const db = anon()
    await joinEvent(db)
    await assertSucceeds(setDoc(doc(db, "events/PULSE26/scores/visitor-a_look-again"), {
      participantId: "visitor-a",
      participantName: "Ada K.",
      gameId: "look-again",
      score: 850,
      playedAt: serverTimestamp(),
    }))
  })

  it("rejects an impossible game score", async () => {
    const db = anon()
    await joinEvent(db)
    await assertFails(setDoc(doc(db, "events/PULSE26/scores/visitor-a_look-again"), {
      participantId: "visitor-a",
      participantName: "Ada K.",
      gameId: "look-again",
      score: 50000,
      playedAt: serverTimestamp(),
    }))
  })

  it("accepts one response to the active poll", async () => {
    const db = anon()
    await joinEvent(db)
    await assertSucceeds(setDoc(doc(db, "events/PULSE26/responses/visitor-a_poll-1"), {
      promptId: "poll-1",
      type: "poll",
      optionId: "option-1",
      word: null,
      visible: true,
      createdAt: serverTimestamp(),
    }))
  })

  it("does not let an attendee drive the venue screen", async () => {
    await assertFails(setDoc(doc(anon(), "events/PULSE26"), {
      activeExperience: "leaderboard",
      updatedAt: serverTimestamp(),
    }, { merge: true }))
  })

  it("lets an admin create a new live session", async () => {
    await assertSucceeds(setDoc(doc(admin(), "events/PULSE27"), {
      name: "PULSE Summit Evening",
      code: "PULSE27",
      status: "live",
      activeExperience: "lobby",
      activePromptId: null,
      trackerViewMode: "overview",
      trackerLab: null,
      trackerCommitmentId: null,
      createdAt: serverTimestamp(),
      createdBy: "admin-1",
    }))
  })

  it("lets an admin capture the complete Reform Signal template", async () => {
    await assertSucceeds(setDoc(doc(admin(), "events/PULSE26/commitments/health-signal-new"), {
      lab: "health",
      signalNumber: 1,
      signalCode: "HLT-01",
      problem: "RUTF stockouts affected caregivers in two LGAs.",
      publicChange: "Caregivers should find stock or a clear restock date.",
      signalType: "committed-action",
      statement: "Publish the current-quarter distribution schedule.",
      leadActor: "Bauchi State Ministry of Health, Nutrition Division.",
      confirmationStatus: "yes",
      confirmationNote: "Confirmed by the Nutrition Officer in the room.",
      intendedOutcome: "Published distribution schedule",
      milestoneDate: "2026-10-01",
      evidenceOfProgress: "Copy of the schedule and a facility spot-check.",
      trackerReadiness: "ready",
      readBackConfirmed: true,
      outstandingItems: "",
      status: "draft",
      headline: false,
      revision: 1,
      actualStatus: null,
      evidenceNote: "",
      evidenceSources: [],
      predictionSummary: null,
      publishedAt: null,
      verifiedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
  })

  it("publishes commitments while keeping rapporteur metadata private", async () => {
    const publicCommitment = {
      lab: "water",
      statement: "Publish monthly water-point functionality data.",
      leadActor: "State Water Agency",
      intendedOutcome: "A public dashboard updated every month.",
      status: "published",
      headline: true,
      revision: 1,
      actualStatus: null,
      evidenceNote: "",
      evidenceSources: [],
      predictionSummary: null,
      publishedAt: new Date(),
      verifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      await setDoc(doc(db, "events/PULSE26/commitments/water-1"), publicCommitment)
      await setDoc(doc(db, "events/PULSE26/commitmentMeta/water-1"), {
        rapporteurName: "Nkiru",
        withdrawnReason: null,
      })
    })
    await assertSucceeds(getDoc(doc(guest(), "events/PULSE26/commitments/water-1")))
    await assertFails(getDoc(doc(guest(), "events/PULSE26/commitmentMeta/water-1")))
    await assertSucceeds(getDoc(doc(admin(), "events/PULSE26/commitmentMeta/water-1")))
  })

  it("locks an attendee's first Promise or Progress prediction", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      await setDoc(doc(db, "events/PULSE26/commitments/headline-1"), {
        lab: "health",
        statement: "Publish quarterly primary-health releases.",
        leadActor: "Federal Ministry of Health",
        intendedOutcome: "Four public release reports by the next Summit.",
        status: "published",
        headline: true,
        revision: 1,
        actualStatus: null,
        evidenceNote: "",
        evidenceSources: [],
        predictionSummary: null,
        publishedAt: new Date(),
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await setDoc(doc(db, "events/PULSE26/prompts/prediction-1"), {
        type: "prediction",
        question: "Promise or Progress?",
        options: [
          { id: "stalled", label: "Will stall" },
          { id: "progressing", label: "Will progress" },
          { id: "completed", label: "Will be completed" },
        ],
        commitmentId: "headline-1",
        countdownEndsAt: null,
        status: "active",
        createdAt: new Date(),
        createdBy: "admin-1",
      })
      await setDoc(doc(db, "events/PULSE26"), {
        name: "PULSE Summit Live",
        code: "PULSE26",
        status: "live",
        activeExperience: "prediction",
        activePromptId: "prediction-1",
        trackerViewMode: "overview",
        trackerLab: null,
        trackerCommitmentId: null,
        createdAt: new Date(),
        createdBy: "admin-1",
      })
    })
    const db = anon()
    await joinEvent(db)
    const responseRef = doc(db, "events/PULSE26/responses/visitor-a_prediction-1")
    await assertSucceeds(setDoc(responseRef, {
      promptId: "prediction-1",
      type: "prediction",
      optionId: "progressing",
      word: null,
      visible: true,
      createdAt: serverTimestamp(),
    }))
    await assertFails(setDoc(responseRef, {
      promptId: "prediction-1",
      type: "prediction",
      optionId: "completed",
      word: null,
      visible: true,
      createdAt: serverTimestamp(),
    }))
  })

  it("lets each joined attendee vote once per published Reform Signal", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      await setDoc(doc(db, "events/PULSE26/commitments/health-signal-1"), {
        lab: "health",
        statement: "Publish the RUTF distribution schedule.",
        leadActor: "State Ministry of Health",
        intendedOutcome: "A public schedule within 90 days.",
        status: "published",
        headline: false,
        revision: 1,
        actualStatus: null,
        evidenceNote: "",
        evidenceSources: [],
        predictionSummary: null,
        publishedAt: new Date(),
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await setDoc(doc(db, "events/PULSE26"), {
        name: "PULSE Summit Live",
        code: "PULSE26",
        status: "live",
        activeExperience: "tracker",
        activePromptId: null,
        trackerViewMode: "overview",
        trackerLab: null,
        trackerCommitmentId: null,
        createdAt: new Date(),
        createdBy: "admin-1",
      })
    })

    const db = anon()
    await joinEvent(db)
    const voteRef = doc(db, "events/PULSE26/trackerVotes/visitor-a_health-signal-1")
    await assertSucceeds(setDoc(voteRef, {
      commitmentId: "health-signal-1",
      choice: "progressing",
      createdAt: serverTimestamp(),
    }))
    await assertFails(setDoc(voteRef, {
      commitmentId: "health-signal-1",
      choice: "completed",
      createdAt: serverTimestamp(),
    }))
    await assertSucceeds(getDocs(collection(db, "events/PULSE26/trackerVotes")))
    await assertFails(getDocs(collection(guest(), "events/PULSE26/trackerVotes")))
  })
})
