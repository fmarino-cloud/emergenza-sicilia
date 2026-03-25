"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SEVERITIES = ["BASSA", "MEDIA", "ALTA", "CRITICA"];

interface EventData {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  provincia: string | null;
  source: string;
  sourceUrl: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  tags: string[];
  publishedAt: Date;
}

interface Props {
  event: EventData;
}

export function EditEventForm({ event }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: event.title,
    description: event.description,
    severity: event.severity,
    status: event.status,
    tags: event.tags.join(", "),
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const body: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      severity: form.severity,
      status: form.status,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.message ?? "Errore durante l'aggiornamento.");
        setLoading(false);
        return;
      }

      setSuccess("Evento aggiornato con successo.");
      router.refresh();
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClose() {
    if (!window.confirm("Chiudere questo evento?")) return;
    setClosing(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CHIUSO" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.message ?? "Errore durante la chiusura.");
        setClosing(false);
        return;
      }

      router.push("/admin/eventi");
    } catch {
      setError("Errore di rete. Riprova.");
      setClosing(false);
    }
  }

  return (
    <div className="bg-white rounded-card border border-gray-200 shadow-sm p-6">
      {/* Read-only info */}
      <div className="grid grid-cols-2 gap-4 mb-5 p-4 bg-gray-50 rounded-card text-sm font-body">
        <div>
          <span className="text-gray-500">Categoria:</span>{" "}
          <strong className="text-gray-700">{event.category}</strong>
        </div>
        <div>
          <span className="text-gray-500">Provincia:</span>{" "}
          <strong className="text-gray-700">{event.provincia ?? "—"}</strong>
        </div>
        <div>
          <span className="text-gray-500">Fonte:</span>{" "}
          <strong className="text-gray-700">{event.source}</strong>
        </div>
        <div>
          <span className="text-gray-500">Pubblicato:</span>{" "}
          <strong className="text-gray-700">
            {new Date(event.publishedAt).toLocaleDateString("it-IT")}
          </strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
            Titolo <span className="text-red-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            minLength={3}
            maxLength={200}
            className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
            Descrizione <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Severity + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
              Severità
            </label>
            <select
              value={form.severity}
              onChange={(e) => update("severity", e.target.value)}
              className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
              Stato
            </label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ATTIVO">ATTIVO</option>
              <option value="MONITORAGGIO">MONITORAGGIO</option>
              <option value="CHIUSO">CHIUSO</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
            Tag (separati da virgola)
          </label>
          <input
            value={form.tags}
            onChange={(e) => update("tags", e.target.value)}
            className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-card px-3 py-2.5">
            <p className="text-sm text-red-600 font-body">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-card px-3 py-2.5">
            <p className="text-sm text-green-600 font-body">{success}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-sm px-5 py-2.5 rounded-card transition-colors disabled:opacity-60"
          >
            {loading ? "Salvataggio..." : "Salva modifiche"}
          </button>

          <button
            type="button"
            onClick={handleClose}
            disabled={closing || event.status === "CHIUSO"}
            className="border border-red-300 text-red-600 hover:bg-red-50 font-body text-sm px-5 py-2.5 rounded-card transition-colors disabled:opacity-40"
          >
            {closing ? "Chiusura..." : "Chiudi evento"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/eventi")}
            className="border border-gray-300 text-gray-600 font-body text-sm px-5 py-2.5 rounded-card hover:bg-gray-50 transition-colors ml-auto"
          >
            ← Lista eventi
          </button>
        </div>
      </form>
    </div>
  );
}
