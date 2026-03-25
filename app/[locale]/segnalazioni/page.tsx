import { ReportForm } from "@/components/reports/report-form";

export const metadata = {
  title: "Segnala un'emergenza | Emergenza Sicilia",
  description: "Invia una segnalazione di emergenza dalla Sicilia. Le segnalazioni vengono verificate dal nostro team.",
};

export default function SegnalazioniPage() {
  return (
    <div className="min-h-screen bg-es-bg">
      {/* Hero */}
      <section className="bg-es-blue py-12 px-4">
        <div className="mx-auto max-w-content text-center">
          <h1 className="font-heading font-bold text-white text-h1 mb-3">
            Segnala un&apos;emergenza
          </h1>
          <p className="font-body text-white/80 text-base max-w-xl mx-auto">
            Hai visto qualcosa? Aiutaci a tener informata la Sicilia inviando una segnalazione.
            Ogni contributo viene verificato dal nostro team prima della pubblicazione.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 px-4">
        <div className="mx-auto max-w-content grid md:grid-cols-3 gap-8 items-start">
          {/* Form card */}
          <div className="md:col-span-2 bg-white rounded-card shadow-sm p-6 border border-es-border">
            <h2 className="font-heading font-semibold text-es-text text-h2 mb-6">
              Invia la tua segnalazione
            </h2>
            <ReportForm />
          </div>

          {/* Info box */}
          <aside className="space-y-4">
            <div className="bg-white rounded-card border border-es-border p-5 shadow-sm">
              <h3 className="font-heading font-semibold text-es-text text-base mb-3 flex items-center gap-2">
                <span className="text-es-blue">ℹ</span>
                Come funziona la moderazione
              </h3>
              <ul className="space-y-2 font-body text-sm text-es-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-es-green mt-0.5 shrink-0">1.</span>
                  <span>Invii la tua segnalazione con i dettagli dell&apos;emergenza.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-green mt-0.5 shrink-0">2.</span>
                  <span>Il sistema calcola automaticamente un punteggio di affidabilità.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-green mt-0.5 shrink-0">3.</span>
                  <span>Il nostro team verifica e approva prima della pubblicazione.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-green mt-0.5 shrink-0">4.</span>
                  <span>Le segnalazioni approvate appaiono sulla mappa pubblica.</span>
                </li>
              </ul>
            </div>

            <div className="bg-es-yellow/10 rounded-card border border-es-yellow/30 p-5">
              <h3 className="font-heading font-semibold text-es-text text-sm mb-2">
                ⚠ Emergenza in corso?
              </h3>
              <p className="font-body text-sm text-es-text-secondary">
                In caso di pericolo immediato chiama il{" "}
                <strong className="text-es-red">112</strong> (Emergenze),{" "}
                <strong>115</strong> (Vigili del Fuoco) o{" "}
                <strong>118</strong> (Emergenza medica).
              </p>
            </div>

            <div className="bg-white rounded-card border border-es-border p-5 shadow-sm">
              <h3 className="font-heading font-semibold text-es-text text-sm mb-2">
                Suggerimenti per una buona segnalazione
              </h3>
              <ul className="font-body text-sm text-es-text-secondary space-y-1">
                <li>• Descrivi cosa vedi con precisione</li>
                <li>• Indica il luogo esatto se possibile</li>
                <li>• Allega foto o video se disponibili</li>
                <li>• Evita informazioni non verificate</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
