```md
# 📋 Bodybuilding Tracker Pro - Specifiche di Progetto
Questo documento descrive tutte le specifiche funzionali, le strutture dati, la logica di business e i requisiti UI/UX per l'applicazione "Bodybuilding Tracker Pro".

## 🎯 1. Overview del Progetto
L'obiettivo è creare un'applicazione web React completa per la programmazione e il tracciamento di allenamenti di bodybuilding. L'applicazione deve consentire all'utente di:
- Gestire una libreria di esercizi personalizzabile.
- Pianificare schede di allenamento settimanali.
- Registrare (loggare) le sessioni di allenamento con dettagli set-per-set.
- Analizzare le progressioni nel tempo tramite grafici interattivi.

## 📚 2. Struttura Dati
Di seguito sono definite le interfacce e le costanti principali per la gestione dei dati dell'applicazione.

### 2.1. Libreria Esercizi (Exercise Library)
Definisce ogni esercizio e i gruppi muscolari primari e secondari coinvolti.

// Costante per i gruppi muscolari
const MUSCLE_GROUPS = [
  "Petto",
  "Dorso - Lats",
  "Dorso - Upper Back",
  "Dorso - Trapezi",
  "Deltoidi - Anteriore",
  "Deltoidi - Laterale",
  "Deltoidi - Posteriore",
  "Bicipiti",
  "Tricipiti",
  "Avambracci",
  "Quadricipiti",
  "Femorali",
  "Glutei",
  "Polpacci",
  "Adduttori",
  "Abduttori",
  "Addome",
  "Obliqui",
  "Core"
];

// Interfaccia per un singolo esercizio
interface Exercise {
  name: string;
  muscles: Array<{
    muscle: string;  // Deve essere uno dei MUSCLE_GROUPS
    percent: number; // 0-100
  }>; // Massimo 3 muscoli per esercizio
}

Esempi:
{
  "name": "Panca Piana Bilanciere",
  "muscles": [
    { "muscle": "Petto", "percent": 80 },
    { "muscle": "Tricipiti", "percent": 20 }
  ]
}
{
  "name": "Rematore Bilanciere",
  "muscles": [
    { "muscle": "Dorso - Upper Back", "percent": 70 },
    { "muscle": "Dorso - Lats", "percent": 20 },
    { "muscle": "Bicipiti", "percent": 10 }
  ]
}

### 2.2. Programma (Program - Pianificazione Scheda)
Definisce la struttura delle schede di allenamento, suddivise in settimane e giorni.

// Costanti per Rep Ranges e Tecniche
const REP_RANGES = [
  { label: "1-5 (Forza)", value: "1-5" },
  { label: "6-8 (Forza-Ipertrofia)", value: "6-8" },
  { label: "8-12 (Ipertrofia)", value: "8-12" },
  { label: "12-20 (Pump)", value: "12-20" },
  { label: "20+ (Endurance)", value: "20+" }
];

const TECHNIQUES = [
  "Normale",
  "Rest-Pause",
  "Myo-Reps",
  "Drop-Set",
  "Cluster Sets",
  "Reps Scalare",      // es. 12-10-8-6
  "Reps Crescente",    // es. 6-8-10-12
  "1.5 Reps"
];

// Interfaccia per un esercizio pianificato
interface ProgramExercise {
  exerciseName: string;        // Selezionato dalla Exercise Library
  rest: number;                // Secondi di recupero
  sets: number;                // Numero di serie
  repsBase: string;            // Es. "10" (Disabilitato se technique !== "Normale")
  repRange: string;            // Categoria (valore da REP_RANGES)
  targetLoad: string;          // KG target (es. "80")
  technique: string;           // Valore da TECHNIQUES
  techniqueSchema: string;     // Es. "10+10+10" (Abilitato solo se technique !== "Normale")
  coefficient: number;         // 0.0 - 2.0 (per calcolo volume)
  notes: string;
}

// Interfaccia per un giorno di allenamento
interface Day {
  name: string;                // "Giorno 1", "Giorno 2", etc.
  exercises: ProgramExercise[];
}

// Interfaccia per una settimana di allenamento
interface Week {
  days: Day[];
}

// Stato globale per le settimane (esempio)
// weeks: Record<number, Week>; // Es. { 1: Week, 2: Week, ... }

### 2.3. Sessioni Loggate (Logged Sessions)
Definisce i dati registrati dall'utente dopo aver completato un allenamento.

// Interfaccia per un singolo set registrato
interface LoggedSet {
  reps: string;       // Reps effettive
  load: string;       // KG usati
  rpe: string;        // RPE effettivo (5.0 - 10.0)
  setNum: number;     // Numero del set (1, 2, 3...)
  clusterNum: number; // Numero del cluster (1, 2, 3...) - usato per Myo-Reps, etc.
}

// Interfaccia per una sessione di allenamento completata
interface LoggedSession {
  id: number;                 // Timestamp (usato come ID univoco)
  date: string;               // Data ISO (es. "2024-10-28")
  weekNum: number;            // Settimana di appartenenza
  exercise: string;           // Nome dell'esercizio
  technique: string;          // Tecnica usata
  techniqueSchema: string;    // Schema tecnica (se presente)
  repRange: string;           // Rep range (ereditato dalla scheda)
  coefficient: number;        // Coefficiente (ereditato dalla scheda)
  sets: LoggedSet[];          // Array dei set completati
  
  // Metriche calcolate al salvataggio
  totalReps: number;          // Somma di tutte le reps
  targetReps: number;         // Reps target calcolate dalla scheda
  totalTonnage: number;       // Somma (reps × load) di tutti i set
  avgRPE: number;             // Media RPE di tutti i set
  completion: number;         // (totalReps / targetReps) * 100
}

### 2.4. Macros
Definisce gli obiettivi macro-nutrizionali per una data settimana.

interface WeekMacros {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  notes: string;
}

// Stato globale per i macros (esempio)
// macros: Record<number, WeekMacros>; // Es. { 1: WeekMacros, 2: WeekMacros, ... }

---

## 🧮 3. Logica e Calcoli
Logiche di business fondamentali per il calcolo delle metriche.

### 3.1. Volume (A Priori)
Il volume è calcolato prima dell'allenamento, basandosi solo sulla pianificazione.

- **Formula:** Volume = Sets × Coefficient
- **Nota:** Il volume NON dipende dalle reps pianificate.

**Esempi:**
- 4 sets × 1.0 (coeff) = 4.0 volume
- 3 sets × 1.3 (coeff) = 3.9 volume
- 5 sets × 0.7 (coeff) = 3.5 volume

**Distribuzione per Muscolo:**
Il volume di ogni esercizio viene distribuito ai gruppi muscolari in base alle percentuali definite nella Exercise Library.
Esempio: Panca Piana (4.0 volume) -> 80% Petto (3.2), 20% Tricipiti (0.8)

### 3.2. RPE Stimato (A Priori)
L'RPE stimato (usato nel summary) deriva direttamente dal coefficiente impostato.

- coefficient <= 0.7 → RPE 5.5
- coefficient <= 0.9 → RPE 7.5
- coefficient <= 1.0 → RPE 8.5
- coefficient > 1.0 → RPE 10.0

### 3.3. Target Reps (per Calcolo Completamento)
Calcola le reps totali target per una LoggedSession.

- **Se Tecnica ≠ "Normale" e `techniqueSchema` è presente:**
  - Parse dello schema (es. "10+10+10" → [10, 10, 10]).
  - Somma dello schema (es. 10+10+10 = 30 reps per set).
  - Target Reps = (Somma Schema) × sets
  - Esempio: 3 sets × (10+10+10) = 90 target reps
  - Esempio: 1 set × (15+5+5+5+5) = 35 target reps

- **Se Tecnica = "Normale":**
  - Target Reps = repsBase × sets
  - Esempio: 4 sets × 10 reps = 40 target reps

### 3.4. Metriche Post-Log (per LoggedSession)
Calcolate al momento del salvataggio del log.

- **totalReps:** Somma di set.reps per tutti i LoggedSet.
- **totalTonnage:** Somma di (set.reps × set.load) per tutti i LoggedSet.
- **avgRPE:** Media di set.rpe per tutti i LoggedSet (ignorando set senza RPE).

### 3.5. Comportamenti Specifici e Validazioni
**Gestione Cambio Tecnica:**

const handleTechniqueChange = (weekNum, dayIndex, exIndex, newTechnique) => {
  updateDayExercise(weekNum, dayIndex, exIndex, 'technique', newTechnique);
  
  if (newTechnique !== 'Normale') {
    // Disabilita repsBase, pulisci valore
    updateDayExercise(weekNum, dayIndex, exIndex, 'repsBase', '');
    // Focus su techniqueSchema per guidare l'utente
    // (opzionale: auto-focus su campo schema)
  } else {
    // Abilita repsBase, pulisci schema
    updateDayExercise(weekNum, dayIndex, exIndex, 'techniqueSchema', '');
    // Ripristina repsBase default (es. "10")
    updateDayExercise(weekNum, dayIndex, exIndex, 'repsBase', '10');
  }
};

**Validazione Schema Tecnica:**

function validateSchema(schema) {
  if (!schema) return false;
  
  // Deve essere formato "10+10+10" o "15+5+5+5"
  const pattern = /^\d+(\+\d+)*$/;
  if (!pattern.test(schema)) return false;
  
  const clusters = parseSchema(schema);
  // Almeno 2 cluster per tecniche (altrimenti è set normale)
  return clusters.length >= 2;
}

// Esempio di applicazione (da adattare a ShadcnUI)
/*
const schemaError = exercise.technique !== 'Normale'
  && exercise.techniqueSchema
  && !validateSchema(exercise.techniqueSchema);

// Render:
<Input
  className={`... ${schemaError ? 'border-red-500' : 'border-gray-300'}`}
  ...
/>
{schemaError && (
  <div className="text-xs text-red-600 mt-1">
    Formato invalido. Usa: 10+10+10
  </div>
)}
*/

### 3.6. Calcolo Completamento con Tolleranza
Per la visualizzazione nel Logbook, si usa una tolleranza per definire lo stato (es. badge colorati).

function getCompletionStatus(completion) {
  if (completion >= 95) return { color: 'green', label: 'Completato' };
  if (completion >= 85) return { color: 'yellow', label: 'Quasi completato' };
  if (completion >= 70) return { color: 'orange', label: 'Parziale' };
  return { color: 'red', label: 'Incompleto' };
}

---

## 🎨 4. UI/UX Requirements
Requisiti di interfaccia utente e interazione per ogni sezione dell'app. (Da implementare usando ShadcnUI e Tailwind CSS).

### 4.1. Tab 1: Libreria Esercizi
**Layout:**
- Header: Titolo "📚 Libreria Esercizi".
- Pulsante "Nuovo Esercizio" (es. Button di ShadcnUI).
- Lista di esercizi (es. Card di ShadcnUI).

**Card Esercizio:**
- Input per il nome (es. Input).
- Sezione "Distribuzione Muscolare" (max 3):
  - Dropdown Muscolo (es. Select / ComboBox con MUSCLE_GROUPS).
  - Input Percentuale (es. Input type number).
  - Pulsante "+ Muscolo" (visibile se muscoli < 3).
  - Icona per rimuovere muscolo (es. X o Trash2 di Lucide).
  - Indicatore "Totale %" (deve essere 100%).
- Pulsante "Elimina Esercizio" (es. Button variant="destructive").

**Funzionalità:**
- CRUD completo per gli esercizi.
- Aggiunta/Rimozione dinamica dei campi muscolo (max 3).
- Validazione: Il totale % deve essere 100% prima di salvare. Feedback visivo (es. bordo rosso) se non valido.

### 4.2. Tab 2: Scheda Allenamento
**Sezione 1: Week Selector**
- Pulsanti per selezionare la settimana (es. ToggleGroup o Tabs di ShadcnUI).
- Pulsante "+ Nuova Week".
- Pulsante "Duplica Week" (copia la settimana corrente in una nuova).
- Indicatore visivo (es. icona Check) su settimane che contengono sessioni loggate.

**Sezione 2: Volume Summary (per la settimana selezionata)**
- Box informativo (es. Alert di ShadcnUI) che spiega la formula del volume: ℹ️ Volume = Sets × Coefficient (NON dipende dalle reps!).
- Grid di 4 metriche (es. Card di ShadcnUI):
  - Volume (A Priori): (sets × coeff) totale.
  - Tonnellaggio (Reale): Somma del tonnellaggio da sessioni loggate.
  - RPE Stimato: Media degli RPE stimati (da coefficient).
  - Muscoli: Conteggio dei gruppi muscolari allenati.

**Dettaglio Volume per Gruppo Muscolare:**
- Grid di card (o Table) che mostra:
  - Nome Muscolo
  - Volume (calcolato)
  - RPE Stimato (calcolato)

**Sezione 3: Days & Exercises**
- Componente Tabs di ShadcnUI per navigare tra i giorni ("Giorno 1", "Giorno 2", ...).
- Pulsante "+ Aggiungi Giorno".
- Per ogni giorno:
  - Una Table di ShadcnUI per gli esercizi.
  - **Colonne Tabella:**
    - # (Ordine)
    - Esercizio (Select / ComboBox dalla Libreria)
    - Muscoli (mostrati automaticamente)
    - Sets (Input number)
    - Reps (Input text - Disabilitato se Tecnica ≠ "Normale". Aggiungere Tooltip esplicativo).
    - Carico (Target Load - Input text, es. "80").
    - Tecnica (Select da TECHNIQUES).
    - Schema (Input text - Abilitato solo se Tecnica ≠ "Normale". Es. "10+10+10").
    - Coeff. (Input number, 0.0-2.0, step 0.1).
    - Rest (Input number, secondi).
    - Note (Input text o Textarea).
    - Log (Pulsante Button arancione "📝" per aprire il modal di log).
    - Del (Pulsante Button variant="destructive" con icona Trash2).
  - Pulsante "+ Esercizio" (in fondo alla tabella del giorno).
  - Pulsante "Elimina Giorno".

**Sezione 4: Macros (per la settimana selezionata)**
- Grid di 4 input: Kcal, Proteine, Carboidrati, Grassi.
- Textarea per le note.

### 4.3. Tab 3: Logbook
**Sezione 1: Filtri**
- Grid di 4 colonne:
  - Esercizio (Select/ComboBox con "Tutti" + lista esercizi).
  - Rep Range (Select con "Tutti" + REP_RANGES).
  - Tecnica (Select con "Tutti" + TECHNIQUES).
  - Risultati (Testo: "XX sessioni trovate").

**Sezione 2: Tabella Storico**
- Table di ShadcnUI con ordinamento per data (più recente in alto).
- **Colonne:**
  - Data
  - Week
  - Esercizio
  - Tecnica
  - Rep Range
  - Reps (Fatto/Target) (es. "86 / 90").
  - Completamento (es. Progress di ShadcnUI + "%". Colore dinamico: Verde ≥90%, Giallo 75-89%, Rosso <75%).
  - Tonnellaggio
  - RPE Reale (Media RPE. es. Badge di ShadcnUI. Colore dinamico: Verde <7, Giallo 7-7.9, Arancione 8-8.9, Rosso ≥9).

**Sezione 3: Grafici Progressioni**
- Vedi "Specifiche Grafici Dettagliate" (Sezione 8). Da implementare con Recharts.

### 4.4. Modal: Log Sessione
- Utilizzare Dialog o Drawer di ShadcnUI.

**Header (Sticky):**
- Titolo: "📝 Log Sessione".
- Sottotitolo: Nome dell'esercizio.
- Info: Tecnica + Schema (se presente).

**Body (Scrollabile):**
- **CASO 1: Tecnica = "Normale"**
  - Genera N righe (uno per setNum).
  - Ogni riga: Set X: [__] reps × [__] kg RPE [__]
  - Pre-compilare reps da repsBase e load da targetLoad.
- **CASO 2: Tecnica ≠ "Normale" (con Schema)**
  - Parsare lo schema (es. "10+10+10").
  - Generare N gruppi (uno per setNum).
  - Ogni gruppo ha M righe (una per clusterNum).
  - **Esempio:**
    - Set 1
      - Cluster 1: [10] reps × [80] kg RPE []
      - Cluster 2: [10] reps × [80] kg RPE []
      - Cluster 3: [10] reps × [80] kg RPE []
    - Set 2
      - Cluster 1: [10] reps × [80] kg RPE []
      - ...

**Funzionalità Input:**
- Input reps e load pre-compilati, ma editabili.
- Input RPE (5.0-10.0, step 0.5).
- Pulsante "+ Aggiungi Set".
- Icona Trash2 per rimuovere set/cluster.

**Box Riepilogo (Live Update):**
- Card o Alert che mostra i totali calcolati in tempo reale:
  - Reps Totali
  - Tonnellaggio (kg)
  - RPE Medio

**Footer (Sticky):**
- Pulsante "✅ Salva Sessione".

---

## 🎨 5. Design System (Linee Guida per ShadcnUI)
L'implementazione userà ShadcnUI, che gestisce il design system. Le seguenti sono le linee guida cromatiche e tipografiche originali da mappare ai temi di ShadcnUI.

**Colori (Tema):**
- Primary/Accent: Viola/Blu (es. from-purple-600 to-blue-600).
- Success: Verde (es. from-green-500 to-emerald-500).
- Warning: Giallo/Arancione (es. from-yellow-500 to-orange-500).
- Destructive: Rosso (es. from-orange-500 to-red-500).
- Background: Sfondo scuro (Dark Mode) o grigio molto chiaro (Light Mode) con il gradiente originale `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` usato come elemento decorativo (es. background del body o header).

**Componenti:**
- Card: Usare le Card di ShadcnUI.
- Button: Usare i Button di ShadcnUI, applicando varianti (primary, destructive, outline).
- Input, Select, Tabs, Dialog, Tooltip, Progress, Badge, Alert: Usare i componenti standard di ShadcnUI.

**Icone:**
- Utilizzare lucide-react, come raccomandato da ShadcnUI.
- Icone chiave: Plus, Trash2, Copy, BookOpen, Dumbbell, TrendingUp, X, ClipboardList.

---

## 🔧 6. Implementazione Tecnica (Linee Guida)
**Tech Stack:**
- React 18+ (con Hooks).
- Tailwind CSS.
- ShadcnUI (per i componenti UI).
- Recharts (o simile, per i grafici).
- lucide-react (per le icone).

**State Management:**
- Utilizzare React Context o Zustand per lo stato globale.

**Stati Globali Necessari:**
- `currentTab` (stringa: 'library', 'program', 'logbook')
- `currentWeek` (numero)
- `exercises` (array `Exercise[]`)
- `weeks` (oggetto `Record<number, Week>`)
- `loggedSessions` (array `LoggedSession[]`)
- `macros` (oggetto `Record<number, WeekMacros>`)

**Stati Locali (per Modal/Filtri):**
- `showLogModal` (boolean)
- `currentLogExercise` (oggetto `ProgramExercise` da loggare)
- `tempLogSets` (array `LoggedSet[]` per il modal)
- `logbookFilters` (oggetto per i filtri del logbook)

**Key Functions (Logica di Business):**
- `parseSchema(schema: string): number[]`: Converte "10+5+5" in [10, 5, 5].
- `calculateTargetReps(exercise: ProgramExercise): number`: Calcola le reps target (vedi Sezione 3.3).
- `calculateVolume(weekNum: number)`: Calcola volume totale e byMuscle (vedi Sezione 3.1).
- `openLogModal(weekNum, dayIndex, exerciseIndex)`: Prepara lo stato `tempLogSets` per il modal (vedi Sezione 4.4).
- `saveLogSession()`: Calcola le metriche finali (`totalReps`, `totalTonnage`, `avgRPE`, `completion`) e salva la sessione in `loggedSessions`.
- `getFilteredSessions()`: Applica i filtri del logbook a `loggedSessions`.

**Grafici:**
- Implementare i 5 grafici (vedi Sezione 8) usando Recharts, mappando i dati calcolati alle componenti `BarChart`, `LineChart`, ecc.

### 6.1. Auto-save in localStorage (Opzionale)
Per la persistenza dei dati senza backend.

useEffect(() => {
  // Carica dati all'avvio
  const saved = localStorage.getItem('bodybuilding-data');
  if (saved) {
    const data = JSON.parse(saved);
    setExercises(data.exercises || DEFAULT_EXERCISES);
    setWeeks(data.weeks || { 1: { days: [] } });
    setLoggedSessions(data.loggedSessions || []);
    setMacros(data.macros || { 1: {} });
  }
}, []);

useEffect(() => {
  // Salva dati ad ogni modifica (debounced)
  const timeoutId = setTimeout(() => {
    localStorage.setItem('bodybuilding-data', JSON.stringify({
      exercises,
      weeks,
      loggedSessions,
      macros
    }));
  }, 500); // debounce 500ms
  
  return () => clearTimeout(timeoutId);
}, [exercises, weeks, loggedSessions, macros]);

// Pulsante "Reset All Data" (conferma necessaria)
const handleReset = () => {
  // Sostituire confirm() con un Dialog/Alert di ShadcnUI
  if (confirm('Cancellare tutti i dati? Questa azione è irreversibile!')) {
    localStorage.removeItem('bodybuilding-data');
    window.location.reload();
  }
};

### 6.2. Export CSV (Bonus Feature)
function exportToCSV() {
  let csv = 'BODYBUILDING TRACKER EXPORT\n\n';
  
  // Esercizi
  csv += 'LIBRERIA ESERCIZI\n';
  csv += 'Nome,Muscolo 1,%,Muscolo 2,%,Muscolo 3,%\n';
  exercises.forEach(ex => {
    csv += `"${ex.name}"`;
    for (let i = 0; i < 3; i++) {
      if (ex.muscles[i]) {
        csv += `,"${ex.muscles[i].muscle}",${ex.muscles[i].percent}`;
      } else {
        csv += ',,';
      }
    }
    csv += '\n';
  });
  
  csv += '\n\nSCHEDA\n';
  csv += 'Week,Giorno,Esercizio,Sets,Reps,Carico,Tecnica,Schema,Coeff,Rest,Note\n';
  Object.keys(weeks).sort((a,b) => Number(a)-Number(b)).forEach(weekNum => {
    weeks[weekNum].days.forEach(day => {
      day.exercises.forEach(ex => {
        csv += `${weekNum},"${day.name}","${ex.exerciseName}",${ex.sets},"${ex.repsBase}","${ex.targetLoad}","${ex.technique}","${ex.techniqueSchema}",${ex.coefficient},${ex.rest},"${ex.notes}"\n`;
      });
    });
  });
  
  csv += '\n\nSESSIONI LOGGATE\n';
  csv += 'Data,Week,Esercizio,Tecnica,Rep Range,Reps,Target,Completamento,Tonnage,RPE\n';
  loggedSessions.forEach(s => {
    csv += `${s.date},${s.weekNum},"${s.exercise}","${s.technique}","${s.repRange}",${s.totalReps},${s.targetReps},${s.completion}%,${s.totalTonnage},${s.avgRPE}\n`;
  });
  
  csv += '\n\nMACROS\n';
  csv += 'Week,Kcal,Protein,Carbs,Fat,Note\n';
  Object.keys(macros).sort((a,b) => Number(a)-Number(b)).forEach(weekNum => {
    const m = macros[weekNum];
    if (m) { // Aggiunto controllo null
      csv += `${weekNum},${m.kcal || ''},${m.protein || ''},${m.carbs || ''},${m.fat || ''},"${m.notes || ''}"\n`;
    }
  });
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `bodybuilding-tracker-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// Aggiungere un <Button> in UI per chiamare exportToCSV
/*
<Button onClick={exportToCSV}>
  <Download size={20} />
  Esporta CSV
</Button>
*/

