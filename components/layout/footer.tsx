import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-es-navy text-white mt-16" role="contentinfo">
      <div className="mx-auto max-w-content px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Image
              src="/logo_emergenza_sicilia.png"
              alt="Emergenza Sicilia"
              width={150}
              height={38}
              className="h-8 w-auto brightness-0 invert mb-3"
            />
            <p className="text-white/60 text-sm font-body leading-relaxed">
              Informazione in tempo reale sulle emergenze in Sicilia.
            </p>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm mb-3 text-white/90">Navigazione</h3>
            <ul className="space-y-2">
              {[
                { href: "/mappa", label: "Mappa eventi" },
                { href: "/fonti", label: "Fonti ufficiali" },
                { href: "/editoriale", label: "Editoriale" },
                { href: "/segnala", label: "Segnala" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 hover:text-white text-sm font-body transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm mb-3 text-white/90">Servizi</h3>
            <ul className="space-y-2">
              {[
                { href: "/alert", label: "Imposta Alert" },
                { href: "/premium", label: "Premium" },
                { href: "/privacy", label: "Privacy Policy" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 hover:text-white text-sm font-body transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm mb-3 text-white/90">Chi siamo</h3>
            <p className="text-white/60 text-sm font-body leading-relaxed">
              Emergenza Sicilia nasce dopo eventi estremi come il ciclone Harry, per centralizzare le informazioni su emergenze in una regione ad alto rischio sismico e vulcanico.
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-white/40 text-xs font-body">
          <span>© {new Date().getFullYear()} Emergenza Sicilia. Tutti i diritti riservati.</span>
          <span>Fonti: INGV · Protezione Civile · ANAS</span>
        </div>
      </div>
    </footer>
  );
}
