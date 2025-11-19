import { useApp } from './contexts/AppContext';
import { HomeTab } from './components/HomeTab';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { ProgramsTab } from './components/ProgramsTab';
import { ProgramTab } from './components/ProgramTab';
import { LogbookTab } from './components/LogbookTab';
import { MacrosTab } from './components/MacrosTab';
import { Home, BookOpen, Dumbbell, Folder, Apple } from 'lucide-react';
import { cn } from './lib/utils';
import { BackgroundBeams } from './components/ui/background-beams';
import '@fontsource/inter-tight/400.css';
import '@fontsource/inter-tight/500.css';
import '@fontsource/inter-tight/600.css';
import '@fontsource/inter-tight/700.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import { UserSelector } from './components/UserSelector';
import { MobileNav } from './components/ui/mobile-nav';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const { currentTab, setCurrentTab } = useApp();

  return (
    <div className="min-h-screen w-full bg-white text-foreground relative overflow-x-hidden font-sans selection:bg-primary/20">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundBeams className="opacity-10" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
        <div className="w-full flex h-16 items-center justify-between px-4 md:px-6 lg:px-8 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <Dumbbell className="h-5 w-5 text-black" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white hidden sm:block">Nobody Cares Work Harder</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
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
      <main className="w-full py-6 px-4 md:px-6 lg:px-8 pb-24 md:pb-8 relative z-10">
        <div className="max-w-[1920px] mx-auto">
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
        "relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full flex items-center gap-2",
        active ? "text-black" : "text-white/60 hover:text-white hover:bg-white/10"
      )}
    >
      {active && (
        <motion.div
          layoutId="desktop-nav-pill"
          className="absolute inset-0 bg-white rounded-full shadow-sm"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  );
}

export default App;
