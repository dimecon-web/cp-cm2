// Données de la carte de Spetses, partagées par le composant du site et par
// le générateur d'aperçu statique : une seule source pour un seul dessin.
//
// Repère : viewBox 1000 × 640, le nord en haut. Le contour suit la forme
// réelle de l'île, en version simplifiée ; les emplacements sont approximatifs.

export const COAST = [
  [133, 94], [183, 56], [233, 89], [289, 25], [355, 33], [422, 61], [478, 50],
  [533, 100], [589, 128], [655, 161], [716, 183], [755, 217], [822, 239],
  [858, 261], [863, 311], [833, 361], [816, 422], [777, 478], [722, 533],
  [655, 566], [583, 594], [527, 608], [483, 583], [444, 541], [414, 494],
  [372, 455], [339, 414], [333, 383], [358, 355], [319, 322], [289, 289],
  [272, 266], [239, 239], [217, 200], [183, 167], [161, 133],
];

// La pinède qui couvre le cœur de l'île — tache indicative, pas un relevé.
export const PINES = [
  [330, 200], [430, 150], [560, 175], [660, 230], [720, 300], [700, 390],
  [620, 460], [520, 500], [430, 460], [360, 380], [320, 290],
];

export const PLACES = [
  {
    id: "dapia", x: 722, y: 183, kind: "town", anchor: "start", dx: 15, dy: -3,
    label: { fr: "Dapia — port et centre", en: "Dapia — port and centre", el: "Δαπιά — λιμάνι και κέντρο" },
  },
  {
    id: "oldport", x: 838, y: 252, kind: "town", anchor: "start", dx: 15, dy: 5,
    label: { fr: "Vieux port", en: "Old harbour", el: "Παλιό Λιμάνι" },
  },
  {
    id: "venue", x: 792, y: 342, kind: "venue", anchor: "end", dx: -26, dy: -8,
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

export const ARRIVALS = [
  {
    id: "piraeus", from: [740, 170], to: [905, 92], anchor: "end", at: [900, 72],
    label: { fr: "Le Pirée · ~2 h", en: "Piraeus · ~2 h", el: "Πειραιάς · ~2 ώρες" },
  },
  {
    id: "kosta", from: [868, 262], to: [950, 288], anchor: "end", at: [958, 308],
    label: { fr: "Kosta · 5–15 min", en: "Kosta · 5–15 min", el: "Κόστα · 5–15 λεπτά" },
  },
];

export const mapPath = (pts) => pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ") + " Z";

