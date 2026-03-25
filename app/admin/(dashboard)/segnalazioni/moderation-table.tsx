"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Report {
  id: string;
  text: string;
  reliabilityScore: number;
  lat: number | null;
  lng: number | null;
  status: string;
  moderationNote: string | null;
  createdAt: Date;
}

interface Props {
  reports: Report[];
  activeTab: string;
}

export function ModerationTable({ reports, activeTab }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionStates, setActionStates] = useState<Record<string, "loading" | "done" | "error">>({});
  const [localReports, setLocalReports] = useState(reports);

  async function moderate(id: string, status: "APPROVATO" | "RIFIUTATO") {
    setActionStates((prev) => ({ ...prev, [id]: "loading" }));

    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        setActionStates((prev) => ({ ...prev, [id]: "error" }));
        return;
      }

      setActionStates((prev) => ({ ...prev, [id]: "done" }));
      // Remove from local list if we changed the status
      setLocalReports((prev) => prev.filter((r) => r.id !== id));

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setActionStates((prev) => ({ ...prev, [id]: "error" }));
    }
  }

  return (
    <div className="bg-white rounded-card border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">ID</th>
              <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Testo</th>
              <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Affid. %</th>
              <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Posizione</th>
              <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Data</th>
              {activeTab === "NUOVO" && (
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Azioni</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {localReports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nessuna segnalazione trovata
                </td>
              </tr>
            )}
            {localReports.map((r) => {
              const state = actionStates[r.id];
              return (
                <tr key={r.id} className={`hover:bg-gray-50 ${state === "done" ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 max-w-[280px] text-gray-700">
                    <p className="truncate" title={r.text}>{r.text}</p>
                    {r.moderationNote && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        Nota: {r.moderationNote}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-heading font-semibold px-2 py-0.5 rounded ${
                      r.reliabilityScore >= 70
                        ? "bg-green-100 text-green-700"
                        : r.reliabilityScore >= 40
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {r.reliabilityScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {r.lat && r.lng ? `${r.lat.toFixed(3)}, ${r.lng.toFixed(3)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(r.createdAt).toLocaleDateString("it-IT")}
                  </td>
                  {activeTab === "NUOVO" && (
                    <td className="px-4 py-3">
                      {state === "loading" && (
                        <span className="text-xs text-gray-400 font-body">...</span>
                      )}
                      {state === "error" && (
                        <span className="text-xs text-red-500 font-body">Errore</span>
                      )}
                      {(!state || state === "done") && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => moderate(r.id, "APPROVATO")}
                            disabled={state === "done" || isPending}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white font-heading font-semibold px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                          >
                            Approva
                          </button>
                          <button
                            onClick={() => moderate(r.id, "RIFIUTATO")}
                            disabled={state === "done" || isPending}
                            className="text-xs bg-red-500 hover:bg-red-600 text-white font-heading font-semibold px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                          >
                            Rifiuta
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
