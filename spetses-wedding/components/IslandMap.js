"use client";

import { usePick } from "@/lib/i18n";

// Carte simplifiée de Spetses, dessinée à la main en SVG.
//
// Le contour suit la forme réelle de l'île, mais en version stylisée : les
// emplacements sont approximatifs et la carte sert à se repérer, pas à
// naviguer. Rien n'est importé d'un fournisseur de cartes, donc rien à
// attribuer et rien qui dépende d'un service extérieur.
//
// Repère : viewBox 1000 × 640, le nord en haut.

const COAST = [
  [133, 94], [183, 56], [233, 89], [289, 25], [355, 33], [422, 61], [478, 50],
  [533, 100], [589, 128], [655, 161], [716, 183], [755, 217], [822, 239],
  [858, 261], [863, 311], [833, 361], [816, 422], [777, 478], [722, 533],
  [655, 566], [583, 594], [527, 608], [483, 583], [444, 541], [414, 494],
  [372, 455], [339, 414], [333, 383], [358, 355], [319, 322], [289, 289],
  [272, 266], [239, 239], [217, 200], [183, 167], [161, 133],
];

// La pinède qui couvre le cœur de l'île — tache indicative, pas un relevé.
const PINES = [
  [330, 200], [430, 150], [560, 175], [660, 230], [720, 300], [700, 390],
  [620, 460], [520, 500], [430, 460], [360, 380], [320, 290],
];

const PLACES = [
  {
    id: "dapia", x: 722, y: 183, kind: "town", anchor: "start", dx: 15, dy: -3,
    label: { fr: "Dapia — port et centre", en: "Dapia — port and centre", el: "Δαπιά — λιμάνι και κέντρο" },
  },
  {
    id: "oldport", x: 838, y: 252, kind: "town", anchor: "start", dx: 15, dy: 5,
    label: { fr: "Vieux port", en: "Old harbour", el: "Παλιό Λιμάνι" },
  },
  {
    id: "venue", x: 792, y: 342, kind: "venue", anchor: "start", dx: 20, dy: -8,
    label: { fr: "Les Scholes", en: "The Scholes", el: "Οι Σχολές" },
    sub: { fr: "église Anastasis · Magus Art Cafe", en: "Anastasis chapel · Magus Art Cafe", el: "Ναός Αναστάσεως · Magus Art Cafe" },
  },
  {
    id: "kaiki", x: 786, y: 392, kind: "beach", anchor: "start", dx: 15, dy: 18,
    label: { fr: "Kaiki", en: "Kaiki", el: "Καΐκι" },
  },
  {
    id: "ligoneri", x: 575, y: 120, kind: "beach", anchor: "start", dx: 14, dy: 16,
    label: { fr: "Ligoneri", en: "Ligoneri", el: "Λιγονέρι" },
  },
  {
    id: "vrellos", x: 505, y: 86, kind: "beach", anchor: "middle", dx: 0, dy: -16,
    label: { fr: "Vrellos", en: "Vrellos", el: "Βρέλλος" },
  },
  {
    id: "zogeria", x: 183, y: 58, kind: "star", anchor: "middle", dx: 10, dy: -16,
    label: { fr: "Zogeria ⭐", en: "Zogeria ⭐", el: "Ζογεριά ⭐" },
  },
  {
    id: "paraskevi", x: 268, y: 268, kind: "star", anchor: "end", dx: -15, dy: 4,
    label: { fr: "Agia Paraskevi ⭐", en: "Agia Paraskevi ⭐", el: "Αγία Παρασκευή ⭐" },
  },
  {
    id: "anargyroi", x: 350, y: 348, kind: "beach", anchor: "end", dx: -15, dy: 18,
    label: { fr: "Agioi Anargyroi", en: "Agioi Anargyroi", el: "Άγιοι Ανάργυροι" },
  },
  {
    id: "xylokeriza", x: 533, y: 578, kind: "beach", anchor: "middle", dx: 0, dy: 28,
    label: { fr: "Xylokeriza", en: "Xylokeriza", el: "Ξυλοκέριζα" },
  },
];

