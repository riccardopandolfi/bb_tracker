import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export type DockItem = {
  value: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  description?: string;
};

interface FloatingDockProps {
  items: DockItem[];
  value: string;
  onValueChange: (value: string) => void;
}

export function FloatingDock({ items, value, onValueChange }: FloatingDockProps) {
  return (
    <div className="flex w-full justify-center">
      <div className="floating-dock">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = value === item.value;

          return (
            <button
              key={item.value}
              type="button"
              disabled={item.disabled}
              onClick={() => !item.disabled && onValueChange(item.value)}
              className={cn(
                'dock-item',
                isActive && 'dock-item-active',
                item.disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="dock-icon">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-tight">{item.label}</p>
                  {item.description ? (
                    <p className="text-xs text-white/60">{item.description}</p>
                  ) : null}
                </div>
              </div>
              <span className="dock-pill" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
