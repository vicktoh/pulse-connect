"use client"

import Image from "next/image"
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react"
import {
  type CSSProperties,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import styles from "./look-again-game.module.css"
import { GameScoreReporter } from "@/components/events/game-score-reporter"

type GameScreen = "intro" | "sectors" | "briefing" | "game" | "results"
type SectorId = "education" | "health" | "wash" | "roads"
type Difficulty = "easy" | "medium" | "tricky"
type EndReason = "complete" | "timeout" | "revealed"
type SoundKind = "found" | "miss" | "tick" | "open" | "win"

type Problem = {
  id: string
  x: number
  y: number
  width: number
  height: number
  title: string
  short: string
  explain: string
  difficulty: Difficulty
}

type Sector = {
  id: SectorId
  name: string
  icon: string
  sceneName: string
  image: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  accent: string
  time: number
  problems: Problem[]
}

const WRONG_PENALTY = 5
const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 150,
  tricky: 200,
}

const SECTORS: Sector[] = [
  {
    id: "education",
    name: "Education",
    icon: "🏫",
    sceneName: "classroom",
    image: "/games/look-again/education.jpg",
    imageAlt:
      "A busy public-school classroom with pupils, a teacher and an entrance from the courtyard",
    imageWidth: 1400,
    imageHeight: 787,
    accent: "#f0a030",
    time: 45,
    problems: [
      {
        id: "floor",
        x: 0,
        y: 40.38,
        width: 29.31,
        height: 59.62,
        title: "Not enough desks",
        short: "Some pupils are learning from the floor.",
        explain:
          "Three pupils have no desks and are sitting on the floor to write. The classroom looks functional at a glance, but there is not enough furniture for every child.",
        difficulty: "easy",
      },
      {
        id: "roof",
        x: 37.68,
        y: 0,
        width: 10.17,
        height: 49.95,
        title: "Leaking roof",
        short: "Learning is continuing in an unsafe classroom.",
        explain:
          "Water drips from the ceiling into a bucket in the middle of the room. Class carries on around it, but the building itself needs repair.",
        difficulty: "medium",
      },
      {
        id: "ramp",
        x: 84.93,
        y: 27.63,
        width: 15.07,
        height: 23.38,
        title: "No accessible entrance",
        short: "The classroom is not accessible to every pupil.",
        explain:
          "A pupil using a wheelchair is stopped at the entrance. There are steps into the classroom and no ramp, so this child cannot get in independently.",
        difficulty: "tricky",
      },
    ],
  },
  {
    id: "health",
    name: "Health",
    icon: "🏥",
    sceneName: "clinic",
    image: "/games/look-again/health.jpg",
    imageAlt:
      "A crowded public clinic with patients, health workers, shelves and medical equipment",
    imageWidth: 1400,
    imageHeight: 787,
    accent: "#ff6a4d",
    time: 45,
    problems: [
      {
        id: "shelf",
        x: 64,
        y: 6,
        width: 23,
        height: 42,
        title: "Essential medicines out of stock",
        short: "The medicine shelf is almost empty.",
        explain:
          "Row after row of shelving stands mostly bare. Patients are being seen, but there is little left to actually treat them with.",
        difficulty: "easy",
      },
      {
        id: "ultrasound",
        x: 9,
        y: 63,
        width: 18,
        height: 26,
        title: "Equipment never installed",
        short: "A diagnostic machine still sits in its packaging.",
        explain:
          "An ultrasound machine was delivered, but it remains wrapped and boxed on the floor. Owning equipment is not the same as being able to use it.",
        difficulty: "medium",
      },
      {
        id: "wheelchair",
        x: 2,
        y: 28,
        width: 10,
        height: 28,
        title: "No way in for a wheelchair",
        short: "A patient is stuck outside the entrance.",
        explain:
          "A woman waits in her wheelchair outside the clinic door. The steps into the building were built only for people who can climb them.",
        difficulty: "medium",
      },
      {
        id: "water",
        x: 75,
        y: 65,
        width: 15,
        height: 31,
        title: "Dirty water, not clean water",
        short: "What is being poured is not fit for washing hands.",
        explain:
          "A health worker fills a basin with visibly murky water. A clinic without clean water cannot reliably prevent the infections it is meant to treat.",
        difficulty: "tricky",
      },
    ],
  },
  {
    id: "wash",
    name: "WASH",
    icon: "💧",
    sceneName: "community",
    image: "/games/look-again/wash.jpg",
    imageAlt:
      "A community where people collect water near standpipes, an open polluted channel and a damaged toilet block",
    imageWidth: 1400,
    imageHeight: 787,
    accent: "#13c8d5",
    time: 45,
    problems: [
      {
        id: "source",
        x: 29,
        y: 34,
        width: 21,
        height: 37,
        title: "Drinking from a polluted stream",
        short: "People are collecting water from a dirty drain.",
        explain:
          "People scoop water from an open channel choked with rubbish—the same water children wade through nearby—and carry it home.",
        difficulty: "easy",
      },
      {
        id: "standpipes",
        x: 2,
        y: 12,
        width: 24,
        height: 46,
        title: "Working taps, sitting idle",
        short: "Two concrete standpipes stand unused.",
        explain:
          "Jerry cans wait empty beside built water points. If the infrastructure ran, no one would need to bend over a drain a few metres away.",
        difficulty: "medium",
      },
      {
        id: "latrine",
        x: 67,
        y: 6,
        width: 30,
        height: 34,
        title: "A toilet block no one can use",
        short: "The latrine building is falling apart.",
        explain:
          "Crumbling walls and doorless openings pass for sanitation. A structure this far gone offers little privacy, safety or protection from disease.",
        difficulty: "tricky",
      },
    ],
  },
  {
    id: "roads",
    name: "Roads",
    icon: "🛣️",
    sceneName: "street",
    image: "/games/look-again/roads.jpg",
    imageAlt:
      "A busy road near a school with traffic, children, a pothole and an open drainage channel",
    imageWidth: 1400,
    imageHeight: 1120,
    accent: "#a960ff",
    time: 45,
    problems: [
      {
        id: "pothole",
        x: 1,
        y: 53,
        width: 43,
        height: 38,
        title: "A road failing beneath traffic",
        short: "A deep pothole has swallowed part of the road.",
        explain:
          "Water and loose stone fill a crater where cars are still driving. A road left like this gets more expensive to fix the longer it waits.",
        difficulty: "easy",
      },
      {
        id: "drainage",
        x: 57,
        y: 58,
        width: 36,
        height: 41,
        title: "A drain choked with waste",
        short: "The drainage channel is clogged and stagnant.",
        explain:
          "A functioning drain has become a trench of trapped litter and standing water. It floods the road and breeds disease with every rain.",
        difficulty: "medium",
      },
      {
        id: "crossing",
        x: 44,
        y: 29,
        width: 53,
        height: 27,
        title: "No safe way to school",
        short: "Children pick their way across an open drain.",
        explain:
          "With no proper sidewalk or crossing, schoolchildren step over an open drain beside moving traffic just to get to school.",
        difficulty: "tricky",
      },
    ],
  },
]

