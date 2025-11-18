import { useApp } from './contexts/AppContext';
import { HomeTab } from './components/HomeTab';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { ProgramsTab } from './components/ProgramsTab';
import { ProgramTab } from './components/ProgramTab';
import { LogbookTab } from './components/LogbookTab';
import { MacrosTab } from './components/MacrosTab';
import { Home, BookOpen, Dumbbell, TrendingUp, Folder, Apple } from 'lucide-react';
import { AuroraBackground } from './components/acertenity/AuroraBackground';
import { FloatingDock } from './components/acertenity/FloatingDock';

function App() {
  const {
    currentTab,
    setCurrentTab,
    programs,
    exercises,
    loggedSessions,
    customTechniques,
  } = useApp();

  const totalPrograms = Object.keys(programs).length;
  const hasPrograms = totalPrograms > 0;

  const navItems = [
    { value: 'home', label: 'Home', icon: Home, requiresProgram: false },
    { value: 'library', label: 'Libreria', icon: BookOpen, requiresProgram: false },
    { value: 'programs', label: 'Programmi', icon: Folder, requiresProgram: false },
    { value: 'program', label: 'Scheda', icon: Dumbbell, requiresProgram: true },
    { value: 'logbook', label: 'Logbook', icon: TrendingUp, requiresProgram: true },
    { value: 'macros', label: 'Macros', icon: Apple, requiresProgram: true },
  ] as const;

  const statTiles = [
    { label: 'Programmi Attivi', value: totalPrograms },
    { label: 'Esercizi Libreria', value: exercises.length },
    { label: 'Sessioni Loggate', value: loggedSessions.length },
    { label: 'Tecniche Custom', value: customTechniques.length },
  ];

  return (
    <div className="app-shell relative min-h-screen overflow-hidden">
      <AuroraBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="app-hero">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
            <div className="flex flex-col gap-4 text-white">
              <div className="flex items-center gap-3 text-emerald-300">
                <div className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em]">
                  ACETERNITY CONTROL ROOM
                </div>
                <Dumbbell className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
                  Nobody Cares. Work Harder.
                </h1>
                <p className="mt-2 max-w-3xl text-base text-white/80 sm:text-lg">
                  Tutto il tuo ecosistema di bodybuilding prende vita in un cockpit Aceternity UI: libreria esercizi, programmazioni, logbook e nutrizione in un'unica esperienza immersiva.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {statTiles.map((tile) => (
                <div key={tile.label} className="stat-tile">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">{tile.label}</p>
                  <p className="text-2xl font-semibold text-white">{tile.value}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="sticky top-4 z-40 w-full px-4 sm:px-6 lg:px-10">
          <FloatingDock
            items={navItems.map((item) => ({
              value: item.value,
              label: item.label,
              icon: item.icon,
              disabled: item.requiresProgram && !hasPrograms,
              description: item.requiresProgram ? 'Richiede programma' : undefined,
            }))}
            value={currentTab}
            onValueChange={(next) => setCurrentTab(next as any)}
          />
        </div>

        <main className="w-full flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            <div className="animate-in fade-in duration-500 w-full">
              {currentTab === 'home' && <HomeTab />}
              {currentTab === 'library' && <ExerciseLibrary />}
              {currentTab === 'programs' && <ProgramsTab />}
              {currentTab === 'program' && <ProgramTab />}
              {currentTab === 'logbook' && <LogbookTab />}
              {currentTab === 'macros' && <MacrosTab />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
