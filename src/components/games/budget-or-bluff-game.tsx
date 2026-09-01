"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import {
  Check,
  ChevronRight,
  Clipboard,
  Clock3,
  Flame,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react"

import styles from "./budget-or-bluff-game.module.css"
import { GameScoreReporter } from "@/components/events/game-score-reporter"

type GameScreen = "lobby" | "claim" | "results"
type Verdict = "fact" | "spin" | "bluff"
type Confidence = 1 | 2 | 3
type DeskId = "receipts" | "detectives" | "auditors"
type SoundKind = "good" | "bad" | "tick" | "win" | "wager" | "case"

type Desk = {
  id: DeskId
  name: string
  shortName: string
  emoji: string
  colour: string
}

type Claim = {
  category: string
  claim: string
  answer: Verdict
  explanation: string
  receipt: string
  hostLine: string
  accent: string
  audience: Record<Verdict, number>
}

const ROUND_SECONDS = 12
const VERDICTS: Verdict[] = ["fact", "spin", "bluff"]

const VERDICT_META: Record<
  Verdict,
  { label: string; shortLabel: string; symbol: string; description: string }
> = {
  fact: {
    label: "Fact",
    shortLabel: "Fact",
    symbol: "✓",
    description: "The claim holds up",
  },
  spin: {
    label: "Half-True",
    shortLabel: "Half-True",
    symbol: "½",
    description: "True-ish, but missing context",
  },
  bluff: {
    label: "Bluff",
    shortLabel: "Bluff",
    symbol: "!",
    description: "Confidently incorrect",
  },
}

const DESKS: Desk[] = [
  {
    id: "receipts",
    name: "Receipt Hunters",
    shortName: "Hunters",
    emoji: "🧾",
    colour: "#13c8d5",
  },
  {
    id: "detectives",
    name: "Data Detectives",
    shortName: "Detectives",
    emoji: "🔎",
    colour: "#f0a030",
  },
  {
    id: "auditors",
    name: "Audit Avengers",
    shortName: "Avengers",
    emoji: "📋",
    colour: "#a960ff",
  },
]

const CLAIMS: Claim[] = [
  {
    category: "Budget approval",
    claim: "Once a budget is approved, the full amount is immediately ready to spend.",
    answer: "bluff",
    explanation:
      "Approval authorises spending; cash releases and controls determine what can actually move.",
    receipt: "Approved is not the same as released.",
    hostLine: "Cashflow is checking its calendar.",
    accent: "#ff6a4d",
    audience: { fact: 22, spin: 31, bluff: 47 },
  },
  {
    category: "Open budgets",
    claim: "Publishing budget data can improve accountability, but only when people can use and act on it.",
    answer: "fact",
    explanation:
      "Publishing helps only when people can understand the data, question it and trigger a response.",
    receipt: "Visibility needs participation and enforcement.",
    hostLine: "A public PDF can still be practically invisible.",
    accent: "#13c8d5",
    audience: { fact: 61, spin: 28, bluff: 11 },
  },
  {
    category: "Procurement",
    claim: "The lowest procurement bid always delivers the best value for taxpayers.",
    answer: "bluff",
    explanation:
      "Value also depends on quality, delivery risk, maintenance and lifetime cost.",
    receipt: "The cheapest bid can carry the costliest repairs.",
    hostLine: "That bargain printer has called its fourth technician.",
    accent: "#a960ff",
    audience: { fact: 18, spin: 34, bluff: 48 },
  },
  {
    category: "Last-mile delivery",
    claim: "A completed clinic can still fail citizens when staff, medicines or maintenance are missing.",
    answer: "fact",
    explanation:
      "A building is useful only when staff, medicines and maintenance make the service work.",
    receipt: "Citizens experience services, not completion certificates.",
    hostLine: "The ribbon is ready. The medicine cabinet is not.",
    accent: "#9ee53d",
    audience: { fact: 69, spin: 23, bluff: 8 },
  },
  {
    category: "Performance claims",
    claim: "A 90% fund-release rate means 90% of promised services definitely reached citizens.",
    answer: "spin",
    explanation:
      "Fund release tracks money leaving treasury, not services reaching citizens.",
    receipt: "Money moved is not impact delivered.",
    hostLine: "The funds travelled; results missed the flight.",
    accent: "#f0a030",
    audience: { fact: 29, spin: 52, bluff: 19 },
  },
  {
    category: "Audit evidence",
    claim: "A clean audit opinion proves every funded service reached the intended community.",
    answer: "spin",
    explanation:
      "A clean opinion supports the accounts, not every service outcome.",
    receipt: "Financial assurance is not service verification.",
    hostLine: "The spreadsheet balanced. The waiting room disagreed.",
    accent: "#3a7bff",
    audience: { fact: 32, spin: 49, bluff: 19 },
  },
]