const CONFETTI = Array.from({ length: 22 }, (_, index) => ({
  left: `${3 + ((index * 41) % 94)}%`,
  delay: `${(index % 7) * 55}ms`,
  drift: `${-48 + ((index * 31) % 96)}px`,
  colour: ["#f0a030", "#ff6a4d", "#13c8d5", "#a960ff", "#9ee53d"][
    index % 5
  ],
}))

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
      : kind === "found"
        ? [523, 659, 784]
        : kind === "miss"
          ? [180, 135]
          : kind === "open"
            ? [262, 392]
            : [82, 68]

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const startsAt = context.currentTime + index * 0.075
    oscillator.type = kind === "miss" ? "sawtooth" : kind === "tick" ? "sine" : "triangle"
    oscillator.frequency.setValueAtTime(frequency, startsAt)
    gain.gain.setValueAtTime(0.0001, startsAt)
    gain.gain.exponentialRampToValueAtTime(kind === "tick" ? 0.04 : 0.095, startsAt + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.18)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(startsAt)
    oscillator.stop(startsAt + 0.2)
  })

  window.setTimeout(() => void context.close(), 650)
}

export function LookAgainGame() {
  const [screen, setScreen] = useState<GameScreen>("intro")
  const [sectorId, setSectorId] = useState<SectorId>("education")
  const [found, setFound] = useState<string[]>([])
  const [secondsLeft, setSecondsLeft] = useState(SECTORS[0].time)
  const [score, setScore] = useState(0)
  const [wrongTaps, setWrongTaps] = useState(0)
  const [soundOn, setSoundOn] = useState(true)
  const [roundComplete, setRoundComplete] = useState(false)
  const [endReason, setEndReason] = useState<EndReason>("revealed")
  const [showLesson, setShowLesson] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [toast, setToast] = useState<{ text: string; kind: "good" | "bad" } | null>(null)
  const [missRing, setMissRing] = useState<{ x: number; y: number; key: number } | null>(null)
  const [bestScores, setBestScores] = useState<Partial<Record<SectorId, number>>>({})
  const [previousBest, setPreviousBest] = useState<number | null>(null)
  const toastTimerRef = useRef<number | null>(null)
  const missTimerRef = useRef<number | null>(null)
  const missKeyRef = useRef(0)
  const finishTimerRef = useRef<number | null>(null)
  const endedRef = useRef(false)

  const currentSector = SECTORS.find((sector) => sector.id === sectorId) ?? SECTORS[0]
  const foundProblems = currentSector.problems.filter((problem) => found.includes(problem.id))
  const perfect = found.length === currentSector.problems.length

  function scrollToStageTop() {
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }))
  }

  const showToast = useCallback((text: string, kind: "good" | "bad") => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    setToast({ text, kind })
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3300)
  }, [])

  function finishRound(reason: EndReason, finalScore = score, delay = 0) {
    if (endedRef.current) return
    endedRef.current = true
    setRoundComplete(true)
    setEndReason(reason)
    setShowHint(false)
    const prior = bestScores[currentSector.id] ?? null
    setPreviousBest(prior)
    setBestScores((value) => ({
      ...value,
      [currentSector.id]: Math.max(value[currentSector.id] ?? 0, finalScore),
    }))
    playTone(reason === "complete" ? "win" : "miss", soundOn)

    if (delay > 0) {
      finishTimerRef.current = window.setTimeout(() => {
        setScreen("results")
        scrollToStageTop()
      }, delay)
    } else {
      setScreen("results")
      scrollToStageTop()
    }
  }

  useEffect(() => {
    if (screen !== "game" || roundComplete || secondsLeft === 0) return

    const timer = window.setTimeout(() => {
      if (secondsLeft === 1) {
        setSecondsLeft(0)
        endedRef.current = true
        setRoundComplete(true)
        setEndReason("timeout")
        setShowHint(false)
        setPreviousBest(bestScores[currentSector.id] ?? null)
        setBestScores((value) => ({
          ...value,
          [currentSector.id]: Math.max(value[currentSector.id] ?? 0, score),
        }))
        setScreen("results")
        scrollToStageTop()
        playTone("miss", soundOn)
        return
      }

      setSecondsLeft((value) => value - 1)
      if (secondsLeft <= 10) playTone("tick", soundOn)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [bestScores, currentSector.id, roundComplete, score, screen, secondsLeft, soundOn])

  useEffect(
    () => () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      if (missTimerRef.current) window.clearTimeout(missTimerRef.current)
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current)
    },
    [],
  )

  function chooseSector(id: SectorId) {
    setSectorId(id)
    setScreen("briefing")
    playTone("open", soundOn)
  }

  function startRound() {
    endedRef.current = false
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current)
    setFound([])
    setSecondsLeft(currentSector.time)
    setScore(0)
    setWrongTaps(0)
    setRoundComplete(false)
    setEndReason("revealed")
    setShowLesson(false)
    setShowHint(true)
    setToast(null)
    setMissRing(null)
    setPreviousBest(null)
    setScreen("game")
    scrollToStageTop()
    playTone("open", soundOn)
  }

  function findProblem(problem: Problem, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (roundComplete || found.includes(problem.id)) return

    const nextFound = [...found, problem.id]
    const nextScore = score + DIFFICULTY_POINTS[problem.difficulty]
    setFound(nextFound)
    setScore(nextScore)
    setShowHint(false)
    showToast(`✓ ${problem.title} — ${problem.short}`, "good")
    playTone("found", soundOn)

    if (nextFound.length === currentSector.problems.length) {
      finishRound("complete", nextScore, 850)
    }
  }

  function missScene(event: MouseEvent<HTMLDivElement>) {
    if (roundComplete) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    const nextTime = Math.max(0, secondsLeft - WRONG_PENALTY)

    if (missTimerRef.current) window.clearTimeout(missTimerRef.current)
    missKeyRef.current += 1
    setMissRing({ x, y, key: missKeyRef.current })
    missTimerRef.current = window.setTimeout(() => setMissRing(null), 650)
    setWrongTaps((value) => value + 1)
    setSecondsLeft(nextTime)
    setShowHint(false)
    showToast("Not there — look again. −5 seconds", "bad")
    playTone("miss", soundOn)

    if (nextTime === 0) finishRound("timeout")
  }

  function returnToSectors() {
    endedRef.current = false
    setScreen("sectors")
    scrollToStageTop()
    setRoundComplete(false)
    setShowLesson(false)
  }

  return (
    <main className={`${styles.show} ${secondsLeft <= 10 && screen === "game" ? styles.urgent : ""}`}>
      <div className={styles.noise} aria-hidden="true" />
      <div className={styles.orbitOne} aria-hidden="true" />
      <div className={styles.orbitTwo} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.brand}>
          <Image src="/pulse-logo.png" width={190} height={60} alt="PULSE" priority />
          <span>Play</span>
        </div>
        <div className={styles.edition}><i /> Event games · Summit 2026</div>
        <button
          type="button"
          className={styles.soundButton}
          onClick={() => setSoundOn((value) => !value)}
          aria-label={soundOn ? "Mute game sounds" : "Turn on game sounds"}
        >
          {soundOn ? <Volume2 /> : <VolumeX />}
        </button>
      </header>

      <div className={styles.bulbs} aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
      </div>

      <section className={styles.stage}>
        {screen === "intro" && (
          <div className={`${styles.panel} ${styles.introPanel}`}>
            <div className={styles.kicker}>
              <Image
                src="/games/look-again/pulse-inspector-mark.png"
                width={179}
                height={194}
                alt=""
                aria-hidden="true"
                unoptimized
              />
              PULSE Inspector
            </div>
            <div className={styles.heroEye} aria-hidden="true"><Eye /></div>
            <p className={styles.eyebrow}>Game 03 · Observation challenge</p>
            <h1>Look<br /><em>Again.</em></h1>
            <p className={styles.introCopy}>
              Public services can look fine at first glance. Pick a sector, inspect the whole scene and spot what should not be this way.
            </p>
            <div className={styles.quickRules}>
              <span><strong>45</strong> seconds</span>
              <span><strong>−5</strong> per miss</span>
              <span><strong>4</strong> sectors</span>
            </div>
            <button type="button" className={styles.primaryButton} onClick={() => setScreen("sectors")}>
              Choose a scene <ArrowRight />
            </button>
            <p className={styles.hostLine}>First glance is for vibes. Second glance is for evidence.</p>
          </div>
        )}

        {screen === "sectors" && (
          <div className={`${styles.panel} ${styles.sectorPanel}`}>
            <div className={styles.screenHeading}>
              <div>
                <p className={styles.eyebrow}>Pick your inspection</p>
                <h2>Where will you look closer?</h2>
              </div>
              <div className={styles.caseCount}>04<br /><span>live cases</span></div>
            </div>
            <div className={styles.sectorGrid}>
              {SECTORS.map((sector, index) => (
                <button
                  type="button"
                  key={sector.id}
                  className={styles.sectorCard}
                  style={{ "--sector": sector.accent } as CSSProperties}
                  onClick={() => chooseSector(sector.id)}
                >
                  <span className={styles.sectorNumber}>0{index + 1}</span>
                  <span className={styles.sectorIcon} aria-hidden="true">{sector.icon}</span>
                  <strong>{sector.name}</strong>
                  <small>{sector.problems.length} things to find</small>
                  <span className={styles.sectorArrow}><ArrowRight /></span>
                </button>
              ))}
            </div>
            <button type="button" className={styles.textButton} onClick={() => setScreen("intro")}>← Back to game intro</button>
          </div>
        )}

        {screen === "briefing" && (
          <div className={`${styles.panel} ${styles.briefPanel}`} style={{ "--sector": currentSector.accent } as CSSProperties}>
            <div className={styles.briefTop}>
              <span className={styles.briefIcon} aria-hidden="true">{currentSector.icon}</span>
              <div><p className={styles.eyebrow}>{currentSector.name} inspection</p><h2>Read this before the clock starts.</h2></div>
            </div>
            <div className={styles.briefSteps}>
              <div><b>1</b><p><strong>Scan the whole {currentSector.sceneName}.</strong><span>{currentSector.problems.length} things should not be this way. Nothing is labelled.</span></p></div>
              <div><b>2</b><p><strong>Tap each problem you find.</strong><span>One is obvious. One needs a proper scan. One may hide in plain sight.</span></p></div>
              <div><b>3</b><p><strong>Beat the 45-second clock.</strong><span>Every wrong tap costs {WRONG_PENALTY} seconds, so inspect before you accuse.</span></p></div>
            </div>
            <button type="button" className={styles.primaryButton} onClick={startRound}>
              Start looking <Eye />
            </button>
            <button type="button" className={styles.textButton} onClick={() => setScreen("sectors")}>← Choose a different sector</button>
          </div>
        )}

        {screen === "game" && (
          <div className={`${styles.gamePanel} ${roundComplete ? styles.gameResolved : ""}`} style={{ "--sector": currentSector.accent } as CSSProperties}>
            <div className={styles.gameTopbar}>
              <div className={styles.gameSector}><span>{currentSector.icon}</span><p><small>Inspecting</small><strong>{currentSector.name}</strong></p></div>
              <div className={styles.statStrip}>
                <div><small>Found</small><strong>{found.length}<span>/{currentSector.problems.length}</span></strong></div>
                <div className={secondsLeft <= 10 ? styles.timeHot : ""}><small><Clock3 /> Time</small><strong>{secondsLeft}<span>s</span></strong></div>
                <div><small>Score</small><strong>{score}</strong></div>
              </div>
            </div>

            <div className={styles.instructionBar}>
              <p><Search /><strong>Find {currentSector.problems.length} service gaps.</strong> Tap what should not be this way.</p>
              <span>Misses: {wrongTaps}</span>
            </div>

            <div className={styles.sceneFrame}>
              <div
                className={styles.sceneCanvas}
                onClick={missScene}
                onContextMenu={(event) => event.preventDefault()}
              >
                <Image
                  className={styles.sceneImage}
                  src={currentSector.image}
                  alt={currentSector.imageAlt}
                  width={currentSector.imageWidth}
                  height={currentSector.imageHeight}
                  sizes="(max-width: 900px) 100vw, 1280px"
                  draggable={false}
                  priority
                  unoptimized
                />
                {currentSector.problems.map((problem) => {
                  const isFound = found.includes(problem.id)
                  return (
                    <button
                      type="button"
                      key={problem.id}
                      className={`${styles.hotspot} ${isFound ? styles.hotspotFound : ""}`}
                      style={{ left: `${problem.x}%`, top: `${problem.y}%`, width: `${problem.width}%`, height: `${problem.height}%` }}
                      onClick={(event) => findProblem(problem, event)}
                      aria-label={isFound ? `Found: ${problem.title}` : "Inspect this part of the scene"}
                      aria-pressed={isFound}
                    >
                      {isFound && <span><Check /></span>}
                    </button>
                  )
                })}
                {foundProblems.map((problem) => (
                  <div
                    key={`tag-${problem.id}`}
                    className={styles.foundTag}
                    style={{ left: `${problem.x + problem.width / 2}%`, top: `${Math.min(problem.y + problem.height, 94)}%` }}
                  >
                    <Check /> {problem.title}
                  </div>
                ))}
                {missRing && (
                  <div key={missRing.key} className={styles.missRing} style={{ left: `${missRing.x}%`, top: `${missRing.y}%` }} />
                )}
              </div>
              {showHint && <div className={styles.tapHint}>👆 Tap anything that looks wrong</div>}
            </div>

            <div className={styles.gameFooter}>
              <p><span /> Wrong taps remove {WRONG_PENALTY} seconds</p>
              <button type="button" onClick={() => finishRound("revealed")}>Reveal answers now <ArrowRight /></button>
            </div>
          </div>
        )}

        {screen === "results" && (
          <div className={`${styles.panel} ${styles.resultsPanel}`} style={{ "--sector": currentSector.accent } as CSSProperties}>
            <div className={styles.confetti} aria-hidden="true">
              {CONFETTI.map((piece, index) => (
                <i key={index} style={{ left: piece.left, animationDelay: piece.delay, background: piece.colour, "--drift": piece.drift } as CSSProperties} />
              ))}
            </div>
            <div className={`${styles.resultSeal} ${perfect ? styles.perfectSeal : ""}`}>
              {perfect ? <Sparkles /> : <Eye />}
            </div>
            <p className={styles.eyebrow}>{currentSector.name} case closed</p>
            <h2>{endReason === "complete" ? "Sharp eyes!" : endReason === "timeout" ? "Clock caught you." : "Evidence revealed."}</h2>
            <p className={styles.resultSub}>
              {perfect ? "You found everything hiding in plain sight." : `You found ${found.length} of ${currentSector.problems.length}. Here is what the full picture was saying.`}
            </p>
            {previousBest !== null && (
              <div className={styles.bestLine}>{score > previousBest ? `🔥 New ${currentSector.name} best — you beat ${previousBest} points.` : `Your ${currentSector.name} best is ${Math.max(previousBest, score)} points.`}</div>
            )}
            <div className={styles.resultStats}>
              <div><strong>{found.length}/{currentSector.problems.length}</strong><span>found</span></div>
              <div><strong>{score}</strong><span>points</span></div>
              <div><strong>{secondsLeft}s</strong><span>remaining</span></div>
              <div><strong>{wrongTaps}</strong><span>misses</span></div>
            </div>

            <div className={styles.breakdown}>
              <div className={styles.breakdownHeading}><span>Inspection report</span><small>{currentSector.problems.length} service gaps</small></div>
              {currentSector.problems.map((problem) => {
                const wasFound = found.includes(problem.id)
                return (
                  <article key={problem.id} className={wasFound ? styles.foundRow : styles.missedRow}>
                    <div className={styles.rowStatus}>{wasFound ? <Check /> : <Search />}</div>
                    <div><h3>{problem.title}<span>{problem.difficulty}</span></h3><p>{problem.explain}</p></div>
                  </article>
                )
              })}
            </div>

            <div className={styles.lesson}>
              <div><strong>A service can look open and still leave people behind.</strong><button type="button" onClick={() => setShowLesson((value) => !value)}>{showLesson ? <>Hide <ChevronUp /></> : <>Why? <ChevronDown /></>}</button></div>
              {showLesson && <p>Nothing here was hidden on purpose; it was simply easy to miss while everything else looked fine. Community monitoring means looking at the whole picture, not only the parts someone points out.</p>}
            </div>

            <GameScoreReporter gameId="look-again" score={score} />

            <div className={styles.resultActions}>
              <button type="button" className={styles.primaryButton} onClick={startRound}><RotateCcw /> Play this scene again</button>
              <button type="button" className={styles.secondaryButton} onClick={returnToSectors}>Try another sector <ArrowRight /></button>
            </div>
          </div>
        )}
      </section>

      <div className={`${styles.toast} ${toast ? styles.toastVisible : ""} ${toast?.kind === "bad" ? styles.toastBad : ""}`} role="status" aria-live="polite">
        {toast?.text}
      </div>
    </main>
  )
}