---

## ✅ 7. Checklist delle Feature
**Libreria**
- [ ] CRUD completo per gli esercizi.
- [ ] Gestione distribuzione muscolare (max 3 muscoli, totale 100%).
- [ ] Validazione 100% sul salvataggio.

**Scheda**
- [ ] Gestione multi-settimana (Aggiungi / Duplica / Seleziona).
- [ ] Gestione multi-giorno per settimana.
- [ ] Tabella esercizi con tutti i campi (Select, Input, ...).
- [ ] Logica condizionale: Reps disabilitato se Tecnica ≠ Normale.
- [ ] Logica condizionale: Schema abilitato SOLO se Tecnica ≠ Normale.
- [ ] Calcolo live del "Volume Summary" (4 card).
- [ ] Dettaglio "Volume per Gruppo Muscolare".
- [ ] Sezione Macros per settimana.

**Log Modal**
- [ ] Apertura modal tramite pulsante "📝".
- [ ] Pre-compilazione campi (Reps e Load) dalla scheda.
- [ ] Logica Tecnica Normale: Genera N righe (1 per set).
- [ ] Logica Tecniche Speciali: Genera N×M righe (Set × Cluster) con label "Set X".
- [ ] Box riepilogo con calcolo live (Reps, Tonnage, RPE).
- [ ] Salvataggio sessione nello stato `loggedSessions` (con tutti i campi calcolati).

