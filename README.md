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
  
  // Pattern regex per "10+10+10" o "15+5+5+5"
  const pattern = /^\d+(\+\d+)*$/;
  if (!pattern.test(schema)) return false;
  
  const clusters = parseSchema(schema);
  // Almeno 2 cluster per tecniche (altrimenti è set normale)
  return clusters.length >= 2;
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

### Calcolo Completamento con Tolleranza

Per la visualizzazione nel Logbook, si usa una tolleranza per definire lo stato (badge colorati):

```typescript
function getCompletionStatus(completion) {
  if (completion >= 95) return { color: 'green', label: 'Completato' };
  if (completion >= 85) return { color: 'yellow', label: 'Quasi completato' };
  if (completion >= 70) return { color: 'orange', label: 'Parziale' };
  return { color: 'red', label: 'Incompleto' };
}
```

---

## 🎨 4. UI/UX Requirements

### 4.1. Tab 1: Libreria Esercizi

**Layout:**
- Header: Titolo "📚 Libreria Esercizi"
- Pulsante "Nuovo Esercizio"
- Lista di esercizi in Card

**Card Esercizio:**
- Input per il nome
- Sezione "Distribuzione Muscolare" (max 3):
  - Dropdown Muscolo (Select da MUSCLE_GROUPS)
  - Input Percentuale (0-100)
  - Pulsante "+ Muscolo" (visibile se muscoli < 3)
  - Icona X/Trash2 per rimuovere
  - Indicatore "Totale %" (deve essere 100%)
- Pulsante "Elimina Esercizio" (variant="destructive")

**Funzionalità:**
- CRUD completo per gli esercizi
- Aggiunta/Rimozione dinamica campi muscolo
- Validazione: Totale % deve essere 100% prima di salvare
- Feedback visivo (bordo rosso) se non valido

### 4.2. Tab 2: Scheda Allenamento

#### Sezione 1: Week Selector
- Pulsanti per selezionare settimana (ToggleGroup o Tabs)
- Pulsante "+ Nuova Week"
- Pulsante "Duplica Week" (copia settimana corrente)
- Indicatore visivo (icona Check) su settimane con sessioni loggate

#### Sezione 2: Volume Summary
- Box informativo (Alert) che spiega: **Volume = Sets × Coefficient** (NON dipende dalle reps!)
- Grid di 4 metriche (Card):
  - **Volume (A Priori):** Sets × coeff totale
  - **Tonnellaggio (Reale):** Somma tonnellaggio da sessioni loggate
  - **RPE Stimato:** Media RPE stimati da coefficient
  - **Muscoli:** Conteggio gruppi muscolari allenati

**Dettaglio Volume per Gruppo Muscolare:**
- Grid di card che mostra: Nome Muscolo, Volume calcolato, RPE Stimato

#### Sezione 3: Days & Exercises
- Componente Tabs per navigare tra giorni ("Giorno 1", "Giorno 2", ...)
- Pulsante "+ Aggiungi Giorno"
- Per ogni giorno: Table con gli esercizi

**Colonne Tabella:**

| Colonna | Tipo | Note |
|---------|------|------|
| # | Text | Ordine |
| Esercizio | Select/ComboBox | Dalla Libreria |
| Muscoli | Text | Mostrati automaticamente |
| Sets | Input number | - |
| Reps | Input text | Disabilitato se Tecnica ≠ "Normale" |
| Carico | Input text | Target Load es. "80" |
| Tecnica | Select | Dalla lista TECHNIQUES |
| Schema | Input text | Abilitato solo se Tecnica ≠ "Normale", es. "10+10+10" |
| Coeff. | Input number | 0.0-2.0, step 0.1 |
| Rest | Input number | Secondi |
| Note | Input text | - |
| Log | Button | 📝 Arancione per aprire modal |
| Del | Button | Destructive con icona Trash2 |

- Pulsante "+ Esercizio" (in fondo)
- Pulsante "Elimina Giorno"

#### Sezione 4: Macros
- Grid di 4 input: Kcal, Proteine, Carboidrati, Grassi
- Textarea per note

### 4.3. Tab 3: Logbook

#### Sezione 1: Filtri
- Grid 4 colonne:
  - Esercizio (Select con "Tutti")
  - Rep Range (Select con "Tutti")
  - Tecnica (Select con "Tutti")
  - Risultati (Testo: "XX sessioni trovate")

#### Sezione 2: Tabella Storico
- Table ordinata per data (più recente in alto)

**Colonne:**

| Colonna | Tipo | Note |
|---------|------|------|
| Data | Text | Formato ISO |
| Week | Text | "W1", "W2", ... |
| Esercizio | Text | Nome esercizio |
| Tecnica | Text | Tecnica usata |
| Rep Range | Text | Categoria |
| Reps | Badge | "86 / 90" formato |
| Completamento | Progress | Barra colorata: Verde ≥90%, Giallo 75-89%, Rosso <75% |
| Tonnellaggio | Text | Totale |
| RPE Reale | Badge | Media RPE colorata: Verde <7, Giallo 7-7.9, Arancione 8-8.9, Rosso ≥9 |

