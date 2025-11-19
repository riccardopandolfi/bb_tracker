import { useApp } from './contexts/AppContext';
import { HomeTab } from './components/HomeTab';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { ProgramsTab } from './components/ProgramsTab';
import { ProgramTab } from './components/ProgramTab';
import { LogbookTab } from './components/LogbookTab';
import { MacrosTab } from './components/MacrosTab';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from './components/ui/navigation-menu';
import { Home, BookOpen, Dumbbell, TrendingUp, Folder, Apple } from 'lucide-react';
import { cn } from './lib/utils';
import { BackgroundBeams } from './components/ui/background-beams';
import { TextGenerateEffect } from './components/ui/text-generate-effect';

import { UserSelector } from './components/UserSelector';

function App() {
  const { currentTab, setCurrentTab, programs } = useApp();

  // Check if there are any programs
  const hasPrograms = Object.keys(programs).length > 0;

  const navItems = [
    { value: 'home', label: 'Home', icon: Home, requiresProgram: false },
    { value: 'library', label: 'Libreria', icon: BookOpen, requiresProgram: false },
    { value: 'programs', label: 'Programmi', icon: Folder, requiresProgram: false },
    { value: 'program', label: 'Scheda', icon: Dumbbell, requiresProgram: true },
    { value: 'logbook', label: 'Logbook', icon: TrendingUp, requiresProgram: true },
    { value: 'macros', label: 'Macros', icon: Apple, requiresProgram: true },
  ] as const;

  return (
    <div className="min-h-screen bg-neutral-950 relative w-full overflow-hidden flex flex-col">
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <BackgroundBeams />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-black/40 bg-black text-white">
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex h-14 sm:h-16 items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                <div className="text-base sm:text-xl font-bold tracking-wide text-white brand-font">
                  <TextGenerateEffect words="Nobody Cares Work Harder" className="text-white" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="hidden md:block text-sm text-white/80">
                  Il tuo tracker di allenamento professionale
                </p>
                <UserSelector />
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-auto">
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
            <NavigationMenu className="max-w-full justify-start py-1.5 sm:py-2">
              <NavigationMenuList className="flex-wrap gap-0.5 sm:gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isDisabled = item.requiresProgram && !hasPrograms;
                  return (
                    <NavigationMenuItem key={item.value}>
                      <NavigationMenuLink
                        className={cn(
                          navigationMenuTriggerStyle(),
                          'cursor-pointer',
                          currentTab === item.value &&
                          'bg-accent text-accent-foreground',
                          isDisabled && 'opacity-50 cursor-not-allowed'
                        )}
                        onClick={() => {
                          if (!isDisabled) {
                            setCurrentTab(item.value as any);
                          }
                        }}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                        <span className="sm:hidden">
                          {item.label === 'Libreria' ? 'Lib' : item.label}
                        </span>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Main Content */}
        <main className="w-full overflow-x-hidden">
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
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
