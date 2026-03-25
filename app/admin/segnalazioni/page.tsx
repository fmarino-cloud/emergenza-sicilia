import { prisma } from "@/lib/prisma";
import { ModerationTable } from "./moderation-table";

type FilterTab = "NUOVO" | "APPROVATO" | "RIFIUTATO";

interface Props {
  searchParams: { tab?: string };
}

export default async function AdminSegnalazioniPage({ searchParams }: Props) {
  const tab = (searchParams?.tab ?? "NUOVO") as FilterTab;
  const validTabs: FilterTab[] = ["NUOVO", "APPROVATO", "RIFIUTATO"];
  const activeTab = validTabs.includes(tab) ? tab : "NUOVO";

  const reports = await prisma.report.findMany({
    where: { status: activeTab },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      text: true,
      reliabilityScore: true,
      status: true,
      moderationNote: true,
      lat: true,
      lng: true,
      createdAt: true,
    },
  });

  const counts = await prisma.report.groupBy({
    by: ["status"],
    _count: true,
  });

  const countMap: Record<string, number> = {};
  for (const c of counts) {
    countMap[c.status] = c._count;
  }

  return (
    <div className="space-y-5">
      <h1 className="font-heading font-bold text-gray-900 text-2xl">Segnalazioni</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["NUOVO", "APPROVATO", "RIFIUTATO"] as FilterTab[]).map((t) => (
          <a
            key={t}
            href={`/admin/segnalazioni?tab=${t}`}
            className={`px-4 py-2 rounded-md text-sm font-heading font-semibold transition-colors ${
              activeTab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "NUOVO" ? "In attesa" : t === "APPROVATO" ? "Approvate" : "Rifiutate"}
            <span className="ml-1.5 text-xs font-body opacity-70">
              ({countMap[t] ?? 0})
            </span>
          </a>
        ))}
      </div>

      {/* Table */}
      <ModerationTable reports={reports} activeTab={activeTab} />
    </div>
  );
}
