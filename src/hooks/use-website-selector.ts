"use client";

import { useState, useEffect } from "react";
import { useTenant } from "./use-tenant";
import type { WebsiteOption } from "@/types/seo";

interface UseWebsiteSelectorResult {
  websiteId: string;
  setWebsiteId: (id: string) => void;
  websitesList: WebsiteOption[];
  loading: boolean;
}

/**
 * Shared hook for pages that need a website selector dropdown.
 *
 * Fetches the website list once when the tenant is available,
 * auto-selects the first website, and exposes the selected ID + full list.
 *
 * Eliminates ~20 lines of duplicated boilerplate per page.
 */
export function useWebsiteSelector(): UseWebsiteSelectorResult {
  const { tenant } = useTenant();
  const [websiteId, setWebsiteId] = useState("1");
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
          if (list.length > 0) setWebsiteId(list[0].id);
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

  const loading = !fetched;
  return { websiteId, setWebsiteId, websitesList, loading };
}
