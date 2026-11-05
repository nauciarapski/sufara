import React, { useEffect, useRef, useState } from "react";
import { LETTERS, makeQuestion, pointsFor } from "../lib/letters";

const START_LIVES = 3;
const BASE_TIME = 9000;

export default function Game({ best = 0, onNewBest = () => {} }) {
  const [phase, setPhase] = useState("start");
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [gain, setGain] = useState(0);

  const level = 1 + Math.floor(correctCount / 5);
  const duration = Math.max(3500, BASE_TIME - (level - 1) * 900);
  const remainingRef = useRef(0);
  const resolveRef = useRef(() => {});
  const actionsRef = useRef({});

  const resolve = (pickedId) => {
    if (phase !== "play" || locked || !question) return;
    const correct = pickedId === question.letter.id;
    setLocked(true);
    setFeedback({ correct, pickedId, answerId: question.letter.id });
    if (correct) {
      const earned = pointsFor(remainingRef.current, duration);
      setGain(earned);
      setScore((value) => value + earned);
      setCorrectCount((value) => value + 1);
      setStreak((value) => value + 1);
    } else {
      setGain(0);
      setStreak(0);
      setLives((value) => Math.max(0, value - 1));
    }
  };

  resolveRef.current = resolve;

  const start = () => {
    setScore(0);
    setLives(START_LIVES);
    setCorrectCount(0);
    setStreak(0);
    setGain(0);
    setFeedback(null);
    setLocked(false);
    setRemaining(BASE_TIME);
    setQuestion(makeQuestion());
    setPhase("play");
  };

  const togglePause = () => {
    setPhase((current) => (current === "play" ? "paused" : current === "paused" ? "play" : current));
  };

  actionsRef.current = { resolve, start, togglePause, phase };

  useEffect(() => {
    const onKey = (event) => {
      const actions = actionsRef.current;
      if (event.key === "1" || event.key === "2" || event.key === "3") {
        event.preventDefault();
        actions.resolve(LETTERS[Number(event.key) - 1].id);
        return;
      }
      if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        if (actions.phase === "start" || actions.phase === "over") actions.start();
        else actions.togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (phase !== "play" || locked || !question) return undefined;
    const dur = duration;
    const started = performance.now();
    let raf = 0;
    remainingRef.current = dur;
    setRemaining(dur);

    const loop = (now) => {
      const left = Math.max(0, dur - (now - started));
      remainingRef.current = left;
      setRemaining((prev) => (Math.abs(prev - left) > 50 || left === 0 ? left : prev));
      if (left <= 0) {
        resolveRef.current(null);
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, locked, question, duration]);

  useEffect(() => {
    if (!locked) return undefined;
    const timer = setTimeout(() => {
      setFeedback(null);
      setLocked(false);
      setQuestion((current) => (current ? makeQuestion() : current));
    }, 1150);
    return () => clearTimeout(timer);
  }, [locked]);

  useEffect(() => {
    if (phase !== "play" || lives > 0) return;
    setPhase("over");
    onNewBest(score);
  }, [lives, phase, score, onNewBest]);

  const pct = duration > 0 ? Math.max(0, Math.min(100, (remaining / duration) * 100)) : 0;
  const answeredLetter = feedback ? LETTERS.find((letter) => letter.id === feedback.answerId) : null;
  const running = phase === "play";
  const showGlyph = question && (phase === "play" || phase === "paused" || phase === "over");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 rounded-2xl border border-line bg-panel/70 px-4 py-3 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Poeni</p>
          <p className="font-display text-4xl font-bold tabular-nums leading-none text-accent drop-shadow-[0_0_25px_rgba(56,232,255,0.45)] sm:text-5xl">
            {score}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel/70 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Najbolji</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{Math.max(best, score)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel/70 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Nivo</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{level}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel/70 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Životi</p>
          <div className="mt-2 flex items-center gap-2">
            {Array.from({ length: START_LIVES }).map((_, index) => (
              <span
                key={index}
                className={`h-3 w-3 rounded-full transition ${
                  index < lives ? "bg-flare shadow-[0_0_14px_rgba(255,61,154,0.8)]" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-panel/80 shadow-[0_0_80px_-40px_rgba(56,232,255,0.9)]">
        <div className="h-1 w-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-accent via-accent to-flare"
            style={{ width: `${pct}%`, transition: "width 80ms linear" }}
          />
        </div>

        <div className="kx-grid-field relative flex min-h-[300px] flex-col items-center justify-center px-6 py-10">
          {showGlyph ? (
            <div className="text-center">
              <span className="arabic block text-[6rem] leading-none text-ink drop-shadow-[0_0_45px_rgba(56,232,255,0.35)] sm:text-[9rem]">
                {question.glyph}
              </span>
              <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-muted">{question.form.label}</p>
              <p className="mx-auto mt-2 max-w-[34ch] text-xs text-ink/60">{question.form.note}</p>
            </div>
          ) : (
            <div className="text-center">
              <span className="arabic block text-[5rem] leading-none text-accent/70 sm:text-[7rem]">ج ح خ</span>
              <p className="mt-4 max-w-[36ch] text-sm text-muted">
                Tri slova, jedan oblik. Pogodi koje je koje prije nego što istekne vrijeme.
              </p>
            </div>
          )}

          {feedback && (
            <div
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border px-4 py-2 text-xs font-semibold ${
                feedback.correct
                  ? "border-good/60 bg-good/10 text-good"
                  : "border-bad/60 bg-bad/10 text-bad"
              }`}
            >
              {feedback.correct
                ? `Tačno · +${gain}`
                : feedback.pickedId
                  ? `Netačno · ${answeredLetter ? answeredLetter.dotHint : ""}`
                  : `Vrijeme isteklo · ${answeredLetter ? answeredLetter.dotHint : ""}`}
            </div>
          )}

          {phase === "start" && (
            <div className="absolute inset-0 grid place-items-center bg-void/85 px-6 backdrop-blur-sm">
              <div className="max-w-md text-center">
                <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Igra prepoznavanja</p>
                <h3 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Koje je ovo slovo?</h3>
                <p className="mt-2 text-sm text-muted">
                  Tri života, vrijeme se skraćuje sa svakih pet tačnih odgovora. Brži odgovor nosi više poena.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {["1", "2", "3"].map((key) => (
                    <span
                      key={key}
                      className="rounded-lg border border-line bg-panel2 px-3 py-1 font-mono text-xs text-ink"
                    >
                      {key}
                    </span>
                  ))}
                  <span className="text-[11px] text-muted">biraj slovo</span>
                  <span className="rounded-lg border border-line bg-panel2 px-3 py-1 font-mono text-xs text-ink">
                    Space
                  </span>
                  <span className="text-[11px] text-muted">pauza</span>
                </div>
                <button
                  type="button"
                  onClick={start}
                  className="mt-6 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-void transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                >
                  Počni
                </button>
              </div>
            </div>
          )}

          {phase === "paused" && (
            <div className="absolute inset-0 grid place-items-center bg-void/85 px-6 backdrop-blur-sm">
              <div className="text-center">
                <h3 className="font-display text-2xl font-bold">Pauza</h3>
                <p className="mt-2 text-sm text-muted">Poeni: {score}</p>
                <button
                  type="button"
                  onClick={togglePause}
                  className="mt-5 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-void transition hover:brightness-110"
                >
                  Nastavi
                </button>
              </div>
            </div>
          )}

          {phase === "over" && (
            <div className="absolute inset-0 grid place-items-center bg-void/90 px-6 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.28em] text-flare">Kraj partije</p>
                <p className="mt-2 font-display text-5xl font-bold tabular-nums text-accent">{score}</p>
                <p className="mt-1 text-sm text-muted">
                  Najbolji rezultat: <span className="text-ink">{Math.max(best, score)}</span>
                </p>
                <button
                  type="button"
                  onClick={start}
                  className="mt-5 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-void transition hover:brightness-110"
                >
                  Igraj ponovo
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-line p-4 sm:grid-cols-3">
          {LETTERS.map((letter, index) => {
            const isAnswer = feedback && feedback.answerId === letter.id;
            const isPicked = feedback && feedback.pickedId === letter.id;
            let tone = "border-line bg-panel2/60 hover:-translate-y-0.5 hover:border-accent/50";
            if (isAnswer) tone = "border-good/70 bg-good/10";
            else if (isPicked) tone = "border-bad/70 bg-bad/10";
            return (
              <button
                key={letter.id}
                type="button"
                onClick={() => resolve(letter.id)}
                disabled={!running || locked}
                className={`group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70 ${tone}`}
              >
                <span className="flex items-center gap-3">
                  <span className="arabic text-3xl text-ink">{letter.glyph}</span>
                  <span>
                    <span className="block text-sm font-semibold">{letter.name}</span>
                    <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">{letter.dotHint}</span>
                  </span>
                </span>
                <span className="rounded-md border border-line px-2 py-1 font-mono text-[10px] text-muted">
                  {index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="rounded-full border border-line bg-panel2/60 px-3 py-1">
            Niz: <span className="text-ink tabular-nums">{streak}</span>
          </span>
          <span className="rounded-full border border-line bg-panel2/60 px-3 py-1">
            Vrijeme: <span className="text-ink tabular-nums">{Math.ceil(remaining / 100) / 10}s</span>
          </span>
          <span className="rounded-full border border-line bg-panel2/60 px-3 py-1">
            Tačnih: <span className="text-ink tabular-nums">{correctCount}</span>
          </span>
        </div>
        {running && (
          <button
            type="button"
            onClick={togglePause}
            className="rounded-full border border-line px-4 py-2 text-xs text-muted transition hover:border-accent/50 hover:text-ink"
          >
            Pauza
          </button>
        )}
        {phase === "paused" && (
          <button
            type="button"
            onClick={start}
            className="rounded-full border border-line px-4 py-2 text-xs text-muted transition hover:border-flare/50 hover:text-ink"
          >
            Počni ispočetka
          </button>
        )}
      </div>
    </div>
  );
}