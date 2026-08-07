"use client";

import { config } from "@/lib/config";
import { useT, usePick, useLang } from "@/lib/i18n";

export default function ProgrammePage() {
  const t = useT();
  const pick = usePick();
  const { lang } = useLang();
  const locale = lang === "en" ? "en-GB" : lang === "el" ? "el-GR" : "fr-FR";

  return (
    <div className="narrow" style={{ margin: "0 auto" }}>
      <h1>{t("programme.title")}</h1>
      <p style={{ color: "var(--muted)" }}>{t("programme.intro")}</p>

      {config.events.map((ev) => {
        const d = new Date(ev.date + "T12:00:00");
        return (
          <div className="card event-card" key={ev.id}>
            <div className="event-date">
              <div className="day">{d.getDate()}</div>
              <div className="month">{d.toLocaleDateString(locale, { month: "short" })}</div>
            </div>
            <div>
              <h3 style={{ marginBottom: 4 }}>{pick(ev.name)}</h3>
              <p style={{ marginBottom: 8 }}>{pick(ev.desc)}</p>
              {ev.detailsPublic ? (
                <span className="badge olive">{ev.time}</span>
              ) : (
                <span className="badge sun">{t("programme.detailsSoon")}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
