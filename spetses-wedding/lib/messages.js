import { config } from "./config";

// Modèles des messages envoyés aux invités, dans les trois langues.
// Chaque foyer reçoit le sien dans SA langue, avec son nom et son lien.
//
// Trois moments : le « save the date » (bloquer la date), l'invitation
// complète (avec le lien et la demande de réponse), et la relance.
//
// Pour changer un texte, c'est ici — et nulle part ailleurs.

const DATE_TEXT = {
  fr: "samedi 10 juillet 2027",
  en: "Saturday 10 July 2027",
  el: "Σάββατο 10 Ιουλίου 2027",
};

const DEADLINE_TEXT = {
  fr: "fin janvier 2027",
  en: "the end of January 2027",
  el: "το τέλος Ιανουαρίου 2027",
};

const PLACE = {
  fr: "Spetses, en Grèce",
  en: "Spetses, Greece",
  el: "τις Σπέτσες",
};

// Signature commune : les invités doivent toujours savoir à qui répondre,
// quelle que soit la personne qui a matériellement envoyé le message.
const REACH_US = {
  fr: "Pour nous joindre",
  en: "To reach us",
  el: "Για να επικοινωνήσετε μαζί μας",
};

function signature(lang) {
  const lines = config.couple.map((c) => `${c.name} — ${c.phone} — ${c.email}`);
  return `${REACH_US[lang] || REACH_US.fr} :\n${lines.join("\n")}`;
}

// Le site continuera de s'étoffer : autant le dire dès le premier message.
const LIVING_SITE = {
  fr: "Le site s'enrichira au fil de l'eau : programme détaillé, conseils pour venir, adresses où dormir… Passez y jeter un œil de temps en temps.",
  en: "The website will keep growing: detailed programme, travel tips, places to stay… Do drop by from time to time.",
  el: "Η ιστοσελίδα θα εμπλουτίζεται συνεχώς: αναλυτικό πρόγραμμα, συμβουλές για το ταξίδι, καταλύματα… Περνάτε πού και πού.",
};

export const MESSAGE_KINDS = [
  { id: "saveDate", label: "Save the date", personal: true },
  { id: "invite", label: "Invitation", personal: true },
  { id: "reminder", label: "Relance", personal: true },
  { id: "custom", label: "Autre information", personal: false },
];

