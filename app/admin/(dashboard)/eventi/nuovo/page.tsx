"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "TERREMOTO", "MALTEMPO", "INCENDIO", "TRAFFICO", "ALLERTA", "ERUZIONE", "TRASPORTI",
];
const SEVERITIES = ["BASSA", "MEDIA", "ALTA", "CRITICA"];
const PROVINCES = ["PA", "CT", "ME", "EN", "AG", "CL", "RG", "SR", "TP"];

export default function NuovoEventoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    severity: "",
    provincia: "",
    source: "",
    sourceUrl: "",
    lat: "",
    lng: "",
    tags: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      category: form.category,
      severity: form.severity,
      source: form.source,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };

    if (form.provincia) body.provincia = form.provincia;
    if (form.sourceUrl) body.sourceUrl = form.sourceUrl;
    if (form.lat) body.lat = parseFloat(form.lat);
    if (form.lng) body.lng = parseFloat(form.lng);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.message ?? JSON.stringify(data?.error) ?? "Errore durante la creazione.");
        setLoading(false);
        return;
      }

      router.push("/admin/eventi");
    } catch {
      setError("Errore di rete. Riprova.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 text-sm font-body"
        >
          ← Indietro
        </button>
        <h1 className="font-heading font-bold text-gray-900 text-2xl">Nuovo Evento</h1>
      </div>

      <div className="bg-white rounded-card border border-gray-200 shadow-sm p-6">
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

          {/* Category + Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                required
                className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
                Severità <span className="text-red-500">*</span>
              </label>
              <select
                value={form.severity}
                onChange={(e) => update("severity", e.target.value)}
                required
                className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona...</option>
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Province + Source */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
                Provincia
              </label>
              <select
                value={form.provincia}
                onChange={(e) => update("provincia", e.target.value)}
                className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nessuna</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
                Fonte <span className="text-red-500">*</span>
              </label>
              <input
                value={form.source}
                onChange={(e) => update("source", e.target.value)}
                required
                maxLength={100}
                className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="es. INGV, Protezione Civile..."
              />
            </div>
          </div>

          {/* Source URL */}
          <div>
            <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
              URL Fonte
            </label>
            <input
              type="url"
              value={form.sourceUrl}
              onChange={(e) => update("sourceUrl", e.target.value)}
              className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          {/* Lat + Lng */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
                Latitudine
              </label>
              <input
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => update("lat", e.target.value)}
                className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="37.5"
              />
            </div>
            <div>
              <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
                Longitudine
              </label>
              <input
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => update("lng", e.target.value)}
                className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="14.0"
              />
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
              placeholder="tag1, tag2, tag3"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-card px-3 py-2.5">
              <p className="text-sm text-red-600 font-body">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-sm px-5 py-2.5 rounded-card transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creazione..." : "Crea Evento"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="border border-gray-300 text-gray-600 font-body text-sm px-5 py-2.5 rounded-card hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
