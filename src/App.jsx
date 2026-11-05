import React, { useCallback, useState } from "react";
import Lesson from "./components/Lesson";
import Examples from "./components/Examples";
import Game from "./components/Game";
import Muallim from "./components/Muallim";
import PrintSheet from "./components/PrintSheet";
import { LESSONS, letterById } from "./lib/letters";

const TABS = [
  { id: "uvod", label: "Uvod" },
  { id: "casovi", label: "Časovi 1–5" },
  { id: "plus1", label: "+1 Čas" },
  { id: "igra", label: "Igra" },
  { id: "muallim", label: "Muallim" },
  { id: "stampa", label: "Štampa" },
];

export default function App() {
  const [tab, setTab] = useState("uvod");
  const [lessonId, setLessonId] = useState("cas1");
  const [scale, setScale] = useState(1);
  const [best, setBest] = useState(0);

  const registerBest = useCallback((value) => setBest((current) => Math.max(current, value)), []);
  const zoom = (step) => setScale((value) => Math.min(1.6, Math.max(0.85, Math.round((value + step) * 100) / 100)));
  const openLesson = (id) => {
    setLessonId(id);
    setTab("casovi");
  };

  return (
    <div className="relative min-h-screen bg-void text-ink">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 kx-atmosphere" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 kx-grain" />

      <header className="sticky top-0 z-40 border-b border-line bg-void/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
          <img src="/logo.svg" alt="sufara.online" width="28" height="28" className="h-7 w-7" />
          <div className="mr-auto leading-tight">
            <p className="text-sm font-semibold">sufara.online</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Metoda 5 + 1 · arapsko pismo</p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-line bg-panel/70 p-1">
            <button
              type="button"
              onClick={() => zoom(-0.15)}
              aria-label="Smanji slova"
              className="h-8 w-8 rounded-full text-sm font-bold text-muted transition hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              A−
            </button>
            <span className="w-10 text-center text-[10px] tabular-nums text-muted">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={() => zoom(0.15)}
              aria-label="Povećaj slova"
              className="h-8 w-8 rounded-full text-sm font-bold text-muted transition hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              A+
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl overflow-x-auto px-5 pb-3">
          <div className="flex w-max items-center gap-1 rounded-full border border-line bg-panel/70 p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-pressed={tab === item.id}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm ${
                  tab === item.id ? "bg-accent text-void" : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-20">
        {tab === "uvod" && (
          <div className="space-y-16">
            <section className="kx-rise grid gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-14">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Specijalni kurs za džematlije</p>
                <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
                  Arapsko pismo
                  <span className="mt-2 block bg-gradient-to-r from-accent via-ink to-flare bg-clip-text text-transparent">
                    lahko je od bosanskog
                  </span>
                </h1>
                <p className="mt-5 max-w-[58ch] text-muted">
                  Ako ste nekoliko puta počinjali i odustajali — nije bilo do vas. Arapski ima 28 slova i nijedno
                  nema veliko i malo, štampano i pisano, ćirilicu i latinicu. Bog je odabrao arapski za posljednju
                  Objavu, jezik sredine, razumljiv svakom narodu — i zato je jednostavan.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["28 slova", "bez velikih i malih", "bez ćirilice i latinice", "5 + 1 časova"].map((chip) => (
                    <span key={chip} className="rounded-full border border-line bg-panel2/60 px-3 py-1 text-xs text-muted">
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openLesson("cas1")}
                    className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-void transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                  >
                    Počni 1. čas
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("stampa")}
                    className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink transition hover:border-accent/60 hover:text-accent"
                  >
                    Štampani list
                  </button>
                </div>
              </div>

              <div className="relative rounded-3xl border border-line bg-panel/70 p-6 shadow-[0_0_90px_-40px_rgba(56,232,255,0.9)]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Matematičko poređenje</p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-line/80 bg-panel2/50 px-5 py-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted">Bosanski</p>
                        <p className="mt-1 text-sm text-ink/70">30 glasova × 8 oblika</p>
                      </div>
                      <p className="font-display text-6xl font-bold leading-none tabular-nums text-ink/80">240</p>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted">
                      ćirilica i latinica · velika i mala · štampana i pisana · dugi vokali i akcenti
                    </p>
                  </div>
                  <div className="rounded-2xl border border-accent/60 bg-accent/[0.08] px-5 py-5 shadow-[0_0_60px_-25px_rgba(56,232,255,0.9)]">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-accent">Arapski</p>
                        <p className="mt-1 text-sm text-ink/80">28 slova · jedan oblik</p>
                      </div>
                      <p className="font-display text-7xl font-bold leading-none tabular-nums text-accent drop-shadow-[0_0_30px_rgba(56,232,255,0.5)]">
                        28
                      </p>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-ink/70">
                      nema velika i mala slova · nema dva pisma · nema štampano i pisano
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-center text-[11px] uppercase tracking-[0.2em] text-muted">
                  stranac za bosanski uči 240 simbola. mi učimo 28.
                </p>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              {[
                ["Jezik sredine", "Arapski je jezik na kojem je posljednja Objava. Uči se kao jezik dove — pomalo, svaki dan."],
                ["Nema skrivenih slova", "Svako slovo ima jedan osnovni oblik. Tačke i hareke mijenjaju glas, ne oblik."],
                ["Starost nije smetnja", "Kurs je napravljen za ljude koji su dugo vjeru prakticirali, a pismo nisu savladali. Krupno, tiho, bez žurbe."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-line bg-panel/60 p-5">
                  <p className="font-display text-lg font-semibold">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              ))}
            </section>

            <section>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-flare">Struktura kursa</p>
                  <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Pet porodica i jedan poseban čas</h2>
                </div>
                <p className="max-w-[38ch] text-sm text-muted">Klikni na porodicu i otvori čas sa svim slovima.</p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {LESSONS.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => openLesson(lesson.id)}
                    className="group rounded-2xl border border-line bg-panel/60 p-4 text-left transition hover:-translate-y-1 hover:border-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="text-[10px] uppercase tracking-[0.2em] text-accent">{lesson.no} čas</span>
                    <p className="mt-1 font-display text-base font-semibold">{lesson.title}</p>
                    <div className="mt-3 flex flex-wrap gap-1 text-2xl text-ink">
                      {lesson.ids.map((id) => (
                        <span key={id} className="arabic">
                          {letterById(id)?.glyph}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-flare/40 bg-flare/[0.06] px-5 py-4">
                <p className="text-sm text-ink/85">
                  <span className="font-semibold text-flare">+1 Čas:</span> spajanje i praktično čitanje — šest slova
                  koja se ne spajaju ulijevo, pa Bismilla, El-Ihlas i dova „Rabbi jessir”.
                </p>
              </div>
            </section>
          </div>
        )}

        {tab === "casovi" && <Lesson lessonId={lessonId} onChangeLesson={setLessonId} scale={scale} />}

        {tab === "plus1" && <Examples scale={scale} />}

        {tab === "igra" && <Game best={best} onNewBest={registerBest} />}

        {tab === "muallim" && <Muallim />}

        {tab === "stampa" && <PrintSheet scale={scale} />}
      </main>

      <footer className="border-t border-line/70 bg-panel/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted">
          <p>sufara.online · Kurs arapskog pisma · Metoda 5 + 1</p>
          <p>Za džematlije: polako, krupno, bez žurbe.</p>
        </div>
      </footer>
    </div>
  );
}