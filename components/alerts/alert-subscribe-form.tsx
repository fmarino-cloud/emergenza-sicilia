"use client";

import { useState } from "react";

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
const SEVERITIES = [
  { value: "BASSA", label: "Bassa" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Critica" },
];

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function AlertSubscribeForm() {
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minSeverity, setMinSeverity] = useState("MEDIA");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function toggleProvince(p: string) {
    setSelectedProvinces((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function toggleCategory(c: string) {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function selectAllProvinces() {
    setSelectedProvinces(PROVINCES);
  }

  function selectAllCategories() {
    setSelectedCategories(CATEGORIES.map((c) => c.value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selectedProvinces.length === 0) {
      setError("Seleziona almeno una provincia.");
      return;
    }
    if (selectedCategories.length === 0) {
      setError("Seleziona almeno una categoria.");
      return;
    }

    setLoading(true);

    try {
      // 1. Request notification permission
      if (!("Notification" in window)) {
        setError("Il tuo browser non supporta le notifiche push.");
        setLoading(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Permesso notifiche negato. Attiva le notifiche nelle impostazioni del browser.");
        setLoading(false);
        return;
      }

      // 2. Register service worker + get push subscription
      let pushSubscription: PushSubscription | null = null;

      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js");
          await navigator.serviceWorker.ready;

          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (vapidKey) {
            pushSubscription = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });
          }
        } catch {
          // Push subscription optional — proceed without it
        }
      }

      // 3. POST to /api/alerts/subscribe
      const body: {
        categories: string[];
        provinces: string[];
        minSeverity: string;
        pushSubscription?: { endpoint: string; keys: { p256dh: string; auth: string } };
      } = {
        categories: selectedCategories,
        provinces: selectedProvinces,
        minSeverity,
      };

      if (pushSubscription) {
        const subJson = pushSubscription.toJSON();
        if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
          body.pushSubscription = {
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            },
          };
        }
      }

      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.message ?? "Errore durante la registrazione. Riprova.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Errore durante l'attivazione delle notifiche. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-es-green/10 border border-es-green rounded-card p-8 text-center">
        <div className="text-es-green text-5xl mb-4">🔔</div>
        <h3 className="font-heading font-semibold text-es-text text-xl mb-2">
          Notifiche attivate!
        </h3>
        <p className="font-body text-es-text-secondary">
          Riceverai avvisi per le emergenze che hai selezionato.
          Puoi modificare le preferenze in qualsiasi momento.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Provinces */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-heading font-semibold text-es-text text-sm">
            Province <span className="text-es-red">*</span>
          </label>
          <button
            type="button"
            onClick={selectAllProvinces}
            className="text-xs text-es-blue font-body underline"
          >
            Seleziona tutte
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {PROVINCES.map((p) => (
            <label
              key={p}
              className={`flex items-center justify-center gap-1.5 border rounded-card px-2 py-2 cursor-pointer text-sm font-body transition-colors ${
                selectedProvinces.includes(p)
                  ? "bg-es-blue text-white border-es-blue"
                  : "bg-white text-es-text border-es-border hover:border-es-blue"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedProvinces.includes(p)}
                onChange={() => toggleProvince(p)}
                className="sr-only"
              />
              {p}
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-heading font-semibold text-es-text text-sm">
            Categorie <span className="text-es-red">*</span>
          </label>
          <button
            type="button"
            onClick={selectAllCategories}
            className="text-xs text-es-blue font-body underline"
          >
            Seleziona tutte
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <label
              key={c.value}
              className={`flex items-center gap-2 border rounded-card px-3 py-2 cursor-pointer text-sm font-body transition-colors ${
                selectedCategories.includes(c.value)
                  ? "bg-es-blue text-white border-es-blue"
                  : "bg-white text-es-text border-es-border hover:border-es-blue"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(c.value)}
                onChange={() => toggleCategory(c.value)}
                className="sr-only"
              />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      {/* Severity threshold */}
      <div>
        <label className="block font-heading font-semibold text-es-text text-sm mb-2">
          Gravità minima
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SEVERITIES.map((s) => (
            <label
              key={s.value}
              className={`flex items-center justify-center border rounded-card px-3 py-2 cursor-pointer text-sm font-body transition-colors ${
                minSeverity === s.value
                  ? "bg-es-blue text-white border-es-blue"
                  : "bg-white text-es-text border-es-border hover:border-es-blue"
              }`}
            >
              <input
                type="radio"
                name="minSeverity"
                value={s.value}
                checked={minSeverity === s.value}
                onChange={() => setMinSeverity(s.value)}
                className="sr-only"
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-es-red/10 border border-es-red/30 rounded-card px-4 py-3">
          <p className="text-sm text-es-red font-body">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full font-heading font-semibold text-white py-3 rounded-card transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#0056A0" }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Attivazione in corso...
          </span>
        ) : (
          "🔔 Attiva notifiche"
        )}
      </button>
    </form>
  );
}
