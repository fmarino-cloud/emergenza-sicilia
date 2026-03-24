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
  { href: "/segnala", label: "Segnala" },
  { href: "/alert", label: "Alert" },
];

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-es-blue shadow-md" role="banner">
      <div className="mx-auto max-w-content flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Emergenza Sicilia - Home">
          <Image
            src="/logo_emergenza_sicilia.png"
            alt="Emergenza Sicilia"
            width={160}
            height={40}
            className="h-8 w-auto brightness-0 invert"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-5" aria-label="Navigazione principale">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-body font-medium transition-colors duration-150",
                pathname === link.href
                  ? "text-white font-semibold"
                  : "text-white/80 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/premium"
            className="bg-es-yellow text-es-text text-sm font-heading font-semibold px-4 py-1.5 rounded-chip hover:opacity-90 transition-opacity duration-150"
          >
            Premium
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
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
        <nav className="md:hidden bg-es-blue border-t border-white/10 px-4 pb-4 pt-2" aria-label="Menu mobile">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2.5 text-white/90 hover:text-white text-sm font-body border-b border-white/10 last:border-0"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/premium"
            className="block mt-3 bg-es-yellow text-es-text text-sm font-heading font-semibold px-4 py-2 rounded-chip text-center"
            onClick={() => setMenuOpen(false)}
          >
            Premium
          </Link>
        </nav>
      )}
    </header>
  );
}
