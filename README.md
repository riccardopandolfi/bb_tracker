# 📋 Bodybuilding Tracker Pro

Applicazione web React completa per la programmazione e il tracciamento avanzato di allenamenti di bodybuilding.

## 🎯 Obiettivi del Progetto

L'applicazione consente all'utente di:

- 📚 Gestire una libreria di esercizi personalizzabile con assegnazione di gruppi muscolari
- 📅 Pianificare schede di allenamento settimanali con tecniche avanzate
- 📝 Registrare sessioni di allenamento con dettagli set-per-set
- 📊 Analizzare progressioni nel tempo tramite grafici interattivi
- 🎯 Tracciare nutrizione e macronutrienti settimanali

---

## 📚 Struttura Dati

### 1. Libreria Esercizi (Exercise Library)

Definisce ogni esercizio e i gruppi muscolari primari e secondari coinvolti.

#### Gruppi Muscolari Supportati

```
Petto, Dorso - Lats, Dorso - Upper Back, Dorso - Trapezi,
Deltoidi - Anteriore, Deltoidi - Laterale, Deltoidi - Posteriore,
Bicipiti, Tricipiti, Avambracci,
Quadricipiti, Femorali, Glutei, Polpacci,
Adduttori, Abduttori, Addome, Obliqui, Core
```

#### Interfaccia Exercise

```typescript
interface Exercise {
  name: string;
  muscles: Array<{
    muscle: string;  // Uno dei gruppi muscolari
    percent: number; // 0-100
  }>; // Massimo 3 muscoli per esercizio
}
```

**Esempi:**

```json
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
```

### 2. Programma (Program - Pianificazione Scheda)

Definisce la struttura delle schede di allenamento, suddivise in settimane e giorni.

#### Rep Ranges Disponibili

| Label | Valore | Focus |
|-------|--------|-------|
| 1-5 | 1-5 | Forza |
| 6-8 | 6-8 | Forza-Ipertrofia |
| 8-12 | 8-12 | Ipertrofia |
| 12-20 | 12-20 | Pump |
| 20+ | 20+ | Endurance |

#### Tecniche di Allenamento

- **Normale** - Esecuzione standard
- **Rest-Pause** - Pausa breve tra serie per recupero parziale
- **Myo-Reps** - Serie multiple con ripetizioni in diminuzione
- **Drop-Set** - Riduzione del carico con continuità
- **Cluster Sets** - Piccoli cluster di ripetizioni
- **Reps Scalare** - Diminuire reps (es. 12-10-8-6)
- **Reps Crescente** - Aumentare reps (es. 6-8-10-12)
- **1.5 Reps** - Esecuzione parziale + completa

#### Interfaccia ProgramExercise

```typescript
interface ProgramExercise {
  exerciseName: string;        // Selezionato dalla Exercise Library
  rest: number;                // Secondi di recupero
  sets: number;                // Numero di serie
  repsBase: string;            // Es. "10" (disabilitato se technique !== "Normale")
  repRange: string;            // Categoria (valore da REP_RANGES)
  targetLoad: string;          // KG target (es. "80")
  technique: string;           // Valore da TECHNIQUES
  techniqueSchema: string;     // Es. "10+10+10" (abilitato solo se technique !== "Normale")
  coefficient: number;         // 0.0 - 2.0 (per calcolo volume)
  notes: string;
}
```

#### Strutture Gerarchiche

```typescript
interface Day {
  name: string;              // "Giorno 1", "Giorno 2", etc.
  exercises: ProgramExercise[];
}

interface Week {
  days: Day[];
}

// Stato globale
weeks: Record<number, Week>; // Es. { 1: Week, 2: Week, ... }
```

### 3. Sessioni Loggate (Logged Sessions)

Definisce i dati registrati dopo il completamento di un allenamento.

#### Interfaccia LoggedSet

```typescript
interface LoggedSet {
  reps: string;       // Reps effettive
  load: string;       // KG usati
  rpe: string;        // RPE effettivo (5.0 - 10.0)
  setNum: number;     // Numero del set (1, 2, 3...)
  clusterNum: number; // Numero del cluster (1, 2, 3...)
}
```

