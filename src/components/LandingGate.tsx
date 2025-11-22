import { Dumbbell } from 'lucide-react';
import { Button } from './ui/button';
import { Vortex } from './ui/vortex';
import { TextGenerateEffect } from './ui/text-generate-effect';

interface LandingGateProps {
  onStart: () => void;
  onDemo: () => void;
  isDemoLoading?: boolean;
}

export function LandingGate({ onStart, onDemo, isDemoLoading }: LandingGateProps) {
  return (
    <div className="w-full h-[100dvh] overflow-hidden fixed inset-0 bg-black z-50">
      <Vortex
        backgroundColor="black"
        baseHue={76}
        rangeHue={20}
        className="flex items-center flex-col justify-center px-4 md:px-10 py-4 w-full h-full"
      >
        <TextGenerateEffect
          words="NOBODY CARES WORK HARDER"
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-center font-brand tracking-widest"
          duration={3}
          filter
          textColor="#C4FF39"
        />
        <p className="text-white text-base md:text-xl max-w-2xl mt-6 text-center mb-8 font-heading">
          Accedi o crea un account per costruire programmi condivisi con il tuo coach, oppure prova subito la demo per esplorare l&rsquo;app.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
          <Button
            onClick={onStart}
            size="lg"
            className="lime-gradient text-black font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/50"
          >
            <Dumbbell className="mr-2 h-5 w-5" />
            Inizia Ora
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onDemo}
            disabled={isDemoLoading}
            className="bg-white text-black border-white hover:bg-gray-100"
          >
            {isDemoLoading ? 'Caricamento...' : 'Carica Dati Demo'}
          </Button>
        </div>
      </Vortex>
    </div>
  );
}


