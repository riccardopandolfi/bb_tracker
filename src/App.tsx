import { useEffect } from 'react';
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
  const { currentTab, setCurrentTab, programs } = useApp();
  const hasPrograms = Object.keys(programs).length > 0;

  // On initial mount, redirect to home if no programs exist (except home/library)
  useEffect(() => {
    if (!hasPrograms && currentTab !== 'home' && currentTab !== 'library') {
      setCurrentTab('home');
    }
  }, [hasPrograms]); // Run only when hasPrograms changes, not on every tab change

  return (
    <div className={cn("min-h-screen w-full relative overflow-x-hidden font-sans selection:bg-primary/20", hasPrograms ? "bg-background text-foreground" : "bg-black")}>
      {/* Header with Gradient Accent Strip */}
      {hasPrograms && (
      <header className="sticky top-0 z-40 w-full">
        {/* Lime gradient strip - brand signature */}
        <div className="h-1 w-full lime-gradient" />

        {/* Main header content */}
        <div className="w-full bg-black/95 backdrop-blur-sm">
          <div className="w-full flex min-h-14 py-2 items-center justify-between px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg lime-gradient flex items-center justify-center flex-shrink-0">
                <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
              </div>
              <h1 className="text-[10px] sm:text-xs md:text-sm font-bold tracking-wider md:tracking-widest text-white font-brand uppercase leading-[1.2]">
                NOBODY CARES<br className="sm:hidden" /> WORK HARDER
              </h1>
            </div>

            {/* Desktop Navigation - Clean style */}
            <nav className="hidden md:flex items-center gap-1">
              <NavigationMenuLink
                active={currentTab === 'home'}
                onClick={() => setCurrentTab('home')}
                icon={<Home className="w-4 h-4" />}
              >
                Home
              </NavigationMenuLink>
              <NavigationMenuLink
                active={currentTab === 'library'}
                onClick={() => setCurrentTab('library')}
                icon={<BookOpen className="w-4 h-4" />}
              >
                Libreria
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
                onClick={() => hasPrograms && setCurrentTab('program')}
                disabled={!hasPrograms}
                icon={<Dumbbell className="w-4 h-4" />}
              >
                Scheda
              </NavigationMenuLink>
              <NavigationMenuLink
                active={currentTab === 'logbook'}
                onClick={() => hasPrograms && setCurrentTab('logbook')}
                disabled={!hasPrograms}
                icon={<Dumbbell className="w-4 h-4" />}
              >
                Logbook
              </NavigationMenuLink>
              <NavigationMenuLink
                active={currentTab === 'macros'}
                onClick={() => hasPrograms && setCurrentTab('macros')}
                disabled={!hasPrograms}
                icon={<Apple className="w-4 h-4" />}
              >
                Macros
              </NavigationMenuLink>
            </nav>

            <UserSelector />
          </div>
        </div>
      </header>
      )}

      {/* Main Content */}
      <main className={hasPrograms ? "w-full py-6 pb-24 md:pb-8 relative z-10" : "w-full h-[100dvh] relative z-10"}>
        <div className={hasPrograms ? "w-full px-4 md:px-6 lg:px-8" : "w-full h-full"}>
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

      {/* Mobile Navigation - Only show if programs exist */}
      {hasPrograms && <MobileNav currentTab={currentTab} setCurrentTab={setCurrentTab} hasPrograms={hasPrograms} />}
    </div>
  );
}

function NavigationMenuLink({ active, onClick, children, icon, disabled }: { active: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2 group",
        active ? "text-primary" : "text-white/70 hover:text-white",
        disabled && "opacity-40 cursor-not-allowed hover:text-white/40"
      )}
    >
      <span className="relative z-10 flex items-center gap-2 font-heading">
        {icon}
        {children}
      </span>
      {/* Animated underline indicator */}
      <motion.div
        className="absolute bottom-0 left-1/2 h-0.5 bg-primary rounded-full"
        initial={false}
        animate={{
          width: active ? "60%" : "0%",
          x: "-50%",
          opacity: active ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
      {/* Hover glow effect */}
      {active && (
        <div className="absolute inset-0 bg-primary/5 rounded-lg -z-10" />
      )}
    </button>
  );
}

export default App;