#### Interfaccia LoggedSession

```typescript
interface LoggedSession {
  id: number;                 // Timestamp (ID univoco)
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
```

### 4. Macros

```typescript
interface WeekMacros {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  notes: string;
}

// Stato globale
macros: Record<number, WeekMacros>; // Es. { 1: WeekMacros, 2: WeekMacros, ... }
```

---

## 🧮 Logica e Calcoli

### Volume (A Priori)

Calcolato prima dell'allenamento, basandosi solo sulla pianificazione.

**Formula:** `Volume = Sets × Coefficient`

**Nota:** Il volume NON dipende dalle reps pianificate.

**Esempi:**
- 4 sets × 1.0 = 4.0 volume
- 3 sets × 1.3 = 3.9 volume
- 5 sets × 0.7 = 3.5 volume

**Distribuzione per Muscolo:**

Il volume di ogni esercizio viene distribuito ai gruppi muscolari in base alle percentuali.

Esempio: Panca Piana (4.0 volume) con muscoli [Petto 80%, Tricipiti 20%]
- Petto: 3.2 volume
- Tricipiti: 0.8 volume

### RPE Stimato (A Priori)

L'RPE stimato deriva direttamente dal coefficiente impostato.

| Coefficient | RPE Stimato |
|-------------|------------|
| ≤ 0.7 | 5.5 |
| ≤ 0.9 | 7.5 |
| ≤ 1.0 | 8.5 |
| > 1.0 | 10.0 |

### Target Reps (per Calcolo Completamento)

#### Se Tecnica ≠ "Normale" e `techniqueSchema` è presente:

1. Parse dello schema (es. "10+10+10" → [10, 10, 10])
2. Somma dello schema (es. 10+10+10 = 30 reps per set)
3. Target Reps = (Somma Schema) × sets

**Esempi:**
- 3 sets × (10+10+10) = 90 target reps
- 1 set × (15+5+5+5+5) = 35 target reps

#### Se Tecnica = "Normale":

Target Reps = repsBase × sets

**Esempio:** 4 sets × 10 reps = 40 target reps

### Metriche Post-Log

Calcolate al momento del salvataggio del log:

- **totalReps:** Somma di set.reps per tutti i LoggedSet
- **totalTonnage:** Somma di (set.reps × set.load) per tutti i LoggedSet
- **avgRPE:** Media di set.rpe per tutti i LoggedSet (ignorando set senza RPE)

### Validazione Schema Tecnica

Lo schema deve seguire il formato `numero+numero+numero...`:

```typescript
function validateSchema(schema) {
  if (!schema) return false;
  
  // Formato valido: "10+10+10" o "15+5+5+5"
  const parts = schema.split('+');
  
  if (parts.length < 2) return false;
  
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num > 0;
  });
}
```

### Comportamento Cambio Tecnica

Quando la tecnica viene modificata:

```typescript
function handleTechniqueChange(weekNum, dayIndex, exIndex, newTechnique) {
  updateDayExercise(weekNum, dayIndex, exIndex, 'technique', newTechnique);
  
  if (newTechnique !== 'Normale') {
    // Disabilita repsBase
    updateDayExercise(weekNum, dayIndex, exIndex, 'repsBase', '');
  } else {
    // Abilita repsBase
    updateDayExercise(weekNum, dayIndex, exIndex, 'techniqueSchema', '');
    updateDayExercise(weekNum, dayIndex, exIndex, 'repsBase', '10');
  }
}
```

---

## 🎨 UI/UX e Componenti

### Struttura Principale

L'applicazione è divisa in 4 sezioni principali:

1. **Exercise Library** - Gestione esercizi
2. **Program Planning** - Pianificazione schede
3. **Session Logging** - Registrazione allenamenti
4. **Logbook & Analytics** - Visualizzazione dati e grafici

### Componenti ShadcnUI Utilizzati

