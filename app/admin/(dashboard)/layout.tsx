import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminLogoutButton } from "./logout-button";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/eventi", label: "Eventi", icon: "📍" },
  { href: "/admin/segnalazioni", label: "Segnalazioni", icon: "📋" },
  { href: "/admin/editoriali", label: "Editoriali", icon: "📰" },
  { href: "/admin/push", label: "Push", icon: "🔔" },
  { href: "/admin/audit", label: "Audit Log", icon: "🔍" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const userEmail = session.user?.email ?? "admin";

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col" style={{ backgroundColor: "#003366" }}>
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10">
          <Link href="/admin" className="font-heading font-bold text-white text-base">
            Emergenza Sicilia
          </Link>
          <p className="font-body text-white/50 text-xs mt-0.5">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="font-body text-white/50 text-xs truncate mb-2">{userEmail}</p>
          <AdminLogoutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <span className="font-body text-sm text-gray-600">{userEmail}</span>
            <AdminLogoutButton compact />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
