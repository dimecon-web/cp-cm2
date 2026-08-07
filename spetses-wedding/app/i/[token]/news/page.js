"use client";

import { useT, usePick, useLang } from "@/lib/i18n";
import { SEED_NEWS } from "@/lib/store";

export default function NewsPage() {
  const t = useT();
  const pick = usePick();
  const { lang } = useLang();
  const locale = lang === "en" ? "en-GB" : lang === "el" ? "el-GR" : "fr-FR";

  const posts = [...SEED_NEWS].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="narrow" style={{ margin: "0 auto" }}>
      <h1>{t("news.title")}</h1>
      <p style={{ color: "var(--muted)" }}>{t("news.intro")}</p>

      <div className="notice info">{t("news.wallSoon")}</div>

      {posts.map((post) => (
        <article className="card" key={post.id}>
          <span className="badge bougain">
            {new Date(post.date + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
          </span>
          <h3 style={{ marginTop: 10 }}>{pick(post.title)}</h3>
          <p style={{ marginBottom: 0 }}>{pick(post.body)}</p>
        </article>
      ))}
    </div>
  );
}
