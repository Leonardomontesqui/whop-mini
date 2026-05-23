"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type Company, type Me } from "./api";

type Ctx = {
  me: Me | null;
  users: Me[];
  myCompanies: Company[];
  refresh: () => Promise<void>;
  switchTo: (userId: string) => Promise<void>;
};

const MeCtx = createContext<Ctx | null>(null);

export function MeProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [users, setUsers] = useState<Me[]>([]);
  const [myCompanies, setMyCompanies] = useState<Company[]>([]);

  const refresh = useCallback(async () => {
    const [m, us] = await Promise.all([api.me(), api.users()]);
    setMe(m);
    setUsers(us);
    const companies = await api.listCompanies({ ownerId: m.id });
    setMyCompanies(companies);
  }, []);

  const switchTo = useCallback(
    async (userId: string) => {
      await api.switchUser(userId);
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    refresh().catch((e) => console.error("failed to load /api/me", e));
  }, [refresh]);

  return (
    <MeCtx.Provider value={{ me, users, myCompanies, refresh, switchTo }}>
      {children}
    </MeCtx.Provider>
  );
}

export function useMe() {
  const v = useContext(MeCtx);
  if (!v) throw new Error("useMe must be used within MeProvider");
  return v;
}