const CONFETTI = Array.from({ length: 24 }, (_, index) => ({
  left: `${4 + ((index * 37) % 92)}%`,
  delay: `${(index % 6) * 38}ms`,
  drift: `${-54 + ((index * 29) % 108)}px`,
  spin: `${220 + ((index * 73) % 440)}deg`,
  colour: ["#f0a030", "#ff6a4d", "#13c8d5", "#a960ff", "#9ee53d"][
    index % 5
  ],
}))

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function createVerdictOrders() {
  return CLAIMS.map(() => {
    const order = [...VERDICTS]

    for (let index = order.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1))
      ;[order[index], order[target]] = [order[target], order[index]]
    }

    return order
  })
}

function playTone(kind: SoundKind, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext

  if (!AudioContextClass) return

  const context = new AudioContextClass()
  const notes =
    kind === "win"
      ? [392, 523, 659, 784, 1047]
      : kind === "good"
        ? [523, 659, 784]
        : kind === "bad"
          ? [196, 147]
          : kind === "case"
            ? [262, 392]
            : kind === "wager"
              ? [622]
              : [560]

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const startsAt = context.currentTime + index * 0.08
    oscillator.type =
      kind === "bad" ? "sawtooth" : kind === "wager" ? "square" : "sine"
    oscillator.frequency.setValueAtTime(frequency, startsAt)
    gain.gain.setValueAtTime(0.0001, startsAt)
    gain.gain.exponentialRampToValueAtTime(
      kind === "tick" || kind === "wager" ? 0.045 : 0.09,
      startsAt + 0.015,
    )
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startsAt + (kind === "win" ? 0.24 : 0.16),
    )
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(startsAt)
    oscillator.stop(startsAt + (kind === "win" ? 0.26 : 0.18))
  })

  window.setTimeout(() => void context.close(), 700)
}

