"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ember critter — a pixel companion for Ember Code with a whole moveset.
 * It autonomously cycles through moods while idle (walk, whistle, bored, happy,
 * football, hyper), breaks into a run while the agent is working (busy), and
 * does a random trick when you poke it. Animations honour the reduced-motion
 * preference via the global data-motion CSS.
 *
 * Only the ACTIVE mood's effect is mounted (notes / zzz / hearts / ball), so
 * effects can never overlap or leak between moods.
 */

type Mood = "walk" | "run" | "hyper" | "bored" | "happy" | "whistle" | "football";

const IDLE_MOODS: Mood[] = ["walk", "whistle", "bored", "happy", "football", "hyper"];
const POKE_MOODS: Mood[] = ["happy", "football", "hyper", "whistle"];

const MOOD_LABEL: Record<Mood, string> = {
  walk: "out for a stroll",
  run: "on the case",
  hyper: "hyperactive",
  bored: "bored",
  happy: "happy",
  whistle: "whistling",
  football: "playing football",
};

// Pixel sprite (facing right). a=body(accent), e=eye, f=flag. The two frames
// differ only in the legs row → a 2-frame walk cycle.
const BODY = [
  "  f        ",
  "  ff  aaa  ",
  "  f  aaaaa ",
  " aaaaaaaaae",
  " aaaaaaaaaa",
  "  aaaaaaaa ",
];
const FRAME_A = [...BODY, " a  a a  a "];
const FRAME_B = [...BODY, "  a a  a a "];

const COLORS: Record<string, string> = {
  a: "var(--color-accent)",
  e: "var(--color-foreground)",
  f: "var(--color-foreground)",
};
const COLS = FRAME_A[0].length;
const ROWS = FRAME_A.length;

function Frame({ map, unit, className }: { map: string[]; unit: number; className?: string }) {
  return (
    <div
      className={`absolute inset-0 grid ${className ?? ""}`}
      style={{ gridTemplateColumns: `repeat(${COLS}, ${unit}px)`, gridAutoRows: `${unit}px` }}
      aria-hidden
    >
      {map.flatMap((row, r) =>
        [...row].map((ch, c) => <span key={`${r}-${c}`} style={{ background: COLORS[ch] ?? "transparent" }} />)
      )}
    </div>
  );
}

const Note = () => (
  <svg width="6" height="9" viewBox="0 0 6 9" fill="currentColor">
    <circle cx="2" cy="7" r="2" />
    <rect x="3.2" y="0" width="1" height="7" />
  </svg>
);
const Heart = () => (
  <svg width="9" height="8" viewBox="0 0 9 8" fill="currentColor">
    <path d="M4.5 8 0.7 3.6a2.1 2.1 0 0 1 3.8-1.4A2.1 2.1 0 0 1 8.3 3.6z" />
  </svg>
);

/** The one effect that belongs to the active mood, positioned around the sprite. */
function MoodFx({ mood }: { mood: Mood }) {
  if (mood === "whistle")
    return (
      <span className="ec-fx ec-notes" aria-hidden>
        <span><Note /></span>
        <span><Note /></span>
        <span><Note /></span>
      </span>
    );
  if (mood === "bored")
    return (
      <span className="ec-fx ec-zzz" aria-hidden>
        <i>z</i>
        <i>z</i>
        <i>z</i>
      </span>
    );
  if (mood === "happy")
    return (
      <span className="ec-fx ec-hearts" aria-hidden>
        <span><Heart /></span>
        <span><Heart /></span>
      </span>
    );
  if (mood === "football") return <span className="ec-fx ec-ball" aria-hidden />;
  return null;
}

export function EmberCritter({ busy = false, unit = 3 }: { busy?: boolean; unit?: number }) {
  const [mood, setMood] = useState<Mood>("walk");
  const [jump, setJump] = useState(false);
  const jumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Busy → run. Idle → wander through moods on a timer.
  useEffect(() => {
    if (busy) {
      setMood("run");
      return;
    }
    setMood((m) => (m === "run" ? "walk" : m));
    const id = setInterval(() => {
      setMood((m) => {
        const pool = IDLE_MOODS.filter((x) => x !== m);
        return pool[Math.floor(Math.random() * pool.length)];
      });
    }, 3800);
    return () => clearInterval(id);
  }, [busy]);

  useEffect(() => () => {
    if (jumpTimer.current) clearTimeout(jumpTimer.current);
  }, []);

  function poke() {
    setJump(true);
    if (jumpTimer.current) clearTimeout(jumpTimer.current);
    jumpTimer.current = setTimeout(() => setJump(false), 520);
    if (!busy) setMood(POKE_MOODS[Math.floor(Math.random() * POKE_MOODS.length)]);
  }

  const w = COLS * unit;
  const h = ROWS * unit;

  return (
    <button
      type="button"
      onClick={poke}
      aria-label="Ember, your coding companion"
      title={`Ember is ${MOOD_LABEL[mood]} — poke me`}
      className={`ec-root ec-mood-${mood}`}
      style={{ width: w + 30, height: h + 20 }}
    >
      <span className="ec-ground" />
      <MoodFx mood={mood} />
      <span className="ec-patrol" style={{ width: w, height: h }}>
        <span className="ec-hop" style={{ width: w, height: h }}>
          <span className={`ec-jumper ${jump ? "ec-jump" : ""}`} style={{ width: w, height: h }}>
            <span className="ec-bob" style={{ position: "relative", display: "block", width: w, height: h }}>
              <Frame map={FRAME_A} unit={unit} className="ec-legA" />
              <Frame map={FRAME_B} unit={unit} className="ec-legB" />
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
