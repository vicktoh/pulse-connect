/**
 * Removes what scripts/demo-video.mjs leaves behind: the illustrative
 * submission, its contact document, and the support the recording cast.
 *
 *   node scripts/demo-cleanup.mjs           # show what would be removed
 *   node scripts/demo-cleanup.mjs --commit  # actually remove it
 *
 * Matches on the exact demo name AND organisation so it can never touch a real
 * submission. Dry-run by default, because this deletes civic testimony.
 */
import { applicationDefault, initializeApp } from "firebase-admin/app"
import { FieldValue, getFirestore } from "firebase-admin/firestore"

const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "pulse-connect-9ab4c"

const DEMO_NAME = "Adaeze Nwosu"
const DEMO_ORG = "Delta Accountability Network"
const commit = process.argv.includes("--commit")

async function main() {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID })
  const db = getFirestore()

  const snap = await db
    .collection("submissions")
    .where("name", "==", DEMO_NAME)
    .get()

  const targets = snap.docs.filter((d) => d.data().org === DEMO_ORG)

  if (!targets.length) {
    console.log("No demo submissions found.")
  }
  for (const doc of targets) {
    console.log(
      `${commit ? "deleting" : "would delete"} submission ${doc.id} (${doc.data().moderation})`
    )
    if (commit) {
      await db.collection("submissionContacts").doc(doc.id).delete()
      await doc.ref.delete()
    }
  }

  // The recording clicks "I have seen this too" once. Withdraw it so the seeded
  // counts stay honest.
  const supports = await db.collection("supports").get()
  for (const doc of supports.docs) {
    const { submissionId } = doc.data()
    console.log(
      `${commit ? "withdrawing" : "would withdraw"} support on ${submissionId}`
    )
    if (commit) {
      await db.runTransaction(async (tx) => {
        const ref = db.collection("submissions").doc(submissionId)
        const cur = await tx.get(ref)
        if (cur.exists && (cur.data().supportCount ?? 0) > 0) {
          tx.update(ref, { supportCount: FieldValue.increment(-1) })
        }
        tx.delete(doc.ref)
      })
    }
  }

  if (!commit) console.log("\nDry run. Re-run with --commit to apply.")
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("Cleanup failed:", error.message)
    process.exit(1)
  }
)
