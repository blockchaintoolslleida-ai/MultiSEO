"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "./use-tenant";
import type { WebsiteOption } from "@/types/seo";

const STORAGE_KEY = "multiseo-selected-website";

interface UseWebsiteSelectorResult {
  websiteId: string;
  setWebsiteId: (id: string) => void;
  websitesList: WebsiteOption[];
  loading: boolean;
}

function getSavedWebsiteId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveWebsiteId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage full or unavailable — ignore
  }
}

/**
 * Shared hook for pages that need a website selector dropdown.
 *
 * Fetches the website list once when the tenant is available,
 * restores the last-selected website from localStorage,
 * and persists the selection across page navigation.
 */
export function useWebsiteSelector(): UseWebsiteSelectorResult {
  const { tenant } = useTenant();
  const [websiteId, setWebsiteIdState] = useState(() => getSavedWebsiteId() ?? "");
  const [websitesList, setWebsitesList] = useState<WebsiteOption[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    let cancelled = false;
    fetch("/api/websites")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data) {
          const realList: WebsiteOption[] = json.data.map((w: WebsiteOption) => ({
            id: w.id,
            domain: w.domain,
          }));
          // Prepend "all websites" option when there are 2+ real websites
          const allOption: WebsiteOption = { id: "all", domain: "🌐 Todos los websites" };
          const list = realList.length > 1 ? [allOption, ...realList] : realList;
          setWebsitesList(list);

          // Restore saved selection, or fall back to first in list
          const saved = getSavedWebsiteId();
          if (saved && list.some((w) => w.id === saved)) {
            setWebsiteIdState(saved);
          } else {
            setWebsiteIdState(list.length > 0 ? list[0].id : "");
          }
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[useWebsiteSelector] Failed to load websites:", err);
        }
      })
      .finally(() => {
        if (!cancelled) setFetched(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tenant]);

  const setWebsiteId = useCallback((id: string) => {
    setWebsiteIdState(id);
    saveWebsiteId(id);
  }, []);

  const loading = !fetched;
  return { websiteId, setWebsiteId, websitesList, loading };
}
