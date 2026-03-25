"use client";

import { signOut } from "next-auth/react";

interface Props {
  compact?: boolean;
}

export function AdminLogoutButton({ compact = false }: Props) {
  if (compact) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="text-sm font-body text-gray-500 hover:text-gray-700 transition-colors"
      >
        Esci
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="w-full text-left text-xs font-body text-white/60 hover:text-white transition-colors"
    >
      Esci
    </button>
  );
}
