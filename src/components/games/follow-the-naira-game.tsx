"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import {
  Check,
  ChevronRight,
  Clipboard,
  Clock3,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react"

import styles from "./follow-the-naira-game.module.css"
import { GameScoreReporter } from "@/components/events/game-score-reporter"

type TeamId = "health" | "education" | "wash" | "social"
type GameScreen = "lobby" | "question" | "results"

type Team = {
  id: TeamId
  name: string
  shortName: string
  emoji: string
  colour: string
  demoScore: number
}

type Answer = {
  id: string
  label: string
  sublabel: string
  image: string
  imageAlt: string
  fundsDelta: number
  trustDelta: number
  impactDelta: number
  points: number
  verdict: "smart" | "chaos"
  headline: string
  explanation: string
  hostLine: string
}

type Round = {
  kicker: string
  situation: string
  image: string
  imageAlt: string
  characterName: string
  characterRole: string
  colour: string
  answers: [Answer, Answer]
}

const ROUND_SECONDS = 15

const TEAMS: Team[] = [
  {
    id: "health",
    name: "Health Hotshots",
    shortName: "Hotshots",
    emoji: "🏥",
    colour: "#ff4d3d",
    demoScore: 2180,
  },
  {
    id: "education",
    name: "Education Eagles",
    shortName: "Eagles",
    emoji: "📚",
    colour: "#3a7bff",
    demoScore: 2040,
  },
  {
    id: "wash",
    name: "WASH Waves",
    shortName: "Waves",
    emoji: "💧",
    colour: "#13c8d5",
    demoScore: 1970,
  },
  {
    id: "social",
    name: "Social Shields",
    shortName: "Shields",
    emoji: "🛡️",
    colour: "#a960ff",
    demoScore: 1890,
  },
]

