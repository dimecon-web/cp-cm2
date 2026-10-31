"use client";

import { usePick } from "@/lib/i18n";
import { VENUE } from "@/lib/content";

// La façade des Scholes, dessinée d'après une photo du lieu : deux étages
// néoclassiques, murs ocre et pilastres blancs, portique central à colonnes,
// le buste d'Anargyros devant, les pins de part et d'autre.
//
// Un dessin plutôt qu'une photo : rien à héberger, net à toutes les tailles,
// et le dessin assume d'être une évocation.

const WALL = "#e2bd66";
const STONE = "#fbf7ef";
const SHADOW = "#cfa94e";
const GLASS = "#2f4a63";
const PINE = "#7ba05b";
const PINE_DARK = "#5f8244";

// Fenêtres : deux rangées régulières, interrompues par le portique central.
const BAYS = [60, 118, 176, 234, 292, 350, 470, 528, 586, 644, 702, 760];

function Window({ x, y, h }) {
  return (
    <g>
      <rect x={x} y={y} width="30" height={h} rx="2" fill={STONE} />
      <rect x={x + 3} y={y + 3} width="24" height={h - 6} fill={GLASS} opacity="0.85" />
      <line x1={x + 15} y1={y + 3} x2={x + 15} y2={y + h - 3} stroke={STONE} strokeWidth="1.5" />
    </g>
  );
}

function Pine({ x, y, s = 1, dark }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x="-4" y="40" width="8" height="52" fill="#8a6a45" />
      <ellipse cx="0" cy="18" rx="46" ry="26" fill={dark ? PINE_DARK : PINE} />
      <ellipse cx="-26" cy="34" rx="30" ry="18" fill={dark ? PINE : PINE_DARK} opacity="0.9" />
      <ellipse cx="26" cy="34" rx="30" ry="18" fill={dark ? PINE : PINE_DARK} opacity="0.9" />
    </g>
  );
}

export function ScholesView() {
  const pick = usePick();

  return (
    <>
      <div className="scholes">
        <svg viewBox="0 0 900 420" role="img"
          aria-label="Illustration de la façade de l'école Anargyrios et Korgialenios">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9ec9e8" />
              <stop offset="100%" stopColor="#e3f0fa" />
            </linearGradient>
          </defs>

          <rect width="900" height="420" fill="url(#sky)" />

          {/* Corps du bâtiment */}
          <rect x="40" y="110" width="820" height="215" fill={WALL} />
          <rect x="40" y="96" width="820" height="22" fill={STONE} />
          <rect x="40" y="88" width="820" height="10" fill="#e9e2d4" />
          <rect x="40" y="305" width="820" height="20" fill={STONE} />
          <rect x="412" y="70" width="76" height="26" fill={STONE} />

          {/* Pilastres d'angle */}
          {[40, 100, 800, 830].map((x) => (
            <rect key={x} x={x} y="110" width="30" height="195" fill={STONE} opacity="0.95" />
          ))}

          {/* Deux rangées de fenêtres */}
          {BAYS.map((x) => <Window key={`u${x}`} x={x} y="128" h="66" />)}
          {BAYS.map((x) => <Window key={`l${x}`} x={x} y="222" h="72" />)}
          {BAYS.map((x) => (
            <rect key={`s${x}`} x={x - 3} y="200" width="36" height="7" fill={SHADOW} opacity="0.5" />
          ))}

          {/* Portique central, balcon, porte */}
          <rect x="390" y="110" width="120" height="215" fill={STONE} />
          <rect x="406" y="124" width="88" height="54" fill={GLASS} opacity="0.8" />
          <rect x="398" y="182" width="104" height="12" fill="#efe7d7" />
          {[404, 420, 436, 452, 468, 484].map((x) => (
            <rect key={x} x={x} y="170" width="6" height="14" fill={STONE} />
          ))}
          <rect x="404" y="194" width="18" height="110" fill="#f3ece0" />
          <rect x="478" y="194" width="18" height="110" fill="#f3ece0" />
          <rect x="432" y="228" width="36" height="76" rx="2" fill={GLASS} />
          <rect x="396" y="186" width="108" height="8" fill="#e4dac6" />

          {/* Mât et drapeau */}
          <rect x="447" y="40" width="4" height="265" fill="#e8e2d6" />
          <path d="M451,48 L492,58 L451,70 Z" fill="var(--sea)" opacity="0.9" />

          {/* Pins */}
          <Pine x="100" y="150" s="1.25" />
          <Pine x="818" y="140" s="1.4" dark />

          {/* Mur bas, haies, buste */}
          <rect x="0" y="338" width="900" height="82" fill="#efe6d6" />
          <rect x="0" y="330" width="900" height="16" fill={STONE} />
          {[40, 150, 260, 600, 710, 820].map((x) => (
            <ellipse key={x} cx={x} cy="332" rx="58" ry="26" fill={PINE} opacity="0.9" />
          ))}
          <rect x="432" y="330" width="36" height="62" fill={STONE} />
          <rect x="424" y="388" width="52" height="12" fill="#e7dcc6" />
          <circle cx="450" cy="322" r="15" fill="#f4efe4" />
          <path d="M437,330 h26 v12 h-26 z" fill="#f4efe4" />

          {/* Sol */}
          <rect x="0" y="400" width="900" height="20" fill="#e6d9bf" />
        </svg>
      </div>

      <dl className="scholes-facts">
        {VENUE.facts.map((f, i) => (
          <div key={i}>
            <dt>{pick(f.k)}</dt>
            <dd>{pick(f.v)}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
