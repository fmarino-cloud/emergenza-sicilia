import { prisma } from "@/lib/prisma";
import { SyncWordPressButton } from "./sync-button";
import { FeaturedToggle } from "./featured-toggle";

export default async function AdminEditorialiPage() {
  const posts = await prisma.editorialPost.findMany({
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      wpId: true,
      title: true,
      slug: true,
      type: true,
      featured: true,
      publishedAt: true,
      syncedAt: true,
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-gray-900 text-2xl">Editoriali</h1>
        <SyncWordPressButton />
      </div>

      <div className="bg-white rounded-card border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Titolo</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Data</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">WP ID</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Sincronizzato</th>
                <th className="text-left px-4 py-3 text-xs font-heading text-gray-500 uppercase tracking-wide">Evidenza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Nessun editoriale trovato. Sincronizza da WordPress.
                  </td>
                </tr>
              )}
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-[250px] truncate text-gray-700 font-medium">{p.title}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.slug}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-100 text-blue-700 font-heading font-semibold px-2 py-0.5 rounded">
                      {p.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(p.publishedAt).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.wpId}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(p.syncedAt).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3">
                    <FeaturedToggle id={p.id} featured={p.featured} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
