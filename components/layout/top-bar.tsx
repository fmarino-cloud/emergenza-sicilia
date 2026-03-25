"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/mappa", label: "Mappa" },
  { href: "/fonti", label: "Fonti" },
  { href: "/editoriale", label: "Editoriale" },
  { href: "/segnalazioni", label: "Segnala" },
  { href: "/alert", label: "Alert" },
];

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const stripped = pathname.replace(/^\/(it|en)/, "") || "/";

  return (
    <header className="sticky top-0 z-50 bg-white border-b-[3px] border-es-blue shadow-sm" role="banner">
      <div className="mx-auto max-w-content flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0" aria-label="Emergenza Sicilia - Home">
          <Image
            src="/logo_emergenza_sicilia.png"
            alt="Emergenza Sicilia"
            width={180}
            height={46}
            className="h-11 w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navigazione principale">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? stripped === "/"
                : stripped === link.href || stripped.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-body font-medium pb-1 border-b-2 transition-colors duration-150",
                  isActive
                    ? "text-es-blue font-semibold border-es-blue"
                    : "text-es-text-secondary hover:text-es-blue border-transparent"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/premium"
            className="bg-es-blue text-white text-sm font-heading font-semibold px-4 py-2 rounded-chip hover:bg-es-blue-hover transition-colors duration-150 ml-2"
          >
            ⭐ Premium
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-es-text p-2 rounded focus:outline-none focus:ring-2 focus:ring-es-blue/50"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
          aria-expanded={menuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <nav className="md:hidden bg-white border-t border-es-border px-4 pb-4 pt-2" aria-label="Menu mobile">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3 text-es-text hover:text-es-blue text-sm font-body border-b border-es-border last:border-0 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/premium"
            className="block mt-3 bg-es-blue text-white text-sm font-heading font-semibold px-4 py-2.5 rounded-chip text-center hover:bg-es-blue-hover transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            ⭐ Premium
          </Link>
        </nav>
      )}
    </header>
  );
}
