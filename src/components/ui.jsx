/**
 * Kood UI kit - the components this project was given, so every screen is composed from the same
 * verified parts instead of new markup.
 *
 * Everything is styled with the locked design system's classes (kx-*), which live in src/index.css.
 * Change the design direction and every screen restyles with it. Behaviour lives here: disclosure
 * state, table empty states, rail snapping, reveal on scroll, focus rings.
 *
 * Numbers, dates and lists come from src/lib/format.js.
 */
import React, { useEffect, useRef, useState } from "react";
import { formatNumber, initials } from "../lib/format";

// One import site for a screen: the helpers the components themselves use are re-exported here.
export { initials } from "../lib/format";

export function cx(...values) {
  return values.filter(Boolean).join(" ");
}

/** The page itself: flat surface, the direction's own pattern, and a footer. */
export function Page(props) {
  return (
    <div className="kx-page" id="top">
      {props.children}
      <footer className="kx-shell kx-hairline" style={{ paddingBlock: "2.5rem", marginTop: "var(--spacing-kx-section)" }}>
        {props.footer || ""}
      </footer>
    </div>
  );
}

/** Sticky, blurred navigation: brand, links, one primary action. */
export function Nav(props) {
  return (
    <header className="kx-nav">
      <div className="kx-shell kx-row" style={{ justifyContent: "space-between", paddingBlock: "1rem", rowGap: "0.75rem" }}>
        <a className="kx-row" href="#top" style={{ gap: "0.6rem", textDecoration: "none", color: "inherit" }}>
          <span className="kx-avatar" aria-hidden="true">{props.mark || String(props.name || "?").slice(0, 1)}</span>
          <strong style={{ fontSize: "var(--text-kx-h3)" }}>{props.name}</strong>
        </a>
        <nav className="kx-row" aria-label="Sections" style={{ gap: "1.25rem" }}>
          {(props.links || []).map((link) => (
            <a key={link.href} className="kx-label" href={link.href} style={{ textDecoration: "none" }}>
              {link.label}
            </a>
          ))}
          {props.action ? <Button variant="primary" onClick={props.action.onClick}>{props.action.label}</Button> : null}
        </nav>
      </div>
    </header>
  );
}

/** The opening screen: display type, a lede, one or two actions, and a slot for the product panel. */
export function Hero(props) {
  return (
    <section className={"kx-hero kx-section kx-spotlight" + (props.children ? " kx-hero--split" : "")}>
      <div className="kx-stack" style={{ gap: "1.25rem" }}>
        {props.eyebrow ? <p className="kx-eyebrow">{props.eyebrow}</p> : null}
        <h1 className="kx-display">{props.title}</h1>
        {props.lede ? <p className="kx-lede">{props.lede}</p> : null}
        {props.actions ? <div className="kx-row">{props.actions}</div> : null}
        {props.proof ? <p className="kx-label">{props.proof}</p> : null}
      </div>
      {props.children ? <div className="kx-stack">{props.children}</div> : null}
    </section>
  );
}

/** A section that reveals itself once and carries its own heading. */
export function Section(props) {
  const ref = useReveal();
  const columns = props.columns === 2 ? "kx-grid kx-grid--2" : props.columns === 4 ? "kx-grid kx-grid--4" : "kx-grid kx-grid--3";
  return (
    <section className={props.tint ? "kx-section kx-section--tint" : "kx-section"} id={props.id}>
      <div ref={ref} className="kx-reveal" style={{ display: "grid", gap: "clamp(1.5rem, 1rem + 2vw, 2.75rem)" }}>
        {props.eyebrow ? <p className="kx-eyebrow">{props.eyebrow}</p> : null}
        {props.title ? <h2 className="kx-title">{props.title}</h2> : null}
        {props.hint ? <p className="kx-lede">{props.hint}</p> : null}
        {props.children ? <div className={props.plain ? undefined : columns}>{props.children}</div> : null}
      </div>
    </section>
  );
}

export function Card(props) {
  const variant = props.variant === "float" ? " kx-card--float" : props.variant === "raised" ? " kx-card--raised" : "";
  return (
    <div className={"kx-card" + variant + " kx-stack"}>
      {props.eyebrow ? <p className="kx-eyebrow">{props.eyebrow}</p> : null}
      {props.title ? <h3 className="kx-card__title">{props.title}</h3> : null}
      {props.children}
    </div>
  );
}

/** A bento tile: its own surface step, an optional big value, and a span for varied composition. */
export function Tile(props) {
  return (
    <div className={"kx-tile kx-stack" + (props.accent ? " kx-tile--accent" : "")} style={props.span ? { gridColumn: "span " + props.span } : undefined}>
      {props.meta ? <div className="kx-tile__meta">{props.meta}</div> : null}
      {props.value !== undefined ? <span className="kx-tile__value">{props.value}</span> : null}
      {props.title ? <h3 className="kx-card__title">{props.title}</h3> : null}
      {props.children}
    </div>
  );
}

