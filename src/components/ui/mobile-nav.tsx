import { Home, BookOpen, Dumbbell, Folder, Apple, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MobileNavProps {
    currentTab: string;
    setCurrentTab: (tab: any) => void;
    hasPrograms: boolean;
}

export function MobileNav({ currentTab, setCurrentTab, hasPrograms }: MobileNavProps) {
    const tabs = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'library', icon: BookOpen, label: 'Libreria' },
        { id: 'programs', icon: Folder, label: 'Programmi' },
        { id: 'program', icon: Dumbbell, label: 'Scheda' },
        { id: 'logbook', icon: FileText, label: 'Logbook' },
        { id: 'macros', icon: Apple, label: 'Macros' },
    ];

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 xl:hidden">
            <div className="bg-card/95 backdrop-blur-xl rounded-2xl p-2 flex justify-between items-center shadow-monetra-xl border border-border/50">
                {tabs.map((tab) => {
                    const isActive = currentTab === tab.id;
                    const Icon = tab.icon;
                    const isDisabled = !hasPrograms && (tab.id === 'program' || tab.id === 'logbook' || tab.id === 'macros');

                    return (
                        <button
                            key={tab.id}
                            onClick={() => !isDisabled && setCurrentTab(tab.id)}
                            disabled={isDisabled}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-full h-12 rounded-xl transition-all duration-300",
                                isActive ? "text-black" : "text-muted-foreground hover:text-foreground",
                                isDisabled && "opacity-50 cursor-not-allowed hover:text-muted-foreground"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-pill"
                                    className="absolute inset-0 lime-gradient rounded-xl shadow-md"
                                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                />
                            )}
                            <Icon className={cn("w-5 h-5 relative z-10", isActive && "stroke-[2.5px]")} />
                            {isActive && (
                                <span className="text-[10px] font-semibold mt-1 relative z-10 animate-in fade-in zoom-in duration-200 font-heading">
                                    {tab.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