const ROUNDS: Round[] = [
  {
    kicker: "Gate 01 · Fund release",
    situation: "₦500m is approved, but nobody can find the release timetable.",
    characterName: "Madam Cashflow",
    characterRole: "Keeper of the treasury gate",
    image: "/games/follow-the-naira/round-1-prompt.webp",
    imageAlt: "A treasury official searching through files for a missing fund release timetable",
    colour: "#f0a030",
    answers: [
      {
        id: "publish-release",
        label: "Publish the schedule",
        sublabel: "Release against public milestones",
        image: "/games/follow-the-naira/round-1-publish-landscape.webp",
        imageAlt: "Officials publishing a clear release schedule on a public notice board",
        fundsDelta: -8,
        trustDelta: 18,
        impactDelta: 14,
        points: 520,
        verdict: "smart",
        headline: "The calendar has been located!",
        explanation: "Public milestones expose delays before they become excuses.",
        hostLine: "Transparency has entered the chat.",
      },
      {
        id: "surprise-release",
        label: "Keep it flexible",
        sublabel: "Release whenever cash appears",
        image: "/games/follow-the-naira/round-1-flexible-landscape.webp",
        imageAlt: "An official informally deciding when to release funds from a stack of files",
        fundsDelta: -62,
        trustDelta: -15,
        impactDelta: -12,
        points: 110,
        verdict: "chaos",
        headline: "A surprise nobody ordered",
        explanation: "Unpredictable releases create delays and raise project costs.",
        hostLine: "The budget is playing hide-and-seek.",
      },
    ],
  },
  {
    kicker: "Gate 02 · Procurement",
    situation: "A confident vendor promises next-day delivery, without competitive bidding.",
    characterName: "Chief Express Delivery",
    characterRole: "Vendor, optimist, networking enthusiast",
    image: "/games/follow-the-naira/round-2-prompt.webp",
    imageAlt: "A confident vendor presenting a flashy next-day delivery pitch",
    colour: "#ff4d3d",
    answers: [
      {
        id: "open-tender",
        label: "Run an open bid",
        sublabel: "Compare prices. Publish the winner.",
        image: "/games/follow-the-naira/round-2-open-bid-landscape.webp",
        imageAlt: "A procurement panel comparing several vendor bids around a table",
        fundsDelta: -14,
        trustDelta: 16,
        impactDelta: 18,
        points: 560,
        verdict: "smart",
        headline: "Competition brings receipts",
        explanation: "Comparable bids improve value and leave a public trail.",
        hostLine: "Chief Express must now express himself in writing.",
      },
      {
        id: "cousin-contract",
        label: "Take the fast deal",
        sublabel: "Skip bidding. Prioritize speed.",
        image: "/games/follow-the-naira/round-2-fast-deal-landscape.webp",
        imageAlt: "Two people sealing a quick procurement deal with a handshake",
        fundsDelta: -118,
        trustDelta: -24,
        impactDelta: -18,
        points: 80,
        verdict: "chaos",
        headline: "The vibes were not audited",
        explanation: "Skipping comparison hides whether the price is fair.",
        hostLine: "Fast delivery; slower questions about value.",
      },
    ],
  },
  {
    kicker: "Gate 03 · Delivery",
    situation: "The report says 90% complete. The roof and windows disagree.",
    characterName: "Engineer Nearly-There",
    characterRole: "Professional percentage announcer",
    image: "/games/follow-the-naira/round-3-prompt.webp",
    imageAlt: "An engineer presenting a nearly finished clinic with an incomplete roof and windows",
    colour: "#13c8d5",
    answers: [
      {
        id: "verify-site",
        label: "Inspect the site",
        sublabel: "Verify milestones before payment",
        image: "/games/follow-the-naira/round-3-inspect-landscape.webp",
        imageAlt: "An inspection team documenting construction progress at the clinic",
        fundsDelta: -10,
        trustDelta: 20,
        impactDelta: 22,
        points: 610,
        verdict: "smart",
        headline: "The roof has entered the evidence",
        explanation: "Site evidence links payment to work that actually exists.",
        hostLine: "A camera angle is not infrastructure policy.",
      },
      {
        id: "pay-report",
        label: "Trust the report",
        sublabel: "Pay against submitted paperwork",
        image: "/games/follow-the-naira/round-3-report-landscape.webp",
        imageAlt: "An official approving payment after reviewing a project report at a desk",
        fundsDelta: -96,
        trustDelta: -20,
        impactDelta: -25,
        points: 70,
        verdict: "chaos",
        headline: "100% paid. 62% building.",
        explanation: "Paper-only approval transfers construction risk to citizens.",
        hostLine: "The missing windows send their regards.",
      },
    ],
  },
  {
    kicker: "Final gate · Citizen check",
    situation: "The clinic has beds, but no drugs, staff plan or feedback line.",
    characterName: "Amina from Gidan Ruwa",
    characterRole: "Citizen and undefeated question-asker",
    image: "/games/follow-the-naira/round-4-prompt.webp",
    imageAlt: "A citizen examining a newly opened clinic that has beds but lacks essential services",
    colour: "#a960ff",
    answers: [
      {
        id: "service-check",
        label: "Test the service",
        sublabel: "Check stock, staff and feedback",
        image: "/games/follow-the-naira/round-4-service-test-landscape.webp",
        imageAlt: "Citizens and staff checking medicine, staffing and a feedback desk inside the clinic",
        fundsDelta: -12,
        trustDelta: 24,
        impactDelta: 28,
        points: 680,
        verdict: "smart",
        headline: "From building delivered to service working",
        explanation: "A finished building only matters when the service works.",
        hostLine: "The ribbon has passed its performance review.",
      },
      {
        id: "cut-ribbon",
        label: "Cut the ribbon",
        sublabel: "Open now. Complete details later.",
        image: "/games/follow-the-naira/round-4-ribbon-landscape.webp",
        imageAlt: "Officials posing for a ceremonial ribbon cutting at the clinic entrance",
        fundsDelta: -74,
        trustDelta: -26,
        impactDelta: -32,
        points: 60,
        verdict: "chaos",
        headline: "Beautiful launch. Invisible service.",
        explanation: "Opening without staff or supplies delivers a building, not care.",
        hostLine: "Great photos. Still waiting for paracetamol.",
      },
    ],
  },
]

