"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { useTenant } from "@/hooks/use-tenant";
import { apiFetch } from "@/lib/api-client";
import type { WebsiteData, WebsiteStats, AccessType } from "@/types/seo";
import { QuickStats } from "@/components/websites/quick-stats";
import { WebsiteGrid } from "@/components/websites/website-grid";
import { EditWebsiteModal } from "@/components/websites/edit-website-modal";
import { AddWebsiteModal } from "@/components/websites/add-website-modal";

export default function WebsitesPage() {
  const { tenant } = useTenant();
  const {
    data: websites,
    loading: wLoading,
    refetch,
  } = useApi<WebsiteData[]>(tenant ? "/api/websites" : "");
  const { data: stats, loading: sLoading } = useApi<WebsiteStats>(
    tenant ? "/api/websites/stats" : ""
  );
  const loading = wLoading || sLoading || !tenant;

  // Modal state
  const [editingWebsite, setEditingWebsite] = useState<WebsiteData | null>(null);
  const [addingWebsite, setAddingWebsite] = useState(false);

  // --- Handlers ---

  const handleEdit = (website: WebsiteData) => {
    setEditingWebsite(website);
  };

  const handleSaveEdit = async (data: {
    domain: string;
    accessTypes: AccessType[];
    gscSiteUrl?: string | null;
  }) => {
    if (!editingWebsite) return;
    await apiFetch(`/api/websites/${editingWebsite.id}`, {
      method: "PATCH",
      body: { domain: data.domain, accessTypes: data.accessTypes, gscSiteUrl: data.gscSiteUrl },
    });
    setEditingWebsite(null);
    refetch();
  };

  const handleTest = async (website: WebsiteData): Promise<string> => {
    const result = await apiFetch<{ data: { success: boolean; message: string } }>(
      `/api/websites/${website.id}/test`,
      { method: "POST" }
    );
    refetch();
    return result.data?.message ?? "Test completado";
  };

  const handleDelete = async (website: WebsiteData) => {
    await apiFetch(`/api/websites/${website.id}`, { method: "DELETE" });
    refetch();
  };

  const handleRefresh = async (website: WebsiteData): Promise<string> => {
    // Re-test the website to try to recover from error state
    const result = await apiFetch<{ data: { success: boolean; message: string } }>(
      `/api/websites/${website.id}/test`,
      { method: "POST" }
    );
    refetch();
    return result.data?.message ?? "Reintento completado";
  };

  const handleUpdateAccess = (website: WebsiteData) => {
    // Open edit modal for no-access websites to update credentials
    setEditingWebsite(website);
  };

  const handleAddWebsite = async (data: { domain: string; accessTypes: AccessType[] }) => {
    await apiFetch("/api/websites", {
      method: "POST",
      body: { domain: data.domain, accessTypes: data.accessTypes },
    });
    setAddingWebsite(false);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando websites...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {tenant?.name}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-gray-700 font-medium">Websites</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Gestión de Websites
        </h1>
        <button
          onClick={() => setAddingWebsite(true)}
          className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-brand-700 transition-colors"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Añadir Website
        </button>
      </div>

      <QuickStats stats={stats ?? { total: 0, connected: 0, noAccess: 0, error: 0 }} />
      <WebsiteGrid
        websites={websites ?? []}
        onEdit={handleEdit}
        onTest={handleTest}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
        onUpdateAccess={handleUpdateAccess}
        onAdd={() => setAddingWebsite(true)}
      />

      {/* Edit Modal */}
      {editingWebsite && (
        <EditWebsiteModal
          website={editingWebsite}
          onSave={handleSaveEdit}
          onClose={() => setEditingWebsite(null)}
        />
      )}

      {/* Add Modal */}
      {addingWebsite && (
        <AddWebsiteModal onSave={handleAddWebsite} onClose={() => setAddingWebsite(false)} />
      )}
    </div>
  );
}