**Logbook**
- [ ] Filtri funzionanti (Esercizio, Rep Range, Tecnica).
- [ ] Tabella storico ordinata per data (DESC).
- [ ] Colonna "Reps (fatto/target)" con formattazione corretta.
- [ ] Colonna "Completamento" con Progress bar colorata.
- [ ] Colonna "RPE Reale" con Badge colorato.

**Grafici (con Recharts)**
- [ ] Grafico 1: Volume Totale per Settimana (Barre verticali).
- [ ] Grafico 2: Volume per Gruppo Muscolare (Barre orizzontali + filtri Week/Muscolo).
- [ ] Grafico 3: Tonnellaggio nel Tempo (Barre verticali, basato sui filtri).
- [ ] Grafico 4: RPE Reale nel Tempo (Barre orizzontali colorate, basato sui filtri).
- [ ] Grafico 5: Progressione Carico (Linea + Punti, con 3 filtri dedicati).

---

## 📊 8. Specifiche Grafici Dettagliate (per Recharts)

### GRAFICO 1: Volume Totale per Settimana
- **Tipo:** BarChart (verticale).
- **Posizione:** Logbook, primo grafico.
- **Dati:** Array calcolato:

// Calcola il volume totale per ogni settimana
const weeklyVolumes = Object.keys(weeks).map(weekNum => {
  const vol = calculateVolume(weekNum); // Funzione da Sezione 3.1
  return {
    week: `W${weekNum}`,
    volume: vol.total
  };
});