/** A band of numbers read as type: the signature moment of a page, not four equal boxes. */
export function StatBand(props) {
  return (
    <section className="kx-stat-band" aria-label={props.label || "Numbers"}>
      {(props.items || []).map((item) => (
        <div className="kx-stat-band__item" key={item.label}>
          <span className="kx-tile__value">{item.value}</span>
          <span className="kx-eyebrow">{item.label}</span>
          {item.hint ? <span className="kx-label">{item.hint}</span> : null}
        </div>
      ))}
    </section>
  );
}

export function Kpi(props) {
  return (
    <div className="kx-kpi">
      <span className="kx-kpi__label">{props.label}</span>
      <span className="kx-kpi__value">{props.value}</span>
      {props.trend !== undefined ? (
        <span className={"kx-kpi__trend kx-kpi__trend--" + (props.trend >= 0 ? "up" : "down")}>
          {(props.trend >= 0 ? "+" : "") + props.trend + "%"}
        </span>
      ) : null}
      {props.hint ? <span className="kx-label">{props.hint}</span> : null}
    </div>
  );
}

/** Sideways browsing on a phone, a grid on a desktop. */
export function Rail(props) {
  return <div className="kx-rail">{props.children}</div>;
}

/** A testimonial with its source: never an anonymous sentence. */
export function Testimonial(props) {
  return (
    <figure className="kx-card kx-card--raised kx-testimonial">
      <blockquote className="kx-quote">{props.quote}</blockquote>
      <figcaption className="kx-testimonial__who">
        <span className="kx-avatar" aria-hidden="true">{initials(props.name)}</span>
        <span className="kx-stack" style={{ gap: "0.15rem" }}>
          <strong>{props.name}</strong>
          <span className="kx-label">{props.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function Logos(props) {
  return (
    <div className="kx-logos" aria-label={props.label || "Trusted by"}>
      {(props.items || []).map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

/** A process as a numbered sequence, never a row of equal cards. */
export function Steps(props) {
  return (
    <div className="kx-steps">
      {(props.items || []).map((item) => (
        <div className="kx-step" key={item.title}>
          <span className="kx-step__index" aria-hidden="true" />
          <p className="kx-card__title">{item.title}</p>
          <p className="kx-card__body">{item.body}</p>
        </div>
      ))}
    </div>
  );
}

/** A real disclosure, keyboard accessible. */
export function Faq(props) {
  const items = props.items || [];
  const [open, setOpen] = useState(items.length > 0 ? items[0].q : "");
  return (
    <div className="kx-faq">
      {items.map((item) => (
        <div className="kx-faq__item" key={item.q}>
          <button type="button" className="kx-faq__q" aria-expanded={open === item.q} onClick={() => setOpen(open === item.q ? "" : item.q)}>
            <span>{item.q}</span>
            <span aria-hidden="true">{open === item.q ? "-" : "+"}</span>
          </button>
          {open === item.q ? <p className="kx-faq__a">{item.a}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function CtaBand(props) {
  return (
    <section className="kx-cta kx-cta--split kx-section kx-spotlight">
      <div className="kx-stack">
        <h2 className="kx-title">{props.title}</h2>
        {props.body ? <p className="kx-lede">{props.body}</p> : null}
      </div>
      <div className="kx-row">{props.children}</div>
    </section>
  );
}

/** A drawn picture from the palette: remote photos are blocked in the preview. */
export function Media(props) {
  return (
    <div className={props.tall ? "kx-media kx-media--tall" : "kx-media"} role="img" aria-label={props.label}>
      {props.label ? <span className="kx-media__label">{props.label}</span> : null}
    </div>
  );
}

/**
 * A real photograph, with the ratio its slot needs, an optional tone that pulls it into the palette,
 * and a caption that cites it. Pass a picture from the project's own photos module (photos.hero.src,
 * photos.interior2.src, ...) - never a remote URL, which the preview blocks.
 */
export function Photo(props) {
  const style = props.ratio ? { aspectRatio: props.ratio } : undefined;
  return (
    <figure className={props.tall ? "kx-photo kx-photo--tall" : "kx-photo"} style={style}>
      <img className="kx-photo__img" src={props.src} alt={props.alt || ""} loading={props.eager ? "eager" : "lazy"} decoding="async" />
      {props.tone ? <span className={"kx-photo__tone kx-photo__tone--" + props.tone} aria-hidden="true" /> : null}
      {props.children}
      {props.caption ? <figcaption className="kx-photo__caption">{props.caption}</figcaption> : null}
    </figure>
  );
}

/**
 * Layered imagery: one photograph at the back, a scrim that carries the contrast, and the content in
 * front of it. Add drift and the picture moves with the scroll (a no-JavaScript enhancement that a
 * browser without scroll timelines simply renders still). This is how a headline goes over a
 * picture without losing either one - and the only honest way to stack an image behind content.
 */
export function Layers(props) {
  const classes = ["kx-layers"];
  if (props.drift) classes.push("kx-layers--drift");
  if (props.tall) classes.push("kx-layers--tall");
  return (
    <section className={classes.join(" ")} aria-label={props.label} style={props.height ? { minHeight: props.height } : undefined}>
      {props.image ? <img className="kx-layers__back" src={props.image} alt={props.alt || ""} loading="lazy" decoding="async" /> : null}
      <span className={"kx-layers__scrim kx-layers__scrim--" + (props.tone || "ink")} aria-hidden="true" />
      <div className="kx-layers__front">{props.children}</div>
    </section>
  );
}

/**
 * The product, drawn: a window chrome and real rows beat a decorative rectangle every time.
 * Pass children; rows inside are your own markup (a list, a board, a chart).
 */
export function AppFrame(props) {
  return (
    <div className="kx-glass kx-stack" style={{ gap: "0.85rem", padding: "0.85rem" }}>
      <div className="kx-row" style={{ justifyContent: "space-between", gap: "0.5rem" }}>
        <span className="kx-chip">{props.title}</span>
        <span className="kx-row" style={{ gap: "0.35rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--color-kx-accent)" }} />
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--color-kx-line)" }} />
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--color-kx-line)" }} />
          {props.meta ? <span className="kx-label" style={{ marginLeft: "0.35rem" }}>{props.meta}</span> : null}
        </span>
      </div>
      {props.children}
    </div>
  );
}

export function Button(props) {
  return (
    <button
      type={props.type || "button"}
      className={props.variant === "primary" ? "kx-button kx-button--primary" : "kx-button"}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}

export function Badge(props) {
  return <span className={"kx-badge " + (props.tone ? TONE_CLASS[props.tone] || " " : props.accent ? "kx-badge--accent" : "")}>{props.children}</span>;
}

/** The badge tone per state, as data, so the class names are real and the mapping is one place. */
export const TONE_CLASS = {
  positive: "kx-badge--positive",
  warning: "kx-badge--warning",
  negative: "kx-badge--negative",
  neutral: "kx-badge--neutral",
  accent: "kx-badge--accent",
};

/** Maps a status word to the tone that tells the truth about it. */
export function statusTone(status) {
  const text = String(status || "").toLowerCase();
  if (/(won|signed|paid|done|active|on track|live|complete|shipped|approved)/.test(text)) return "positive";
  if (/(lost|failed|cancelled|overdue|blocked|risk|declined)/.test(text)) return "negative";
  if (/(waiting|pending|review|hold|draft|new|open|in progress|processing)/.test(text)) return "warning";
  return "neutral";
}

/** A status badge whose colour is derived from the word: "on track" can never render as an error. */
export function Status(props) {
  return <Badge tone={props.tone || statusTone(props.value)}>{props.value}</Badge>;
}

/**
 * The identity band: the one place a real photograph belongs on an application surface.
 *
 * It is a scrim and a duotone, not a photograph dropped on a layout - the image is desaturated, tinted
 * towards the accent and washed into the background so type always sits on it as light on dark, in every
 * direction. With no photograph the band still works: the accent grid carries it, which is what keeps a
 * project that has no imagery from rendering an empty rectangle.
 */
export function Band(props) {
  const classes = ["kx-band"];
  if (props.tall) classes.push("kx-band--tall");
  if (!props.image) classes.push("kx-band--drawn");
  return (
    <section className={classes.join(" ")} aria-label={props.label || props.title}>
      {props.image ? <img className="kx-band__image" src={props.image} alt={props.alt || ""} loading="eager" /> : null}
      <span className="kx-band__wash" aria-hidden="true" />
      <div className="kx-band__body">
        {props.eyebrow ? <p className="kx-eyebrow kx-eyebrow--accent">{props.eyebrow}</p> : null}
        <h1 className="kx-band__title">{props.title}</h1>
        {props.lede ? <p className="kx-lede">{props.lede}</p> : null}
        {props.chips && props.chips.length ? (
          <div className="kx-band__breadth">
            {props.chips.map((chip) => (
              <Chip key={chip}>{chip}</Chip>
            ))}
          </div>
        ) : null}
        {props.actions ? <div className="kx-row">{props.actions}</div> : null}
      </div>
    </section>
  );
}

/** The screen header of an application: the name, one line about it, the state, and the actions. */
export function PageHeader(props) {
  return (
    <header className="kx-page-header">
      <span className="kx-page-header__text">
        <h1 className="kx-page-title">{props.title}</h1>
        {props.lede ? <p className="kx-stat__hint">{props.lede}</p> : null}
      </span>
      <div className="kx-row" style={{ gap: "0.6rem" }}>
        {props.meta}
        {props.actions}
      </div>
    </header>
  );
}

/**
 * The application frame: a bar that says whose app this is, a rail for navigation, a content area.
 * Every product has these three things, and a screen without them reads as a page, not a tool.
 * Pass an active value with onSelect to drive it from your own state; the rail then really switches.
 */
export function AppShell(props) {
  const items = props.nav || [];
  const [chosen, setChosen] = useState(props.active || (items[0] ? items[0].label : ""));
  const active = props.active !== undefined ? props.active : chosen;
  const tabs = props.tabs || [];
  const [chosenTab, setChosenTab] = useState(props.tab || tabs[0] || "");
  const tab = props.tab !== undefined ? props.tab : chosenTab;
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={items.length > 0 ? "kx-app kx-app--railed" : "kx-app"}>
      {items.length > 0 ? (
        <aside className="kx-apprail" aria-label="Sections">
          <div className="kx-apprail__group">
            <span className="kx-label kx-apprail__label">{props.railLabel || "Workspace"}</span>
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={item.label === active ? "kx-apprail__item kx-apprail__item--active" : "kx-apprail__item"}
                aria-current={item.label === active ? "page" : undefined}
                onClick={() => {
                  setChosen(item.label);
                  if (props.onSelect) props.onSelect(item.label);
                }}
              >
                <span className="kx-apprail__glyph" aria-hidden="true">{item.glyph || "\u2022"}</span>
                <span>{item.label}</span>
                {item.count !== undefined ? <span className="kx-apprail__count">{item.count}</span> : null}
              </button>
            ))}
          </div>
          {props.railFooter ? <div className="kx-apprail__group">{props.railFooter}</div> : null}
        </aside>
      ) : null}
      <div className="kx-app__body">
        <header className="kx-appbar">
          <div className="kx-appbar__brand">
            <span className="kx-appbar__mark">
              {props.logo ? <img src={props.logo} alt="" /> : <span className="kx-avatar" aria-hidden="true">{initials(props.name)}</span>}
            </span>
            <span className="kx-stack" style={{ gap: "0.05rem" }}>
              <span className="kx-appbar__name">{props.name}</span>
              {props.where ? <span className="kx-appbar__where">{props.where}</span> : null}
            </span>
          </div>
          <span className="kx-appbar__spacer" />
          {props.search !== undefined ? (
            <label className="kx-appbar__search">
              <input
                type="search"
                value={search}
                placeholder={props.search || "Search"}
                aria-label={props.search || "Search"}
                onChange={(event) => {
                  setSearch(event.target.value);
                  if (props.onSearch) props.onSearch(event.target.value);
                }}
              />
              <span className="kx-appbar__hint">{"⌘"}K</span>
            </label>
          ) : null}
          <div className="kx-appbar__tools">
            {props.status ? (
              <span className="kx-live">
                <span className="kx-live__dot" aria-hidden="true" />
                {props.status}
              </span>
            ) : null}
            {props.tools}
            {props.action ? <Button variant="primary" onClick={props.action.onClick}>{props.action.label}</Button> : null}
          </div>
          {props.user ? (
            <span className="kx-anchor">
              <button
                type="button"
                className="kx-appbar__user"
                title={props.user}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {initials(props.user)}
              </button>
              {menuOpen ? (
                <span className="kx-anchored kx-menu" role="menu">
                  <button type="button" role="menuitem" className="kx-menu__item" onClick={() => setMenuOpen(false)}>
                    Profile
                  </button>
                  <button type="button" role="menuitem" className="kx-menu__item" onClick={() => setMenuOpen(false)}>
                    Preferences
                  </button>
                  <button type="button" role="menuitem" className="kx-menu__item kx-menu__item--danger" onClick={() => setMenuOpen(false)}>
                    Sign out
                  </button>
                </span>
              ) : null}
            </span>
          ) : null}
          {tabs.length > 0 ? (
            <nav className="kx-appbar__tabs" aria-label="Pages">
              {tabs.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  className={entry === tab ? "kx-appbar__tab kx-appbar__tab--active" : "kx-appbar__tab"}
                  aria-current={entry === tab ? "page" : undefined}
                  onClick={() => {
                    setChosenTab(entry);
                    if (props.onSelectTab) props.onSelectTab(entry);
                  }}
                >
                  {entry}
                </button>
              ))}
            </nav>
          ) : null}
        </header>
        <main className="kx-app__main">{props.children}</main>
      </div>
    </div>
  );
}

/** A content panel: one surface step off the page, a header row, and the body. */
export function Panel(props) {
  return (
    <section className={props.quiet ? "kx-panel" : "kx-panel kx-appear"}>
      {props.title || props.meta ? (
        <header className="kx-panel__head">
          {props.title ? <span className="kx-panel__title">{props.title}</span> : null}
          <span className="kx-appbar__spacer" />
          {props.meta}
        </header>
      ) : null}
      <div className="kx-panel__body">{props.children}</div>
    </section>
  );
}

/** A KPI tile with a drawn trend in it: the chart belongs to the number, not to a decorative band. */
export function TrendTile(props) {
  return (
    <div className={props.primary ? "kx-stat kx-stat--primary" : "kx-stat"}>
      <span className="kx-eyebrow">{props.label}</span>
      <span className="kx-stat__value">
        {props.value}
        {props.unit ? <span className="kx-stat__unit">{props.unit}</span> : null}
      </span>
      {props.values && props.values.length > 1 ? (
        <span style={{ display: "block", height: 38, marginBlock: "0.15rem" }}>
          <Sparkline values={props.values} label={props.label + " trend"} />
        </span>
      ) : null}
      {props.hint ? <span className="kx-stat__hint">{props.hint}</span> : null}
    </div>
  );
}

/** A drawn trend line: the one graphic a business tool earns, and it carries a number. */
export function Sparkline(props) {
  const values = props.values && props.values.length ? props.values : [4, 7, 5, 9, 8, 12, 10];
  const max = Math.max.apply(null, values);
  const min = Math.min.apply(null, values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 92 - ((value - min) / span) * 78;
      return x.toFixed(1) + "," + y.toFixed(1);
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }} role="img" aria-label={props.label || "Trend"}>
      <polygon points={"0,100 " + points + " 100,100"} fill="color-mix(in srgb, var(--color-kx-accent) 18%, transparent)" />
      <polyline points={points} fill="none" stroke="var(--color-kx-accent)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

/** The unit scale of a chart: five ticks from zero up to a rounded maximum. */
function niceScale(values) {
  const top = values.reduce((max, value) => (Number(value) > max ? Number(value) : max), 0);
  if (!(top > 0)) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(top)));
  const scaled = top / magnitude;
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const step = steps.find((candidate) => scaled <= candidate) || 10;
  return step * magnitude;
}

/**
 * A real chart: an axis that counts in the metric's own unit, quiet gridlines, one legend entry per
 * series, and a readout that follows the pointer (hover or focus a column to move it).
 *
 * Props:
 * - labels: one x label per value, e.g. ["Jan", "Feb", "Mar"].
 * - series: [{ label, values: [Number], tone }] - tone is "accent" (default), "positive", "negative" or "muted".
 * - kind: "area" (default), "line" or "bar".
 * - unit: the unit the axis counts in ("EUR", "kg", "h") - printed on every tick and in the readout.
 * - format: (value) => string, when the screen formats numbers its own way.
 * - title: what the chart is. note: where the numbers came from. height: px, 220 by default.
 *
 * Draw one whenever the screen is about numbers: a chart is the difference between a list of figures
 * and a product someone reads at a glance.
 */
export function Chart(props) {
  const labels = props.labels || [];
  const series = (props.series || []).filter((entry) => entry && entry.values && entry.values.length > 0);
  const kind = props.kind || "area";
  const format = props.format || formatNumber;
  const [hovered, setHovered] = useState(-1);
  if (series.length === 0 || labels.length === 0) return null;
  const top = niceScale(series.reduce((all, entry) => all.concat(entry.values.map(Number)), []));
  const tones = {
    accent: "var(--color-kx-accent)",
    positive: "var(--color-kx-positive)",
    negative: "var(--color-kx-negative)",
    muted: "var(--color-kx-muted)",
  };
  const last = labels.length - 1;
  const index = hovered >= 0 && hovered <= last ? hovered : last;
  const across = (position) => (labels.length === 1 ? 50 : (position / last) * 100);
  const down = (value) => 100 - (Math.max(0, Math.min(Number(value) || 0, top)) / top) * 100;
  const slot = 100 / labels.length;

  return (
    <figure className="kx-chart">
      <div className="kx-chart__head">
        {props.title ? <span className="kx-chart__title">{props.title}</span> : null}
        {series.length > 1 ? (
          <div className="kx-chart__legend">
            {series.map((entry) => (
              <span key={entry.label}>
                <span className={"kx-chart__key kx-chart__key--" + (entry.tone || "accent")} />
                {entry.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="kx-chart__frame">
        <div className="kx-chart__scale" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((tick) => (
            <span className="kx-chart__mark" key={tick} style={{ top: tick * 25 + "%" }}>
              {format((top * (4 - tick)) / 4)}
            </span>
          ))}
        </div>
        <div className="kx-chart__area" style={{ height: (props.height || 220) + "px" }}>
          <svg className="kx-chart__svg" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={props.title || "Chart"}>
            {[0, 25, 50, 75, 100].map((line) => (
              <line className="kx-chart__rule" key={line} x1="0" x2="100" y1={line} y2={line} vectorEffect="non-scaling-stroke" />
            ))}
            <line className="kx-chart__cursor" x1={across(index)} x2={across(index)} y1="0" y2="100" vectorEffect="non-scaling-stroke" />
            {series.map((entry, order) => {
              const points = entry.values.map((value, position) => across(position).toFixed(2) + "," + down(value).toFixed(2)).join(" ");
              const tone = tones[entry.tone || "accent"];
              if (kind === "bar") {
                const width = (slot * 0.62) / series.length;
                return (
                  <g key={entry.label}>
                    {entry.values.map((value, position) => (
                      <rect
                        className="kx-chart__bar"
                        key={position}
                        style={{ fill: tone }}
                        x={(position * slot + slot * 0.19 + order * width).toFixed(2)}
                        y={down(value).toFixed(2)}
                        width={width.toFixed(2)}
                        height={(100 - down(value)).toFixed(2)}
                      />
                    ))}
                  </g>
                );
              }
              return (
                <g key={entry.label}>
                  {kind === "area" && labels.length > 1 ? <polygon className="kx-chart__fill" style={{ fill: tone }} points={"0,100 " + points + " 100,100"} /> : null}
                  <polyline className="kx-chart__line" style={{ stroke: tone }} points={points} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </g>
              );
            })}
          </svg>
          <div className="kx-chart__dots">
            {series.map((entry) => (
              <span
                className="kx-chart__dot"
                key={entry.label}
                style={{ left: across(index) + "%", top: down(entry.values[index]) + "%", background: tones[entry.tone || "accent"] }}
              />
            ))}
          </div>
          <div className="kx-chart__slots">
            {labels.map((label, position) => (
              <span
                className="kx-chart__slot"
                key={label + position}
                title={label + ": " + series.map((entry) => format(entry.values[position])).join(" / ")}
                onMouseEnter={() => setHovered(position)}
                onMouseLeave={() => setHovered(-1)}
              />
            ))}
          </div>
          <div className="kx-chart__readout">
            <span className="kx-chart__readout-label">{labels[index]}</span>
            {series.map((entry) => (
              <span className="kx-chart__value" key={entry.label}>
                {format(entry.values[index])}
              </span>
            ))}
            {props.unit ? <span className="kx-chart__unit">{props.unit}</span> : null}
          </div>
        </div>
        <div className="kx-chart__axis">
          {labels.map((label, position) => (
            <span className="kx-chart__tick" key={label + position}>
              {label}
            </span>
          ))}
        </div>
        <span className="kx-chart__corner" aria-hidden="true">
          {props.unit || ""}
        </span>
      </div>
      {props.note ? <figcaption className="kx-chart__note">{props.note}</figcaption> : null}
    </figure>
  );
}

/** One measured value: a card with its unit, its comparison and where the number came from. */
export function KpiCard(props) {
  return (
    <div className={props.primary ? "kx-stat kx-stat--primary" : "kx-stat"}>
      <span className="kx-eyebrow">{props.label}</span>
      <span className="kx-stat__value">
        {props.value}
        {props.unit ? <span className="kx-stat__unit">{props.unit}</span> : null}
      </span>
      {props.trend !== undefined ? (
        <span className={"kx-stat__trend kx-stat__trend--" + (props.trend >= 0 ? "up" : "down")}>
          {(props.trend >= 0 ? "+" : "") + props.trend + "% vs last period"}
        </span>
      ) : null}
      {props.hint ? <span className="kx-stat__hint">{props.hint}</span> : null}
    </div>
  );
}

export function Chip(props) {
  return <span className="kx-chip">{props.children}</span>;
}

export function Avatar(props) {
  return <span className="kx-avatar" aria-hidden={props.decorative !== false}>{props.label || initials(props.name || "")}</span>;
}

export function Field(props) {
  return (
    <label className="kx-field">
      <span className="kx-label">{props.label}</span>
      {props.children}
      {props.hint ? <span className="kx-lede">{props.hint}</span> : null}
      {props.error ? <span className="kx-error" role="alert">{props.error}</span> : null}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      className="kx-input"
      type={props.type || "text"}
      value={props.value}
      placeholder={props.placeholder}
      min={props.min}
      max={props.max}
      step={props.step}
      disabled={props.disabled}
      onChange={(event) => props.onChange(event.target.value)}
    />
  );
}

export function Textarea(props) {
  return (
    <textarea
      className="kx-input"
      rows={props.rows || 4}
      value={props.value}
      placeholder={props.placeholder}
      onChange={(event) => props.onChange(event.target.value)}
    />
  );
}

export function Select(props) {
  return (
    <select
      className="kx-input"
      // A bare <select> has no accessible name, and a screen reader announces it as "combobox" with no
      // subject. Inside a Field the wrapping <label> names it; on its own it needs the label spelled out.
      aria-label={props.label || props["aria-label"]}
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    >
      {(props.options || []).map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export function Tabs(props) {
  return (
    <div className="kx-tabs" role="tablist">
      {(props.tabs || []).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={props.active === tab}
          className={props.active === tab ? "kx-tab kx-tab--active" : "kx-tab"}
          onClick={() => props.onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

/** A table with a real empty state. Columns: { key, label, numeric, render }. */export function Table(props) {
  const rows = props.rows || [];
  if (rows.length === 0) {
    return (
      <Empty
        title={props.emptyTitle || "Nothing here yet"}
        body={props.emptyBody || "Add the first record and it appears here straight away."}
        action={props.emptyAction}
      />
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="kx-table">
        <thead>
          <tr>
            {(props.columns || []).map((column) => (
              <th key={column.key} scope="col" className={column.numeric ? "kx-num" : undefined}>
                {column.label}
              </th>
            ))}
            {props.onRemove ? (
              <th scope="col">
                <span className="kx-visually-hidden">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const clickable = typeof props.onRowClick === "function";
            const keyOf = props.rowKey || ((entry, i) => (entry && entry.id !== undefined ? entry.id : i));
            return (
              <tr
                key={keyOf(row, index)}
                className={clickable ? "kx-table__row--clickable" : undefined}
                tabIndex={clickable ? 0 : undefined}
                role={clickable ? "button" : undefined}
                onClick={clickable ? () => props.onRowClick(row) : undefined}
                onKeyDown={
                  clickable
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          props.onRowClick(row);
                        }
                      }
                    : undefined
                }
              >
                {(props.columns || []).map((column) => (
                  <td key={column.key} className={column.numeric ? "kx-num" : undefined}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
                {props.onRemove ? (
                  <td className="kx-num">
                    <Button onClick={() => props.onRemove(row)}>Remove</Button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Empty(props) {
  return (
    <div className="kx-empty kx-stack">
      <p className="kx-title">{props.title}</p>
      {props.body ? <p className="kx-lede">{props.body}</p> : null}
      {props.action ? <Button variant="primary" onClick={props.action.onClick}>{props.action.label}</Button> : null}
    </div>
  );
}

export function Confirm(props) {
  if (!props.open) return null;
  return (
    <div role="alertdialog" aria-modal="true" className="kx-card kx-card--float kx-stack">
      <p className="kx-title">{props.question}</p>
      <div className="kx-row">
        <Button variant="primary" onClick={props.onConfirm}>{props.confirmLabel || "Yes, continue"}</Button>
        <Button onClick={props.onCancel}>{props.cancelLabel || "Keep it"}</Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Conversation surfaces. An app that answers is a conversation, and the shape people already know is
   a messenger: a header, a canvas, bubbles on both sides, one composer. Use these instead of building
   a thread out of divs - the day separators, grouping, tails, ticks and pinned-to-the-bottom
   behaviour are the parts that are easy to get wrong.
   --------------------------------------------------------------------------- */

function dayKey(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toDateString();
}

function dayLabel(value, labels) {
  const date = value instanceof Date ? value : new Date(value);
  const today = new Date();
  if (dayKey(date) === dayKey(today)) return (labels && labels.today) || "Today";
  if (dayKey(date) === dayKey(new Date(today.getTime() - 86400000))) return (labels && labels.yesterday) || "Yesterday";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

/**
 * One message bubble. A message sent by the person using the app sits on the right with ticks; anything
 * else stays on the left and carries a tail only when first=true (the first message of a run).
 *
 * A message may carry steps (what an agent did), sources (numbered citations), error with onRetry,
 * image, file: { name, size }, time and state: "sent" | "read".
 */
export function Message(props) {
  const outgoing = props.from === "me" || props.outgoing === true;
  return (
    <div className={cx("kx-bubble", outgoing && "kx-bubble--out", props.first && "kx-bubble--first", props.className)}>
      {props.sender ? <span className="kx-bubble__sender">{props.sender}</span> : null}
      {props.steps && props.steps.length ? <AgentSteps items={props.steps} durationMs={props.durationMs} /> : null}
      {props.image ? <img className="kx-bubble__image" src={props.image} alt={props.alt || ""} loading="lazy" /> : null}
      {props.file ? (
        <span className="kx-bubble__file">
          <span className="kx-stack" style={{ gap: "0.1rem" }}>
            <strong>{props.file.name}</strong>
            {props.file.size ? <span className="kx-label">{props.file.size}</span> : null}
          </span>
        </span>
      ) : null}
      {props.children || props.text ? <div className="kx-bubble__body">{props.children || props.text}</div> : null}
      {props.sources && props.sources.length ? <Sources items={props.sources} /> : null}
      {props.error ? (
        <span className="kx-bubble__error" role="alert">
          <span>{props.error}</span>
          {props.onRetry ? (
            <button type="button" className="kx-button" onClick={props.onRetry}>
              {props.retryLabel || "Try again"}
            </button>
          ) : null}
        </span>
      ) : null}
      {props.time || outgoing ? (
        <span className="kx-bubble__meta">
          {props.time ? <time>{props.time}</time> : null}
          {outgoing ? <span className="kx-ticks" title={props.state === "read" ? "Read" : "Sent"}>{props.state === "read" ? "✓✓" : "✓"}</span> : null}
        </span>
      ) : null}
    </div>
  );
}

/**
 * What an agent did, folded into one line above its answer: "3 steps · 2.4 s", opening to one row per
 * step. Item shape: { label, state: "running" | "done" | "failed", args, durationMs, reason }.
 */
export function AgentSteps(props) {
  const items = props.items || [];
  // A finished run stays folded - the answer is what matters. A run that is still working shows its rows,
  // because "it is doing something" is the whole reason the block exists.
  const [open, setOpen] = useState(props.open !== undefined ? props.open : items.some((item) => item.state === "running"));
  if (items.length === 0) return null;
  const total = props.durationMs || items.reduce((sum, item) => sum + (item.durationMs || 0), 0);
  return (
    <div className="kx-agent">
      <button type="button" className="kx-agent__summary" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>
          {items.length} steps{total ? " · " + (total / 1000).toFixed(1) + " s" : ""}
        </span>
        <span aria-hidden="true">{open ? "-" : "+"}</span>
      </button>
      {open ? (
        <ol className="kx-agent__list">
          {items.map((item, index) => (
            <li className="kx-agent__row" key={(item.label || "step") + index}>
              <span className={cx("kx-agent__state", "kx-agent__state--" + (item.state || "done"))} aria-hidden="true" />
              <span className="kx-visually-hidden">{item.state || "done"}</span>
              <span className="kx-agent__args">
                {item.label}
                {item.args ? " · " + item.args : ""}
                {item.reason ? " - " + item.reason : ""}
              </span>
              {item.durationMs ? <span className="kx-agent__time">{item.durationMs} ms</span> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/** Cited sources as numbered chips. Item shape: { title, domain, url }. */
export function Sources(props) {
  return (
    <span className="kx-sources">
      {(props.items || []).map((source, index) => (
        <a className="kx-source" key={source.url || source.title} href={source.url} target="_blank" rel="noreferrer noopener">
          <span className="kx-source__index" aria-hidden="true">{index + 1}</span>
          <span>{source.title || source.domain}</span>
          {source.title && source.domain ? <span className="kx-label">{source.domain}</span> : null}
        </a>
      ))}
    </span>
  );
}

/**
 * The conversation itself: header, canvas, composer. Pass messages and they are rendered with day
 * separators, grouping and tails; busy shows the typing indicator and swaps the send button for Stop.
 * Extra canvas nodes go in children, the composer in composer.
 *
 * Message shape: { id, text, from: "me" | "peer", sender, at, time, state, image, file, steps, sources, error }.
 */
export function Chat(props) {
  const messages = props.messages || [];
  const canvas = useRef(null);
  const pinned = useRef(true);
  const [showPill, setShowPill] = useState(false);

  const scrollToBottom = (behavior) => {
    const node = canvas.current;
    if (!node) return;
    if (typeof node.scrollTo === "function") node.scrollTo({ top: node.scrollHeight, behavior: behavior || "smooth" });
    else node.scrollTop = node.scrollHeight;
  };

  useEffect(() => {
    if (pinned.current) scrollToBottom(messages.length > 1 ? "smooth" : "auto");
    else setShowPill(true);
  }, [messages.length, props.busy]);

  const handleScroll = () => {
    const node = canvas.current;
    if (!node) return;
    pinned.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
    if (pinned.current) setShowPill(false);
  };

  const rows = [];
  messages.forEach((message, index) => {
    const day = dayKey(message.at);
    const previous = messages[index - 1];
    const newDay = day !== "" && dayKey(previous && previous.at) !== day;
    if (newDay) rows.push(<span className="kx-day" key={"day-" + day}>{dayLabel(message.at, props.labels)}</span>);
    rows.push(<Message key={message.id || index} {...message} first={newDay || !previous || previous.from !== message.from} />);
  });

  return (
    <div className={cx("kx-chat", props.className)} style={props.style}>
      <header className="kx-chat__header">
        <span className="kx-avatar" aria-hidden="true">{initials(props.peer || "?")}</span>
        <span className="kx-chat__who">
          <strong>{props.peer}</strong>
          {props.busy || props.presence ? <span className="kx-chat__presence">{props.busy ? props.workingLabel || "Writing…" : props.presence}</span> : null}
        </span>
        {props.actions ? <div className="kx-chat__actions">{props.actions}</div> : null}
      </header>
      <div className="kx-chat__canvas" ref={canvas} onScroll={handleScroll} aria-label={props.label || "Conversation"} aria-live="polite">
        {rows}
        {props.children}
        {props.busy ? (
          <Message first>
            <span className="kx-typing" aria-label={props.typingLabel || "Typing"}>
              <span className="kx-typing__dot" />
              <span className="kx-typing__dot" />
              <span className="kx-typing__dot" />
            </span>
          </Message>
        ) : null}
        {showPill ? (
          <button
            type="button"
            className="kx-chat__pill"
            onClick={() => {
              pinned.current = true;
              setShowPill(false);
              scrollToBottom();
            }}
          >
            {props.newLabel || "New messages"}
          </button>
        ) : null}
      </div>
      {props.composer}
    </div>
  );
}

/** One composer: attachment, a field that grows to five lines, one round 44px action that becomes Stop. */
export function Composer(props) {
  const [value, setValue] = useState(props.value || "");
  const field = useRef(null);

  const grow = () => {
    const node = field.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = Math.min(node.scrollHeight, 120) + "px";
  };

  const send = () => {
    const text = value.trim();
    if (!text || props.disabled) return;
    setValue("");
    if (field.current) field.current.style.height = "auto";
    if (props.onSend) props.onSend(text);
  };

  return (
    <form
      className="kx-composer"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      {props.onAttach ? (
        <button type="button" className="kx-composer__attach" aria-label={props.attachLabel || "Attach a file"} onClick={props.onAttach}>
          +
        </button>
      ) : null}
      <textarea
        ref={field}
        className="kx-composer__field"
        rows={1}
        value={value}
        placeholder={props.placeholder || "Write a message"}
        onChange={(event) => {
          setValue(event.target.value);
          grow();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
      />
      <button
        type={props.busy ? "button" : "submit"}
        className={props.busy ? "kx-composer__send kx-composer__send--stop" : "kx-composer__send"}
        aria-label={props.busy ? props.stopLabel || "Stop" : props.sendLabel || "Send"}
        disabled={!props.busy && value.trim().length === 0}
        onClick={props.busy ? props.onStop : undefined}
      >
        {props.busy ? "■" : "↑"}
      </button>
    </form>
  );
}

/**
 * Reveal on scroll, once. Native scroll-driven animation does it in CSS where supported. */
export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("kx-reveal--in");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.04 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/** State that survives a reload, with the same shape useState has. */
export function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // A full or blocked store must not break the screen.
    }
  }, [key, value]);
  return [value, setValue];
}
