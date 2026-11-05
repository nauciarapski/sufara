import React, { useEffect, useRef, useState } from "react";

const SYSTEM = `Ti si "Virtualni muallim" u kursu arapskog pisma za starije polaznike (džematlije) koji govore bosanski.
Odgovaraj na bosanskom jeziku, toplo, strpljivo i kratko (najviše 120 riječi).
Objašnjavaj kroz domaće slike: čamčić, stomačić, repić, zubići, krug, hareke.
Nikoga ne kori i ne omalovažavaj; ako je neko ranije odustajao, ohrabri ga.
Ako pitanje traži fetvu ili precizno učenje izgovora, reci da to provjeri kod svog muallima.
Ne izmišljaj ajete ni hadise.`;

const QUICK = [
  "Kako da ne pobrkam Dž, H i Kh?",
  "Zašto arapski ima samo 28 slova?",
  "Mnemotehnika za tačke iznad i ispod",
  "Kako da vježbam 10 minuta dnevno?",
  "Objasni mi hareke jednostavno",
];

export default function Muallim() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Selam! Ja sam tvoj virtualni muallim. Pitaj me bilo šta o slovima, tačkama ili hareketima — bez žurbe i bez srama." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, busy, error]);

  const send = async (value) => {
    const question = (value || input).trim();
    if (!question || busy) return;
    setError("");
    setInput("");
    setBusy(true);
    const next = [...messages, { role: "user", content: question }];
    setMessages(next);
    try {
      if (!window.KOOD_AI || typeof window.KOOD_AI.chat !== "function") {
        const failed = new Error("Pomoćnik trenutno nije dostupan u ovom pregledu.");
        failed.code = "unavailable";
        throw failed;
      }
      const { reply } = await window.KOOD_AI.chat([
        { role: "system", content: SYSTEM },
        ...next.map((item) => ({ role: item.role, content: item.content })),
      ]);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: (reply || "").trim() || "Nisam dobio odgovor — pitaj me ponovo." },
      ]);
    } catch (err) {
      const code = err && err.code ? err.code : "";
      const reason =
        code === "rate_limited"
          ? "Previše pitanja u kratkom vremenu. Sačekaj minutu i pitaj ponovo."
          : (err && err.message) || "Veza sa pomoćnikom nije uspjela. Pokušaj ponovo.";
      setError(reason);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pt-8">
      <section className="max-w-[62ch]">
        <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Virtualni muallim</p>
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">Pitaj kad god ti nije jasno</h2>
        <p className="mt-2 text-muted">
          Pomoćnik odgovara na bosanskom, objašnjava polako i daje mnemotehnike. Model:{" "}
          <span className="text-ink/80">{(typeof window !== "undefined" && window.KOOD_AI && window.KOOD_AI.model) || "kood Flash"}</span>
        </p>
      </section>

      <section className="rounded-3xl border border-line bg-panel/70">
        <div className="max-h-[26rem] space-y-3 overflow-y-auto px-5 py-5">
          {messages.map((item, index) => (
            <div key={index} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  item.role === "user"
                    ? "bg-accent text-void"
                    : "border border-line bg-panel2/70 text-ink/90"
                }`}
              >
                {item.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-line bg-panel2/70 px-4 py-3 text-sm text-muted">
                Muallim piše…
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-bad/60 bg-bad/10 px-4 py-3 text-sm text-bad">{error}</div>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
          {QUICK.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => send(item)}
              disabled={busy}
              className="rounded-full border border-line bg-panel2/60 px-3 py-1.5 text-[11px] text-muted transition hover:border-accent/50 hover:text-ink disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Napiši pitanje na bosanskom…"
            className="min-w-0 flex-1 rounded-full border border-line bg-void/60 px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-void transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Šaljem…" : "Pitaj"}
          </button>
        </form>
      </section>
    </div>
  );
}