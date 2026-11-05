import React, { useState } from "react";
import { NO_CONNECT, PRACTICE, letterById } from "../lib/letters";
import { speak } from "../lib/speech";

export default function Examples({ scale = 1 }) {
  const [openId, setOpenId] = useState("bismilla");
  const [word, setWord] = useState(null);
  const [note, setNote] = useState("");
  const text = PRACTICE.find((item) => item.id === openId) || PRACTICE[0];

  const play = (value) => setNote(speak(value) ? "" : "Ovaj preglednik ne podržava izgovor.");
  const glyphSize = (base) => ({ fontSize: `${(base * scale).toFixed(2)}rem`, lineHeight: 1.2 });

  return (
    <div className="space-y-10 pt-8">
      <section>
        <p className="text-[11px] uppercase tracking-[0.24em] text-accent">+1 specijalni čas</p>
        <h2 className="mt-2 max-w-[46ch] font-display text-3xl font-bold leading-tight sm:text-4xl">
          Spajanje i praktično čitanje — od slova do dove.
        </h2>
        <p className="mt-3 max-w-[58ch] text-muted">
          Arapska slova se u riječi drže za ruke. Ali šest slova ima jednu posebnost: ne spajaju se ulijevo, nego
          prave mali prekid i puštaju sljedeće slovo da stane.
        </p>
      </section>

      <section className="rounded-3xl border border-line bg-panel/60 p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-flare">Pravilo šest slova</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {NO_CONNECT.map((id) => {
            const letter = letterById(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => play(letter.glyph)}
                className="rounded-2xl border border-line/80 bg-panel2/60 px-2 py-4 text-center transition hover:-translate-y-0.5 hover:border-flare/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="arabic block text-ink" style={glyphSize(2.1)}>
                  {letter.glyph}
                </span>
                <p className="mt-2 text-xs font-semibold">{letter.name}</p>
                <p className="text-[10px] text-muted">{letter.sound}</p>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink/75">
          Sva ostala slova se spajaju s obje strane. Zato „Bismilla” ima spojeno بِسْ, a kod اَلرَّحِيمِ napravimo
          predah poslije Râ.
        </p>
        {note && <p className="mt-2 text-xs text-sun">{note}</p>}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Vježba čitanja</p>
            <h3 className="mt-2 font-display text-2xl font-bold">Tri teksta koja već znaš napamet</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRACTICE.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setOpenId(item.id);
                  setWord(null);
                }}
                aria-pressed={item.id === text.id}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  item.id === text.id
                    ? "border-accent/70 bg-accent/10 text-accent"
                    : "border-line bg-panel/60 text-muted hover:border-accent/40 hover:text-ink"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-line bg-panel/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold">{text.title}</p>
              <p className="text-sm text-muted">{text.meaning}</p>
            </div>
            <button
              type="button"
              onClick={() => play(text.ar)}
              className="rounded-full border border-line px-4 py-2 text-xs text-muted transition hover:border-accent/60 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              🔊 Slušaj cijeli tekst
            </button>
          </div>

          <p className="arabic mt-4 text-right leading-loose text-ink" style={glyphSize(2.2)} dir="rtl">
            {text.ar}
          </p>
          <p className="mt-2 text-sm text-ink/70">{text.tr}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {text.words.map((item) => (
              <button
                key={item.ar}
                type="button"
                onClick={() => {
                  setWord(item);
                  play(item.ar);
                }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  word?.ar === item.ar
                    ? "border-accent/70 bg-accent/10"
                    : "border-line bg-panel2/60 hover:-translate-y-0.5 hover:border-accent/40"
                }`}
              >
                <span className="arabic text-2xl text-ink">{item.ar}</span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted">{item.tr}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-line/80 bg-panel2/50 px-4 py-3">
            <p className="text-sm text-ink/80">
              {word ? word.tip : "Dodirni dio teksta iznad i ovdje će pisati kako se čita i koje slovo ga nosi."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}