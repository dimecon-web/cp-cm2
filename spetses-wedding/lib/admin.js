"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { adminLoad, adminAction, loadSession } from "./store";

// État partagé de l'espace organisateurs : une seule requête pour toutes les
// pages, rechargée après chaque modification.

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [session, setSession] = useState(null);   // { configured, user }
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const status = await loadSession();
    setSession(status);
    if (status.configured && status.user) {
      setData(await adminLoad());
    } else {
      setData(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Exécute une action puis recharge, pour que l'affichage reflète la base.
  const act = useCallback(
    async (payload) => {
      const result = await adminAction(payload);
      setData(await adminLoad());
      return result;
    },
    []
  );

  return (
    <AdminContext.Provider value={{ session, user: session?.user ?? null, data, loading, reload, act }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin doit être utilisé dans AdminProvider");
  return ctx;
}
