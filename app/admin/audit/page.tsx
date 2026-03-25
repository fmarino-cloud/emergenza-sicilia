import { prisma } from "@/lib/prisma";
import Link from "next/link";

const PAGE_SIZE = 20;

interface Props {
  searchParams: { page?: string };
}

export default async function AdminAuditPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
      include: {
        admin: {
          select: { email: true },
        },
      },
    }),
    prisma.auditLog.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function metadataPreview(meta: unknown): string {
    if (!meta) return "—";
    try {
      const str = JSON.stringify(meta);
      return str.length > 80 ? str.slice(0, 80) + "…" : str;
    } catch {
      return "—";
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-gray-900 text-2xl">Audit Log</h1>
        <span className="font-body text-sm text-gray-500">{total} operazioni totali</span>
      </div>

      <div className="bg-white rounded-card border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Azione</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Entità</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Entity ID</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Admin</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Dati</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Nessuna operazione registrata
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-700 font-heading font-semibold px-2 py-0.5 rounded font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{log.entityType}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.entityId.slice(0, 10)}…</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{log.admin.email}</td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span
                      className="text-xs font-mono text-gray-400 truncate block"
                      title={typeof log.metadata === "object" ? JSON.stringify(log.metadata) : ""}
                    >
                      {metadataPreview(log.metadata)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("it-IT")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-xs font-body text-gray-500">
              Pagina {page} di {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/audit?page=${page - 1}`}
                  className="text-xs font-body text-blue-600 hover:underline px-3 py-1.5 border border-gray-200 rounded bg-white hover:bg-gray-50"
                >
                  ← Precedente
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/audit?page=${page + 1}`}
                  className="text-xs font-body text-blue-600 hover:underline px-3 py-1.5 border border-gray-200 rounded bg-white hover:bg-gray-50"
                >
                  Successiva →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