const TEMPLATES = {
  // ---------- Save the date ----------
  saveDate: {
    subject: {
      fr: "Bloquez la date : 10 juillet 2027 ☀️",
      en: "Save the date: 10 July 2027 ☀️",
      el: "Κρατήστε την ημερομηνία: 10 Ιουλίου 2027 ☀️",
    },
    short: {
      fr: (n, link) =>
        `☀️ Save the date ! On se marie le ${DATE_TEXT.fr}, à ${PLACE.fr} 🇬🇷\n` +
        `Entourez la date en gros et posez vos congés avant les collègues 😄\n` +
        `Et si vous le savez déjà, dites-nous si vous venez et combien vous serez : ${link}\n` +
        `Tout restera modifiable jusqu'à ${DEADLINE_TEXT.fr} — nombre de personnes, dates d'arrivée et de départ. Rien n'est gravé dans le marbre !\n` +
        `${LIVING_SITE.fr}`,
      en: (n, link) =>
        `☀️ Save the date! We're getting married on ${DATE_TEXT.en}, in ${PLACE.en} 🇬🇷\n` +
        `Circle the date and book those days off before your colleagues get there first 😄\n` +
        `And if you already know, tell us whether you're coming and how many of you: ${link}\n` +
        `Everything stays editable until ${DEADLINE_TEXT.en} — number of people, arrival and departure dates. Nothing is set in stone!\n` +
        `${LIVING_SITE.en}`,
      el: (n, link) =>
        `☀️ Κρατήστε την ημερομηνία! Παντρευόμαστε το ${DATE_TEXT.el}, στις Σπέτσες 🇬🇷\n` +
        `Κυκλώστε την ημερομηνία και κλείστε την άδειά σας πριν προλάβουν οι συνάδελφοι 😄\n` +
        `Κι αν το ξέρετε ήδη, πείτε μας αν έρχεστε και πόσοι θα είστε: ${link}\n` +
        `Όλα μπορούν να αλλάξουν μέχρι ${DEADLINE_TEXT.el} — αριθμός ατόμων, ημερομηνίες άφιξης και αναχώρησης. Τίποτα δεν είναι οριστικό!\n` +
        `${LIVING_SITE.el}`,
    },
    long: {
      fr: (n, link) =>
        `${n}, on a une nouvelle qui sent bon le soleil.\n\n` +
        `Le ${DATE_TEXT.fr}, on se marie à ${PLACE.fr}. 🎉\n\n` +
        `Première mission : entourez la date en gros, et posez vos congés avant que vos collègues n'y pensent.\n\n` +
        `Deuxième mission, si le cœur vous en dit : on vous a préparé un petit site rien que pour vous, où vous pouvez déjà nous dire si vous venez et combien vous serez.\n\n` +
        `👉 ${link}\n\n` +
        `Il vous reconnaît tout seul, pas de mot de passe à retenir. Et surtout : rien n'est définitif. Le nombre de personnes, vos dates d'arrivée et de départ, tout restera modifiable jusqu'à ${DEADLINE_TEXT.fr}. Répondez au feeling, on ajustera ensemble.\n\n` +
        `${LIVING_SITE.fr} Le programme complet et les détails pratiques arrivent dans les prochaines semaines. D'ici là, sachez seulement qu'on a hâte — vraiment hâte — de fêter et de partager ce moment avec vous. Et que les pastèques sont déjà commandées. Enfin, presque : le débat sur la quantité fait rage.\n\n` +
        `À très vite ! ☀️\n${config.coupleNames}\n\n` +
        `P.-S. — Un conseil d'ami : en juillet, les vols vers la Grèce partent vite. Rien à réserver dans l'immédiat, mais gardez un œil dessus.`,
      en: (n, link) =>
        `${n}, we have news that smells of sunshine.\n\n` +
        `On ${DATE_TEXT.en}, we're getting married in ${PLACE.en}. 🎉\n\n` +
        `First mission: circle the date, and book those days off before your colleagues think of it.\n\n` +
        `Second mission, if you feel like it: we've prepared a little website just for you, where you can already tell us whether you're coming and how many of you there will be.\n\n` +
        `👉 ${link}\n\n` +
        `It recognises you on its own, no password to remember. And above all: nothing is final. The number of people, your arrival and departure dates — everything stays editable until ${DEADLINE_TEXT.en}. Answer with your gut, we'll adjust together.\n\n` +
        `${LIVING_SITE.en} The full programme and practical details are coming in the next few weeks. Until then, just know that we can't wait — truly — to celebrate and share this moment with you. And that the watermelons are already on order. Almost: the debate about how many rages on.\n\n` +
        `See you very soon! ☀️\n${config.coupleNames}\n\n` +
        `P.S. — A friendly tip: July flights to Greece fill up fast. Nothing to book yet, but keep an eye out.`,
      el: (n, link) =>
        `${n}, έχουμε νέα που μυρίζουν καλοκαίρι.\n\n` +
        `Το ${DATE_TEXT.el} παντρευόμαστε στις Σπέτσες. 🎉\n\n` +
        `Πρώτη αποστολή: κυκλώστε την ημερομηνία και κλείστε την άδειά σας πριν το σκεφτούν οι συνάδελφοι.\n\n` +
        `Δεύτερη αποστολή, αν θέλετε: σας ετοιμάσαμε μια μικρή ιστοσελίδα μόνο για εσάς, όπου μπορείτε ήδη να μας πείτε αν έρχεστε και πόσοι θα είστε.\n\n` +
        `👉 ${link}\n\n` +
        `Σας αναγνωρίζει μόνη της, χωρίς κωδικό. Και κυρίως: τίποτα δεν είναι οριστικό. Ο αριθμός των ατόμων, οι ημερομηνίες άφιξης και αναχώρησης — όλα μπορούν να αλλάξουν μέχρι ${DEADLINE_TEXT.el}.\n\n` +
        `${LIVING_SITE.el} Το πλήρες πρόγραμμα και οι πρακτικές λεπτομέρειες έρχονται τις επόμενες εβδομάδες. Μέχρι τότε, να ξέρετε μόνο ότι ανυπομονούμε — πραγματικά — να γιορτάσουμε αυτή τη στιγμή μαζί σας. Και ότι τα καρπούζια έχουν ήδη παραγγελθεί. Σχεδόν: η συζήτηση για την ποσότητα συνεχίζεται.\n\n` +
        `Τα λέμε σύντομα! ☀️\n${config.coupleNames}\n\n` +
        `Υ.Γ. — Μια φιλική συμβουλή: τον Ιούλιο οι πτήσεις για Ελλάδα γεμίζουν γρήγορα.`,
    },
  },

  // ---------- Invitation complète ----------
  invite: {
    subject: {
      fr: "C'est officiel : on se marie ! ☀️",
      en: "It's official — we're getting married! ☀️",
      el: "Επίσημα: παντρευόμαστε! ☀️",
    },
    short: {
      fr: (n, link) =>
        `🎉 C'est officiel : on se marie !\n` +
        `${DATE_TEXT.fr.charAt(0).toUpperCase() + DATE_TEXT.fr.slice(1)}, à ${PLACE.fr}. Soleil, mer, musique — et vous, surtout vous.\n` +
        `On a tellement hâte de fêter ça avec vous ! Tout est là, avec votre réponse à nous donner : ${link}\n` +
        `Le lien est rien qu'à vous, il vous reconnaît tout seul 🪄 Réponse d'ici ${DEADLINE_TEXT.fr}… et après, on danse !`,
      en: (n, link) =>
        `🎉 It's official — we're getting married!\n` +
        `${DATE_TEXT.en}, in ${PLACE.en}. Sunshine, sea, music — and you, most of all.\n` +
        `We can't wait to celebrate with you! Everything's here, along with your RSVP: ${link}\n` +
        `The link is yours alone, no password needed 🪄 Just let us know by ${DEADLINE_TEXT.en}… and then, we dance!`,
      el: (n, link) =>
        `🎉 Επίσημα: παντρευόμαστε!\n` +
        `Το ${DATE_TEXT.el}, στις Σπέτσες. Ήλιος, θάλασσα, μουσική — και πάνω απ' όλα, εσείς.\n` +
        `Ανυπομονούμε να το γιορτάσουμε μαζί σας! Όλα εδώ, μαζί με την απάντησή σας: ${link}\n` +
        `Ο σύνδεσμος είναι μόνο δικός σας, χωρίς κωδικό 🪄 Απαντήστε μέχρι ${DEADLINE_TEXT.el} — και μετά, χορός!`,
    },
    long: {
      fr: (n, link) =>
        `${n}, tenez-vous bien : on se marie ! 🎉\n\n` +
        `Le ${DATE_TEXT.fr}, à ${PLACE.fr}. Du soleil, la mer, des bougainvilliers partout — et vous, surtout vous.\n\n` +
        `Nous avons hâte de fêter et de partager ce moment avec vous. Tellement hâte, en fait, qu'on a déjà commencé la playlist et débattu du nombre de pastèques à prévoir. (Le débat est encore ouvert.)\n\n` +
        `Pour tout savoir — le programme des festivités, l'île, où poser vos valises — on vous a préparé un petit site rien que pour vous :\n\n` +
        `👉 ${link}\n\n` +
        `Il vous reconnaît tout seul : pas de mot de passe à retenir, on vous a épargné ça.\n\n` +
        `Une seule mission pour l'instant : nous dire si vous serez de la fête, d'ici ${DEADLINE_TEXT.fr}. Ça prend moins de temps qu'un frappé en terrasse, et vous pourrez toujours modifier votre réponse d'ici là — sur les détails, hein, pas sur votre venue 😄\n\n` +
        `On a déjà des étoiles dans les yeux. À très vite !\n${config.coupleNames} ☀️`,
      en: (n, link) =>
        `${n}, brace yourselves: we're getting married! 🎉\n\n` +
        `On ${DATE_TEXT.en}, in ${PLACE.en}. Sunshine, the sea, bougainvillea everywhere — and you, most of all.\n\n` +
        `We can't wait to celebrate and share this moment with you. So much so that we've already started the playlist and argued about how many watermelons to order. (The debate is ongoing.)\n\n` +
        `To find out everything — the programme, the island, where to drop your bags — we've prepared a little website just for you:\n\n` +
        `👉 ${link}\n\n` +
        `It recognises you on its own: no password to remember, we spared you that.\n\n` +
        `One mission for now: tell us whether you'll join the party, by ${DEADLINE_TEXT.en}. It takes less time than a frappé on a terrace, and you can always change your answer until then — the details, mind you, not your attendance 😄\n\n` +
        `We already have stars in our eyes. See you very soon!\n${config.coupleNames} ☀️`,
      el: (n, link) =>
        `${n}, κρατηθείτε: παντρευόμαστε! 🎉\n\n` +
        `Το ${DATE_TEXT.el}, στις Σπέτσες. Ήλιος, θάλασσα, βουκαμβίλιες παντού — και πάνω απ' όλα, εσείς.\n\n` +
        `Ανυπομονούμε να γιορτάσουμε και να μοιραστούμε αυτή τη στιγμή μαζί σας. Τόσο πολύ, που έχουμε ήδη ξεκινήσει την playlist και μαλώνουμε για το πόσα καρπούζια θα παραγγείλουμε. (Η συζήτηση συνεχίζεται.)\n\n` +
        `Για να τα μάθετε όλα — το πρόγραμμα, το νησί, πού θα μείνετε — σας ετοιμάσαμε μια μικρή ιστοσελίδα μόνο για εσάς:\n\n` +
        `👉 ${link}\n\n` +
        `Σας αναγνωρίζει μόνη της: κανένας κωδικός να θυμάστε.\n\n` +
        `Μία μόνο αποστολή προς το παρόν: πείτε μας αν θα είστε μαζί μας, μέχρι ${DEADLINE_TEXT.el}. Παίρνει λιγότερη ώρα από έναν φραπέ, και μπορείτε να αλλάξετε την απάντησή σας μέχρι τότε 😄\n\n` +
        `Έχουμε ήδη αστέρια στα μάτια. Τα λέμε πολύ σύντομα!\n${config.coupleNames} ☀️`,
    },
  },

  // ---------- Relance ----------
  reminder: {
    subject: {
      fr: "Petit rappel — votre réponse pour Spetses 💛",
      en: "A gentle reminder — your RSVP for Spetses 💛",
      el: "Μια μικρή υπενθύμιση — η απάντησή σας για τις Σπέτσες 💛",
    },
    short: {
      fr: (n, link) =>
        `Coucou ${n} ! Il nous manque encore votre réponse pour Spetses 💛 Deux minutes, c'est par ici : ${link}\n` +
        `On aimerait vraiment vous compter parmi nous — et puis la playlist a besoin de savoir combien de danseurs prévoir 😄`,
      en: (n, link) =>
        `Hello ${n}! We're still missing your reply for Spetses 💛 Two minutes, right here: ${link}\n` +
        `We'd really love to have you with us — and the playlist needs to know how many dancers to expect 😄`,
      el: (n, link) =>
        `Γεια σας ${n}! Μας λείπει ακόμα η απάντησή σας για τις Σπέτσες 💛 Δύο λεπτά, εδώ: ${link}\n` +
        `Θα θέλαμε πολύ να είστε μαζί μας — και η playlist πρέπει να ξέρει πόσους χορευτές να περιμένει 😄`,
    },
  },
};