const ARRIVALS = [
  {
    id: "piraeus", from: [740, 170], to: [905, 92], anchor: "end", at: [900, 72],
    label: { fr: "Le Pirée · ~2 h", en: "Piraeus · ~2 h", el: "Πειραιάς · ~2 ώρες" },
  },
  {
    id: "kosta", from: [868, 262], to: [950, 288], anchor: "end", at: [955, 318],
    label: { fr: "Kosta · 5–15 min", en: "Kosta · 5–15 min", el: "Κόστα · 5–15 λεπτά" },
  },
];

const path = (pts) => pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ") + " Z";

export function IslandMap() {
  const pick = usePick();

  return (
    <div className="map-scroll">
      <svg className="island-map" viewBox="0 0 1000 640" role="img"
        aria-label="Carte simplifiée de Spetses">
        <rect x="0" y="0" width="1000" height="640" fill="var(--sea-soft)" />

        {/* Quelques vaguelettes, pour que la mer ne soit pas un aplat */}
        <g stroke="#bcd8ee" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8">
          <path d="M60,470 q18,-10 36,0 t36,0" />
          <path d="M60,510 q18,-10 36,0 t36,0" />
          <path d="M740,560 q18,-10 36,0 t36,0" />
          <path d="M800,600 q18,-10 36,0 t36,0" />
          <path d="M120,30 q18,-10 36,0 t36,0" />
        </g>

        <path d={path(COAST)} fill="#f6ecd9" stroke="var(--sun)" strokeWidth="4"
          strokeLinejoin="round" />
        <path d={path(PINES)} fill="var(--olive-soft)" stroke="none" opacity="0.9" />

        <text x="470" y="300" textAnchor="middle" className="map-island-name">ΣΠΕΤΣΕΣ</text>

        {/* Comment on arrive : deux traits pointillés vers le large */}
        <g className="map-route">
          {ARRIVALS.map((a) => (
            <g key={a.id}>
              <path d={`M${a.from[0]},${a.from[1]} L${a.to[0]},${a.to[1]}`}
                stroke="var(--sea)" strokeWidth="3" strokeDasharray="9 7" fill="none" />
              <circle cx={a.to[0]} cy={a.to[1]} r="5" fill="var(--sea)" />
              <text x={a.at[0]} y={a.at[1]} textAnchor={a.anchor} className="map-label map-route-label">
                {pick(a.label)}
              </text>
            </g>
          ))}
        </g>

        {PLACES.map((p) => (
          <g key={p.id}>
            {p.kind === "venue" ? (
              <>
                <circle cx={p.x} cy={p.y} r="13" fill="var(--bougain)" />
                <circle cx={p.x} cy={p.y} r="20" fill="none" stroke="var(--bougain)"
                  strokeWidth="3" opacity="0.45" />
              </>
            ) : (
              <circle cx={p.x} cy={p.y} r={p.kind === "town" ? 9 : 7}
                fill={p.kind === "town" ? "var(--sea-deep)" : "var(--olive)"}
                stroke="#fff" strokeWidth="3" />
            )}
            <text x={p.x + p.dx} y={p.y + p.dy} textAnchor={p.anchor}
              className={`map-label${p.kind === "venue" ? " map-label-venue" : ""}`}>
              {pick(p.label)}
            </text>
            {p.sub && (
              <text x={p.x + p.dx} y={p.y + p.dy + 24} textAnchor={p.anchor} className="map-sub">
                {pick(p.sub)}
              </text>
            )}
          </g>
        ))}

        {/* Rose des vents */}
        <g transform="translate(90,590)">
          <circle r="22" fill="#fff" opacity="0.85" />
          <path d="M0,-17 L6,4 L0,0 L-6,4 Z" fill="var(--bougain)" />
          <text y="-24" textAnchor="middle" className="map-sub">N</text>
        </g>
      </svg>
    </div>
  );
}
