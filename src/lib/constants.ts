import { Exercise } from '@/types';

// Default exercises
export const DEFAULT_EXERCISES: Exercise[] = [
  {
    name: 'Panca Piana Bilanciere',
    type: 'resistance',
    muscles: [
      { muscle: 'Petto', percent: 80 },
      { muscle: 'Tricipiti', percent: 20 },
    ],
  },
  {
    name: 'Rematore Bilanciere',
    type: 'resistance',
    muscles: [
      { muscle: 'Dorso - Upper Back', percent: 70 },
      { muscle: 'Dorso - Lats', percent: 20 },
      { muscle: 'Bicipiti', percent: 10 },
    ],
  },
  {
    name: 'Squat',
    type: 'resistance',
    muscles: [
      { muscle: 'Quadricipiti', percent: 60 },
      { muscle: 'Glutei', percent: 30 },
      { muscle: 'Femorali', percent: 10 },
    ],
  },
  {
    name: 'Military Press',
    type: 'resistance',
    muscles: [
      { muscle: 'Deltoidi - Anteriore', percent: 60 },
      { muscle: 'Deltoidi - Laterale', percent: 30 },
      { muscle: 'Tricipiti', percent: 10 },
    ],
  },
];
