# Bodybuilding Tracker Pro - Guida Installazione

## Installazione

### 1. Installare le dipendenze
```bash
npm install
```

### 2. Avviare il server di sviluppo
```bash
npm run dev
```

L'applicazione sarà disponibile su **http://localhost:5173/**

### 3. Build per produzione
```bash
npm run build
```

I file compilati saranno nella cartella `dist/`

### 4. Anteprima build di produzione
```bash
npm run preview
```

## Tecnologie Utilizzate

- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Styling utility-first
- **ShadcnUI** - Componenti UI moderni e accessibili
- **Recharts** - Libreria per grafici interattivi
- **Lucide React** - Icone moderne
- **LocalStorage** - Persistenza dati lato client

## Struttura del Progetto

```
bb_tracker/
├── src/
│   ├── components/
│   │   ├── ui/              # Componenti ShadcnUI
│   │   ├── program/         # Componenti Tab Scheda
│   │   ├── logbook/         # Componenti Tab Logbook
│   │   │   └── charts/      # 5 grafici Recharts
│   │   ├── ExerciseLibrary.tsx
│   │   ├── ProgramTab.tsx
│   │   └── LogbookTab.tsx
│   ├── contexts/
│   │   └── AppContext.tsx   # State management globale
│   ├── lib/
│   │   ├── calculations.ts  # Funzioni di calcolo
│   │   ├── constants.ts     # Costanti ed esercizi default
│   │   └── utils.ts         # Utility functions
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── components.json          # Config ShadcnUI
└── package.json
```

## Features Implementate

### ✅ Tab 1: Libreria Esercizi
- CRUD completo per esercizi
- Distribuzione muscolare (max 3 muscoli)
- Validazione totale 100%

### ✅ Tab 2: Scheda Allenamento
- Gestione multi-settimana con duplicazione
- Week selector con indicatori sessioni loggate
- Volume Summary con 4 metriche principali
- Volume per gruppo muscolare
- Giorni con tabella esercizi completa
- Logica condizionale Reps/Schema tecnica
- Sezione Macros settimanali
- Modal Log Sessione (tecnica normale e speciale)

### ✅ Tab 3: Logbook e Progressioni
- Filtri per Esercizio, Rep Range, Tecnica
- Tabella storico con completamento e RPE
- 5 Grafici interattivi:
  1. Volume Totale per Settimana
  2. Volume per Gruppo Muscolare
  3. Tonnellaggio nel Tempo
  4. RPE Reale nel Tempo
  5. Progressione Carico per Rep Range

### ✅ Features Extra
- Persistenza automatica su localStorage (debounced 500ms)
- Export CSV completo
- Design responsive (mobile-first)
- Dark mode support (Tailwind)
- Tema viola/blu (primary colors)

## Come Usare l'Applicazione

### 1. Libreria Esercizi
1. Clicca su "Nuovo Esercizio"
2. Inserisci nome esercizio
3. Seleziona fino a 3 gruppi muscolari con percentuali
4. Assicurati che il totale sia 100%
5. Salva automaticamente

### 2. Scheda Allenamento
1. Seleziona o crea una settimana
2. Aggiungi giorni di allenamento
3. Per ogni giorno, aggiungi esercizi dalla libreria
4. Configura sets, reps, carico, tecnica, coefficient
5. Visualizza il volume summary in tempo reale
6. Compila i macros settimanali

### 3. Log Sessione
1. Dalla tabella esercizi, clicca sull'icona arancione "📝"
2. Compila reps, carico e RPE per ogni set
3. Per tecniche speciali, compila ogni cluster
4. Aggiungi set extra se necessario
5. Visualizza il riepilogo live (reps, tonnage, RPE)
6. Salva sessione

### 4. Logbook e Analisi
1. Usa i filtri per analizzare specifici esercizi/rep range
2. Visualizza lo storico nella tabella
3. Analizza i grafici per progressioni
4. Per il grafico "Progressione Carico", seleziona esercizio/range
5. Esporta tutti i dati in CSV

## Note Tecniche

### Calcoli Implementati

**Volume (A Priori)**
```typescript
Volume = Sets × Coefficient
```

**RPE Stimato**
```typescript
coefficient <= 0.7 → RPE 5.5
coefficient <= 0.9 → RPE 7.5
coefficient <= 1.0 → RPE 8.5
coefficient > 1.0 → RPE 10.0
```

**Target Reps**
- Tecnica Normale: `repsBase × sets`
- Tecnica Speciale: `sum(schema) × sets`

**Completamento**
```typescript
Completion = (totalReps / targetReps) × 100
```

### Reset Dati
Per resettare tutti i dati:
```javascript
localStorage.removeItem('bodybuilding-data');
window.location.reload();
```

Oppure usa la console del browser.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Questo progetto è stato creato per scopi educativi e personali.
