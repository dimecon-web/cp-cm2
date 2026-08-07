"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import { useT, LangSwitcher } from "@/lib/i18n";
import { loadGuest } from "@/lib/store";

export default function GuestLayout({ children }) {
  const { token } = useParams();
  const pathname = usePathname();
  const t = useT();
  const [household, setHousehold] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    loadGuest(token)
      .then((data) => { if (!cancelled) setHousehold(data.household); })
      .catch(() => { if (!cancelled) setHousehold(undefined); });
    return () => { cancelled = true; };
  }, [token]);

  if (household === null) {
    return (
      <div className="landing">
        <h1>Lien inconnu</h1>
        <p style={{ color: "var(--muted)" }}>
          Ce lien d'invitation n'est pas valide. Vérifiez le message reçu ou contactez-nous.
        </p>
        <Link className="btn" href="/">Retour</Link>
      </div>
    );
  }

  const base = `/i/${token}`;
  const links = [
    [base, t("nav.home")],
    [`${base}/rsvp`, t("nav.rsvp")],
    [`${base}/programme`, t("nav.programme")],
    [`${base}/spetses`, t("nav.spetses")],
    [`${base}/histoire`, t("nav.story")],
    [`${base}/news`, t("nav.news")],
    [`${base}/contact`, t("nav.contact")],
  ];

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <div className="header-top">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="monogram">{config.initials}</div>
              <div className="header-names">{config.coupleNames}</div>
            </div>
            <LangSwitcher />
          </div>
          <nav className="site-nav" aria-label="Navigation">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className={pathname === href ? "active" : ""}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <svg className="header-wave" viewBox="0 0 1440 26" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,14 C240,30 480,-2 720,10 C960,22 1200,4 1440,16 L1440,26 L0,26 Z" fill="var(--cream)" />
        </svg>
      </header>
      <main className="page">
        <div className="wrap">{children}</div>
      </main>
      <footer className="site-footer">
        <div className="waves">~ ~ ~</div>
        {config.coupleNames} · Spetses · {new Date(config.weddingDate).getFullYear()}
      </footer>
    </>
  );
}
