import { AlertSubscribeForm } from "@/components/alerts/alert-subscribe-form";

export const metadata = {
  title: "Allerte in tempo reale | Emergenza Sicilia",
  description: "Iscriviti alle allerte di emergenza della Sicilia. Ricevi notifiche push per terremoti, maltempo, incendi e altro.",
};

export default function AlertePage() {
  return (
    <div className="min-h-screen bg-es-bg">
      {/* Hero */}
      <section className="bg-es-blue py-12 px-4">
        <div className="mx-auto max-w-content text-center">
          <h1 className="font-heading font-bold text-white text-h1 mb-3">
            Ricevi allerte in tempo reale
          </h1>
          <p className="font-body text-white/80 text-base max-w-xl mx-auto">
            Attiva le notifiche push per ricevere avvisi immediati sulle emergenze
            nelle province e categorie che ti interessano.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 px-4">
        <div className="mx-auto max-w-content grid md:grid-cols-3 gap-8 items-start">
          {/* Form */}
          <div className="md:col-span-2 bg-white rounded-card shadow-sm p-6 border border-es-border">
            <h2 className="font-heading font-semibold text-es-text text-h2 mb-6">
              Personalizza le tue allerte
            </h2>
            <AlertSubscribeForm />
          </div>

          {/* Info sidebar */}
          <aside className="space-y-4">
            <div className="bg-white rounded-card border border-es-border p-5 shadow-sm">
              <h3 className="font-heading font-semibold text-es-text text-base mb-3">
                Come funzionano le allerte
              </h3>
              <ul className="space-y-2 font-body text-sm text-es-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0">•</span>
                  <span>Seleziona le province e categorie di interesse.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0">•</span>
                  <span>Imposta la gravità minima per ricevere solo le allerte rilevanti.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0">•</span>
                  <span>Ricevi notifiche push direttamente sul tuo dispositivo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0">•</span>
                  <span>Funziona anche con il browser chiuso (Android/Desktop).</span>
                </li>
              </ul>
            </div>

            <div className="bg-es-yellow/10 rounded-card border border-es-yellow/30 p-5">
              <h3 className="font-heading font-semibold text-es-text text-sm mb-2">
                Privacy
              </h3>
              <p className="font-body text-sm text-es-text-secondary">
                Non raccogliamo dati personali identificativi. Le preferenze sono
                associate in modo anonimo al tuo dispositivo.{" "}
                <a href="/privacy" className="text-es-blue underline">
                  Leggi la privacy policy
                </a>
                .
              </p>
            </div>

            <div className="bg-white rounded-card border border-es-border p-5 shadow-sm">
              <h3 className="font-heading font-semibold text-es-text text-sm mb-2">
                Compatibilità
              </h3>
              <ul className="font-body text-sm text-es-text-secondary space-y-1">
                <li>✓ Chrome / Edge (Android, Desktop)</li>
                <li>✓ Firefox (Desktop)</li>
                <li>✓ Safari (iOS 16.4+, macOS)</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
