import { DeleteAccountButton } from "@/components/privacy/delete-account-button";

export const metadata = {
  title: "Privacy Policy | Emergenza Sicilia",
  description: "Informativa sulla privacy e trattamento dei dati personali di Emergenza Sicilia.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-es-bg">
      {/* Hero */}
      <section className="bg-es-blue py-10 px-4">
        <div className="mx-auto max-w-content">
          <h1 className="font-heading font-bold text-white text-h1 mb-2">
            Privacy Policy
          </h1>
          <p className="font-body text-white/80 text-sm">
            Ultimo aggiornamento: 25 marzo 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 px-4">
        <div className="mx-auto max-w-content grid md:grid-cols-4 gap-8 items-start">
          {/* Nav sidebar */}
          <nav className="hidden md:block bg-white rounded-card border border-es-border p-5 shadow-sm sticky top-20">
            <h3 className="font-heading font-semibold text-es-text text-sm mb-3">Indice</h3>
            <ul className="space-y-1.5 font-body text-sm text-es-blue">
              <li><a href="#titolare" className="hover:underline">1. Titolare</a></li>
              <li><a href="#dati" className="hover:underline">2. Dati raccolti</a></li>
              <li><a href="#finalita" className="hover:underline">3. Finalità</a></li>
              <li><a href="#base" className="hover:underline">4. Base giuridica</a></li>
              <li><a href="#conservazione" className="hover:underline">5. Conservazione</a></li>
              <li><a href="#diritti" className="hover:underline">6. Diritti (art. 15-22)</a></li>
              <li><a href="#dpo" className="hover:underline">7. Contatti DPO</a></li>
              <li><a href="#elimina" className="hover:underline">Elimina account</a></li>
            </ul>
          </nav>

          {/* Main content */}
          <div className="md:col-span-3 bg-white rounded-card border border-es-border p-6 shadow-sm space-y-8 font-body text-es-text">

            <section id="titolare">
              <h2 className="font-heading font-semibold text-h2 mb-3">
                1. Titolare del trattamento
              </h2>
              <p className="text-sm leading-relaxed text-es-text-secondary">
                Il titolare del trattamento dei dati personali è{" "}
                <strong className="text-es-text">Emergenza Sicilia</strong>, con sede in Sicilia, Italia.
                Per qualsiasi questione relativa alla privacy puoi contattarci all&apos;indirizzo:{" "}
                <a href="mailto:privacy@emergenzasicilia.it" className="text-es-blue underline">
                  privacy@emergenzasicilia.it
                </a>
                .
              </p>
            </section>

            <section id="dati">
              <h2 className="font-heading font-semibold text-h2 mb-3">
                2. Dati raccolti
              </h2>
              <p className="text-sm leading-relaxed text-es-text-secondary mb-3">
                Raccogliamo i seguenti dati:
              </p>
              <ul className="space-y-2 text-sm text-es-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Dati di registrazione:</strong> indirizzo email e password cifrata, per gli utenti che creano un account.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Segnalazioni:</strong> testo, posizione geografica opzionale, media opzionali, hash anonimo dell&apos;IP.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Preferenze allerte:</strong> province, categorie e soglia di gravità selezionate, endpoint push subscription.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Dati tecnici:</strong> log di accesso, indirizzi IP (in forma hashata), User Agent, timestamp.</span>
                </li>
              </ul>
            </section>

            <section id="finalita">
              <h2 className="font-heading font-semibold text-h2 mb-3">
                3. Finalità del trattamento
              </h2>
              <ul className="space-y-2 text-sm text-es-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span>Erogazione del servizio di informazione sulle emergenze in Sicilia.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span>Invio di notifiche push personalizzate sulle emergenze selezionate.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span>Moderazione e verifica delle segnalazioni degli utenti.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span>Sicurezza del servizio e prevenzione degli abusi (rate limiting).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span>Conformità agli obblighi legali.</span>
                </li>
              </ul>
            </section>

            <section id="base">
              <h2 className="font-heading font-semibold text-h2 mb-3">
                4. Base giuridica
              </h2>
              <ul className="space-y-2 text-sm text-es-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Consenso (art. 6.1.a GDPR):</strong> per la raccolta delle preferenze di allerta e notifiche push.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Esecuzione del contratto (art. 6.1.b GDPR):</strong> per la gestione dell&apos;account utente.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Legittimo interesse (art. 6.1.f GDPR):</strong> per la sicurezza del servizio e prevenzione degli abusi.</span>
                </li>
              </ul>
            </section>

            <section id="conservazione">
              <h2 className="font-heading font-semibold text-h2 mb-3">
                5. Conservazione dei dati
              </h2>
              <ul className="space-y-2 text-sm text-es-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span>I dati di account vengono conservati fino alla cancellazione dell&apos;account.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span>Le segnalazioni anonime vengono conservate per 12 mesi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span>I log tecnici vengono conservati per 30 giorni.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span>Le preferenze di allerta rimangono attive fino alla disattivazione da parte dell&apos;utente.</span>
                </li>
              </ul>
            </section>

            <section id="diritti">
              <h2 className="font-heading font-semibold text-h2 mb-3">
                6. Diritti dell&apos;interessato (art. 15-22 GDPR)
              </h2>
              <p className="text-sm text-es-text-secondary mb-3">
                In qualità di interessato, hai i seguenti diritti:
              </p>
              <ul className="space-y-2 text-sm text-es-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Accesso (art. 15):</strong> ottenere conferma del trattamento e copia dei dati.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Rettifica (art. 16):</strong> correggere dati inesatti o incompleti.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Cancellazione (art. 17):</strong> richiedere l&apos;eliminazione dei tuoi dati.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Limitazione (art. 18):</strong> limitare il trattamento in determinate circostanze.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Portabilità (art. 20):</strong> ricevere i tuoi dati in formato strutturato.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Opposizione (art. 21):</strong> opporti al trattamento basato sul legittimo interesse.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-es-blue shrink-0 mt-0.5">•</span>
                  <span><strong className="text-es-text">Revoca del consenso (art. 7.3):</strong> ritirare il consenso in qualsiasi momento.</span>
                </li>
              </ul>
              <p className="text-sm text-es-text-secondary mt-3">
                Per esercitare questi diritti, scrivi a{" "}
                <a href="mailto:privacy@emergenzasicilia.it" className="text-es-blue underline">
                  privacy@emergenzasicilia.it
                </a>
                . Hai anche il diritto di proporre reclamo all&apos;Autorità Garante per la protezione dei dati personali (
                <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-es-blue underline">
                  www.garanteprivacy.it
                </a>
                ).
              </p>
            </section>

            <section id="dpo">
              <h2 className="font-heading font-semibold text-h2 mb-3">
                7. Contatti DPO
              </h2>
              <p className="text-sm text-es-text-secondary">
                Il Responsabile della Protezione dei Dati (DPO) può essere contattato a:{" "}
                <a href="mailto:dpo@emergenzasicilia.it" className="text-es-blue underline">
                  dpo@emergenzasicilia.it
                </a>
              </p>
            </section>

            {/* Delete account section */}
            <section id="elimina" className="border-t border-es-border pt-6">
              <h2 className="font-heading font-semibold text-h2 mb-3 text-es-red">
                Elimina il tuo account
              </h2>
              <p className="text-sm text-es-text-secondary mb-4">
                Puoi eliminare il tuo account e tutti i dati associati in qualsiasi momento.
                Questa azione è <strong className="text-es-text">irreversibile</strong>.
                Le segnalazioni anonime potrebbero essere mantenute in forma non identificabile.
              </p>
              <DeleteAccountButton />
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
