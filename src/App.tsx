import { useApp } from './contexts/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { ProgramTab } from './components/ProgramTab';
import { LogbookTab } from './components/LogbookTab';
import { BookOpen, Dumbbell, TrendingUp } from 'lucide-react';

function App() {
  const { currentTab, setCurrentTab } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Bodybuilding Tracker Pro
          </h1>
          <p className="text-muted-foreground mt-2">
            Traccia i tuoi allenamenti, analizza le progressioni e raggiungi i tuoi obiettivi
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Libreria Esercizi</span>
              <span className="sm:hidden">Libreria</span>
            </TabsTrigger>
            <TabsTrigger value="program" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Scheda Allenamento</span>
              <span className="sm:hidden">Scheda</span>
            </TabsTrigger>
            <TabsTrigger value="logbook" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Logbook</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            <ExerciseLibrary />
          </TabsContent>

          <TabsContent value="program" className="space-y-4">
            <ProgramTab />
          </TabsContent>

          <TabsContent value="logbook" className="space-y-4">
            <LogbookTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