#### Sezione 3: Grafici Progressioni
- Vedi "Specifiche Grafici Dettagliate" (Sezione 8)

### 4.4. Modal: Log Sessione

**Utilizzo:** Dialog o Drawer di ShadcnUI

**Header (Sticky):**
- Titolo: "📝 Log Sessione"
- Sottotitolo: Nome dell'esercizio
- Info: Tecnica + Schema (se presente)

**Body (Scrollabile):**

#### CASO 1: Tecnica = "Normale"
- Genera N righe (uno per setNum)
- Ogni riga: `Set X: [__] reps × [__] kg RPE [__]`
- Pre-compilare reps da repsBase e load da targetLoad

#### CASO 2: Tecnica ≠ "Normale" (con Schema)
- Parsare schema (es. "10+10+10")
- Generare N gruppi (uno per setNum)
- Ogni gruppo ha M righe (una per clusterNum)

**Esempio per tecnica "Myo-Reps" con schema "10+10+10" e 2 set:**
```
Set 1
  Cluster 1: [10] reps × [80] kg RPE []
  Cluster 2: [10] reps × [80] kg RPE []
  Cluster 3: [10] reps × [80] kg RPE []
Set 2
  Cluster 1: [10] reps × [80] kg RPE []
  Cluster 2: [10] reps × [80] kg RPE []
  Cluster 3: [10] reps × [80] kg RPE []
```

**Funzionalità Input:**
- Input reps e load pre-compilati, ma editabili
- Input RPE (5.0-10.0, step 0.5)
- Pulsante "+ Aggiungi Set"
- Icona Trash2 per rimuovere set/cluster

**Box Riepilogo (Live Update):**
- Card/Alert che mostra in tempo reale:
  - Reps Totali
  - Tonnellaggio (kg)
  - RPE Medio

**Footer (Sticky):**
- Pulsante "✅ Salva Sessione"

---

## 🎨 5. Design System (ShadcnUI)

### Colori (Tema)

| Elemento | Colore | Tailwind Class |
|----------|--------|-----------------|
| Primary/Accent | Viola/Blu | from-purple-600 to-blue-600 |
| Success | Verde | from-green-500 to-emerald-500 |
| Warning | Giallo/Arancione | from-yellow-500 to-orange-500 |
| Destructive | Rosso | from-orange-500 to-red-500 |
| Background | Scuro/Chiaro | Dark Mode o Light Mode |

### Componenti ShadcnUI

- **Card** - Container per sezioni
- **Button** - Pulsanti di azione (varianti: primary, destructive, outline)
- **Input** - Campi testo
- **Select** - Dropdown
- **Tabs** - Navigazione tra sezioni
- **Dialog** - Modal per form
- **Drawer** - Panel (specialmente mobile)
- **AlertDialog** - Conferme critiche
- **Tooltip** - Aiuto contestuale
- **Badge** - Etichette di stato
- **Table** - Visualizzazione tabellare
- **Progress** - Barre di avanzamento
- **Alert** - Messaggi informativi

### Icone (lucide-react)

Icone chiave consigliate:
- `Plus` - Aggiungi
- `Trash2` - Elimina
- `Copy` - Duplica
- `BookOpen` - Libreria
- `Dumbbell` - Allenamento
- `TrendingUp` - Progressione
- `X` - Chiudi
- `ClipboardList` - Log
- `Download` - Esporta

### Tipografia

- **Font:** Sistema nativa (San Francisco, Segoe UI, etc.)
- **Spaziatura:** Scala 4px (4, 8, 12, 16, 24, 32...)
- **Heading:** Bold
- **Body:** Regular
- **Caption:** Regular, 12px

---

## 🔧 6. Implementazione Tecnica

### Tech Stack

- **React 18+** - Framework con Hooks
- **Tailwind CSS** - Styling
- **ShadcnUI** - Componenti UI
- **Recharts** - Grafici interattivi
- **lucide-react** - Icone

### State Management

- **Context API o Zustand** per stato globale

### Stati Globali Necessari

```typescript
- currentTab: 'library' | 'program' | 'logbook'
- currentWeek: number
- exercises: Exercise[]
- weeks: Record<number, Week>
- loggedSessions: LoggedSession[]
- macros: Record<number, WeekMacros>
```

### Stati Locali

```typescript
- showLogModal: boolean
- currentLogExercise: ProgramExercise
- tempLogSets: LoggedSet[]
- logbookFilters: {
    exercise?: string;
    repRange?: string;
    technique?: string;
  }
```

### Key Functions

