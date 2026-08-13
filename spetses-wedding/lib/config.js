// Configuration centrale du site — TOUT ce qui est personnel se change ici.
// Noms et dates confirmés ; les horaires, la frise et les descriptions
// d'événements restent à ajuster.

export const config = {
  coupleNames: "Themis & Thierry",
  initials: "T · T",
  weddingDate: "2027-07-10", // samedi
  rsvpDeadline: "2027-01-31", // fin janvier 2027
  location: { fr: "Spetses, Grèce", en: "Spetses, Greece", el: "Σπέτσες, Ελλάδα" },
  // Coordonnées des mariés — utilisées dans la signature des messages
  // envoyés aux invités et sur la page Contact du site.
  couple: [
    { name: "Themis Oikonomidi", email: "themis.econ@gmail.com", phone: "+32 472 99 92 81" },
    { name: "Thierry Vandensteen", email: "vandensteenthierry@hotmail.com", phone: "+32 495 30 86 06" },
  ],
  whatsappGroupUrl: "", // lien du groupe WhatsApp — affiché sur le site quand renseigné

  // « Côté » de chaque foyer, pour l'espace organisateurs.
  sides: [
    { id: "themis", label: "Themis" },
    { id: "thierry", label: "Thierry" },
    { id: "both", label: "Les deux" },
  ],

  // Programme. `status` est le mot affiché en badge sous chaque événement :
  // il sert à dire franchement ce qui n'est pas encore arrêté.
  // `dateAlt` permet d'annoncer un événement dont la date hésite entre deux jours.
  events: [
    {
      id: "party",
      date: "2027-07-09",
      name: { fr: "Rencontre pré-wedding", en: "Pre-wedding get-together", el: "Συνάντηση πριν τον γάμο" },
      desc: {
        fr: "La veille du mariage, on se retrouve tous pour un premier verre — les retrouvailles avant la fête.",
        en: "The day before the wedding, we all gather for a first drink — reunions before the party.",
        el: "Την παραμονή του γάμου, βρισκόμαστε όλοι για ένα πρώτο ποτό.",
      },
      status: {
        fr: "Heure et lieu à définir",
        en: "Time and venue to be confirmed",
        el: "Ώρα και τοποθεσία θα ανακοινωθούν",
      },
    },
    {
      id: "tour",
      date: "2027-07-09",
      dateAlt: "2027-07-10",
      name: { fr: "Visite guidée de l'île", en: "Guided island tour", el: "Ξενάγηση στο νησί" },
      desc: {
        fr: "Balade guidée : le vieux port, la maison de Bouboulina et l'école Anargyrios.",
        en: "Guided walk: the old harbour, Bouboulina's house and the Anargyrios school.",
        el: "Ξενάγηση: το παλιό λιμάνι, το σπίτι της Μπουμπουλίνας και η Αναργύρειος Σχολή.",
      },
      status: {
        fr: "Date à confirmer : le 9, ou le 10 au matin",
        en: "Date to be confirmed: the 9th, or the morning of the 10th",
        el: "Η ημερομηνία θα επιβεβαιωθεί: στις 9, ή το πρωί της 10ης",
      },
    },
    {
      id: "wedding",
      date: "2027-07-10",
      name: { fr: "Le mariage", en: "The wedding", el: "Ο γάμος" },
      desc: {
        fr: "Le grand moment — cérémonie, dîner et fête jusqu'au bout de la nuit.",
        en: "The big moment — ceremony, dinner and party until late.",
        el: "Η μεγάλη στιγμή — τελετή, δείπνο και γλέντι μέχρι το πρωί.",
      },
      status: {
        fr: "Lieu et horaires bientôt communiqués",
        en: "Venue and timings coming soon",
        el: "Τοποθεσία και ώρες σύντομα",
      },
    },
    {
      id: "beach",
      date: "2027-07-11",
      name: { fr: "Journée à la plage", en: "Beach day", el: "Ημέρα στην παραλία" },
      desc: {
        fr: "Le lendemain, on se retrouve tous à la plage pour passer la journée ensemble — les pieds dans l'eau, en refaisant la soirée.",
        en: "The day after, we all meet at the beach to spend the day together — feet in the water, reliving the night.",
        el: "Την επόμενη μέρα, βρισκόμαστε όλοι στην παραλία για να περάσουμε τη μέρα μαζί.",
      },
      status: {
        fr: "Lieu exact et horaires à confirmer",
        en: "Exact place and timings to be confirmed",
        el: "Ακριβής τοποθεσία και ώρες θα επιβεβαιωθούν",
      },
    },
  ],

  // Frise « notre histoire » — placeholders
  timeline: [
    { year: "2015", text: { fr: "On se rencontre (racontez ici votre vraie histoire !)", en: "We meet (tell your real story here!)", el: "Γνωριζόμαστε (γράψτε εδώ την αληθινή σας ιστορία!)" } },
    { year: "2018", text: { fr: "Premier voyage en Grèce ensemble", en: "First trip to Greece together", el: "Πρώτο ταξίδι στην Ελλάδα μαζί" } },
    { year: "2025", text: { fr: "La demande, face à la mer", en: "The proposal, facing the sea", el: "Η πρόταση, με θέα τη θάλασσα" } },
    { year: "2027", text: { fr: "On se dit oui à Spetses", en: "We say yes in Spetses", el: "Λέμε το «ναι» στις Σπέτσες" } },
  ],
};

export const EVENT_IDS = config.events.map((e) => e.id);