- **Asse X:** `week` (es. "W1", "W2").
- **Asse Y:** `volume`.
- **Barra:** Colore primario (viola/blu).
- **Tooltip (on hover):** Mostra "Week {n}: {volume} volume".

### GRAFICO 2: Volume per Gruppo Muscolare (Settimana Selezionata)
- **Tipo:** BarChart (orizzontale).
- **Posizione:** Logbook, secondo grafico.
- **Controlli (Dropdown):**
  - Selezione Settimana (es. Select con `Object.keys(weeks)`).
  - Filtro Muscolo (es. Select con "Tutti i muscoli" + `MUSCLE_GROUPS`).
- **Dati:** Array calcolato dinamicamente:

// Calcola volumi per la settimana selezionata
const volumeData = calculateVolume(selectedWeekForGraph);
const muscleData = Object.entries(volumeData.byMuscle)
  .filter(([muscle]) =>
    selectedMuscleFilter === 'all' || muscle === selectedMuscleFilter
  )
  .sort((a, b) => b[1] - a[1]); // Ordina DESC

// Formato per Recharts: [{ name: "Petto", volume: 4.8 }, ...]

- **Asse X:** volume.
- **Asse Y:** name (nome muscolo).
- **Barra:** Colore primario (blu/indaco). Mostrare Label con il valore.

