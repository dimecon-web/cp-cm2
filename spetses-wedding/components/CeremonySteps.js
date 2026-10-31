"use client";

import { usePick } from "@/lib/i18n";
import { CEREMONY } from "@/lib/content";

// Les quatre temps du mariage orthodoxe, en images. Les pictogrammes sont
// dessinés ici en SVG : rien à télécharger, net à toutes les tailles, et les
// couleurs suivent celles du site.

function Icon({ name }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "rings") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="19" cy="28" r="11" {...common} />
        <circle cx="31" cy="28" r="11" {...common} />
        <path d="M24 9 l4 5 -4 4 -4 -4 z" {...common} />
      </svg>
    );
  }
  if (name === "crowns") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M6 28 v-10 l5 5 5 -8 5 8 5 -5 v10 z" {...common} />
        <path d="M6 32 h20" {...common} />
        <path d="M30 40 c6 -4 6 -12 0 -16" {...common} />
        <circle cx="36" cy="16" r="5" {...common} />
      </svg>
    );
  }
  if (name === "cup") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M15 10 h18 l-2 12 a7 7 0 0 1 -14 0 z" {...common} />
        <path d="M24 29 v8" {...common} />
        <path d="M16 38 h16" {...common} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 9 a15 15 0 1 1 -13 7.5" {...common} />
      <path d="M8 11 l3 6 6 -2" {...common} />
      <circle cx="24" cy="24" r="4" {...common} />
    </svg>
  );
}

export function CeremonySteps() {
  const pick = usePick();
  return (
    <ol className="rite">
      {CEREMONY.steps.map((s, i) => (
        <li className="rite-step" key={s.id}>
          <div className="rite-icon">
            <Icon name={s.icon} />
            <span className="rite-num">{i + 1}</span>
          </div>
          <h4>
            {pick(s.name)}
            {s.badge && <span className="rite-badge">{s.badge}</span>}
          </h4>
          <p>{pick(s.line)}</p>
        </li>
      ))}
    </ol>
  );
}
