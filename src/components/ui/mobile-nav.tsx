import { Home, BookOpen, Dumbbell, Folder, Apple } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MobileNavProps {
    currentTab: string;
    setCurrentTab: (tab: any) => void;
}

export function MobileNav({ currentTab, setCurrentTab }: MobileNavProps) {
    const tabs = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'programs', icon: Folder, label: 'Programmi' },
        { id: 'library', icon: BookOpen, label: 'Libreria' },
        { id: 'logbook', icon: Dumbbell, label: 'Logbook' },
        { id: 'macros', icon: Apple, label: 'Macros' },
    ];

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
            <div className="glass-dark rounded-2xl p-2 flex justify-between items-center shadow-premium-hover">
                {tabs.map((tab) => {
                    const isActive = currentTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentTab(tab.id)}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-full h-12 rounded-xl transition-all duration-300",
                                isActive ? "text-white" : "text-white/50 hover:text-white/80"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-pill"
                                    className="absolute inset-0 bg-white/10 rounded-xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <Icon className={cn("w-5 h-5 relative z-10", isActive && "stroke-[2.5px]")} />
                            {isActive && (
                                <span className="text-[10px] font-medium mt-1 relative z-10 animate-in fade-in zoom-in duration-200">
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
