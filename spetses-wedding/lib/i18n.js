"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dict } from "./dict";

const LangContext = createContext({ lang: "fr", setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("fr");

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("sw:lang");
    if (saved && ["fr", "en", "el"].includes(saved)) setLangState(saved);
  }, []);

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem("sw:lang", l);
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

// Résout une chaîne du dictionnaire partagé : t("rsvp.title")
export function useT() {
  const { lang } = useLang();
  return (key) => {
    const get = (l) => key.split(".").reduce((o, k) => (o ? o[k] : undefined), dict[l]);
    return get(lang) ?? get("fr") ?? key;
  };
}

// Résout un objet de contenu local { fr, en, el }
export function usePick() {
  const { lang } = useLang();
  return (obj) => (obj && typeof obj === "object" ? obj[lang] ?? obj.fr : obj);
}

export function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switcher" role="group" aria-label="Langue">
      {[["fr", "FR"], ["en", "EN"], ["el", "ΕΛ"]].map(([code, label]) => (
        <button
          key={code}
          className={`lang-btn ${lang === code ? "active" : ""}`}
          onClick={() => setLang(code)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
