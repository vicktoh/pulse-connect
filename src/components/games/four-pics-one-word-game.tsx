"use client"

import Image from "next/image"
import {
  ArrowRight,
  Check,
  Clock3,
  Expand,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react"
import { type CSSProperties, useEffect, useMemo, useState } from "react"

import styles from "./four-pics-one-word-game.module.css"
import { GameScoreReporter } from "@/components/events/game-score-reporter"

type GameScreen = "intro" | "playing" | "reveal" | "results"
type SoundKind = "tap" | "wrong" | "correct" | "tick" | "win" | "hint"

type LetterTile = {
  id: string
  letter: string
  extra?: boolean
}

type Round = {
  answer: string
  label: string
  accent: string
  accentSoft: string
  images: { src: string; alt: string }[]
  letters: LetterTile[]
  takeaway: string
  hostLine: string
}

const ROUND_SECONDS = 40
const HINT_COST = 100
const WRONG_COST = 50

const ROUNDS: Round[] = [
  {
    answer: "EVIDENCE",
    label: "Proof, not vibes",
    accent: "#14c8d4",
    accentSoft: "#d9fbff",
    images: [
      {
        src: "/games/four-pics-one-word/evidence-1.webp",
        alt: "An auditor examining financial records with a magnifying glass",
      },
      {
        src: "/games/four-pics-one-word/evidence-2.webp",
        alt: "A community monitor photographing a newly built water point",
      },
      {
        src: "/games/four-pics-one-word/evidence-3.webp",
        alt: "A public officer checking documents against charts on a computer",
      },
      {
        src: "/games/four-pics-one-word/evidence-4.webp",
        alt: "A community member speaking on camera at a public meeting",
      },
    ],
    letters: [
      { id: "e-a", letter: "E" },
      { id: "r-x", letter: "R", extra: true },
      { id: "v-a", letter: "V" },
      { id: "i-a", letter: "I" },
      { id: "t-x", letter: "T", extra: true },
      { id: "d-a", letter: "D" },
      { id: "e-b", letter: "E" },
      { id: "a-x", letter: "A", extra: true },
      { id: "n-a", letter: "N" },
      { id: "c-a", letter: "C" },
      { id: "s-x", letter: "S", extra: true },
      { id: "e-c", letter: "E" },
    ],
    takeaway: "Evidence turns a confident claim into something people can check.",
    hostLine: "Receipts have entered the chat.",
  },
  {
    answer: "BUDGET",
    label: "Choices have receipts",
    accent: "#f5aa2c",
    accentSoft: "#fff0cc",
    images: [
      {
        src: "/games/four-pics-one-word/budget-1.webp",
        alt: "Money, a ledger, receipts and a calculator on a wooden desk",
      },
      {
        src: "/games/four-pics-one-word/budget-2.webp",
        alt: "A public meeting discussing a colourful allocation chart",
      },
      {
        src: "/games/four-pics-one-word/budget-3.webp",
        alt: "A civil servant comparing spending papers with charts",
      },
      {
        src: "/games/four-pics-one-word/budget-4.webp",
        alt: "Coins divided between jars representing public services",
      },
    ],
    letters: [
      { id: "p-x", letter: "P", extra: true },
      { id: "b-a", letter: "B" },
      { id: "u-a", letter: "U" },
      { id: "n-x", letter: "N", extra: true },
      { id: "d-a", letter: "D" },
      { id: "a-x", letter: "A", extra: true },
      { id: "g-a", letter: "G" },
      { id: "e-a", letter: "E" },
      { id: "i-x", letter: "I", extra: true },
      { id: "t-a", letter: "T" },
      { id: "r-x", letter: "R", extra: true },
      { id: "o-x", letter: "O", extra: true },
    ],
    takeaway: "A budget is a public record of priorities—not just a pile of numbers.",
    hostLine: "Every allocation is a choice wearing a spreadsheet.",
  },
  {
    answer: "VOICE",
    label: "Say it where it counts",
    accent: "#ff654f",
    accentSoft: "#ffe1da",
    images: [
      {
        src: "/games/four-pics-one-word/voice-1.webp",
        alt: "A young woman speaking into a microphone at a town hall",
      },
      {
        src: "/games/four-pics-one-word/voice-2.webp",
        alt: "A participant raising a hand during a civic forum",
      },
      {
        src: "/games/four-pics-one-word/voice-3.webp",
        alt: "A radio presenter speaking into a studio microphone",
      },
      {
        src: "/games/four-pics-one-word/voice-4.webp",
        alt: "A community leader addressing neighbours through a megaphone",
      },
    ],
    letters: [
      { id: "t-x", letter: "T", extra: true },
      { id: "v-a", letter: "V" },
      { id: "o-a", letter: "O" },
      { id: "r-x", letter: "R", extra: true },
      { id: "i-a", letter: "I" },
      { id: "a-x", letter: "A", extra: true },
      { id: "c-a", letter: "C" },
      { id: "n-x", letter: "N", extra: true },
      { id: "e-a", letter: "E" },
      { id: "d-x", letter: "D", extra: true },
      { id: "l-x", letter: "L", extra: true },
      { id: "s-x", letter: "S", extra: true },
    ],
    takeaway: "Participation begins when people can speak—and power has to listen.",
    hostLine: "The room has a microphone. Use it responsibly.",
  },
  {
    answer: "IMPACT",
    label: "Results people can feel",
    accent: "#9ce13b",
    accentSoft: "#e9ffd0",
    images: [
      {
        src: "/games/four-pics-one-word/impact-1.webp",
        alt: "Pupils learning in a newly renovated classroom",
      },
      {
        src: "/games/four-pics-one-word/impact-2.webp",
        alt: "A nurse welcoming a mother and child in a working clinic",
      },
      {
        src: "/games/four-pics-one-word/impact-3.webp",
        alt: "A newly paved road connecting a rural community",
      },
      {
        src: "/games/four-pics-one-word/impact-4.webp",
        alt: "A family collecting clean water from a new public water point",
      },
    ],
    letters: [
      { id: "o-x", letter: "O", extra: true },
      { id: "i-a", letter: "I" },
      { id: "m-a", letter: "M" },
      { id: "r-x", letter: "R", extra: true },
      { id: "p-a", letter: "P" },
      { id: "e-x", letter: "E", extra: true },
      { id: "a-a", letter: "A" },
      { id: "c-a", letter: "C" },
      { id: "l-x", letter: "L", extra: true },
      { id: "t-a", letter: "T" },
      { id: "d-x", letter: "D", extra: true },
      { id: "s-x", letter: "S", extra: true },
    ],
    takeaway: "Impact is the change people experience after the ribbon is cut.",
    hostLine: "The spreadsheet says completed. Real life gets the final vote.",
  },
]

const CONFETTI = Array.from({ length: 34 }, (_, index) => ({
  left: `${3 + ((index * 41) % 94)}%`,
  delay: `${(index % 9) * 42}ms`,
  drift: `${-70 + ((index * 31) % 140)}px`,
  spin: `${260 + ((index * 83) % 520)}deg`,
  colour: ["#f5aa2c", "#ff654f", "#14c8d4", "#a15cff", "#9ce13b"][
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
      : kind === "correct"
        ? [440, 659, 880]
        : kind === "wrong"
          ? [210, 155]
          : kind === "hint"
            ? [330, 494]
            : kind === "tick"
              ? [700]
              : [380]

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const start = context.currentTime + index * 0.085
    oscillator.type = kind === "wrong" ? "sawtooth" : kind === "tick" ? "square" : "sine"
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(kind === "tick" ? 0.035 : 0.075, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.2)
  })

  window.setTimeout(() => void context.close(), 800)
}

export function FourPicsOneWordGame() {
  const [screen, setScreen] = useState<GameScreen>("intro")
  const [roundIndex, setRoundIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)
  const [score, setScore] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [hintUsed, setHintUsed] = useState(false)
  const [feedback, setFeedback] = useState<"wrong" | null>(null)
  const [roundWon, setRoundWon] = useState(false)
  const [roundPoints, setRoundPoints] = useState(0)
  const [solvedRounds, setSolvedRounds] = useState<boolean[]>([])
  const [soundOn, setSoundOn] = useState(true)

  const round = ROUNDS[roundIndex]
  const guess = useMemo(
    () =>
      selectedIds
        .map((id) => round.letters.find((tile) => tile.id === id)?.letter ?? "")
        .join(""),
    [round.letters, selectedIds],
  )

  useEffect(() => {
    if (screen !== "playing" || secondsLeft <= 0) return

    const timer = window.setTimeout(() => {
      if (secondsLeft <= 6) playTone("tick", soundOn)
      if (secondsLeft === 1) {
        setSecondsLeft(0)
        setRoundWon(false)
        setRoundPoints(0)
        setSolvedRounds((current) => [...current, false])
        playTone("wrong", soundOn)
        setScreen("reveal")
        return
      }
      setSecondsLeft((current) => current - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [screen, secondsLeft, soundOn])

  function resetRound(nextIndex: number) {
    setRoundIndex(nextIndex)
    setSecondsLeft(ROUND_SECONDS)
    setSelectedIds([])
    setRemovedIds([])
    setHintUsed(false)
    setFeedback(null)
    setRoundWon(false)
    setRoundPoints(0)
  }

  function scrollGameToTop() {
    window.requestAnimationFrame(() =>
      window.scrollTo({ top: 0, left: 0, behavior: "auto" }),
    )
  }

  function startGame() {
    setScore(0)
    setSolvedRounds([])
    resetRound(0)
    setScreen("playing")
    playTone("tap", soundOn)
    scrollGameToTop()
  }

  function chooseLetter(id: string) {
    if (selectedIds.length >= round.answer.length || selectedIds.includes(id)) return
    setSelectedIds((current) => [...current, id])
    setFeedback(null)
    playTone("tap", soundOn)
  }

  function removeLetter(index: number) {
    setSelectedIds((current) => current.filter((_, tileIndex) => tileIndex !== index))
    setFeedback(null)
    playTone("tap", soundOn)
  }

  function useHint() {
    if (hintUsed) return
    const extras = round.letters
      .filter((tile) => tile.extra && !selectedIds.includes(tile.id))
      .slice(0, 2)
      .map((tile) => tile.id)
    setRemovedIds(extras)
    setHintUsed(true)
    playTone("hint", soundOn)
  }

  function submitGuess() {
    if (selectedIds.length !== round.answer.length) return

    if (guess === round.answer) {
      const earned = 300 + secondsLeft * 10 - (hintUsed ? HINT_COST : 0)
      setScore((current) => current + earned)
      setRoundPoints(earned)
      setRoundWon(true)
      setSolvedRounds((current) => [...current, true])
      playTone("correct", soundOn)
      setScreen("reveal")
      return
    }

    setScore((current) => Math.max(0, current - WRONG_COST))
    setFeedback("wrong")
    playTone("wrong", soundOn)
    window.setTimeout(() => setFeedback(null), 650)
  }

  function advanceRound() {
    if (roundIndex === ROUNDS.length - 1) {
      setScreen("results")
      playTone("win", soundOn)
      scrollGameToTop()
      return
    }

    const nextIndex = roundIndex + 1
    resetRound(nextIndex)
    setScreen("playing")
    playTone("tap", soundOn)
    scrollGameToTop()
  }

  function toggleFullscreen() {
    if (typeof document === "undefined") return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void document.documentElement.requestFullscreen()
    }
  }

  const accentStyle = {
    "--round-accent": round.accent,
    "--round-soft": round.accentSoft,
  } as CSSProperties

  const correctCount = solvedRounds.filter(Boolean).length
  const scoreTitle =
    score >= 2500
      ? "PULSE Powerhouse"
      : score >= 1800
        ? "Civic Connector"
        : score >= 1000
          ? "Public Finance Scout"
          : "Clue Catcher"

  return (
    <main className={styles.game} style={accentStyle}>
      <div className={styles.noise} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.brandLockup}>
          <span className={styles.playTag}>PULSE PLAY</span>
          <span className={styles.brandName}>Four Pics, One Word</span>
        </div>
        <div className={styles.headerActions}>
          {screen !== "intro" && (
            <div className={styles.scoreChip} aria-label={`Score ${score}`}>
              <Sparkles aria-hidden="true" />
              <span>{score.toLocaleString()}</span>
              <small>PTS</small>
            </div>
          )}
          <button
            className={styles.iconButton}
            type="button"
            onClick={() => setSoundOn((current) => !current)}
            aria-label={soundOn ? "Mute game sounds" : "Turn on game sounds"}
          >
            {soundOn ? <Volume2 /> : <VolumeX />}
          </button>
          <button
            className={styles.iconButton}
            type="button"
            onClick={toggleFullscreen}
            aria-label="Toggle full screen"
          >
            <Expand />
          </button>
        </div>
      </header>

      {screen === "intro" && (
        <section className={styles.intro}>
          <div className={styles.introCopy}>
            <span className={styles.eyebrow}>THE PICTURE PUZZLE</span>
            <h1>
              Four photos.
              <br />
              <em>One big idea.</em>
            </h1>
            <p>
              Connect the clues, build the word and beat the clock. Four quick
              rounds from public money to public impact.
            </p>
            <div className={styles.rules}>
              <span><b>4</b> rounds</span>
              <span><b>40</b> seconds</span>
              <span><b>1</b> shared word</span>
            </div>
            <button className={styles.primaryButton} type="button" onClick={startGame}>
              <Play fill="currentColor" /> Start the show <ArrowRight />
            </button>
          </div>

          <div className={styles.introMosaic} aria-label="A preview of the four rounds">
            {ROUNDS.map((item, index) => (
              <div
                className={styles.introPhoto}
                style={{ "--intro-rotation": `${[-3, 2, 1, -2][index]}deg` } as CSSProperties}
                key={item.answer}
              >
                <Image
                  src={item.images[0].src}
                  alt={item.images[0].alt}
                  width={900}
                  height={900}
                  sizes="(max-width: 720px) 45vw, 270px"
                  priority
                />
                <span>{index + 1}</span>
              </div>
            ))}
            <div className={styles.mysteryBadge}>?</div>
          </div>
        </section>
      )}

      {(screen === "playing" || screen === "reveal") && (
        <section className={styles.playArea}>
          <div className={styles.roundBar}>
            <div>
              <span>ROUND {roundIndex + 1} OF {ROUNDS.length}</span>
              <strong>{round.label}</strong>
            </div>
            <div
              className={`${styles.timer} ${secondsLeft <= 6 && screen === "playing" ? styles.timerHot : ""}`}
              aria-label={`${secondsLeft} seconds remaining`}
            >
              <Clock3 />
              <b>{secondsLeft}</b>
              <small>SEC</small>
            </div>
          </div>

          <div className={styles.stage}>
            <div className={styles.photoBoard}>
              {round.images.map((image, index) => (
                <figure className={styles.photoCard} key={image.src}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 760px) 45vw, 290px"
                    priority
                  />
                  <span>{index + 1}</span>
                </figure>
              ))}
              <div className={styles.boardSticker}>WHAT CONNECTS THEM?</div>
            </div>

            {screen === "playing" ? (
              <div className={styles.puzzlePanel}>
                <span className={styles.puzzleKicker}>BUILD THE WORD</span>
                <div
                  className={`${styles.answerSlots} ${feedback === "wrong" ? styles.answerWrong : ""}`}
                  aria-label={`Your answer: ${guess || "empty"}`}
                  aria-live="polite"
                >
                  {Array.from({ length: round.answer.length }, (_, index) => {
                    const tileId = selectedIds[index]
                    const letter = tileId
                      ? round.letters.find((tile) => tile.id === tileId)?.letter
                      : ""
                    return (
                      <button
                        type="button"
                        className={styles.answerSlot}
                        onClick={() => tileId && removeLetter(index)}
                        disabled={!tileId}
                        aria-label={tileId ? `Remove letter ${letter}` : `Empty letter ${index + 1}`}
                        key={index}
                      >
                        {letter}
                      </button>
                    )
                  })}
                </div>

                <div className={styles.letterBank} aria-label="Available letters">
                  {round.letters.map((tile) => {
                    const unavailable = selectedIds.includes(tile.id) || removedIds.includes(tile.id)
                    return (
                      <button
                        type="button"
                        className={styles.letterTile}
                        onClick={() => chooseLetter(tile.id)}
                        disabled={unavailable}
                        aria-label={`Choose letter ${tile.letter}`}
                        key={tile.id}
                      >
                        {tile.letter}
                      </button>
                    )
                  })}
                </div>

                <div className={styles.puzzleActions}>
                  <button
                    className={styles.hintButton}
                    type="button"
                    onClick={useHint}
                    disabled={hintUsed}
                  >
                    <Lightbulb />
                    {hintUsed ? "Hint used" : `Remove 2 · −${HINT_COST} pts`}
                  </button>
                  <button
                    className={styles.submitButton}
                    type="button"
                    onClick={submitGuess}
                    disabled={selectedIds.length !== round.answer.length}
                  >
                    Check word <Check />
                  </button>
                </div>
                <p className={styles.feedback} aria-live="assertive">
                  {feedback === "wrong" ? `Not quite — ${WRONG_COST} points. Try again!` : "Tap a filled slot to remove its letter."}
                </p>
              </div>
            ) : (
              <div className={`${styles.revealPanel} ${roundWon ? styles.revealWon : styles.revealMissed}`}>
                {roundWon && (
                  <div className={styles.confetti} aria-hidden="true">
                    {CONFETTI.map((piece, index) => (
                      <i
                        key={index}
                        style={{
                          "--confetti-left": piece.left,
                          "--confetti-delay": piece.delay,
                          "--confetti-drift": piece.drift,
                          "--confetti-spin": piece.spin,
                          "--confetti-colour": piece.colour,
                        } as CSSProperties}
                      />
                    ))}
                  </div>
                )}
                <div className={styles.revealIcon}>{roundWon ? <Check /> : <Clock3 />}</div>
                <span>{roundWon ? "THAT'S THE WORD!" : "TIME'S UP"}</span>
                <h2>{round.answer}</h2>
                <p>{round.takeaway}</p>
                <blockquote>“{round.hostLine}”</blockquote>
                {roundWon && <strong>+{roundPoints.toLocaleString()} POINTS</strong>}
                <button className={styles.primaryButton} type="button" onClick={advanceRound}>
                  {roundIndex === ROUNDS.length - 1 ? "See final score" : "Next picture puzzle"}
                  <ArrowRight />
                </button>
              </div>
            )}
          </div>

          <div className={styles.roundDots} aria-label="Round progress">
            {ROUNDS.map((item, index) => (
              <span
                className={index === roundIndex ? styles.currentDot : index < roundIndex ? styles.doneDot : ""}
                key={item.answer}
              >
                {index < roundIndex ? <Check /> : index + 1}
              </span>
            ))}
          </div>
        </section>
      )}

      {screen === "results" && (
        <section className={styles.results}>
          <div className={styles.confetti} aria-hidden="true">
            {CONFETTI.map((piece, index) => (
              <i
                key={index}
                style={{
                  "--confetti-left": piece.left,
                  "--confetti-delay": piece.delay,
                  "--confetti-drift": piece.drift,
                  "--confetti-spin": piece.spin,
                  "--confetti-colour": piece.colour,
                } as CSSProperties}
              />
            ))}
          </div>
          <div className={styles.trophy}><Trophy /></div>
          <span className={styles.eyebrow}>FINAL SCORE</span>
          <h1>{scoreTitle}</h1>
          <div className={styles.finalScore}>{score.toLocaleString()}<small>PTS</small></div>
          <p>You solved <strong>{correctCount} of {ROUNDS.length}</strong> picture puzzles.</p>
          <div className={styles.answerRibbon}>
            {ROUNDS.map((item, index) => (
              <span className={solvedRounds[index] ? styles.solved : styles.missed} key={item.answer}>
                {solvedRounds[index] ? <Check /> : <X />} {item.answer}
              </span>
            ))}
          </div>
          <blockquote>Public finance makes more sense when you can see what connects the clues.</blockquote>
          <GameScoreReporter gameId="four-pics-one-word" score={score} />
          <button className={styles.primaryButton} type="button" onClick={startGame}>
            <RotateCcw /> Play again
          </button>
        </section>
      )}
    </main>
  )
}
