import { redirect } from "next/navigation";
import { config } from "@/lib/config";

// L'adresse nue mène au lien partagé : c'est la même invitation pour tous.
// Les foyers qui ont leur propre adresse arrivent directement sur la leur.
export default function Root() {
  redirect(`/i/${config.sharedToken}`);
}
