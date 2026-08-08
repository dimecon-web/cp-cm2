"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useT, usePick, useLang } from "@/lib/i18n";
import { loadGuest, submitPhoto, shrinkImage } from "@/lib/store";

export default function NewsPage() {
  const { token } = useParams();
  const t = useT();
  const pick = usePick();
  const { lang } = useLang();
  const locale = lang === "en" ? "en-GB" : lang === "el" ? "el-GR" : "fr-FR";

  const [posts, setPosts] = useState([]);
  const [wall, setWall] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [caption, setCaption] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () =>
    loadGuest(token)
      .then(({ news, photos }) => { setPosts(news); setWall(photos); })
      .catch(() => {});

  useEffect(() => { refresh(); }, [token]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(await shrinkImage(file));
    setSent(false);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!photo) return;
    setBusy(true);
    try {
      await submitPhoto(token, { dataUrl: photo, caption });
      setPhoto(null);
      setCaption("");
      setSent(true);
      e.target.reset();
      refresh();
    } catch {
      setError(t("errors.photo"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="narrow" style={{ margin: "0 auto" }}>
      <h1>{t("news.title")}</h1>
      <p style={{ color: "var(--muted)" }}>{t("news.intro")}</p>

      {posts.map((post) => (
        <article className="card" key={post.id}>
          <span className="badge bougain">
            {new Date(post.date + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
          </span>
          <h3 style={{ marginTop: 10 }}>{pick(post.title)}</h3>
          {post.photo && (
            <img src={post.photo} alt="" style={{ width: "100%", borderRadius: 12, margin: "0 0 12px" }} />
          )}
          <p style={{ marginBottom: 0 }}>{pick(post.body)}</p>
        </article>
      ))}

      <h2 style={{ marginTop: 36 }}>📸 {t("news.wallTitle")}</h2>
      <p style={{ color: "var(--muted)" }}>{t("news.wallIntro")}</p>

      {wall.length === 0 ? (
        <p className="hint">{t("news.wallEmpty")}</p>
      ) : (
        <div className="gallery" style={{ marginBottom: 20 }}>
          {wall.map((p) => (
            <figure key={p.id} style={{ margin: 0 }}>
              <img src={p.dataUrl} alt={p.caption || ""} style={{ width: "100%", borderRadius: 12, display: "block" }} />
              {p.caption && <figcaption style={{ fontSize: 13, color: "var(--muted)" }}>{p.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}

      {sent && <div className="notice ok" role="status">{t("news.submitted")}</div>}
      {error && <div className="notice" role="alert">{error}</div>}

      <form className="card" onSubmit={submit}>
        <label className="field">
          <span className="lbl">{t("news.addPhoto")}</span>
          <input type="file" accept="image/*" onChange={onFile} required />
        </label>
        {photo && <img src={photo} alt="" style={{ maxWidth: 220, borderRadius: 12, marginBottom: 14 }} />}
        <label className="field">
          <span className="lbl">{t("news.caption")}</span>
          <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "…" : t("news.submit")}
        </button>
      </form>
    </div>
  );
}