```typescript
parseSchema(schema: string): number[]
// Converte "10+5+5" in [10, 5, 5]

calculateTargetReps(exercise: ProgramExercise): number
// Calcola le reps target (vedi Sezione 3.3)

calculateVolume(weekNum: number)
// Calcola volume totale e byMuscle (vedi Sezione 3.1)

openLogModal(weekNum, dayIndex, exerciseIndex)
// Prepara lo stato tempLogSets per il modal

saveLogSession()
// Calcola metriche finali e salva in loggedSessions

getFilteredSessions()
// Applica i filtri del logbook a loggedSessions
```

### Auto-save in localStorage (Opzionale)

```typescript
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

// Pulsante "Reset All Data"
const handleReset = () => {
  if (confirm('Cancellare tutti i dati? Questa azione è irreversibile!')) {
    localStorage.removeItem('bodybuilding-data');
    window.location.reload();
  }
};
```

### Export CSV (Bonus Feature)

```typescript
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
    if (m) {
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

// Aggiungere in UI:
// <Button onClick={exportToCSV}>
//   <Download size={20} />
//   Esporta CSV
// </Button>
```

---

## ✅ 7. Checklist delle Feature

### Libreria
- [ ] CRUD completo per gli esercizi
- [ ] Gestione distribuzione muscolare (max 3 muscoli, totale 100%)
- [ ] Validazione 100% sul salvataggio

### Scheda
- [ ] Gestione multi-settimana (Aggiungi / Duplica / Seleziona)
- [ ] Gestione multi-giorno per settimana
- [ ] Tabella esercizi con tutti i campi (Select, Input, ...)
- [ ] Logica condizionale: Reps disabilitato se Tecnica ≠ Normale
- [ ] Logica condizionale: Schema abilitato SOLO se Tecnica ≠ Normale
- [ ] Calcolo live del "Volume Summary" (4 card)
- [ ] Dettaglio "Volume per Gruppo Muscolare"
- [ ] Sezione Macros per settimana

### Log Modal
- [ ] Apertura modal tramite pulsante "📝"
- [ ] Pre-compilazione campi (Reps e Load) dalla scheda
- [ ] Logica Tecnica Normale: Genera N righe (1 per set)
- [ ] Logica Tecniche Speciali: Genera N×M righe (Set × Cluster)
- [ ] Box riepilogo con calcolo live (Reps, Tonnage, RPE)
- [ ] Salvataggio sessione nello stato loggedSessions

### Logbook
- [ ] Filtri funzionanti (Esercizio, Rep Range, Tecnica)
- [ ] Tabella storico ordinata per data (DESC)
- [ ] Colonna "Reps (fatto/target)" con formattazione corretta
- [ ] Colonna "Completamento" con Progress bar colorata
- [ ] Colonna "RPE Reale" con Badge colorato

### Grafici (con Recharts)
- [ ] Grafico 1: Volume Totale per Settimana (Barre verticali)
- [ ] Grafico 2: Volume per Gruppo Muscolare (Barre orizzontali + filtri)
- [ ] Grafico 3: Tonnellaggio nel Tempo (Barre verticali)
- [ ] Grafico 4: RPE Reale nel Tempo (Barre orizzontali colorate)
- [ ] Grafico 5: Progressione Carico (Linea + Punti, 3 filtri dedicati)

---

## 📊 8. Specifiche Grafici Dettagliate (Recharts)

### GRAFICO 1: Volume Totale per Settimana

**Tipo:** BarChart verticale  
**Posizione:** Logbook, primo grafico

```typescript
const weeklyVolumes = Object.keys(weeks).map(weekNum => {
  const vol = calculateVolume(weekNum);
  return {
    week: `W${weekNum}`,
    volume: vol.total
  };
});
```

- **Asse X:** Week (es. "W1", "W2")
- **Asse Y:** Volume totale
- **Colore Barra:** Viola/Blu primario
- **Tooltip:** "Week {n}: {volume} volume"

### GRAFICO 2: Volume per Gruppo Muscolare

**Tipo:** BarChart orizzontale  
**Posizione:** Logbook, secondo grafico

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
- **Asse Y:** Tonnage totale
- **Colore Barra:** Giallo/Arancione

### GRAFICO 4: RPE Reale nel Tempo

**Tipo:** BarChart orizzontale  
**Posizione:** Logbook, quarto grafico

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

### GRAFICO 5: Progressione Carico per Rep Range ⭐ CRITICO

**Tipo:** LineChart con punti  
**Posizione:** Logbook, quinto grafico

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

## 🐛 9. Edge Cases

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

## 📱 10. Responsive Breakpoints

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

## 🛠️ 11. Stack Tecnologico

- **Frontend:** React 18+
- **UI Library:** ShadcnUI
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **State Management:** React Hooks + Context/Zustand
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
