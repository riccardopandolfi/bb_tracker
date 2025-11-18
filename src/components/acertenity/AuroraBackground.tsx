import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  className?: string;
}

/**
 * Decorative animated background inspired by Aceternity UI.
 */
export function AuroraBackground({ className }: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className
      )}
    >
      <div className="aurora-layer aurora-one" />
      <div className="aurora-layer aurora-two" />
      <div className="aurora-layer aurora-three" />
    </div>
  );
}