// Le texte long sert à l'email, le court à WhatsApp. La relance n'a qu'une
// version, assez brève pour les deux canaux.
//
// `custom` est un message libre saisi par les organisateurs : il est fourni
// en argument plutôt que pris dans les modèles.
export function messageFor(kind, household, link, custom) {
  const lang = ["fr", "en", "el"].includes(household.lang) ? household.lang : "fr";
  const name = household.name;

  if (kind === "custom") {
    const pick = (obj) => (obj?.[lang]?.trim() ? obj[lang] : obj?.fr || "");
    const body = pick(custom?.body);
    return {
      subject: pick(custom?.title) || "Des nouvelles du mariage",
      email: `${name},\n\n${body}\n\n${config.coupleNames}\n\n${signature(lang)}`,
      whatsapp: body,
    };
  }

  const tpl = TEMPLATES[kind];
  return {
    subject: tpl.subject[lang],
    email: `${(tpl.long || tpl.short)[lang](name, link)}\n\n${signature(lang)}`,
    whatsapp: tpl.short[lang](name, link),
  };
}

// Version sans nom ni lien personnel, pour un email unique envoyé en copie
// cachée à plusieurs foyers d'une même langue.
export function bulkMessageFor(kind, lang, custom) {
  const l = ["fr", "en", "el"].includes(lang) ? lang : "fr";
  if (kind === "custom") {
    const pick = (obj) => (obj?.[l]?.trim() ? obj[l] : obj?.fr || "");
    return {
      subject: pick(custom?.title) || "Des nouvelles du mariage",
      body: `${pick(custom?.body)}\n\n${config.coupleNames}\n\n${signature(l)}`,
    };
  }
  const tpl = TEMPLATES[kind];
  return { subject: tpl.subject[l], body: `${tpl.short[l]("", "")}\n\n${signature(l)}` };
}