### GRAFICO 3: Tonnellaggio nel Tempo
- **Tipo:** BarChart (verticale).
- **Posizione:** Logbook, terzo grafico.
- **Dati:** Aggregati da `getFilteredSessions()` (rispetta i filtri principali).

// Aggrega tonnellaggio per settimana dalle sessioni filtrate
const tonnageByWeek = getFilteredSessions().reduce((acc, session) => {
  const weekKey = `W${session.weekNum}`;
  acc[weekKey] = (acc[weekKey] || 0) + session.totalTonnage;
  return acc;
}, {});

// Formato per Recharts: [{ week: "W1", tonnage: 5000 }, ...]

- **Asse X:** week.
- **Asse Y:** tonnage.
- **Barra:** Colore "Warning" (giallo/arancione).

### GRAFICO 4: RPE Reale nel Tempo
- **Tipo:** BarChart (orizzontale).
- **Posizione:** Logbook, quarto grafico.
- **Dati:** Direttamente da `getFilteredSessions()`, ordinati per data (ASC).

const rpeData = getFilteredSessions()
  .sort((a, b) => new Date(a.date) - new Date(b.date))
  .map(s => ({
    date: s.date,
    rpe: s.avgRPE,
    // Dati extra per il tooltip/label
    reps: `${s.totalReps}/${s.targetReps}`,
    completion: s.completion
  }));

