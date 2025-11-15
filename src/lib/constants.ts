import { Exercise } from '@/types';

// Muscle color mapping
export const MUSCLE_COLORS: Record<string, string> = {
  'Petto': '#ef4444',                    // red-500
  'Dorso - Lats': '#3b82f6',             // blue-500
  'Dorso - Upper Back': '#3b82f6',       // blue-500
  'Dorso - Trapezi': '#3b82f6',          // blue-500
  'Deltoidi - Anteriore': '#f97316',     // orange-500
  'Deltoidi - Laterale': '#f97316',      // orange-500
  'Deltoidi - Posteriore': '#f97316',    // orange-500
  'Bicipiti': '#a855f7',                 // purple-500
  'Tricipiti': '#ec4899',                // pink-500
  'Avambracci': '#a855f7',               // purple-500
  'Quadricipiti': '#22c55e',             // green-500
  'Femorali': '#22c55e',                 // green-500
  'Glutei': '#22c55e',                   // green-500
  'Polpacci': '#22c55e',                 // green-500
  'Adduttori': '#14b8a6',                // teal-500
  'Abduttori': '#14b8a6',                // teal-500
  'Addome': '#eab308',                   // yellow-500
  'Obliqui': '#eab308',                  // yellow-500
  'Core': '#eab308',                     // yellow-500
};

// Default exercises
export const DEFAULT_EXERCISES: Exercise[] = [
  // Push
  {
    name: 'Panca Piana Bilanciere',
    type: 'resistance',
    muscles: [
      { muscle: 'Petto', percent: 100 },
    ],
  },
  {
    name: 'Military Press',
    type: 'resistance',
    muscles: [
      { muscle: 'Deltoidi - Anteriore', percent: 100 },
    ],
  },
  {
    name: 'Dips',
    type: 'resistance',
    muscles: [
      { muscle: 'Petto', percent: 100 },
    ],
  },
  {
    name: 'Alzate Laterali',
    type: 'resistance',
    muscles: [
      { muscle: 'Deltoidi - Laterale', percent: 100 },
    ],
  },
  {
    name: 'French Press',
    type: 'resistance',
    muscles: [
      { muscle: 'Tricipiti', percent: 100 },
    ],
  },
  // Pull
  {
    name: 'Rematore Bilanciere',
    type: 'resistance',
    muscles: [
      { muscle: 'Dorso - Upper Back', percent: 100 },
    ],
  },
  {
    name: 'Trazioni',
    type: 'resistance',
    muscles: [
      { muscle: 'Dorso - Lats', percent: 100 },
    ],
  },
  {
    name: 'Pulley',
    type: 'resistance',
    muscles: [
      { muscle: 'Dorso - Lats', percent: 100 },
    ],
  },
  {
    name: 'Curl Bilanciere',
    type: 'resistance',
    muscles: [
      { muscle: 'Bicipiti', percent: 100 },
    ],
  },
  // Legs
  {
    name: 'Squat',
    type: 'resistance',
    muscles: [
      { muscle: 'Quadricipiti', percent: 100 },
    ],
  },
  {
    name: 'Leg Press',
    type: 'resistance',
    muscles: [
      { muscle: 'Quadricipiti', percent: 100 },
    ],
  },
  {
    name: 'Leg Curl',
    type: 'resistance',
    muscles: [
      { muscle: 'Femorali', percent: 100 },
    ],
  },
  {
    name: 'Calf Raise',
    type: 'resistance',
    muscles: [
      { muscle: 'Polpacci', percent: 100 },
    ],
  },
];
