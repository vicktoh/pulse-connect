/**
 * Records a walkthrough of the PULSE Community board:
 *   landing → support an account → share an experience →
 *   sign in as IBP → approve & publish → see it on the board.
 *
 * Run with:
 *   DEMO_ADMIN_EMAIL=... DEMO_ADMIN_PASSWORD=... node scripts/demo-video.mjs
 *
 * Credentials are read from the environment on purpose — never hardcode them
 * here, this file is committed. Add --local to record against localhost:3000
 * instead of the deployed site.
 *
 * The submission this creates is illustrative. Delete it afterwards with
 * scripts/demo-cleanup.mjs so fabricated testimony does not sit on a live
 * civic accountability board.
 */
import { chromium } from "playwright"

const SITE = process.argv.includes("--local")
  ? "http://localhost:3000"
  : "https://pulse-connect-9ab4c.web.app"

const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "Set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD in the environment."
  )
  process.exit(1)
}

const VIEWPORT = { width: 1440, height: 900 }
const OUT_DIR = "demo"

const SUBMISSION = {
  name: "Adaeze Nwosu",
  email: "adaeze@deltaaccountability.org",
  role: "Field Monitor",
  org: "Delta Accountability Network",
  sector: "Education",
  observed:
    "Delta State budgeted for 12 primary school renovations in 2025. Contractors were paid in full on certification, but site visits to 7 of the schools found no work had begun.",
  changed:
    "Publishing the certification records alongside geotagged site photos would make a paper-only completion impossible to sustain.",
  ibpResponse:
    "The Education Lab is collecting paper-completion cases ahead of September 3. We have contacted the submitter about presenting this.",
}

const wait = (page, ms) => page.waitForTimeout(ms)

/**
 * Playwright does not draw a pointer into the recording, so the video would
 * show things happening with no visible cause. This injects one.
 */
async function installCursor(page) {
  await page.addStyleTag({
    content: `
      #demo-cursor {
        position: fixed; top: 0; left: 0; width: 22px; height: 22px;
        border-radius: 50%; background: rgba(240,160,48,.35);
        border: 2px solid #F0A030; box-shadow: 0 2px 10px rgba(0,31,64,.35);
        z-index: 2147483647; pointer-events: none;
        transform: translate(-50%,-50%); transition: transform .35s ease-out,
          left .45s cubic-bezier(.22,.61,.36,1), top .45s cubic-bezier(.22,.61,.36,1);
      }
      #demo-cursor.tap { transform: translate(-50%,-50%) scale(.55); }
    `,
  })
  await page.evaluate(() => {
    const dot = document.createElement("div")
    dot.id = "demo-cursor"
    dot.style.left = "50%"
    dot.style.top = "60%"
    document.body.appendChild(dot)
  })
}

async function moveCursorTo(page, locator) {
  const box = await locator.boundingBox()
  if (!box) return null
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.evaluate(
    ({ x, y }) => {
      const dot = document.getElementById("demo-cursor")
      if (dot) {
        dot.style.left = `${x}px`
        dot.style.top = `${y}px`
      }
    },
    { x, y }
  )
  await page.mouse.move(x, y)
  await wait(page, 500)
  return { x, y }
}

async function click(page, locator, settle = 700) {
  await moveCursorTo(page, locator)
  await page.evaluate(() => {
    document.getElementById("demo-cursor")?.classList.add("tap")
  })
  await wait(page, 130)
  await locator.click()
  await page.evaluate(() => {
    document.getElementById("demo-cursor")?.classList.remove("tap")
  })
  await wait(page, settle)
}

async function type(page, locator, text, delay = 26) {
  await moveCursorTo(page, locator)
  await locator.click()
  await locator.pressSequentially(text, { delay })
  await wait(page, 350)
}

/** Eased scroll — a jump cut is hard to follow in a recording. */
async function scrollTo(page, targetY, duration = 1100) {
  await page.evaluate(
    ({ targetY, duration }) =>
      new Promise((resolve) => {
        const startY = window.scrollY
        const delta = targetY - startY
        const start = performance.now()
        function step(now) {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 3)
          window.scrollTo(0, startY + delta * eased)
          if (t < 1) requestAnimationFrame(step)
          else resolve()
        }
        requestAnimationFrame(step)
      }),
    { targetY, duration }
  )
  await wait(page, 300)
}

/**
 * The moderation queue legitimately contains other people's pending
 * submissions, complete with their contact email. This keeps the recording
 * focused on the demo's own card so a third party's address never lands in a
 * shareable video. It is a presentation filter for the recording only — no
 * data is touched, and nothing else is moderated.
 */
