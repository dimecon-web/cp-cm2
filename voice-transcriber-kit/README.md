# Kit dictée vocale pour personal-hub (façon FluidVoice, version web)

Ajoute la dictée vocale à l'app Next.js `personal-hub` : un bouton micro
enregistre la voix dans le navigateur, l'envoie à une route API serverless
qui la transcrit avec Whisper (Groq ou OpenAI), et renvoie le texte.

Contrairement à FluidVoice (app native macOS, non intégrable dans une web
app), cette version fonctionne partout : Mac, iPhone, Android, n'importe
quel navigateur.

## Installation (3 étapes, aucune dépendance npm)

1. **Copier les fichiers** dans le repo personal-hub (App Router) :
   - `app/api/transcribe/route.ts`
   - `components/useVoiceTranscriber.ts`
   - `components/MicButton.tsx`

   > Projet en Pages Router ? Seule la route change : adapter
   > `route.ts` en `pages/api/transcribe.ts` (handler classique).

2. **Ajouter la clé API** dans Vercel → Settings → Environment Variables :
   - `GROQ_API_KEY` (recommandé : `whisper-large-v3-turbo`, très rapide,
     quasi gratuit — clé sur https://console.groq.com), **ou**
   - `OPENAI_API_KEY` (modèle `whisper-1`).

   La route utilise Groq si les deux sont définies.

3. **Poser le bouton** à côté de n'importe quel champ :

   ```tsx
   import { MicButton } from "@/components/MicButton";

   const [note, setNote] = useState("");

   <textarea value={note} onChange={(e) => setNote(e.target.value)} />
   <MicButton onText={(t) => setNote((v) => (v ? v + " " : "") + t)} />
   ```

   Ou brancher le hook `useVoiceTranscriber` directement pour un
   comportement sur mesure (raccourci clavier global, insertion au
   curseur, etc.).

## Notes

- La langue par défaut est `fr` (prop `language` pour changer).
- Le micro nécessite HTTPS — OK sur Vercel, et en local `localhost`
  est considéré comme sécurisé.
- Safari enregistre en mp4/aac, Chrome/Firefox en webm/opus : les deux
  sont gérés (hook + route).
- Limite : ~24 Mo d'audio par requête (≈ 25 min en webm/opus), largement
  suffisant pour de la dictée.