- **Asse X:** `rpe` (max 10).
- **Asse Y:** `date`.
- **Barra:** Colore dinamico per ogni cella (Cell di Recharts) in base al valore RPE (Verde <7, Giallo 7-7.9, Arancione 8-8.9, Rosso ≥9).
- **Label (dentro barra):** Mostra RPE, reps e completamento.

### GRAFICO 5: Progressione Carico per Rep Range (⭐ IL PIÙ IMPORTANTE)
- **Tipo:** LineChart (con punti).
- **Posizione:** Logbook, quinto grafico.
- **Controlli (3 Dropdown dedicati):**
  - Esercizio (Select con `exercises`).
  - Rep Range (Select con `REP_RANGES`).
  - Tecnica (Select con "Tutte" + `TECHNIQUES`).
- **Stato "Vuoto":** Se l'esercizio non è selezionato, mostrare un placeholder (es. icona TrendingUp e testo "Seleziona esercizio...").
- **Dati:** Array calcolato dinamicamente in base ai 3 filtri:

const progressionSessions = loggedSessions.filter(s => {
  if (progExercise && s.exercise !== progExercise) return false;
  if (progRepRange && s.repRange !== progRepRange) return false;
  if (progTechnique && s.technique !== progTechnique) return false;
  return true;
}).sort((a, b) => new Date(a.date) - new Date(b.date)); // Ordina per data ASC

