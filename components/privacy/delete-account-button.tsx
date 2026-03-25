"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function DeleteAccountButton() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      "Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile e cancellerà tutti i tuoi dati."
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/user/me", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Errore durante l'eliminazione. Riprova.");
        setDeleting(false);
        return;
      }
      // Sign out after deletion
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Errore di rete. Riprova.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="bg-es-red text-white font-heading font-semibold text-sm px-5 py-2.5 rounded-card hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {deleting ? "Eliminazione in corso..." : "Elimina il mio account"}
      </button>
      {error && (
        <p className="text-sm text-es-red font-body">{error}</p>
      )}
    </div>
  );
}
