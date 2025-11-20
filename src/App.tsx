import { useApp } from './contexts/AppContext';
import { HomeTab } from './components/HomeTab';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { ProgramsTab } from './components/ProgramsTab';
import { ProgramTab } from './components/ProgramTab';
import { LogbookTab } from './components/LogbookTab';
import { MacrosTab } from './components/MacrosTab';
import { Home, BookOpen, Dumbbell, Folder, Apple } from 'lucide-react';
import { cn } from './lib/utils';
import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import { UserSelector } from './components/UserSelector';
import { MobileNav } from './components/ui/mobile-nav';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const { currentTab, setCurrentTab } = useApp();

  return (
    <div className="min-h-screen w-full bg-background text-foreground relative overflow-x-hidden font-sans selection:bg-primary/20">
      {/* Header - Monetra Style */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-white/80 backdrop-blur-xl">
        <div className="w-full flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl lime-gradient flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
              <Dumbbell className="h-5 w-5 text-black" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-foreground font-heading sm:block">Nobody Cares Work Harder</h1>
          </div>

          {/* Desktop Navigation - Monetra Style */}
          <div className="hidden md:flex items-center gap-1 bg-muted/50 p-1.5 rounded-full border border-border/50">
            <NavigationMenuLink
              active={currentTab === 'home'}
              onClick={() => setCurrentTab('home')}
              icon={<Home className="w-4 h-4" />}
            >
              Home
            </NavigationMenuLink>
            <NavigationMenuLink
              active={currentTab === 'programs'}
              onClick={() => setCurrentTab('programs')}
              icon={<Folder className="w-4 h-4" />}
            >
              Programmi
            </NavigationMenuLink>
            <NavigationMenuLink
              active={currentTab === 'program'}
              onClick={() => setCurrentTab('program')}
              icon={<Dumbbell className="w-4 h-4" />}
            >
              Scheda
            </NavigationMenuLink>
            <NavigationMenuLink
              active={currentTab === 'library'}
              onClick={() => setCurrentTab('library')}
              icon={<BookOpen className="w-4 h-4" />}
            >
              Libreria
            </NavigationMenuLink>
            <NavigationMenuLink
              active={currentTab === 'logbook'}
              onClick={() => setCurrentTab('logbook')}
              icon={<Dumbbell className="w-4 h-4" />}
            >
              Logbook
            </NavigationMenuLink>
            <NavigationMenuLink
              active={currentTab === 'macros'}
              onClick={() => setCurrentTab('macros')}
              icon={<Apple className="w-4 h-4" />}
            >
              Macros
            </NavigationMenuLink>
          </div>

          <UserSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full py-6 pb-24 md:pb-8 relative z-10">
        <div className="w-full px-4 md:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentTab === 'home' && <HomeTab />}
              {currentTab === 'library' && <ExerciseLibrary />}
              {currentTab === 'programs' && <ProgramsTab />}
              {currentTab === 'program' && <ProgramTab />}
              {currentTab === 'logbook' && <LogbookTab />}
              {currentTab === 'macros' && <MacrosTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  );
}

function NavigationMenuLink({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full flex items-center gap-2",
        active ? "text-black" : "text-muted-foreground hover:text-foreground hover:bg-white/50"
      )}
    >
      {active && (
        <motion.div
          layoutId="desktop-nav-pill"
          className="absolute inset-0 lime-gradient rounded-full shadow-md shadow-primary/20"
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2 font-heading">
        {icon}
        {children}
      </span>
    </button>
  );
}

export default App;