- **Card** - Container per sezioni
- **Button** - Pulsanti di azione
- **Input** - Campi testo
- **Select** - Dropdown
- **Tabs** - Navigazione tra sezioni
- **Dialog** - Modal per form
- **AlertDialog** - Conferme critiche
- **Tooltip** - Aiuto contestuale
- **Badge** - Etichette di stato
- **Table** - Visualizzazione tabellare
- **Drawer** - Pannello laterale (mobile)

### Design System

- **Colore Primario:** Viola/Indaco
- **Colore Warning:** Giallo/Arancione
- **Colore Success:** Verde
- **Colore Danger:** Rosso
- **Font:** Sistema nativa (San Francisco, Segoe UI, etc.)
- **Spaziatura:** Scala 4px (4, 8, 12, 16, 24, 32...)

---

## 📊 Grafici e Analytics

### GRAFICO 1: Volume nel Tempo

**Tipo:** BarChart verticale  
**Posizione:** Logbook, primo grafico

Mostra il volume totale per settimana.

```typescript
const volumeByWeek = calculateVolume()
  .reduce((acc, { week, volume }) => {
    acc[week] = (acc[week] || 0) + volume;
    return acc;
  }, {});

// Formato: [{ week: "W1", volume: 12.5 }, ...]
```

- **Asse X:** Week (es. "W1", "W2")
- **Asse Y:** Volume totale
- **Colore Barra:** Viola/Blu primario
- **Tooltip:** "Week {n}: {volume} volume"

### GRAFICO 2: Volume per Gruppo Muscolare

**Tipo:** BarChart orizzontale  
**Posizione:** Logbook, secondo grafico

Mostra volume per muscolo nella settimana selezionata.

**Controlli:**
- Dropdown per selezionare settimana
- Dropdown per filtrare gruppo muscolare

```typescript
const volumeData = calculateVolume(selectedWeek);
const muscleData = Object.entries(volumeData.byMuscle)
  .filter(([muscle]) => selectedMuscleFilter === 'all' || muscle === selectedMuscleFilter)
  .sort((a, b) => b[1] - a[1]);
// Formato: [{ name: "Petto", volume: 4.8 }, ...]
```

- **Asse X:** Volume
- **Asse Y:** Nome muscolo
- **Label:** Valore volume sulla barra

### GRAFICO 3: Tonnellaggio nel Tempo

**Tipo:** BarChart verticale  
**Posizione:** Logbook, terzo grafico

Aggrega tonnellaggio per settimana dalle sessioni filtrate.

```typescript
const tonnageByWeek = getFilteredSessions()
  .reduce((acc, session) => {
    const weekKey = `W${session.weekNum}`;
    acc[weekKey] = (acc[weekKey] || 0) + session.totalTonnage;
    return acc;
  }, {});
// Formato: [{ week: "W1", tonnage: 5000 }, ...]
```

- **Asse X:** Week
- **Asse Y:** Tonnage
- **Colore Barra:** Giallo/Arancione

### GRAFICO 4: RPE Reale nel Tempo

**Tipo:** BarChart orizzontale  
**Posizione:** Logbook, quarto grafico

Mostra RPE medio per sessione ordinato cronologicamente.

```typescript
const rpeData = getFilteredSessions()
  .sort((a, b) => new Date(a.date) - new Date(b.date))
  .map(s => ({
    date: s.date,
    rpe: s.avgRPE,
    reps: `${s.totalReps}/${s.targetReps}`,
    completion: s.completion
  }));
```

- **Asse X:** RPE (max 10)
- **Asse Y:** Data
- **Colore Dinamico per barra:**
  - Verde: RPE < 7
  - Giallo: RPE 7-7.9
  - Arancione: RPE 8-8.9
  - Rosso: RPE ≥ 9
- **Label:** RPE, reps e completamento

### GRAFICO 5: Progressione Carico per Rep Range ⭐

**Tipo:** LineChart con punti  
**Posizione:** Logbook, quinto grafico  
**Importanza:** CRITICO

