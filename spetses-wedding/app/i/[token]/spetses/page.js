"use client";

import { usePick } from "@/lib/i18n";

// Page « essentiel au lancement, enrichie au fil du temps » (choix E2c).
const CONTENT = {
  title: { fr: "Spetses, mode d'emploi", en: "Spetses, a user's guide", el: "Σπέτσες: οδηγός χρήσης" },
  intro: {
    fr: "Une petite île sans voitures, à deux heures d'Athènes, entre pinèdes et maisons d'armateurs. Voici l'essentiel pour organiser votre venue — on enrichira cette page au fil des mois.",
    en: "A small car-free island two hours from Athens, all pine trees and shipowners' mansions. Here are the essentials for planning your trip — we'll keep adding to this page.",
    el: "Ένα μικρό νησί χωρίς αυτοκίνητα, δύο ώρες από την Αθήνα. Εδώ θα βρείτε τα βασικά — θα εμπλουτίζουμε τη σελίδα συνεχώς.",
  },
  sections: [
    {
      emoji: "✈️",
      title: { fr: "Venir à Spetses", en: "Getting to Spetses", el: "Πώς να έρθετε" },
      body: {
        fr: "Volez jusqu'à Athènes, puis deux options : le ferry rapide depuis Le Pirée (environ 2h, réservez sur Ferryhopper) ou la route jusqu'à Costa (2h30 de voiture) puis 10 minutes de bateau-taxi. Les billets de ferry s'ouvrent environ 3 mois avant la date.",
        en: "Fly to Athens, then two options: the fast ferry from Piraeus (about 2h, book on Ferryhopper) or drive to Costa (2.5h) then a 10-minute water taxi. Ferry tickets open about 3 months ahead.",
        el: "Πετάξτε στην Αθήνα και μετά: ταχύπλοο από τον Πειραιά (περίπου 2 ώρες) ή οδικώς μέχρι την Κόστα και 10 λεπτά με θαλάσσιο ταξί.",
      },
      links: [
        ["Ferryhopper", "https://www.ferryhopper.com"],
        ["Hellenic Seaways", "https://www.hellenicseaways.gr"],
      ],
    },
    {
      emoji: "🛵",
      title: { fr: "Se déplacer sur l'île", en: "Getting around", el: "Μετακινήσεις στο νησί" },
      body: {
        fr: "Pas de voitures privées à Spetses ! On circule à pied, à vélo, en scooter de location, en calèche pour le charme, ou en bateau-taxi pour rejoindre les plages. Tout le centre se fait à pied.",
        en: "No private cars on Spetses! You get around on foot, by bike, rented scooter, horse-drawn carriage for charm, or water taxi to reach the beaches. The whole centre is walkable.",
        el: "Χωρίς ιδιωτικά αυτοκίνητα στις Σπέτσες! Περπάτημα, ποδήλατο, ενοικιαζόμενο μηχανάκι, άμαξα ή θαλάσσιο ταξί για τις παραλίες.",
      },
      links: [],
    },
    {
      emoji: "🏨",
      title: { fr: "Dormir", en: "Where to stay", el: "Διαμονή" },
      body: {
        fr: "Du grand hôtel historique aux chambres chez l'habitant : réservez tôt, juin est très demandé. Nous préparons une liste d'adresses recommandées à tous les prix — elle apparaîtra ici. Dites-nous dans le RSVP si vous cherchez encore.",
        en: "From the grand historic hotel to guesthouses: book early, June is busy. We're preparing a list of recommended places at all prices — it will appear here. Tell us in the RSVP if you're still looking.",
        el: "Από το ιστορικό ξενοδοχείο μέχρι δωμάτια: κλείστε νωρίς, ο Ιούνιος έχει ζήτηση. Ετοιμάζουμε λίστα προτάσεων.",
      },
      links: [],
    },
    {
      emoji: "🏛️",
      title: { fr: "Un peu d'histoire", en: "A bit of history", el: "Λίγη ιστορία" },
      body: {
        fr: "Spetses, c'est l'île de Laskarina Bouboulina, héroïne de la révolution grecque de 1821, et de l'Armata, la grande fête maritime de septembre. C'est aussi l'école Anargyrios, qui a inspiré « Le Mage » de John Fowles — on vous y emmène pendant la visite guidée !",
        en: "Spetses is the island of Laskarina Bouboulina, heroine of the 1821 Greek revolution, and of the Armata, the great September naval festival. It's also home to the Anargyrios school, which inspired John Fowles' “The Magus” — we'll take you there on the guided tour!",
        el: "Οι Σπέτσες είναι το νησί της Λασκαρίνας Μπουμπουλίνας και της Αρμάτας. Είναι και η Αναργύρειος Σχολή, που ενέπνευσε τον «Μάγο» του John Fowles!",
      },
      links: [["Musée Bouboulina", "https://bouboulinamuseum-spetses.gr"]],
    },
  ],
};

export default function SpetsesPage() {
  const pick = usePick();
  return (
    <div className="narrow" style={{ margin: "0 auto" }}>
      <h1>{pick(CONTENT.title)}</h1>
      <p style={{ color: "var(--muted)" }}>{pick(CONTENT.intro)}</p>

      {CONTENT.sections.map((s, i) => (
        <div className="card" key={i}>
          <h3>
            <span aria-hidden="true" style={{ marginRight: 8 }}>{s.emoji}</span>
            {pick(s.title)}
          </h3>
          <p style={{ marginBottom: s.links.length ? 10 : 0 }}>{pick(s.body)}</p>
          {s.links.length > 0 && (
            <p style={{ marginBottom: 0, fontSize: 14 }}>
              {s.links.map(([label, url], j) => (
                <span key={url}>
                  {j > 0 && " · "}
                  <a href={url} target="_blank" rel="noreferrer">{label} ↗</a>
                </span>
              ))}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
