// Configuration centrale du site — TOUT ce qui est personnel se change ici.
// ⚠️ Les noms, dates et textes ci-dessous sont des PLACEHOLDERS à remplacer.

export const config = {
  coupleNames: "Camille & Dimitri", // ← à personnaliser
  initials: "C · D",
  weddingDate: "2027-06-05", // ← date réelle à confirmer
  rsvpDeadline: "2027-03-31",
  location: { fr: "Spetses, Grèce", en: "Spetses, Greece", el: "Σπέτσες, Ελλάδα" },
  contactEmail: "dimecon@gmail.com", // adresse qui reçoit les messages du formulaire
  whatsappGroupUrl: "", // lien du groupe WhatsApp — affiché sur le site quand renseigné

  // Programme — detailsPublic:false = lieu/horaire précis révélés plus tard (choix E3c)
  events: [
    {
      id: "party",
      date: "2027-06-03",
      time: "19:00",
      detailsPublic: false,
      name: { fr: "Pré-wedding party", en: "Pre-wedding party", el: "Πάρτι πριν τον γάμο" },
      desc: {
        fr: "On se retrouve, on trinque, on danse — l'échauffement officiel.",
        en: "We meet, we toast, we dance — the official warm-up.",
        el: "Βρισκόμαστε, τσουγκρίζουμε, χορεύουμε — η επίσημη προθέρμανση.",
      },
    },
    {
      id: "tour",
      date: "2027-06-04",
      time: "10:30",
      detailsPublic: false,
      name: { fr: "Visite guidée de l'île", en: "Guided island tour", el: "Ξενάγηση στο νησί" },
      desc: {
        fr: "Balade guidée : le vieux port, la maison de Bouboulina et l'école Anargyrios.",
        en: "Guided walk: the old harbour, Bouboulina's house and the Anargyrios school.",
        el: "Ξενάγηση: το παλιό λιμάνι, το σπίτι της Μπουμπουλίνας και η Αναργύρειος Σχολή.",
      },
    },
    {
      id: "wedding",
      date: "2027-06-05",
      time: "17:00",
      detailsPublic: false,
      name: { fr: "Le mariage", en: "The wedding", el: "Ο γάμος" },
      desc: {
        fr: "Le grand moment — cérémonie, dîner et fête jusqu'au bout de la nuit.",
        en: "The big moment — ceremony, dinner and party until late.",
        el: "Η μεγάλη στιγμή — τελετή, δείπνο και γλέντι μέχρι το πρωί.",
      },
    },
    {
      id: "brunch",
      date: "2027-06-06",
      time: "12:00",
      detailsPublic: false,
      name: { fr: "Brunch & debrief", en: "Brunch & debrief", el: "Brunch & απολογισμός" },
      desc: {
        fr: "Dernier rassemblement, les pieds dans l'eau, pour refaire la soirée.",
        en: "One last gathering by the water to relive the night.",
        el: "Μια τελευταία συνάντηση δίπλα στη θάλασσα.",
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
