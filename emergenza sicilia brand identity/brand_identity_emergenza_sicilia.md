---
name: emergenza-sicilia-brand
description: Brand identity guidelines for the Emergenza Sicilia project. Use this skill whenever working on the Emergenza Sicilia website, app, or any digital or print asset — including UI components, CSS variables, copy writing, color choices, typography, logo usage, icon design, or any visual/verbal element. Trigger on: "Emergenza Sicilia", "brand", "colori", "palette", "font", "logo", "stile", "identità visiva", "componente", "header", "footer", "bottone", "card", or any UI/UX task within this project.
---

# Brand Identity: Emergenza Sicilia

## Concept

Il brand comunica **affidabilità immediata, radicamento territoriale e soccorso medico**.
Il design unisce geometria moderna con un simbolo iconico che fonde la geografia siciliana con i simboli universali della medicina.

---

## Palette Cromatica

### Colori Primari

| Nome | HEX | Uso |
|---|---|---|
| Blu Istituzionale | `#0056A0` | Testo "Emergenza", sfondi istituzionali, header, CTA principali |
| Verde Speranza | `#2C6B2F` | Testo "Sicilia", accenti positivi, stati "safe/ok", badge verdi |

### Colori Secondari (dal pittogramma)

| Nome | HEX indicativo | Uso |
|---|---|---|
| Giallo/Ocra | `#F5A623` | Accenti caldi, icone secondarie, warning |
| Rosso Emergenza | `#D0021B` | Chiamate urgenti, codice rosso, alert critici |

### Colori Neutri

| Nome | HEX | Uso |
|---|---|---|
| Bianco | `#FFFFFF` | Sfondi principali, testo su fondi scuri, spazio "asettico" |
| Nero/Grigio testo | `#1A1A1A` | Corpo del testo su sfondo chiaro |

### CSS Variables (da usare in ogni componente)

```css
:root {
  --es-blue:    #0056A0;
  --es-green:   #2C6B2F;
  --es-yellow:  #F5A623;
  --es-red:     #D0021B;
  --es-white:   #FFFFFF;
  --es-text:    #1A1A1A;
  --es-bg:      #F8F9FA;
}
```

---

## Tipografia

| Ruolo | Font | Peso consigliato |
|---|---|---|
| Titoli, logotipo, heading | **Montserrat** | 600–800 (SemiBold/ExtraBold) |
| Corpo testo, label, UI | **Open Sans** | 400–600 (Regular/SemiBold) |

Import Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
```

```css
--es-font-heading: 'Montserrat', sans-serif;
--es-font-body:    'Open Sans', sans-serif;
```

---

## Il Logo e il Pittogramma

Il pittogramma rappresenta la **sagoma della Sicilia** divisa in 4 blocchi cromatici (blu, giallo, rosso, verde), attraversata da una **linea ECG bianca** che culmina in una **croce medica bianca** nel quadrante in alto a destra.

### Regole d'uso del logo

- ✅ Mantenere sempre un'**area di rispetto** attorno al logo (almeno pari all'altezza della lettera "E" di "Emergenza")
- ✅ Su **fondi chiari** → versione a colori standard
- ✅ Su **fondi scuri o fotografici** → versione **negativo (tutto bianco)**
- ❌ Non distorcere, ruotare o cambiare colori del logo
- ❌ Non posizionare altri elementi nell'area di rispetto

---

## Sistema UI Digitale

### Assegnazione colori per funzione (App / Sito)

| Funzione | Colore | Var CSS |
|---|---|---|
| Chiamata urgente / Codice rosso | Rosso | `--es-red` |
| Trasporto programmato / Stato ok | Verde | `--es-green` |
| Warning / Attenzione | Giallo | `--es-yellow` |
| Navigazione principale / Istituzionale | Blu | `--es-blue` |

### Pattern comuni

- **Sfondo sezioni istituzionali**: `--es-blue` con testo bianco
- **Card contenuto**: sfondo bianco `--es-white`, bordo sinistro colorato per categoria
- **CTA primario**: `--es-blue`, hover leggermente più scuro (`#004080`)
- **CTA urgenza**: `--es-red`, solo per azioni critiche
- **Badge/stato**: colore pieno + testo bianco, bordi arrotondati (`border-radius: 4px`)

---

## Tono di Voce e Copy

- **Professionale ma umano**: non burocratico, non freddo
- **Diretto e chiaro**: le informazioni di emergenza devono essere immediatamente comprensibili
- **Rassicurante**: trasmettere competenza e controllo, mai allarmismo gratuito
- **Territoriale**: riferimenti espliciti alla Sicilia sono un valore, non un limite

### Anti-pattern copy

- ❌ Linguaggio troppo tecnico/medico senza spiegazione
- ❌ Frasi vaghe ("potremmo aiutarti") → preferire dirette ("chiamaci ora")
- ❌ Tono freddo/impersonale → preferire "siamo qui" a "il servizio è disponibile"

---

## Immagine Coordinata (riferimento per coerenza digitale)

| Materiale | Stile |
|---|---|
| Header sito | Fondo blu istituzionale, logo versione standard o negativo |
| Footer | Fondo scuro (blu navy `#003366`), testo bianco |
| Sezioni informative | Alternanza moduli colorati per categoria servizio |
| Icone navigazione | Usa i 4 colori del pittogramma, un colore per funzione |
| Filigrana/watermark | Pittogramma Sicilia tono su tono, su sfondi bianchi |

---

## Note per Claude Code

- Usa **sempre le CSS variables** `--es-*` invece di valori HEX inline
- I componenti React/HTML devono importare Montserrat + Open Sans da Google Fonts
- Per componenti di emergenza/urgenza: **rosso è riservato a situazioni critiche**, non usarlo per decorazione
- Il pittogramma (icona Sicilia+ECG+croce) NON va ricreato da zero: chiedere al developer il file SVG originale
- Quando in dubbio sul colore di un componente, consulta la tabella "Assegnazione colori per funzione"
