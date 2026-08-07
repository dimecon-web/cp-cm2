"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getRole, setRole } from "@/lib/store";

// Espace organisateurs (FR uniquement en v1).
// En v2 : accès protégé par Supabase Auth (lien magique par email),
// rôles 'couple' / 'organisateur' stockés en base. Ici : bascule de démo.
export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [role, setRoleState] = useState("couple");

  useEffect(() => { setRoleState(getRole()); }, []);
  const switchRole = (r) => { setRole(r); setRoleState(r); };

  const links = [
    ["/admin", "Tableau de bord"],
    ["/admin/invites", "Invités & envois"],
    ["/admin/news", "Actualités"],
    ["/admin/budget", "Budget"],
    ["/admin/todos", "To-dos"],
    ["/admin/fournisseurs", "Fournisseurs"],
  ];

  return (
    <>
      <header className="admin-header">
        <div className="wrap">
          <strong style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: 18 }}>
            Espace organisateurs
          </strong>
          <nav className="admin-nav" aria-label="Navigation organisateurs">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className={pathname === href ? "active" : ""}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="role-switch">
            <span>Rôle :</span>
            <button className={role === "couple" ? "active" : ""} onClick={() => switchRole("couple")}>
              Mariés
            </button>
            <button className={role === "organisateur" ? "active" : ""} onClick={() => switchRole("organisateur")}>
              Organisateur
            </button>
          </div>
        </div>
      </header>
      <main className="page">
        <div className="wrap">
          <div className="notice">
            🔧 <strong>Mode démo</strong> — données d'exemple stockées dans ce navigateur.
            En production, cet espace sera protégé par une connexion (lien magique par email)
            et les données vivront dans Supabase.
          </div>
          {children}
        </div>
      </main>
    </>
  );
}