const progressionData = progressionSessions.map(s => {
  // Calcola carico medio per quella sessione
  const avgLoad = s.sets.reduce((sum, set) =>
    sum + parseFloat(set.load), 0
  ) / s.sets.length;

  return {
    date: s.date,
    week: `W${s.weekNum}`,
    avgLoad: Math.round(avgLoad * 10) / 10,
    // Dati extra per tooltip
    totalReps: s.totalReps,
    avgRPE: s.avgRPE
  };
});

- **Asse X:** `date` (o week se si preferisce raggruppare).
- **Asse Y:** `avgLoad` (carico medio in kg).
- **Linea:** Colore primario (viola).
- **Punti (Dot):** Mostra un punto per ogni sessione.
- **Tooltip (on hover punto):** Mostra data, carico esatto, reps totali e RPE medio.

---

## 🐛 9. Edge Cases da Gestire
- **Settimana senza esercizi:**
  - Mostra placeholder: "Nessun esercizio in questa settimana".
  - Pulsante "+ Aggiungi Giorno" ben visibile.
- **Log sessione senza RPE inserito:**
  - Permetti salvataggio ma: `avgRPE = 0` o `null`.
  - Mostra "-" nella tabella e badge grigio "N/A".
- **Schema tecnica vuoto:**
  - Se `technique ≠ "Normale"` ma `techniqueSchema` è vuoto:
    - Mostra bordo rosso (o stato destructive di ShadcnUI) sul campo.
    - Disabilita pulsante "Log" finché non è valido.