const CONFETTI = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  delay: `${(index % 7) * 80}ms`,
  colour: ["#f0a030", "#e03020", "#13c8d5", "#a960ff", "#9ee53d"][
    index % 5
  ],
}))

function createRoundSwaps() {
  const swaps = ROUNDS.map((_, index) => index < Math.ceil(ROUNDS.length / 2))

  for (let index = swaps.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[swaps[index], swaps[target]] = [swaps[target], swaps[index]]
  }

  return swaps
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function playTone(kind: "good" | "bad" | "tick" | "win", enabled: boolean) {
  if (!enabled || typeof window === "undefined") return

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext

  if (!AudioContextClass) return

  const context = new AudioContextClass()
  const notes =
    kind === "win"
      ? [392, 523, 659]
      : kind === "good"
        ? [440, 660]
        : kind === "bad"
          ? [180, 120]
          : [520]

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const startsAt = context.currentTime + index * 0.09
    oscillator.type = kind === "bad" ? "sawtooth" : "sine"
    oscillator.frequency.setValueAtTime(frequency, startsAt)
    gain.gain.setValueAtTime(0.0001, startsAt)
    gain.gain.exponentialRampToValueAtTime(0.09, startsAt + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.16)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(startsAt)
    oscillator.stop(startsAt + 0.18)
  })

  window.setTimeout(() => void context.close(), 700)
}

