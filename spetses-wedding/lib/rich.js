"use client";

// Rend les textes de lib/content.js : un balisage volontairement minuscule,
// pour que les contenus restent lisibles et modifiables sans connaître React.
//
//   **gras**                        → <strong>
//   [libellé](https://exemple.com)  → lien externe (nouvel onglet, flèche)
//   [+30 …](tel:+30…)               → lien téléphone, cliquable sur mobile

export function Rich({ text }) {
  if (!text) return null;
  const token = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  const out = [];
  let last = 0;
  let key = 0;
  let m;

  while ((m = token.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={key++}>{m[1]}</strong>);
    } else {
      const href = m[3];
      const external = /^https?:/i.test(href);
      out.push(
        <a key={key++} href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
          {m[2]}
          {external ? " ↗" : ""}
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));

  return <>{out}</>;
}
