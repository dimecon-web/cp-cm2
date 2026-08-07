"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { adminLoad, adminAction, getMode } from "./store";

// État partagé de l'espace organisateurs : une seule requête pour toutes les
// pages, rechargée après chaque modification.

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [data, setData] = useState(null);
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [status, payload] = await Promise.all([getMode(), adminLoad()]);
    setMode(status);
    setData(payload);
    setLoading(false);
    return payload;
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Exécute une action puis recharge, pour que l'affichage reflète la base.
  const act = useCallback(
    async (payload) => {
      const result = await adminAction(payload);
      await reload();
      return result;
    },
    [reload]
  );

  return (
    <AdminContext.Provider value={{ data, mode, loading, reload, act }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin doit être utilisé dans AdminProvider");
  return ctx;
}
