"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import { useT, usePick } from "@/lib/i18n";
import { getHousehold, getRsvp } from "@/lib/store";

export default function GuestHome() {
  const { token } = useParams();
  const t = useT();
  const pick = usePick();
  const [household, setHousehold] = useState(null);
  const [hasRsvp, setHasRsvp] = useState(false);
  const [days, setDays] = useState(null);

  useEffect(() => {
    setHousehold(getHousehold(token));
    setHasRsvp(!!getRsvp(token));
    const diff = new Date(config.weddingDate) - new Date();
    setDays(Math.max(0, Math.ceil(diff / 86400000)));
  }, [token]);

  const dateStr = new Date(config.weddingDate).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="narrow" style={{ margin: "0 auto", textAlign: "center" }}>
      <p style={{ color: "var(--bougain)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 13 }}>
        {t("home.welcome")}{household ? `, ${household.name}` : ""} !
      </p>
      <h1>{config.coupleNames}</h1>
      <p style={{ fontSize: 18, fontFamily: "var(--font-display), Georgia, serif", fontStyle: "italic" }}>
        {dateStr} · {pick(config.location)}
      </p>

      {days !== null && (
        <div className="countdown" aria-label={`${days} ${t("home.countdown")}`}>
          <span className="num">{days}</span>
          <span className="lbl">{t("home.countdown")}</span>
        </div>
      )}

      <p style={{ maxWidth: "48ch", margin: "0 auto 26px" }}>{t("home.intro")}</p>

      <Link className="btn" href={`/i/${token}/rsvp`}>
        {hasRsvp ? t("home.ctaDone") : t("home.cta")}
      </Link>

      <div style={{ marginTop: 40, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link className="btn ghost small" href={`/i/${token}/programme`}>{t("nav.programme")}</Link>
        <Link className="btn ghost small" href={`/i/${token}/spetses`}>{t("nav.spetses")}</Link>
        <Link className="btn ghost small" href={`/i/${token}/histoire`}>{t("nav.story")}</Link>
      </div>
    </div>
  );
}
