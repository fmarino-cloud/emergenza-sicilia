"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error || !result?.ok) {
      setError("Credenziali non valide");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / heading */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 text-white font-heading font-bold text-lg"
            style={{ backgroundColor: "#003366" }}
          >
            ES
          </div>
          <h1 className="font-heading font-bold text-gray-900 text-2xl">
            Admin Panel
          </h1>
          <p className="font-body text-gray-500 text-sm mt-1">
            Emergenza Sicilia
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-card border border-gray-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-heading font-semibold text-gray-700 text-sm mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-gray-300 rounded-card px-3 py-2.5 font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@emergenzasicilia.it"
              />
            </div>

            <div>
              <label className="block font-heading font-semibold text-gray-700 text-sm mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-card px-3 py-2.5 font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-card px-3 py-2.5">
                <p className="text-sm text-red-600 font-body">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-heading font-semibold text-sm py-3 rounded-card transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#003366" }}
            >
              {loading ? "Accesso in corso..." : "Accedi"}
            </button>
          </form>
        </div>

        <p className="text-center font-body text-xs text-gray-400 mt-4">
          Accesso riservato agli amministratori
        </p>
      </div>
    </div>
  );
}
