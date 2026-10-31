"use client";

import { usePick } from "@/lib/i18n";
import { COAST, PINES, PLACES, ARRIVALS, mapPath } from "@/lib/mapdata";

// Carte simplifiée de Spetses, dessinée à la main en SVG.
//
// Le contour suit la forme réelle de l'île, mais en version stylisée : les
// emplacements sont approximatifs et la carte sert à se repérer, pas à
// naviguer. Rien n'est importé d'un fournisseur de cartes, donc rien à
// attribuer et rien qui dépende d'un service extérieur.
//
// Le tracé et les points vivent dans lib/mapdata.js.

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

        <path d={mapPath(COAST)} fill="#f6ecd9" stroke="var(--sun)" strokeWidth="4"
          strokeLinejoin="round" />
        <path d={mapPath(PINES)} fill="var(--olive-soft)" stroke="none" opacity="0.9" />

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
