/**
 * Grants an existing Firebase Auth user the `admin` custom claim, which is what
 * firestore.rules checks in isAdmin(). Run with:
 *
 *   npm run admin:claim -- someone@example.org
 *   npm run admin:claim -- someone@example.org --revoke
 *
 * The account must already exist — create it in the Firebase Console under
 * Authentication -> Users. This script never sets or reads passwords.
 *
 * Runs on Application Default Credentials. If ADC complains about a quota
 * project:
 *   gcloud auth application-default set-quota-project pulse-connect-9ab4c
 *
 * Note: a custom claim only reaches the browser on the next ID token refresh.
 * The app forces that refresh after sign-in (see auth-provider.tsx), so an
 * operator granted the claim mid-session only needs to sign out and back in.
 */
import { applicationDefault, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "pulse-connect-9ab4c"

const args = process.argv.slice(2)
const email = args.find((a) => !a.startsWith("--"))
const revoke = args.includes("--revoke")

if (!email) {
  console.error("Usage: npm run admin:claim -- <email> [--revoke]")
  process.exit(1)
}

async function main() {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID })
  const auth = getAuth()

  const user = await auth.getUserByEmail(email)
  await auth.setCustomUserClaims(user.uid, revoke ? {} : { admin: true })

  const updated = await auth.getUser(user.uid)
  console.log(
    `${revoke ? "Revoked" : "Granted"} admin for ${email} (${user.uid}).`
  )
  console.log("  claims:", JSON.stringify(updated.customClaims ?? {}))
  console.log("  They must sign out and back in for this to take effect.")
}

main().then(
  () => process.exit(0),
  (error) => {
    if (error.code === "auth/user-not-found") {
      console.error(
        `No account for ${email}. Create it in the Firebase Console under Authentication -> Users first.`
      )
    } else if (error.code === "auth/configuration-not-found") {
      console.error(
        "Firebase Authentication is not enabled on this project yet. Enable it in the Console, then re-run."
      )
    } else {
      console.error("Failed:", error.message)
    }
    process.exit(1)
  }
)
