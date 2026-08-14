"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import { useT, LangSwitcher } from "@/lib/i18n";
import { loadGuest, getMode } from "@/lib/store";

export default function GuestLayout({ children }) {
  const { token } = useParams();
  const pathname = usePathname();
  const t = useT();
  const [household, setHousehold] = useState(undefined);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMode().then(({ configured }) => {
      if (cancelled) return;
      setConfigured(configured);
      if (!configured) return;
      loadGuest(token)
        .then((data) => { if (!cancelled) setHousehold(data.household); })
        .catch(() => { if (!cancelled) setHousehold(undefined); });
    });
    return () => { cancelled = true; };
  }, [token]);

  // Sans base configurée, mieux vaut le dire que d'afficher un site vide.
  if (!configured) {
    return (
      <div className="landing">
        <h1>Site momentanément indisponible</h1>
        <p style={{ color: "var(--muted)", maxWidth: "42ch" }}>
          Nous rencontrons un souci technique. Merci de réessayer dans quelques minutes.
        </p>
      </div>
    );
  }

  if (household === null) {
    return (
      <div className="landing">
        <div style={{ position: "absolute", top: 20, right: 20 }}>
          <LangSwitcher />
        </div>
        <h1>{t("landing.unknownTitle")}</h1>
        <p style={{ color: "var(--muted)", maxWidth: "42ch" }}>{t("landing.unknownBody")}</p>
        <Link className="btn" href="/">{t("landing.back")}</Link>
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
