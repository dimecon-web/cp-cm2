"use client";

import { config } from "@/lib/config";
import { usePick } from "@/lib/i18n";

// Page « About us » (choix E4 a+b+c+d) — textes placeholders à remplacer
// par votre vraie histoire dans ce fichier et lib/config.js.
const CONTENT = {
  title: { fr: "Notre histoire", en: "Our story", el: "Η ιστορία μας" },
  story: {
    fr: "Ici, quelques paragraphes sur nous : comment on s'est rencontrés, ce qui nous fait rire, et pourquoi on a fini par se dire que la vie était mieux à deux. (Texte placeholder — écrivez ici votre vraie histoire, on la mettra en trois langues.)",
    en: "A few paragraphs about us: how we met, what makes us laugh, and why we ended up deciding life was better together. (Placeholder — your real story goes here, in three languages.)",
    el: "Λίγα λόγια για εμάς: πώς γνωριστήκαμε, τι μας κάνει να γελάμε, και γιατί αποφασίσαμε ότι η ζωή είναι καλύτερη μαζί. (Κείμενο placeholder.)",
  },
  whySpetsesTitle: { fr: "Pourquoi Spetses ?", en: "Why Spetses?", el: "Γιατί Σπέτσες;" },
  whySpetses: {
    fr: "Parce que c'est là que tout a commencé — ou presque. Cette île compte pour nous, et on ne voyait pas de plus bel endroit pour vous réunir tous. (Placeholder : racontez ici votre lien avec l'île.)",
    en: "Because that's where it all began — almost. This island matters to us, and we couldn't picture a more beautiful place to gather you all. (Placeholder: tell your connection to the island here.)",
    el: "Γιατί εκεί ξεκίνησαν όλα — σχεδόν. Αυτό το νησί μετράει για εμάς. (Placeholder.)",
  },
  galleryTitle: { fr: "Nous deux", en: "The two of us", el: "Εμείς οι δύο" },
  galleryNote: {
    fr: "Vos photos viendront ici — en attendant, on garde la place au chaud.",
    en: "Your photos will go here — keeping the spot warm for now.",
    el: "Οι φωτογραφίες σας θα μπουν εδώ.",
  },
};

const PLACEHOLDER_COLORS = ["var(--sea)", "var(--bougain)", "var(--sun)", "var(--olive)", "var(--sea-deep)", "var(--bougain)"];

export default function StoryPage() {
  const pick = usePick();
  return (
    <div className="narrow" style={{ margin: "0 auto" }}>
      <h1>{pick(CONTENT.title)}</h1>
      <div className="card">
        <p style={{ marginBottom: 0 }}>{pick(CONTENT.story)}</p>
      </div>

      <div className="card">
        <div className="timeline">
          {config.timeline.map((item, i) => (
            <div className="timeline-item" key={i}>
              <div className="timeline-year">{item.year}</div>
              <div>{pick(item.text)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>{pick(CONTENT.whySpetsesTitle)}</h3>
        <p style={{ marginBottom: 0 }}>{pick(CONTENT.whySpetses)}</p>
      </div>

      <div className="card">
        <h3>{pick(CONTENT.galleryTitle)}</h3>
        <p className="hint" style={{ marginBottom: 14 }}>{pick(CONTENT.galleryNote)}</p>
        <div className="gallery">
          {PLACEHOLDER_COLORS.map((c, i) => (
            <div className="photo-placeholder" key={i} style={{ background: c }} aria-hidden="true">
              {["📷", "🌊", "💛", "🏝️", "🥂", "💍"][i]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