async function isolateCard(page, name) {
  await page.evaluate((name) => {
    const apply = () => {
      document.querySelectorAll("article").forEach((el) => {
        if (!el.textContent.includes(name)) el.style.display = "none"
      })
    }
    apply()
    new MutationObserver(apply).observe(document.body, {
      childList: true,
      subtree: true,
    })
  }, name)
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: OUT_DIR, size: VIEWPORT },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  })
  const page = await context.newPage()

  // ---- 1. The board -------------------------------------------------------
  console.log("scene 1: landing")
  // Not networkidle: the Firestore listener holds an open connection for the
  // life of the page, so the network is never idle. Wait for real content.
  await page.goto(SITE, { waitUntil: "domcontentloaded" })
  await page.locator("article").first().waitFor({ timeout: 20000 })
  await installCursor(page)
  await wait(page, 2200)

  await scrollTo(page, 620)
  await wait(page, 1400)
  await scrollTo(page, 1000)
  await wait(page, 1800)

  // ---- 2. Support an account ---------------------------------------------
  console.log("scene 2: support")
  const support = page.getByRole("button", { name: /I have seen this too/ }).first()
  await click(page, support, 1800)

  // ---- 3. Share an experience --------------------------------------------
  console.log("scene 3: share")
  await scrollTo(page, 0, 900)
  await wait(page, 600)
  await click(page, page.getByRole("button", { name: "Share What You Know" }), 1300)

  await type(page, page.locator("#f-name"), SUBMISSION.name)
  await type(page, page.locator("#f-email"), SUBMISSION.email)
  await type(page, page.locator("#f-role"), SUBMISSION.role)
  await type(page, page.locator("#f-org"), SUBMISSION.org)

  await click(page, page.locator("#f-sector"), 700)
  await click(page, page.getByRole("option", { name: SUBMISSION.sector, exact: true }), 900)

  await type(page, page.locator("#f-observed"), SUBMISSION.observed, 12)
  await type(page, page.locator("#f-changed"), SUBMISSION.changed, 12)
  await wait(page, 700)

  await click(page, page.getByRole("button", { name: /Submit for Review/ }), 900)
  await page.getByText("Received. Thank you.").waitFor({ timeout: 20000 })
  await wait(page, 3200)

  // ---- 4. Moderate as IBP -------------------------------------------------
  console.log("scene 4: admin")
  await page.goto(`${SITE}/admin`, { waitUntil: "domcontentloaded" })
  await installCursor(page)
  await wait(page, 1600)

  await type(page, page.locator("#admin-email"), ADMIN_EMAIL, 34)
  await type(page, page.locator("#admin-password"), ADMIN_PASSWORD, 34)
  await click(page, page.getByRole("button", { name: /Sign In/ }), 1200)

  // Scope every control to this submission's own card. The queue legitimately
  // holds other people's pending accounts, and an unscoped locator would both
  // fail strict-mode and risk moderating someone else's testimony.
  const card = page.locator("article").filter({ hasText: SUBMISSION.name })
  await card.waitFor({ timeout: 25000 })
  await isolateCard(page, SUBMISSION.name)
  await card.scrollIntoViewIfNeeded()
  await wait(page, 2600)

  await click(page, card.locator('[data-slot="select-trigger"]'), 700)
  await click(page, page.getByRole("option", { name: "Cited by IBP" }), 900)

  await type(page, card.locator("textarea"), SUBMISSION.ibpResponse, 12)
  await wait(page, 800)

  await click(page, card.getByRole("button", { name: /Approve & Publish/ }), 1200)
  await card.waitFor({ state: "detached", timeout: 25000 })
  await wait(page, 2400)

  // ---- 5. Published on the board -----------------------------------------
  console.log("scene 5: published")
  await page.goto(SITE, { waitUntil: "domcontentloaded" })
  await page.locator("article").first().waitFor({ timeout: 20000 })
  await installCursor(page)
  await wait(page, 2600)

  // Frame the payoff on the newly published card itself, not a fixed offset —
  // the feed height changes as submissions are added.
  const publishedTop = await page.evaluate(() => {
    const el = document.querySelector("article")
    return el ? window.scrollY + el.getBoundingClientRect().top - 150 : 900
  })
  await scrollTo(page, publishedTop)
  await wait(page, 4200)
  await scrollTo(page, publishedTop + 380)
  await wait(page, 3200)

  await context.close()
  await browser.close()
  console.log(`\nRecorded to ${OUT_DIR}/`)
}

main().catch(async (error) => {
  console.error("Demo failed:", error.message)
  process.exit(1)
})
