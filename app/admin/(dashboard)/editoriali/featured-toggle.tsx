"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FeaturedToggle({ id, featured }: { id: string; featured: boolean }) {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(featured);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    await fetch(`/api/admin/editorial/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !current }),
    });
    setCurrent(!current);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-heading font-semibold px-2 py-0.5 rounded transition-colors ${
        current
          ? "bg-es-yellow text-es-text hover:bg-yellow-400"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {loading ? "..." : current ? "★ In evidenza" : "☆ Evidenza"}
    </button>
  );
}
