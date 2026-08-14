import { Suspense } from "react";
import ResetForm from "./ResetForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Réinitialiser mon mot de passe",
  robots: { index: false, follow: false },
};

// Page volontairement hors de /admin : on y arrive justement parce qu'on ne
// peut pas se connecter.
export default async function ResetPage({ searchParams }) {
  const params = await searchParams;
  return (
    <Suspense fallback={<div className="landing"><p className="hint">Chargement…</p></div>}>
      <ResetForm token={params?.token || ""} />
    </Suspense>
  );
}
