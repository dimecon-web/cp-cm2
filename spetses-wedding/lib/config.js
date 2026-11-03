// Configuration centrale du site — TOUT ce qui est personnel se change ici.
// Noms, date et lieu de la cérémonie sont confirmés ; les deux moments qui
// l'entourent restent à préciser.

export const config = {
  coupleNames: "Themis & Thierry",
  initials: "T · T",
  weddingDate: "2027-07-10", // samedi
  weddingTime: "19:00",
  rsvpDeadline: "2027-01-31", // fin janvier 2027

  location: { fr: "Spetses, Grèce", en: "Spetses, Greece", el: "Σπέτσες, Ελλάδα" },

  // Lieux de la journée du mariage.
  venues: {
    ceremony: {
      fr: "Église Anastasis, quartier des Scholes",
      en: "Chapel of Anastasis, in the Scholes grounds",
      el: "Ιερός Ναός Αναστάσεως, στην περιοχή των Σχολών",
    },
    reception: {
      fr: "Magus Art Cafe, dans les Scholes",
      en: "Magus Art Cafe, in the Scholes",
      el: "Magus Art Cafe, στις Σχολές",
    },
  },

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
  // il sert à dire franchement ce qui est arrêté et ce qui ne l'est pas.
  // `dateAlt` annonce un événement dont la date hésite entre deux jours.
  // `details` ajoute les précisions confirmées, une ligne par précision.
  events: [
    {
      id: "party",
      date: "2027-07-09",
      name: { fr: "Le jour avant le mariage", en: "The day before the wedding", el: "Η ημέρα πριν από τον γάμο" },
      desc: {
        fr: "Évènement surprise.",
        en: "Surprise event.",
        el: "Εκδήλωση-έκπληξη.",
      },
      status: {
        fr: "À confirmer",
        en: "To be confirmed",
        el: "Να επιβεβαιωθεί",
      },
    },
    {
      id: "wedding",
      date: "2027-07-10",
      time: "19:00",
      tone: "olive",
      name: { fr: "Le mariage", en: "The wedding", el: "Ο γάμος" },
      desc: {
        fr: "Le grand moment. La cérémonie a lieu à l'église Anastasis, dans le quartier des Scholes, et la réception suit au Magus Art Cafe.",
        en: "The big moment. The ceremony takes place at the chapel of Anastasis, in the Scholes grounds, and the reception follows at the Magus Art Cafe.",
        el: "Η μεγάλη στιγμή. Η τελετή γίνεται στον Ιερό Ναό Αναστάσεως, στην περιοχή των Σχολών, και ακολουθεί δεξίωση στο Magus Art Cafe.",
      },
      details: [
        {
          fr: "🕖 Cérémonie à 19h00 — église Anastasis, quartier des Scholes",
          en: "🕖 Ceremony at 7:00 pm — chapel of Anastasis, Scholes grounds",
          el: "🕖 Τελετή στις 19:00 — Ιερός Ναός Αναστάσεως, περιοχή των Σχολών",
        },
        {
          fr: "🥂 Réception au Magus Art Cafe, dans les Scholes",
          en: "🥂 Reception at the Magus Art Cafe, in the Scholes",
          el: "🥂 Δεξίωση στο Magus Art Cafe, στις Σχολές",
        },
      ],
      status: {
        fr: "Date, heure et lieux confirmés ✓",
        en: "Date, time and venues confirmed ✓",
        el: "Ημερομηνία, ώρα και τοποθεσίες επιβεβαιωμένες ✓",
      },
    },
    {
      id: "beach",
      date: "2027-07-11",
      name: { fr: "Le lendemain, à la plage", en: "The day after, at the beach", el: "Η επόμενη μέρα, στην παραλία" },
      desc: {
        fr: "Un moment de retrouvailles décontracté sur une plage de l'île, pour refaire la soirée les pieds dans l'eau.",
        en: "A relaxed debrief on one of the island's beaches, reliving the night with our feet in the water.",
        el: "Ένα χαλαρό «debrief» σε κάποια παραλία του νησιού, με τα πόδια στο νερό.",
      },
      status: {
        fr: "Lieu et horaires à communiquer en temps voulu",
        en: "Place and timings to be announced in due course",
        el: "Τοποθεσία και ώρες θα ανακοινωθούν εν καιρώ",
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
