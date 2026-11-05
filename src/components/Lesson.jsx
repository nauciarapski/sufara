import React, { useState } from "react";
import { LESSONS, FORMS, HARAKAT, letterById } from "../lib/letters";
import { speak } from "../lib/speech";

export default function Lesson({ lessonId = "cas1", onChangeLesson = () => {}, scale = 1 }) {
  const lesson = LESSONS.find((item) => item.id === lessonId) || LESSONS[0];
  const [picked, setPicked] = useState(null);
  const [note, setNote] = useState("");
  const active = lesson.ids.includes(picked) ? letterById(picked) : letterById(lesson.ids[0]);
  const index = LESSONS.findIndex((item) => item.id === lesson.id);
  const next = LESSONS[index + 1];

  const play = (text) => {
    const ok = speak(text);
    setNote(ok ? "" : "Ovaj preglednik ne podržava izgovor — slušaj muallima.");
  };

  const glyphSize = (base) => ({ fontSize: `${(base * scale).toFixed(2)}rem`, lineHeight: 1.1 });

  return (
    <div className="space-y-10 pt-8">
      <div className="flex flex-wrap gap-2">
        {LESSONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onChangeLesson(item.id);
              setPicked(null);
            }}
            aria-pressed={item.id === lesson.id}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              item.id === lesson.id
                ? "border-accent/70 bg-accent/10 text-accent"
                : "border-line bg-panel/60 text-muted hover:border-accent/40 hover:text-ink"
            }`}
          >
            {item.no} {item.title}
          </button>
        ))}
      </div>

      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-accent">{lesson.no} čas</p>
          <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">{lesson.title}</h2>
          <p className="mt-1 text-sm text-muted">{lesson.sub}</p>
          <p className="mt-4 max-w-[58ch] text-muted">{lesson.mnemonic}</p>
          <p className="mt-3 max-w-[58ch] text-sm text-ink/70">{lesson.compare}</p>
          <div className="mt-4 rounded-2xl border border-accent/40 bg-accent/[0.06] px-5 py-4">
            <p className="font-display text-sm font-semibold text-accent">Kako vježbati</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/80">{lesson.tip}</p>
          </div>
          {note && <p className="mt-3 text-xs text-sun">{note}</p>}
        </div>

        <div className="rounded-3xl border border-line bg-panel/70 p-5 shadow-[0_0_70px_-35px_rgba(56,232,255,0.7)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Izabrano slovo</p>
              <p className="mt-1 font-display text-xl font-semibold">
                {active.name} <span className="text-sm text-muted">· {active.sound}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => play(active.glyph)}
              className="rounded-full border border-line px-3 py-2 text-xs text-muted transition hover:border-accent/60 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              🔊 Slušaj
            </button>
          </div>
          <p className="arabic mt-3 text-center text-ink" style={glyphSize(5.5)}>
            {active.glyph}
          </p>
          <p className="mt-2 text-center text-xs leading-relaxed text-muted">{active.hint}</p>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {FORMS.map((form) => (
              <div key={form.id} className="rounded-xl border border-line/80 bg-panel2/70 px-2 py-3 text-center">
                <span className="arabic block text-ink" style={glyphSize(1.9)}>
                  {active.forms[form.id]}
                </span>
                <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-accent">{form.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line/80 bg-panel2/50 px-3 py-2">
            <p className="arabic text-2xl text-ink">{active.word.split("·")[1]}</p>
            <p className="text-right text-[11px] text-muted">{active.word.split("·")[0]}</p>
          </div>
          <button
            type="button"
            onClick={() => play(active.word.split("·")[1] || active.glyph)}
            className="mt-3 w-full rounded-full border border-line px-3 py-2 text-xs text-muted transition hover:border-accent/60 hover:text-accent"
          >
            🔊 Slušaj primjer
          </button>
        </div>
      </section>

      <section>
        <p className="text-[11px] uppercase tracking-[0.24em] text-flare">Slova ovog časa</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lesson.ids.map((id) => {
            const letter = letterById(id);
            const isActive = letter.id === active.id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setPicked(id);
                  play(letter.glyph);
                }}
                aria-pressed={isActive}
                className={`group flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive
                    ? "border-accent/70 bg-accent/[0.08] shadow-[0_0_40px_-20px_rgba(56,232,255,0.9)]"
                    : "border-line bg-panel/60 hover:-translate-y-0.5 hover:border-accent/40"
                }`}
              >
                <span className="arabic text-ink" style={glyphSize(2.6)}>
                  {letter.glyph}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-base font-semibold">{letter.name}</span>
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-muted">{letter.sound}</span>
                  <span className="mt-1 block text-xs leading-snug text-ink/60">{letter.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {lesson.harakat && (
        <section>
          <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Hareke — vokali</p>
          <h3 className="mt-2 font-display text-2xl font-bold">Znak iznad, znak ispod, znak u stomaku</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {HARAKAT.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => play("بَ بِ بُ")}
                className="rounded-2xl border border-line bg-panel/60 px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="arabic block text-ink" style={glyphSize(2.2)}>
                  {item.sign}
                </span>
                <p className="mt-2 font-display text-sm font-semibold">{item.name}</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-accent">{item.tr}</p>
                <p className="mt-1 text-[11px] leading-snug text-muted">{item.note}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-panel/60 px-5 py-5">
        <p className="max-w-[46ch] text-sm text-muted">
          {next ? `Sljedeće: ${next.no} čas — ${next.title}.` : "Završili ste pet časova. Slijedi +1 čas: spajanje i čitanje."}
        </p>
        <button
          type="button"
          onClick={() => {
            onChangeLesson(next ? next.id : "cas1");
            setPicked(null);
          }}
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-void transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {next ? "Idi na sljedeći čas" : "Ponovi prvi čas"}
        </button>
      </div>
    </div>
  );
}