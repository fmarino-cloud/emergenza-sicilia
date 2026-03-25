export const metadata = {
  title: "Premium | Emergenza Sicilia",
  description: "Passa a Emergenza Sicilia Premium per accedere a contenuti esclusivi, allerte personalizzate e un'esperienza senza pubblicità.",
};

const plans = [
  {
    id: "free",
    name: "FREE",
    price: "€0",
    period: "/mese",
    description: "Per chi vuole restare informato",
    features: [
      "Articoli base",
      "Allerte standard",
      "Mappa pubblica",
      "Segnalazioni",
    ],
    cta: "Piano attuale",
    highlighted: false,
    disabled: true,
  },
  {
    id: "premium",
    name: "PREMIUM",
    price: "€2.99",
    period: "/mese",
    description: "Per chi vuole il massimo",
    features: [
      "Tutto del piano Free",
      "Articoli completi",
      "Allerte personalizzate",
      "Nessuna pubblicità",
      "Accesso anticipato",
    ],
    cta: "Prossimamente",
    highlighted: true,
    disabled: true,
  },
  {
    id: "supporter",
    name: "SUPPORTER",
    price: "€4.99",
    period: "/mese",
    description: "Per chi sostiene il progetto",
    features: [
      "Tutto del piano Premium",
      "Badge Supporter",
      "Supporto diretto al progetto",
      "Newsletter esclusiva",
    ],
    cta: "Prossimamente",
    highlighted: false,
    disabled: true,
  },
];

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-es-bg">
      {/* Hero */}
      <section className="bg-es-blue py-14 px-4">
        <div className="mx-auto max-w-content text-center">
          <div className="inline-block bg-es-yellow text-es-text text-xs font-heading font-bold px-3 py-1 rounded-chip mb-4 uppercase tracking-wide">
            Coming Soon
          </div>
          <h1 className="font-heading font-bold text-white text-h1 mb-3">
            Emergenza Sicilia Premium
          </h1>
          <p className="font-body text-white/80 text-base max-w-xl mx-auto">
            Accedi a contenuti esclusivi, allerte personalizzate e un&apos;esperienza
            senza pubblicità. I pagamenti sono in arrivo — registrati per essere notificato.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-content">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-card border p-6 flex flex-col shadow-sm ${
                  plan.highlighted
                    ? "border-es-blue ring-2 ring-es-blue relative"
                    : "border-es-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-es-blue text-white text-xs font-heading font-bold px-3 py-1 rounded-chip">
                    Più popolare
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="font-heading font-bold text-es-text text-sm tracking-widest mb-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-heading font-bold text-4xl text-es-text">
                      {plan.price}
                    </span>
                    <span className="font-body text-es-text-secondary text-sm">
                      {plan.period}
                    </span>
                  </div>
                  <p className="font-body text-es-text-secondary text-sm">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 font-body text-sm text-es-text">
                      <span className="text-es-green mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="relative group">
                  <button
                    disabled={plan.disabled}
                    className={`w-full py-3 rounded-card font-heading font-semibold text-sm transition-colors ${
                      plan.highlighted
                        ? "bg-es-blue text-white opacity-60 cursor-not-allowed"
                        : "border border-es-border text-es-text-secondary opacity-60 cursor-not-allowed"
                    }`}
                  >
                    {plan.cta}
                  </button>
                  {plan.disabled && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-es-text text-white text-xs font-body py-1 px-2 rounded whitespace-nowrap z-10">
                      Prossimamente
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Notice */}
          <div className="mt-8 bg-es-yellow/10 border border-es-yellow/30 rounded-card p-5 text-center">
            <p className="font-body text-es-text text-sm">
              💳 <strong>Pagamenti in arrivo</strong> — registrati per essere notificato
              quando il piano Premium sarà disponibile.
            </p>
          </div>

          {/* FAQ */}
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-card border border-es-border p-5 shadow-sm">
              <h3 className="font-heading font-semibold text-es-text text-base mb-2">
                Quando saranno disponibili i pagamenti?
              </h3>
              <p className="font-body text-sm text-es-text-secondary">
                Stiamo lavorando per integrare Stripe entro il 2025.
                Gli utenti registrati saranno i primi a saperlo.
              </p>
            </div>
            <div className="bg-white rounded-card border border-es-border p-5 shadow-sm">
              <h3 className="font-heading font-semibold text-es-text text-base mb-2">
                Il piano Free rimarrà gratuito?
              </h3>
              <p className="font-body text-sm text-es-text-secondary">
                Sì. Il piano Free rimarrà sempre disponibile e gratuito.
                Premium è per chi vuole funzionalità aggiuntive.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
