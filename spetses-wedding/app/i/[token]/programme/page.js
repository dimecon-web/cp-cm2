"use client";

import { config } from "@/lib/config";
import { useT, usePick, useLang } from "@/lib/i18n";
import { Rich } from "@/lib/rich";
import { VENUE, CEREMONY } from "@/lib/content";

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
        const alt = ev.dateAlt ? new Date(ev.dateAlt + "T12:00:00") : null;
        return (
          <div className="card event-card" key={ev.id}>
            <div className="event-date">
              <div className="day">
                {d.getDate()}{alt ? <span className="alt">/{alt.getDate()}</span> : null}
              </div>
              <div className="month">{d.toLocaleDateString(locale, { month: "short" })}</div>
            </div>
            <div>
              <h3 style={{ marginBottom: 4 }}>{pick(ev.name)}</h3>
              <p style={{ marginBottom: ev.details ? 10 : 8 }}>{pick(ev.desc)}</p>
              {ev.details && (
                <ul className="event-details">
                  {ev.details.map((line, i) => (
                    <li key={i}>{pick(line)}</li>
                  ))}
                </ul>
              )}
              {ev.status && <span className={`badge ${ev.tone || "sun"}`}>{pick(ev.status)}</span>}
            </div>
          </div>
        );
      })}

      <h2 style={{ marginTop: 34 }}>{pick(VENUE.title)}</h2>
      <div className="card">
        {VENUE.paragraphs.map((p, i) => (
          <p key={i} style={{ marginBottom: i === VENUE.paragraphs.length - 1 ? 0 : 12 }}>
            <Rich text={pick(p)} />
          </p>
        ))}
      </div>

      <h2 style={{ marginTop: 34 }}>{pick(CEREMONY.title)}</h2>
      <div className="card">
        {CEREMONY.paragraphs.map((p, i) => (
          <p key={i} style={{ marginBottom: i === CEREMONY.paragraphs.length - 1 ? 0 : 12 }}>
            <Rich text={pick(p)} />
          </p>
        ))}
      </div>
    </div>
  );
}