**Controlli (3 Dropdown):**
- Esercizio
- Rep Range
- Tecnica ("Tutte" + tutte le tecniche)

**Stato Vuoto:** Placeholder con icona TrendingUp e testo "Seleziona esercizio..."

```typescript
const progressionSessions = loggedSessions
  .filter(s => {
    if (progExercise && s.exercise !== progExercise) return false;
    if (progRepRange && s.repRange !== progRepRange) return false;
    if (progTechnique && s.technique !== progTechnique) return false;
    return true;
  })
  .sort((a, b) => new Date(a.date) - new Date(b.date));

const progressionData = progressionSessions.map(s => {
  const avgLoad = s.sets.reduce((sum, set) => 
    sum + parseFloat(set.load), 0
  ) / s.sets.length;

  return {
    date: s.date,
    week: `W${s.weekNum}`,
    avgLoad: Math.round(avgLoad * 10) / 10,
    totalReps: s.totalReps,
    avgRPE: s.avgRPE
  };
});
```

- **Asse X:** Data (o Week se raggruppato)
- **Asse Y:** Carico medio (kg)
- **Linea:** Viola primario
- **Punti:** Uno per ogni sessione
- **Tooltip:** Data, carico esatto, reps totali, RPE medio

---

## 🐛 Edge Cases

| Caso | Comportamento |
|------|---------------|
| Settimana senza esercizi | Placeholder: "Nessun esercizio in questa settimana" |
| Log sessione senza RPE | Permetti salvataggio con `avgRPE = 0` o `null` |
| Schema tecnica vuoto con technique ≠ "Normale" | Bordo rosso, disabilita pulsante Log |
| Filtri logbook senza risultati | Messaggio: "Nessuna sessione trovata con questi filtri" |
| Eliminazione ultimo esercizio giorno | AlertDialog: "Non puoi eliminare l'ultimo esercizio" |
| Eliminazione settimana con log | AlertDialog: "Questa settimana ha {n} sessioni loggate..." |
| Cambio esercizio con sessioni loggate | AlertDialog: "Hai già {n} sessioni loggate..." |
| Grafico progressione senza dati | Placeholder: "📊 Nessun dato disponibile..." |
| Mobile < 640px | Stack colonna, tabelle scrollabili, grafici ridotti |
| Performance (50+ settimane) | Virtualizzazione tabella, debounce calcoli volume |

---

## 📱 Responsive Breakpoints

Approccio **Mobile-First** con Tailwind CSS.

### Default (Mobile < 640px)
- Stack in colonna singola
- Tabelle: `overflow-x-auto`
- Grafici: Altezza ridotta (es. `h-[200px]`)
- Modal: Drawer (full-screen)

### sm (640px - 767px)
- Grid 2 colonne dove possibile
- Card metriche affiancate

### md (768px - 1023px)
- Layout standard (simile desktop)
- Tabelle: Maggior parte colonne visibili

### lg (1024px+)
- Layout ottimale con `max-w-7xl` (1280px)
- Grafici: Dimensioni piene (es. `h-[300px]` a `h-[400px]`)

---

## 🛠️ Stack Tecnologico

- **Frontend:** React 18+
- **UI Library:** ShadcnUI
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **State Management:** React Hooks
- **Build:** Vite
- **Package Manager:** npm/yarn

---

## 📝 Note Implementative

### Validazione Input

- Tutti i campi numerici devono validare range/tipo
- Schema tecnica deve seguire formato `numero+numero+...`
- Coefficiente deve essere 0.0 - 2.0
- RPE deve essere 5.0 - 10.0

### Performance

- Debounce calcoli volume (500ms)
- Virtualizzazione tabella per >50 righe
- Memoization per componenti grafici
- Lazy load delle sezioni meno usate

### Persistenza

- Salvare su localStorage o backend
- Implementare backup automatico
- Permettere export/import dati

### UX Best Practices

- Confirmazione prima di eliminazioni critiche
- Toast notifiche per azioni completate
- Loading states per operazioni async
- Undo per azioni reversibili (se possibile)