- **Filtri logbook senza risultati:**
  - Mostra messaggio: "Nessuna sessione trovata con questi filtri."
- **Eliminazione ultimo esercizio di un giorno:**
  - Mostra un `AlertDialog` di ShadcnUI: "Non puoi eliminare l'ultimo esercizio. Elimina l'intero giorno se non serve."
- **Eliminazione settimana con sessioni loggate:**
  - Mostra `AlertDialog`: "Questa settimana ha {n} sessioni loggate. Eliminarla cancellerà anche i log. Continuare?"
- **Cambio esercizio in scheda con sessioni già loggate:**
  - Mostra `AlertDialog` o `Toast`: "⚠️ Hai già {n} sessioni loggate per questo esercizio. Cambiarle influenzerà i dati storici."
- **Grafico progressione carico senza dati:**
  - Mostra icona TrendingUp + messaggio: "📊 Nessun dato disponibile. Logga almeno 2 sessioni per vedere la progressione."
- **Mobile/Tablet:**
  - Tabelle: Devono essere responsive (es. `overflow-x-auto`).
  - Grafici: Devono ridimensionarsi (`ResponsiveContainer` di Recharts).
  - Modal log: Usare `Drawer` di ShadcnUI su mobile.
- **Performance con molte settimane (50+):**
  - Considerare virtualizzazione per tabella logbook (es. TanStack Table).
  - Debounce dei calcoli di volume (500ms).

---

## 📱 10. Responsive Breakpoints (Linee Guida)
L'approccio è Mobile-First, gestito nativamente da Tailwind CSS.

- **Default (Mobile < 640px):**
  - Stack in colonna singola.
  - Tabelle: `overflow-x-auto`.
  - Grafici: Altezza ridotta (es. `h-[200px]`).
  - Modal: Drawer (full-screen).
- **sm (640px - 767px):**
  - Grid a 2 colonne dove possibile (es. Card metriche).
- **md (768px - 1023px):**
  - Layout standard (Desktop-like).
  - Tabelle: Maggior parte delle colonne visibili.
- **lg (1024px+):**
  - Layout ottimale, `max-w-7xl` (1280px) centrato.
  - Grafici: Dimensioni piene (es. `h-[300px]` o `h-[400px]`).

---

## 🎨 11. Esempi Componenti Riutilizzabili (Riferimento Concettuale)
> Nota: L'implementazione userà ShadcnUI. Questi sono esempi concettuali del design system precedente.

**Button Component (Concetto):**

function Button({
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'success'
  size = 'md',         // 'sm' | 'md' | 'lg'
  icon: Icon,
  children,
  ...props
}) {
  // ... Logica per mappare props a classi Tailwind ...
  // Corrisponde a <Button variant="..." size="..." /> di ShadcnUI
}

**Card Component (Concetto):**

function Card({ title, children, actions }) {
  return (
    // Corrisponde a:
    // <Card>
    //   <CardHeader>
    //     <CardTitle>{title}</CardTitle>
    //     {actions}
    //   </CardHeader>
    //   <CardContent>{children}</CardContent>
    // </Card>
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* ... */}
    </div>
  );
}

**Input Component (Concetto):**

function Input({
  label,
  error,
  disabled,
  tooltip,
  ...props
}) {
  return (
    // Corrisponde a:
    // <Label htmlFor="...">{label}</Label>
    // <Input disabled={disabled} {...props} />
    // <Tooltip>{tooltip}</Tooltip>
    // <p className="text-sm text-destructive">{error}</p>
    <div className="relative">
      {/* ... */}
    </div>
  );
}

**Badge Component (Concetto):**

function Badge({ children, variant = 'default' }) {
  // Corrisponde a <Badge variant="..." /> di ShadcnUI
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };
  
  return (
    <span className={`
      ${variants[variant]}
      px-2 py-1 rounded text-xs font-bold
    `}>
      {children}
    </span>
  );
}
```
