"use client";

import { useState, useRef } from "react";

const PROVINCES = ["PA", "CT", "ME", "EN", "AG", "CL", "RG", "SR", "TP"];
const CATEGORIES = [
  { value: "TERREMOTO", label: "Terremoto" },
  { value: "MALTEMPO", label: "Maltempo" },
  { value: "INCENDIO", label: "Incendio" },
  { value: "TRAFFICO", label: "Traffico" },
  { value: "ALLERTA", label: "Allerta" },
  { value: "ERUZIONE", label: "Eruzione" },
  { value: "ALTRO", label: "Altro" },
];

const MAX_TEXT = 500;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ReportForm() {
  const [text, setText] = useState("");
  const [province, setProvince] = useState("");
  const [category, setCategory] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_FILE_SIZE) {
      setFileError("Il file supera il limite di 10MB.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(f);
  }

  function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGeoStatus("ok");
      },
      () => setGeoStatus("error")
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setRateLimited(false);

    let mediaUrl: string | null = null;

    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          mediaUrl = uploadData.url ?? null;
        }
      } catch {
        // Non-blocking: proceed without media
      }
    }

    const body: Record<string, unknown> = { text };
    if (lat !== null) body.lat = lat;
    if (lng !== null) body.lng = lng;
    if (mediaUrl) body.mediaUrl = mediaUrl;

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        setRateLimited(true);
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data?.error?.message ?? "Errore durante l'invio. Riprova.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setSubmitError("Errore di rete. Controlla la connessione e riprova.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-es-green/10 border border-es-green rounded-card p-6 text-center">
        <div className="text-es-green text-4xl mb-3">✓</div>
        <h3 className="font-heading font-semibold text-es-text text-lg mb-2">
          Grazie per la tua segnalazione!
        </h3>
        <p className="text-es-text-secondary font-body">
          La tua segnalazione è in verifica — grazie per contribuire!
        </p>
        <button
          className="mt-4 text-es-blue font-body text-sm underline"
          onClick={() => {
            setSuccess(false);
            setText("");
            setProvince("");
            setCategory("");
            setLat(null);
            setLng(null);
            setGeoStatus("idle");
            setFile(null);
          }}
        >
          Invia un&apos;altra segnalazione
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Text */}
      <div>
        <label className="block font-heading font-semibold text-es-text text-sm mb-1">
          Descrivi l&apos;emergenza <span className="text-es-red">*</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_TEXT}
          rows={4}
          required
          className="w-full border border-es-border rounded-card px-3 py-2 font-body text-sm text-es-text placeholder:text-es-text-secondary focus:outline-none focus:ring-2 focus:ring-es-blue resize-none"
          placeholder="Descrivi brevemente cosa sta succedendo..."
        />
        <div className="text-xs text-es-text-secondary font-body text-right mt-1">
          {text.length}/{MAX_TEXT}
        </div>
      </div>

      {/* Province */}
      <div>
        <label className="block font-heading font-semibold text-es-text text-sm mb-1">
          Provincia
        </label>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="w-full border border-es-border rounded-card px-3 py-2 font-body text-sm text-es-text bg-white focus:outline-none focus:ring-2 focus:ring-es-blue"
        >
          <option value="">Seleziona provincia</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block font-heading font-semibold text-es-text text-sm mb-1">
          Categoria
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-es-border rounded-card px-3 py-2 font-body text-sm text-es-text bg-white focus:outline-none focus:ring-2 focus:ring-es-blue"
        >
          <option value="">Seleziona categoria</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Geolocation */}
      <div>
        <label className="block font-heading font-semibold text-es-text text-sm mb-1">
          Posizione (opzionale)
        </label>
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={geoStatus === "loading"}
          className="inline-flex items-center gap-2 border border-es-border rounded-card px-4 py-2 text-sm font-body text-es-text hover:bg-es-bg transition-colors disabled:opacity-60"
        >
          {geoStatus === "loading" ? (
            <span className="animate-pulse">Rilevamento in corso...</span>
          ) : (
            <>
              <svg className="w-4 h-4 text-es-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Usa la mia posizione
            </>
          )}
        </button>
        {geoStatus === "ok" && lat !== null && lng !== null && (
          <p className="text-xs text-es-green font-body mt-1">
            Posizione rilevata: {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        )}
        {geoStatus === "error" && (
          <p className="text-xs text-es-red font-body mt-1">
            Impossibile rilevare la posizione. Verifica i permessi del browser.
          </p>
        )}
      </div>

      {/* Media upload */}
      <div>
        <label className="block font-heading font-semibold text-es-text text-sm mb-1">
          Foto/Video (opzionale, max 10MB)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="block w-full text-sm font-body text-es-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-chip file:border-0 file:text-sm file:font-body file:bg-es-blue/10 file:text-es-blue hover:file:bg-es-blue/20 file:cursor-pointer"
        />
        {fileError && (
          <p className="text-xs text-es-red font-body mt-1">{fileError}</p>
        )}
        {file && !fileError && (
          <p className="text-xs text-es-text-secondary font-body mt-1">
            File selezionato: {file.name}
          </p>
        )}
      </div>

      {/* Errors */}
      {rateLimited && (
        <div className="bg-es-red/10 border border-es-red/30 rounded-card px-4 py-3">
          <p className="text-sm text-es-red font-body">
            Hai raggiunto il limite di segnalazioni. Riprova tra un&apos;ora.
          </p>
        </div>
      )}
      {submitError && (
        <div className="bg-es-red/10 border border-es-red/30 rounded-card px-4 py-3">
          <p className="text-sm text-es-red font-body">{submitError}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || text.length < 10}
        className="w-full bg-[var(--es-blue,#0056A0)] hover:bg-es-blue-hover text-white font-heading font-semibold text-sm py-3 rounded-card transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#0056A0" }}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Invio in corso...
          </span>
        ) : (
          "Invia segnalazione"
        )}
      </button>
    </form>
  );
}
