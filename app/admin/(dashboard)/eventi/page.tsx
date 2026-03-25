import { prisma } from "@/lib/prisma";
import Link from "next/link";

const SEVERITY_COLOR: Record<string, string> = {
  BASSA: "bg-green-100 text-green-700",
  MEDIA: "bg-yellow-100 text-yellow-700",
  ALTA: "bg-red-100 text-red-700",
  CRITICA: "bg-red-200 text-red-800",
};

interface Props {
  searchParams: { q?: string };
}

export default async function AdminEventiPage({ searchParams }: Props) {
  const q = searchParams?.q ?? "";

  const events = await prisma.event.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { provincia: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { publishedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      category: true,
      severity: true,
      provincia: true,
      status: true,
      publishedAt: true,
    },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-gray-900 text-2xl">Eventi</h1>
        <Link
          href="/admin/eventi/nuovo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-sm px-4 py-2 rounded-card transition-colors"
        >
          + Nuovo Evento
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          type="text"
          placeholder="Cerca per titolo o provincia..."
          className="border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
        />
        <button
          type="submit"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-body text-sm px-4 py-2 rounded-card transition-colors"
        >
          Cerca
        </button>
        {q && (
          <Link
            href="/admin/eventi"
            className="text-sm font-body text-gray-400 hover:text-gray-600 self-center"
          >
            Cancella
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-card border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Titolo</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Severità</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Provincia</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Data</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Nessun evento trovato
                  </td>
                </tr>
              )}
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{ev.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 max-w-[220px] truncate text-gray-700 font-medium">{ev.title}</td>
                  <td className="px-4 py-3 text-gray-500">{ev.category}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-heading font-semibold ${SEVERITY_COLOR[ev.severity] ?? ""}`}>
                      {ev.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{ev.provincia ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{ev.status}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(ev.publishedAt).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/eventi/${ev.id}`}
                      className="text-blue-600 hover:underline text-xs font-body"
                    >
                      Modifica
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {q && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 font-body">
            {events.length} risultati per &ldquo;{q}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
