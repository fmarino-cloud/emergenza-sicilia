import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getStats() {
  const [totalEvents, openEvents, pendingReports, totalReports, recentEvents, recentPending] =
    await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: { not: "CHIUSO" } } }),
      prisma.report.count({ where: { status: "NUOVO" } }),
      prisma.report.count(),
      prisma.event.findMany({
        orderBy: { publishedAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          category: true,
          severity: true,
          provincia: true,
          status: true,
          publishedAt: true,
        },
      }),
      prisma.report.findMany({
        where: { status: "NUOVO" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          text: true,
          reliabilityScore: true,
          lat: true,
          lng: true,
          createdAt: true,
        },
      }),
    ]);

  return { totalEvents, openEvents, pendingReports, totalReports, recentEvents, recentPending };
}

const SEVERITY_COLOR: Record<string, string> = {
  BASSA: "bg-green-100 text-green-700",
  MEDIA: "bg-yellow-100 text-yellow-700",
  ALTA: "bg-red-100 text-red-700",
  CRITICA: "bg-red-200 text-red-800",
};

export default async function AdminDashboard() {
  const { totalEvents, openEvents, pendingReports, totalReports, recentEvents, recentPending } =
    await getStats();

  const kpis = [
    { label: "Eventi totali", value: totalEvents, href: "/admin/eventi", color: "bg-blue-50 text-blue-700" },
    { label: "Eventi attivi", value: openEvents, href: "/admin/eventi", color: "bg-green-50 text-green-700" },
    { label: "Segnalazioni in attesa", value: pendingReports, href: "/admin/segnalazioni", color: "bg-yellow-50 text-yellow-700" },
    { label: "Segnalazioni totali", value: totalReports, href: "/admin/segnalazioni", color: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-gray-900 text-2xl">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="bg-white rounded-card border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="font-body text-sm text-gray-500 mb-1">{kpi.label}</p>
            <p className={`font-heading font-bold text-3xl ${kpi.color.split(" ")[1]}`}>
              {kpi.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent events */}
        <div className="bg-white rounded-card border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading font-semibold text-gray-900 text-base">
              Ultimi 10 eventi
            </h2>
            <Link href="/admin/eventi" className="text-sm text-blue-600 font-body hover:underline">
              Vedi tutti →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-heading text-gray-500 uppercase tracking-wide">Titolo</th>
                  <th className="text-left px-4 py-2.5 text-xs font-heading text-gray-500 uppercase tracking-wide">Sev.</th>
                  <th className="text-left px-4 py-2.5 text-xs font-heading text-gray-500 uppercase tracking-wide">Prov.</th>
                  <th className="text-left px-4 py-2.5 text-xs font-heading text-gray-500 uppercase tracking-wide">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 max-w-[180px] truncate text-gray-700">
                      <Link href={`/admin/eventi/${ev.id}`} className="hover:text-blue-600">
                        {ev.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-heading font-semibold ${SEVERITY_COLOR[ev.severity] ?? ""}`}>
                        {ev.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{ev.provincia ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{ev.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending reports */}
        <div className="bg-white rounded-card border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading font-semibold text-gray-900 text-base">
              Segnalazioni in attesa
            </h2>
            <Link href="/admin/segnalazioni" className="text-sm text-blue-600 font-body hover:underline">
              Modera →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-heading text-gray-500 uppercase tracking-wide">Testo</th>
                  <th className="text-left px-4 py-2.5 text-xs font-heading text-gray-500 uppercase tracking-wide">Affid.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPending.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-4 text-center text-gray-400 text-sm">
                      Nessuna segnalazione in attesa
                    </td>
                  </tr>
                )}
                {recentPending.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 max-w-[200px] truncate text-gray-700">
                      {r.text}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{r.reliabilityScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
