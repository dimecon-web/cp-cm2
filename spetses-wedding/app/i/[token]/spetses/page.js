"use client";

import { usePick } from "@/lib/i18n";
import { Rich } from "@/lib/rich";
import { ISLAND, PRACTICAL } from "@/lib/content";
import { IslandMap } from "@/components/IslandMap";

const PAGE = {
  title: { fr: "Spetses, mode d'emploi", en: "Spetses, a user's guide", el: "Σπέτσες: οδηγός χρήσης" },
  intro: {
    fr: "Une petite île sans voitures, à deux heures d'Athènes, entre pinèdes et maisons d'armateurs. Voici l'île, puis tout ce qu'il faut pour venir et s'y déplacer.",
    en: "A small car-free island two hours from Athens, all pine trees and shipowners' mansions. Here is the island, then everything you need to get there and get around.",
    el: "Ένα μικρό νησί χωρίς αυτοκίνητα, δύο ώρες από την Αθήνα, με πεύκα και αρχοντικά. Εδώ θα βρείτε το νησί, και μετά όλα όσα χρειάζεστε για να έρθετε και να μετακινηθείτε.",
  },
};

export default function SpetsesPage() {
  const pick = usePick();

  // La carte ouvre la page : c'est ce qu'on regarde en premier quand on
  // découvre une île. Les autres sections suivent dans l'ordre du guide.
  const map = PRACTICAL.sections.find((s) => s.id === "carte");
  const sections = PRACTICAL.sections.filter((s) => s.id !== "carte");

  return (
    <div className="narrow" style={{ margin: "0 auto" }}>
      <h1>{pick(PAGE.title)}</h1>
      <p style={{ color: "var(--muted)" }}>{pick(PAGE.intro)}</p>

      {map && (
        <section className="card" id="carte">
          <h3>
            <span aria-hidden="true" style={{ marginRight: 8 }}>{map.emoji}</span>
            {pick(map.title)}
          </h3>
          <IslandMap />
          {map.groups[0].items.map((item, i) => (
            <p key={i} className="hint" style={{ marginBottom: 0 }}>
              <Rich text={pick(item.text)} />
            </p>
          ))}
        </section>
      )}

      <div className="card">
        <h3>{pick(ISLAND.title)}</h3>
        {ISLAND.paragraphs.map((p, i) => (
          <p key={i} style={{ marginBottom: i === ISLAND.paragraphs.length - 1 ? 0 : 12 }}>
            <Rich text={pick(p)} />
          </p>
        ))}
      </div>

      <h2 style={{ marginTop: 34 }}>{pick(PRACTICAL.title)}</h2>
      <p style={{ color: "var(--muted)" }}>{pick(PRACTICAL.intro)}</p>

      {/* Raccourcis : la page est longue, autant pouvoir sauter au bon endroit. */}
      <nav className="toc" aria-label={pick(PRACTICAL.title)}>
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            <span aria-hidden="true">{s.emoji}</span> {pick(s.title)}
          </a>
        ))}
      </nav>

      {sections.map((s) => (
        <section className="card" key={s.id} id={s.id}>
          <h3>
            <span aria-hidden="true" style={{ marginRight: 8 }}>{s.emoji}</span>
            {pick(s.title)}
          </h3>

          {s.lead && <p><Rich text={pick(s.lead)} /></p>}

          {s.groups.map((g, gi) => (
            <div className="guide-group" key={gi}>
              {g.title && <p className="guide-label">{pick(g.title)}</p>}
              <ul className="guide-list">
                {g.items.map((item, ii) => (
                  <li key={ii}>
                    <Rich text={pick(item.text)} />
                    {item.sub && (
                      <ul>
                        {item.sub.map((sub, si) => (
                          <li key={si}><Rich text={pick(sub)} /></li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
