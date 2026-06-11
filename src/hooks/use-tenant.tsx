"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface TenantContextValue {
  tenant: Tenant | null;
  tenants: Tenant[];
  setTenant: (id: string) => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  tenants: [],
  setTenant: () => {},
  loading: true,
});

const STORAGE_KEY = "multiseo-tenant-id";

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load tenants from API
  useEffect(() => {
    fetch("/api/tenants")
      .then((res) => res.json())
      .then((json) => {
        const list: Tenant[] = json.data ?? [];
        setTenants(list);
        // Restore saved tenant or default to first
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && list.find((t) => t.id === saved)) {
          setActiveId(saved);
        } else if (list.length > 0) {
          setActiveId(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setTenant = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const tenant = tenants.find((t) => t.id === activeId) ?? null;

  return (
    <TenantContext.Provider value={{ tenant, tenants, setTenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
