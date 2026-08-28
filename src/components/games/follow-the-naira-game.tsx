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
  emoji: string
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
  title: string
  situation: string
  character: string
  characterName: string
  characterRole: string
  colour: string
  answers: [Answer, Answer]
}

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
    title: "The disappearing timetable",
    situation:
      "₦500m has been approved for a rural health centre upgrade. The release schedule, however, has gone on an unplanned holiday.",
    character: "🧑🏾‍💼",
    characterName: "Madam Cashflow",
    characterRole: "Keeper of the treasury gate",
    colour: "#f0a030",
    answers: [
      {
        id: "publish-release",
        label: "Publish & release",
        sublabel: "Set milestones and send the first tranche",
        emoji: "📢",
        fundsDelta: -8,
        trustDelta: 18,
        impactDelta: 14,
        points: 520,
        verdict: "smart",
        headline: "The calendar has been located!",
        explanation:
          "A public release schedule gives implementers certainty and lets citizens see delays before they become excuses.",
        hostLine: "Transparency enters the chat wearing sensible shoes.",
      },
      {
        id: "surprise-release",
        label: "Keep it mysterious",
        sublabel: "Release whenever the fiscal mood feels right",
        emoji: "🎩",
        fundsDelta: -62,
        trustDelta: -15,
        impactDelta: -12,
        points: 110,
        verdict: "chaos",
        headline: "A surprise nobody ordered",
        explanation:
          "Unpredictable releases stall procurement, raise costs and make an approved project look imaginary at the last mile.",
        hostLine: "The budget is now playing hide-and-seek. It is winning.",
      },
    ],
  },
  {
    kicker: "Gate 02 · Procurement",
    title: "A cousin with a PowerPoint",
    situation:
      "A very confident vendor says competitive bidding is stressful. He can supply everything tomorrow—and he knows somebody who knows somebody.",
    character: "🕺🏾",
    characterName: "Chief Express Delivery",
    characterRole: "Vendor, optimist, networking enthusiast",
    colour: "#ff4d3d",
    answers: [
      {
        id: "open-tender",
        label: "Open the tender",
        sublabel: "Compare bids and publish the winner",
        emoji: "🔎",
        fundsDelta: -14,
        trustDelta: 16,
        impactDelta: 18,
        points: 560,
        verdict: "smart",
        headline: "Competition brings receipts",
        explanation:
          "Clear specifications and comparable bids reduce inflated prices while creating a trail that auditors and citizens can follow.",
        hostLine: "Chief Express will have to express himself in writing.",
      },
      {
        id: "cousin-contract",
        label: "Trust the vibes",
        sublabel: "Paperwork is temporary; connections are forever",
        emoji: "🤝",
        fundsDelta: -118,
        trustDelta: -24,
        impactDelta: -18,
        points: 80,
        verdict: "chaos",
        headline: "The vibes were not audited",
        explanation:
          "A closed deal makes overpricing easier and accountability harder. Fast promises can create very slow services.",
        hostLine: "The projector was excellent. The value for money was not.",
      },
    ],
  },
  {
    kicker: "Gate 03 · Delivery",
    title: "The almost-finished clinic",
    situation:
      "The contractor reports 90% completion. The roof disagrees, the windows are philosophical, and the site photo is from a very creative angle.",
    character: "👷🏾‍♀️",
    characterName: "Engineer Nearly-There",
    characterRole: "Professional percentage announcer",
    colour: "#13c8d5",
    answers: [
      {
        id: "verify-site",
        label: "Verify before paying",
        sublabel: "Independent inspection plus geo-tagged evidence",
        emoji: "📍",
        fundsDelta: -10,
        trustDelta: 20,
        impactDelta: 22,
        points: 610,
        verdict: "smart",
        headline: "The roof has entered the evidence",
        explanation:
          "Milestone verification links payment to real work, protects the remaining funds and catches problems while they can still be fixed.",
        hostLine: "A wide-angle lens is no longer an infrastructure policy.",
      },
      {
        id: "pay-report",
        label: "Pay the percentage",
        sublabel: "If the report says 90%, who are we to argue?",
        emoji: "🧾",
        fundsDelta: -96,
        trustDelta: -20,
        impactDelta: -25,
        points: 70,
        verdict: "chaos",
        headline: "100% paid. 62% building.",
        explanation:
          "Paying against paperwork alone removes leverage and transfers construction risk to the community waiting for the service.",
        hostLine: "The missing windows send their warm regards.",
      },
    ],
  },
  {
    kicker: "Final gate · Citizen check",
    title: "The opening-day illusion",
    situation:
      "The ribbon is ready. The cameras are ready. The clinic has beds—but no drugs, staffing plan or public number for reporting problems.",
    character: "👩🏾‍🍼",
    characterName: "Amina from Gidan Ruwa",
    characterRole: "Citizen and undefeated question-asker",
    colour: "#a960ff",
    answers: [
      {
        id: "service-check",
        label: "Test the service",
        sublabel: "Stock, staff, feedback line and public scorecard",
        emoji: "✅",
        fundsDelta: -12,
        trustDelta: 24,
        impactDelta: 28,
        points: 680,
        verdict: "smart",
        headline: "From building delivered to service working",
        explanation:
          "Last-mile accountability measures whether people can actually use the service—not merely whether a ribbon can be cut.",
        hostLine: "The ribbon may proceed. It has passed its performance review.",
      },
      {
        id: "cut-ribbon",
        label: "Cut first, ask later",
        sublabel: "A dramatic ribbon can distract from many things",
        emoji: "✂️",
        fundsDelta: -74,
        trustDelta: -26,
        impactDelta: -32,
        points: 60,
        verdict: "chaos",
        headline: "Beautiful launch. Invisible service.",
        explanation:
          "Infrastructure without staff, supplies and citizen feedback is an output—not an outcome. The last mile remains broken.",
        hostLine: "Ten points for photography. Zero points for paracetamol.",
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
  const [secondsLeft, setSecondsLeft] = useState(12)
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
    setSecondsLeft(12)
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
    setSecondsLeft(12)
    setAnswer(null)
    setTimedOut(false)
  }

  function resetGame() {
    setScreen("lobby")
    setTeamId(null)
    setRoundIndex(0)
    setSecondsLeft(12)
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
      `I scored ${score.toLocaleString()} points for ${selectedTeam.name} in Follow the Naira — ₦${funds}m reached the last mile. #PULSEPlay`,
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
                Four gates. Twelve seconds each. One mission: get as much of
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
                  className={styles.characterCard}
                  style={{ "--round-colour": currentRound.colour } as React.CSSProperties}
                >
                  <span className={styles.characterEmoji}>{currentRound.character}</span>
                  <div>
                    <strong>{currentRound.characterName}</strong>
                    <small>{currentRound.characterRole}</small>
                  </div>
                </div>

                <div className={styles.questionCopy}>
                  <span className={styles.roundKicker}>{currentRound.kicker}</span>
                  <h2 id="round-title">{currentRound.title}</h2>
                  <p>{currentRound.situation}</p>
                </div>
              </div>

              {!answer && !timedOut && (
                <div className={styles.answerGrid}>
                  {currentRound.answers.map((choice, index) => (
                    <button
                      type="button"
                      key={choice.id}
                      className={index === 0 ? styles.buzzerBlue : styles.buzzerRed}
                      onClick={() => chooseAnswer(choice)}
                    >
                      <span className={styles.answerLetter}>{index === 0 ? "A" : "B"}</span>
                      <span className={styles.answerEmoji}>{choice.emoji}</span>
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
                      <cite>— Your slightly dramatic host</cite>
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