export function FollowTheNairaGame() {
  const [screen, setScreen] = useState<GameScreen>("lobby")
  const [teamId, setTeamId] = useState<TeamId | null>(null)
  const [roundIndex, setRoundIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)
  const [roundSwaps, setRoundSwaps] = useState(() =>
    ROUNDS.map(() => false),
  )
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [funds, setFunds] = useState(500)
  const [trust, setTrust] = useState(48)
  const [impact, setImpact] = useState(42)
  const [score, setScore] = useState(0)
  const [soundOn, setSoundOn] = useState(true)
  const [copied, setCopied] = useState(false)

  const selectedTeam = TEAMS.find((team) => team.id === teamId) ?? null
  const currentRound = ROUNDS[roundIndex]
  const displayedAnswers = roundSwaps[roundIndex]
    ? [currentRound.answers[1], currentRound.answers[0]]
    : currentRound.answers

  const leaderboard = useMemo(
    () =>
      TEAMS.map((team) => ({
        ...team,
        score: team.demoScore + (team.id === teamId ? score : 0),
      })).sort((a, b) => b.score - a.score),
    [score, teamId],
  )

  const grade =
    score >= 2700 ? "A+" : score >= 2200 ? "A" : score >= 1600 ? "B" : score >= 950 ? "C" : "D"

  useEffect(() => {
    if (screen !== "question" || answer || timedOut) return

    if (secondsLeft === 0) return

    const timer = window.setTimeout(() => {
      if (secondsLeft === 1) {
        setSecondsLeft(0)
        setTimedOut(true)
        setFunds((value) => Math.max(0, value - 55))
        setTrust((value) => clamp(value - 12))
        setImpact((value) => clamp(value - 10))
        playTone("bad", soundOn)
        return
      }

      setSecondsLeft(secondsLeft - 1)
      if (secondsLeft <= 4) playTone("tick", soundOn)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [answer, screen, secondsLeft, soundOn, timedOut])

  function startGame() {
    if (!teamId) return
    setScreen("question")
    setRoundIndex(0)
    setSecondsLeft(ROUND_SECONDS)
    setRoundSwaps(createRoundSwaps())
    setAnswer(null)
    setTimedOut(false)
    setFunds(500)
    setTrust(48)
    setImpact(42)
    setScore(0)
    playTone("good", soundOn)
  }

  function chooseAnswer(choice: Answer) {
    if (answer || timedOut) return
    setAnswer(choice)
    setFunds((value) => Math.max(0, value + choice.fundsDelta))
    setTrust((value) => clamp(value + choice.trustDelta))
    setImpact((value) => clamp(value + choice.impactDelta))
    setScore((value) => value + choice.points + secondsLeft * 12)
    playTone(choice.verdict === "smart" ? "good" : "bad", soundOn)
  }

  function advanceRound() {
    if (roundIndex === ROUNDS.length - 1) {
      setScreen("results")
      playTone("win", soundOn)
      return
    }
    setRoundIndex((value) => value + 1)
    setSecondsLeft(ROUND_SECONDS)
    setAnswer(null)
    setTimedOut(false)
  }

  function resetGame() {
    setScreen("lobby")
    setTeamId(null)
    setRoundIndex(0)
    setSecondsLeft(ROUND_SECONDS)
    setRoundSwaps(ROUNDS.map(() => false))
    setAnswer(null)
    setTimedOut(false)
    setFunds(500)
    setTrust(48)
    setImpact(42)
    setScore(0)
    setCopied(false)
  }

  async function copyScorecard() {
    if (!selectedTeam) return
    await navigator.clipboard.writeText(
      `I scored ${score.toLocaleString()} points for ${selectedTeam.name} in Follow the Naira. ₦${funds}m reached the last mile. #PULSEPlay`,
    )
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className={styles.show}>
      <div className={styles.noise} aria-hidden="true" />
      <div className={styles.spotlightLeft} aria-hidden="true" />
      <div className={styles.spotlightRight} aria-hidden="true" />

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
          <span className={styles.playBadge}>Play!</span>
        </div>
        <div className={styles.livePill}>
          <span aria-hidden="true" /> Demo arena
        </div>
        <button
          className={styles.soundButton}
          type="button"
          onClick={() => setSoundOn((value) => !value)}
          aria-label={soundOn ? "Mute game sounds" : "Turn on game sounds"}
        >
          {soundOn ? <Volume2 /> : <VolumeX />}
        </button>
      </header>

      <div className={styles.marquee} aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => (
          <i key={index} />
        ))}
      </div>

      <section className={styles.stage}>
        {screen !== "lobby" && (
          <aside className={styles.scoreboard} aria-label="Demo team leaderboard">
            <div className={styles.scoreboardTitle}>
              <span>Team heat</span>
              <small>Live demo scores</small>
            </div>
            <ol>
              {leaderboard.map((team, index) => (
                <li
                  key={team.id}
                  className={team.id === teamId ? styles.activeTeam : undefined}
                  style={{ "--team-colour": team.colour } as React.CSSProperties}
                >
                  <span className={styles.teamPosition}>{index + 1}</span>
                  <span className={styles.teamEmoji}>{team.emoji}</span>
                  <span className={styles.teamScoreName}>{team.shortName}</span>
                  <strong>{team.score.toLocaleString()}</strong>
                </li>
              ))}
            </ol>
          </aside>
        )}

        <div className={styles.gameShell}>
          <div className={styles.gameRibbon}>
            <span>Public finance, but make it a game show</span>
            <Sparkles aria-hidden="true" />
          </div>

          {screen === "lobby" && (
            <section className={styles.lobby} aria-labelledby="game-title">
              <div className={styles.eyebrow}>PULSE Play presents</div>
              <div className={styles.titleStack}>
                <span>Follow</span>
                <h1 id="game-title">The Naira!</h1>
              </div>
              <p className={styles.introCopy}>
                Four gates. Fifteen seconds each. One mission: get as much of
                <strong> ₦500 million</strong> as possible to the people it was
                approved for.
              </p>

              <div className={styles.moneyTicket}>
                <span>Starting fund</span>
                <strong>₦500m</strong>
                <small>For the Gidan Ruwa health centre</small>
              </div>

              <fieldset className={styles.teamPicker}>
                <legend>Choose your team</legend>
                <div className={styles.teamGrid}>
                  {TEAMS.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      className={team.id === teamId ? styles.teamSelected : ""}
                      style={{ "--team-colour": team.colour } as React.CSSProperties}
                      onClick={() => {
                        setTeamId(team.id)
                        playTone("tick", soundOn)
                      }}
                      aria-pressed={team.id === teamId}
                    >
                      <span>{team.emoji}</span>
                      <strong>{team.name}</strong>
                      {team.id === teamId && <Check aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                className={styles.startButton}
                onClick={startGame}
                disabled={!teamId}
              >
                <span>{teamId ? "Start the money trail" : "Pick a team to play"}</span>
                <ChevronRight aria-hidden="true" />
              </button>
              <p className={styles.keyboardHint}>Keyboard-friendly · Sound optional · About 2 minutes</p>
            </section>
          )}

          {screen === "question" && (
            <section className={styles.round} aria-labelledby="round-title">
              <div className={styles.hud}>
                <div className={styles.roundCount}>
                  Round <strong>{roundIndex + 1}</strong> / {ROUNDS.length}
                </div>
                <div className={styles.fundsMeter}>
                  <span>Naira on track</span>
                  <strong>₦{funds}m</strong>
                </div>
                <div
                  className={`${styles.timer} ${secondsLeft <= 4 ? styles.timerUrgent : ""}`}
                  aria-label={`${secondsLeft} seconds remaining`}
                >
                  <Clock3 aria-hidden="true" />
                  <strong>{secondsLeft}</strong>
                  <span>sec</span>
                </div>
              </div>

              <div className={styles.progressTrack} aria-label="Game progress">
                {ROUNDS.map((round, index) => (
                  <div
                    key={round.kicker}
                    className={index <= roundIndex ? styles.progressDone : undefined}
                    style={{ "--round-colour": round.colour } as React.CSSProperties}
                  >
                    <span>{index + 1}</span>
                  </div>
                ))}
              </div>

              <div className={styles.questionStage}>
                <div
                  className={styles.promptVisual}
                  style={{ "--round-colour": currentRound.colour } as React.CSSProperties}
                >
                  <span className={styles.promptArt}>
                    <Image
                      src={currentRound.image}
                      alt={currentRound.imageAlt}
                      fill
                      sizes="(max-width: 720px) 42vw, 210px"
                      priority={roundIndex === 0}
                    />
                  </span>
                  <div className={styles.characterCaption}>
                    <strong>{currentRound.characterName}</strong>
                    <small>{currentRound.characterRole}</small>
                  </div>
                </div>

                <div className={styles.questionCopy}>
                  <span className={styles.roundKicker}>{currentRound.kicker}</span>
                  <h2 id="round-title">{currentRound.situation}</h2>
                </div>
              </div>

              {!answer && !timedOut && (
                <div className={styles.answerGrid}>
                  {displayedAnswers.map((choice, index) => (
                    <button
                      type="button"
                      key={choice.id}
                      className={styles.answerOption}
                      onClick={() => chooseAnswer(choice)}
                    >
                      <span className={styles.answerVisual}>
                        <Image
                          src={choice.image}
                          alt={choice.imageAlt}
                          fill
                          sizes="(max-width: 720px) 44vw, 330px"
                        />
                      </span>
                      <span className={styles.answerLetter}>{index === 0 ? "A" : "B"}</span>
                      <strong>{choice.label}</strong>
                      <small>{choice.sublabel}</small>
                      <i>Buzz!</i>
                    </button>
                  ))}
                </div>
              )}

              {(answer || timedOut) && (
                <div
                  className={`${styles.verdictCard} ${
                    answer?.verdict === "smart" ? styles.verdictSmart : styles.verdictChaos
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  <div className={styles.verdictStamp}>
                    {timedOut ? "Time wahala!" : answer?.verdict === "smart" ? "Smart move!" : "Budget wahala!"}
                  </div>
                  <span className={styles.verdictEmoji}>
                    {timedOut ? "⏰" : answer?.verdict === "smart" ? "🎉" : "😬"}
                  </span>
                  <div className={styles.verdictCopy}>
                    <h3>{timedOut ? "The clock spent your money" : answer?.headline}</h3>
                    <p>
                      {timedOut
                        ? "No decision is still a decision. Delay quietly removed ₦55m from the money trail."
                        : answer?.explanation}
                    </p>
                    <blockquote>
                      “{timedOut ? "The paperwork waited. Inflation did not." : answer?.hostLine}”
                      <cite>Your slightly dramatic host</cite>
                    </blockquote>
                  </div>
                  <button type="button" onClick={advanceRound}>
                    {roundIndex === ROUNDS.length - 1 ? "See the final score" : "Open the next gate"}
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
              )}

              <div className={styles.statRow}>
                <div>
                  <span>Public trust</span>
                  <div className={styles.statBar}><i style={{ width: `${trust}%` }} /></div>
                  <strong>{trust}%</strong>
                </div>
                <div>
                  <span>Service impact</span>
                  <div className={styles.statBar}><i style={{ width: `${impact}%` }} /></div>
                  <strong>{impact}%</strong>
                </div>
              </div>
            </section>
          )}

          {screen === "results" && selectedTeam && (
            <section className={styles.results} aria-labelledby="results-title">
              {CONFETTI.map((piece, index) => (
                <i
                  key={index}
                  className={styles.confetti}
                  style={{
                    left: piece.left,
                    animationDelay: piece.delay,
                    background: piece.colour,
                  }}
                  aria-hidden="true"
                />
              ))}
              <span className={styles.finalKicker}>The last-mile scorecard</span>
              <div className={styles.gradeBurst}>
                <small>Grade</small>
                <strong>{grade}</strong>
              </div>
              <h2 id="results-title">
                ₦{funds}m made it to the people.
              </h2>
              <p>
                {funds >= 430
                  ? "The clinic opens with supplies, staff and a public feedback line. Even the ribbon is impressed."
                  : funds >= 300
                    ? "The clinic opens, but a few missing pieces will keep the Reform Tracker busy."
                    : "The building may get a plaque. The community is still waiting for a working service."}
              </p>

              <div className={styles.resultCards}>
                <div>
                  <span>Team</span>
                  <strong>{selectedTeam.emoji} {selectedTeam.shortName}</strong>
                </div>
                <div>
                  <span>Game score</span>
                  <strong>{score.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Public trust</span>
                  <strong>{trust}%</strong>
                </div>
                <div>
                  <span>Service impact</span>
                  <strong>{impact}%</strong>
                </div>
              </div>

              <div className={styles.lessonCard}>
                <span>🔦 The PULSE point</span>
                <p>
                  Approval is only the starting whistle. Releases, procurement,
                  verification and citizen oversight determine whether public money
                  becomes a public service.
                </p>
              </div>

              <GameScoreReporter gameId="follow-the-naira" score={score} />

              <div className={styles.resultActions}>
                <button type="button" onClick={copyScorecard}>
                  {copied ? <Check /> : <Clipboard />}
                  {copied ? "Scorecard copied" : "Copy scorecard"}
                </button>
                <button type="button" onClick={resetGame}>
                  <RotateCcw /> Play again
                </button>
              </div>
            </section>
          )}
        </div>
      </section>

      <footer className={styles.showFooter}>
        <span>Public Finance · Unlocking Last-Mile Services</span>
        <span>Abuja · 3 September 2026</span>
      </footer>
    </main>
  )
}