export function BudgetOrBluffGame() {
  const [screen, setScreen] = useState<GameScreen>("lobby")
  const [deskId, setDeskId] = useState<DeskId | null>(null)
  const [roundIndex, setRoundIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)
  const [confidence, setConfidence] = useState<Confidence>(2)
  const [orders, setOrders] = useState<Verdict[][]>(() =>
    CLAIMS.map(() => VERDICTS),
  )
  const [selectedVerdict, setSelectedVerdict] = useState<Verdict | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [credibility, setCredibility] = useState(50)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [soundOn, setSoundOn] = useState(true)
  const [copied, setCopied] = useState(false)

  const currentClaim = CLAIMS[roundIndex]
  const selectedDesk = DESKS.find((desk) => desk.id === deskId) ?? null
  const resolved = selectedVerdict !== null || timedOut
  const isCorrect = selectedVerdict === currentClaim.answer
  const accuracy = answers.length
    ? Math.round((correctCount / answers.length) * 100)
    : 0

  const rank =
    correctCount >= 6
      ? "Chief Receipt Officer"
      : correctCount >= 5
        ? "Senior Spin Spotter"
        : correctCount >= 3
          ? "Evidence Detective"
          : correctCount >= 1
            ? "Junior Fact Checker"
            : "Vibes Auditor"

  useEffect(() => {
    if (screen !== "claim" || resolved || secondsLeft === 0) return

    const timer = window.setTimeout(() => {
      if (secondsLeft === 1) {
        setSecondsLeft(0)
        setTimedOut(true)
        setAnswers((value) => [...value, false])
        setStreak(0)
        setCredibility((value) => clamp(value - 10))
        playTone("bad", soundOn)
        return
      }

      setSecondsLeft((value) => value - 1)
      if (secondsLeft <= 4) playTone("tick", soundOn)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [resolved, screen, secondsLeft, soundOn])

  function startGame() {
    if (!deskId) return
    setScreen("claim")
    setRoundIndex(0)
    setSecondsLeft(ROUND_SECONDS)
    setConfidence(2)
    setOrders(createVerdictOrders())
    setSelectedVerdict(null)
    setTimedOut(false)
    setScore(0)
    setCorrectCount(0)
    setStreak(0)
    setMaxStreak(0)
    setCredibility(50)
    setAnswers([])
    setCopied(false)
    playTone("case", soundOn)
  }

  function chooseVerdict(verdict: Verdict) {
    if (resolved) return

    const correct = verdict === currentClaim.answer
    setSelectedVerdict(verdict)
    setAnswers((value) => [...value, correct])

    if (correct) {
      const nextStreak = streak + 1
      const streakBonus = Math.max(0, nextStreak - 1) * 60
      const points = (180 + secondsLeft * 15) * confidence + streakBonus
      setScore((value) => value + points)
      setCorrectCount((value) => value + 1)
      setStreak(nextStreak)
      setMaxStreak((value) => Math.max(value, nextStreak))
      setCredibility((value) => clamp(value + 6 * confidence))
      playTone("good", soundOn)
    } else {
      setScore((value) => Math.max(0, value - 80 * confidence))
      setStreak(0)
      setCredibility((value) => clamp(value - 7 * confidence))
      playTone("bad", soundOn)
    }
  }

  function advanceRound() {
    if (roundIndex === CLAIMS.length - 1) {
      setScreen("results")
      playTone("win", soundOn)
      return
    }

    setRoundIndex((value) => value + 1)
    setSecondsLeft(ROUND_SECONDS)
    setConfidence(2)
    setSelectedVerdict(null)
    setTimedOut(false)
    playTone("case", soundOn)
  }

  function resetGame() {
    setScreen("lobby")
    setDeskId(null)
    setRoundIndex(0)
    setSecondsLeft(ROUND_SECONDS)
    setConfidence(2)
    setSelectedVerdict(null)
    setTimedOut(false)
    setScore(0)
    setCorrectCount(0)
    setStreak(0)
    setMaxStreak(0)
    setCredibility(50)
    setAnswers([])
    setCopied(false)
  }

  async function copyScorecard() {
    if (!selectedDesk) return

    await navigator.clipboard.writeText(
      `I became a ${rank} with ${score.toLocaleString()} points and ${accuracy}% accuracy for ${selectedDesk.name} in Budget or Bluff? #PULSEPlay`,
    )
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className={styles.show}>
      <div className={styles.noise} aria-hidden="true" />
      <div className={styles.gridGlow} aria-hidden="true" />

      <header className={styles.showHeader}>
        <div className={styles.brandLockup}>
          <Image
            src="/pulse-logo.png"
            width={180}
            height={38}
            alt="PULSE Summit"
            style={{ height: "auto" }}
            priority
          />
          <span>PULSE Play</span>
        </div>
        <div className={styles.onAir}><i /> Fact-check desk live</div>
        <button
          className={styles.soundButton}
          type="button"
          onClick={() => {
            const nextValue = !soundOn
            setSoundOn(nextValue)
            if (nextValue) playTone("wager", true)
          }}
          aria-label={soundOn ? "Mute game sounds" : "Turn on game sounds"}
        >
          {soundOn ? <Volume2 /> : <VolumeX />}
        </button>
      </header>

      <div className={styles.ticker} aria-hidden="true">
        <span>BREAKING BUDGET NEWS</span>
        <p>Claims are loud. Evidence is louder.</p>
        <span>RECEIPTS REQUIRED</span>
        <p>Confidence is expensive. Spend wisely.</p>
      </div>

      <section className={styles.stage}>
        <div className={styles.gameShell}>
          <div className={styles.caseTab}>Case file: BOB-006</div>

          {screen === "lobby" && (
            <section className={styles.lobby} aria-labelledby="game-title">
              <div className={styles.lobbyStamp}>PULSE Play presents</div>
              <div className={styles.heroTitle}>
                <span>Budget</span>
                <b>or</b>
                <h1 id="game-title">Bluff?</h1>
              </div>
              <p className={styles.intro}>
                Six bold claims. Twelve seconds each. Call the fact, catch the spin,
                and expose the bluff. Then bet on how sure you are.
              </p>

              <div className={styles.verdictPrimer} aria-label="Possible verdicts">
                {VERDICTS.map((verdict) => (
                  <div key={verdict} data-verdict={verdict}>
                    <strong>{VERDICT_META[verdict].symbol}</strong>
                    <span>{VERDICT_META[verdict].label}</span>
                    <small>{VERDICT_META[verdict].description}</small>
                  </div>
                ))}
              </div>

              <fieldset className={styles.deskPicker}>
                <legend>Choose your fact-check desk</legend>
                <div>
                  {DESKS.map((desk) => (
                    <button
                      key={desk.id}
                      type="button"
                      className={desk.id === deskId ? styles.deskSelected : undefined}
                      style={{ "--desk-colour": desk.colour } as React.CSSProperties}
                      onClick={() => {
                        setDeskId(desk.id)
                        playTone("wager", soundOn)
                      }}
                      aria-pressed={desk.id === deskId}
                    >
                      <span>{desk.emoji}</span>
                      <strong>{desk.name}</strong>
                      {desk.id === deskId && <Check aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                className={styles.startButton}
                disabled={!deskId}
                onClick={startGame}
              >
                <span>{deskId ? "Open the first case" : "Choose a desk to play"}</span>
                <ChevronRight aria-hidden="true" />
              </button>
            </section>
          )}

          {screen === "claim" && (
            <section className={styles.claimScreen} aria-labelledby="claim-title">
              <div className={styles.hud}>
                <div>
                  Case <strong>{String(roundIndex + 1).padStart(2, "0")}</strong>
                  <span>/ {String(CLAIMS.length).padStart(2, "0")}</span>
                </div>
                <div className={styles.scoreHud}>
                  Score <strong>{score.toLocaleString()}</strong>
                </div>
                <div className={`${styles.timer} ${secondsLeft <= 4 && !resolved ? styles.timerHot : ""}`}>
                  <Clock3 aria-hidden="true" />
                  <strong>{secondsLeft}</strong>
                  <span>sec</span>
                </div>
              </div>

              <div className={styles.caseProgress} aria-label="Case progress">
                {CLAIMS.map((claim, index) => (
                  <i
                    key={claim.claim}
                    className={index <= roundIndex ? styles.caseDone : undefined}
                    style={{ "--case-colour": claim.accent } as React.CSSProperties}
                  />
                ))}
              </div>

              <article
                className={styles.claimCard}
                style={{ "--claim-accent": currentClaim.accent } as React.CSSProperties}
              >
                <div className={styles.claimMeta}>
                  <span>Claim under review</span>
                  <strong>{currentClaim.category}</strong>
                </div>
                <span className={styles.quoteMark} aria-hidden="true">“</span>
                <h2 id="claim-title">{currentClaim.claim}</h2>
                <div className={styles.sourceTag}>Source: Someone very confident at a microphone</div>
              </article>

              {!resolved && (
                <>
                  <div className={styles.confidencePanel}>
                    <div>
                      <Zap aria-hidden="true" />
                      <span>Confidence wager</span>
                      <small>Higher reward. Higher penalty.</small>
                    </div>
                    <div className={styles.confidenceChips}>
                      {([1, 2, 3] as Confidence[]).map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={confidence === value ? styles.confidenceSelected : undefined}
                          onClick={() => {
                            setConfidence(value)
                            playTone("wager", soundOn)
                          }}
                          aria-pressed={confidence === value}
                        >
                          {value}×
                          <small>{value === 1 ? "Safe" : value === 2 ? "Bold" : "All in"}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.verdictGrid}>
                    {orders[roundIndex].map((verdict) => (
                      <button
                        key={verdict}
                        type="button"
                        data-verdict={verdict}
                        onClick={() => chooseVerdict(verdict)}
                      >
                        <span>{VERDICT_META[verdict].symbol}</span>
                        <strong>{VERDICT_META[verdict].label}</strong>
                        <small>{VERDICT_META[verdict].description}</small>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {resolved && (
                <div
                  className={`${styles.revealCard} ${isCorrect ? styles.revealCorrect : styles.revealWrong}`}
                  role="status"
                  aria-live="polite"
                >
                  {isCorrect && (
                    <div className={styles.confettiLayer} aria-hidden="true">
                      {CONFETTI.slice(0, 14).map((piece, index) => (
                        <i
                          key={index}
                          style={{
                            "--confetti-left": piece.left,
                            "--confetti-delay": piece.delay,
                            "--confetti-drift": piece.drift,
                            "--confetti-spin": piece.spin,
                            background: piece.colour,
                          } as React.CSSProperties}
                        />
                      ))}
                    </div>
                  )}
                  <div className={styles.revealStamp}>
                    {timedOut ? "No verdict!" : isCorrect ? "Receipt found!" : "Spin detected!"}
                  </div>
                  <div className={styles.answerSeal} data-verdict={currentClaim.answer}>
                    <span>{VERDICT_META[currentClaim.answer].symbol}</span>
                    <strong>{VERDICT_META[currentClaim.answer].label}</strong>
                  </div>
                  <div className={styles.revealCopy}>
                    <h3>
                      {timedOut
                        ? "Time called."
                        : isCorrect
                          ? `${confidence}× wager: correct.`
                          : `Correct answer: ${VERDICT_META[currentClaim.answer].label}.`}
                    </h3>
                    <p>{currentClaim.explanation}</p>
                    <blockquote>
                      <b>The receipt:</b> {currentClaim.receipt}
                    </blockquote>
                    <small>🎙 “{currentClaim.hostLine}”</small>
                  </div>

                  <div className={styles.roomPulse}>
                    <span>Room pulse</span>
                    {VERDICTS.map((verdict) => (
                      <div key={verdict}>
                        <small>{VERDICT_META[verdict].shortLabel}</small>
                        <i><b style={{ width: `${currentClaim.audience[verdict]}%` }} /></i>
                        <strong>{currentClaim.audience[verdict]}%</strong>
                      </div>
                    ))}
                  </div>

                  <button type="button" className={styles.nextButton} onClick={advanceRound}>
                    {roundIndex === CLAIMS.length - 1 ? "File the final report" : "Open the next case"}
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
              )}
            </section>
          )}

          {screen === "results" && selectedDesk && (
            <section className={styles.results} aria-labelledby="results-title">
              <div className={`${styles.confettiLayer} ${styles.resultConfetti}`} aria-hidden="true">
                {CONFETTI.map((piece, index) => (
                  <i
                    key={index}
                    style={{
                      "--confetti-left": piece.left,
                      "--confetti-delay": piece.delay,
                      "--confetti-drift": piece.drift,
                      "--confetti-spin": piece.spin,
                      background: piece.colour,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
              <div className={styles.resultBurst}><Sparkles aria-hidden="true" /></div>
              <span className={styles.finalLabel}>Final fact-check report</span>
              <h2 id="results-title">{rank}</h2>
              <p>
                {correctCount >= 5
                  ? "Your evidence survived cross-examination. The group chat may now cite you carefully."
                  : correctCount >= 3
                    ? "Solid instincts. A few confident claims still walked past your desk wearing sunglasses."
                    : "Your confidence was inspirational. Your receipts are currently in transit."}
              </p>

              <div className={styles.scorePlate}>
                <small>Final score</small>
                <strong>{score.toLocaleString()}</strong>
                <span>{selectedDesk.emoji} {selectedDesk.name}</span>
              </div>

              <div className={styles.resultGrid}>
                <div><strong>{correctCount}/{CLAIMS.length}</strong><span>Receipts found</span></div>
                <div><strong>{accuracy}%</strong><span>Accuracy</span></div>
                <div><strong>{maxStreak}</strong><span>Best streak</span></div>
                <div><strong>{credibility}%</strong><span>Credibility</span></div>
              </div>

              <div className={styles.answerTape} aria-label="Answer record">
                {answers.map((correct, index) => (
                  <span key={index} className={correct ? styles.answerRight : styles.answerMiss}>
                    {correct ? "✓" : "×"}
                  </span>
                ))}
              </div>

              <GameScoreReporter gameId="budget-or-bluff" score={score} />

              <div className={styles.resultActions}>
                <button type="button" onClick={resetGame}>
                  <RotateCcw aria-hidden="true" /> Play again
                </button>
                <button type="button" onClick={copyScorecard}>
                  {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
                  {copied ? "Copied" : "Copy scorecard"}
                </button>
              </div>
            </section>
          )}
        </div>

        {screen !== "lobby" && (
          <aside className={styles.liveDesk} aria-label="Live fact-check stats">
            <div className={styles.deskHeading}>
              <span>{selectedDesk?.emoji}</span>
              <div><small>Your desk</small><strong>{selectedDesk?.shortName}</strong></div>
            </div>
            <div className={styles.liveStat}>
              <span>Receipts</span>
              <strong>{correctCount}<small>/{CLAIMS.length}</small></strong>
            </div>
            <div className={styles.liveStat}>
              <span>Credibility</span>
              <strong>{credibility}%</strong>
              <i><b style={{ width: `${credibility}%` }} /></i>
            </div>
            <div className={styles.streakCard}>
              <Flame aria-hidden="true" />
              <span>Current streak</span>
              <strong>{streak}</strong>
            </div>
            <div className={styles.tipCard}>
              <strong>Anchor’s tip</strong>
              <p>Claims with one impressive number can still be missing the number that matters.</p>
            </div>
          </aside>
        )}
      </section>

      <footer className={styles.showFooter}>
        <span>Public Finance · Unlocking Last-Mile Services</span>
        <span>Abuja · 3 September 2026</span>
      </footer>
    </main>
  )
}
