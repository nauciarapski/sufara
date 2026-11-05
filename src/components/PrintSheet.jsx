import React from "react";
import { LESSONS, HARAKAT, letterById } from "../lib/letters";

export default function PrintSheet({ scale = 1 }) {
  return (
    <div className="space-y-6 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Podsjetnik za štampu</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Male sufare u 5 porodica</h2>
          <p className="mt-2 max-w-[56ch] text-sm text-muted">
            Jedan list koji stane u džep. Odštampaj ga i ponesi u džamiju — sva slova, imena i hareke na jednom mjestu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-void transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          🖨 Štampaj list
        </button>
      </div>

      <div className="rounded-3xl border border-line bg-panel/60 p-6 print:border-0 print:bg-white print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 pb-3 print:border-slate-300">
          <div>
            <p className="font-display text-xl font-bold text-ink print:text-slate-900">Arapsko pismo — 28 slova</p>
            <p className="text-xs text-muted print:text-slate-600">sufara.online · Metoda 5 + 1 · kurs za džematlije</p>
          </div>
          <p className="text-xs text-muted print:text-slate-600">ime polaznika: ____________________</p>
        </div>

        <div className="mt-5 space-y-5">
          {LESSONS.map((lesson) => (
            <div key={lesson.id} className="break-inside-avoid">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent print:text-slate-700">
                {lesson.no} čas · {lesson.title} <span className="text-muted print:text-slate-500">— {lesson.sub}</span>
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {lesson.ids.map((id) => {
                  const letter = letterById(id);
                  return (
                    <div
                      key={id}
                      className="rounded-xl border border-line/80 bg-panel2/50 px-2 py-2 text-center print:border-slate-300 print:bg-white"
                    >
                      <span
                        className="arabic block text-ink print:text-slate-900"
                        style={{ fontSize: `${(2.1 * scale).toFixed(2)}rem`, lineHeight: 1.15 }}
                      >
                        {letter.glyph}
                      </span>
                      <p className="mt-1 text-[11px] font-semibold text-ink print:text-slate-900">{letter.name}</p>
                      <p className="text-[10px] text-muted print:text-slate-600">{letter.sound}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="break-inside-avoid border-t border-line/70 pt-4 print:border-slate-300">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-flare print:text-slate-700">
              Hareke — kratki vokali
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {HARAKAT.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-line/80 bg-panel2/50 px-2 py-2 text-center print:border-slate-300 print:bg-white"
                >
                  <span
                    className="arabic block text-ink print:text-slate-900"
                    style={{ fontSize: `${(1.6 * scale).toFixed(2)}rem`, lineHeight: 1.2 }}
                  >
                    {item.sign}
                  </span>
                  <p className="mt-1 text-[11px] font-semibold text-ink print:text-slate-900">{item.name}</p>
                  <p className="text-[10px] text-muted print:text-slate-600">{item.tr}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="break-inside-avoid rounded-2xl border border-line/80 bg-panel2/40 px-4 py-3 print:border-slate-300 print:bg-white">
            <p className="text-xs font-semibold text-ink print:text-slate-900">Pravilo šest slova</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted print:text-slate-600">
              Elif, Dâl, Zâl, Râ, Zâ i Vâv se ne spajaju ulijevo — poslije njih sljedeće slovo počinje samostalno.
              Sva ostala slova se drže za ruke s obje strane.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}