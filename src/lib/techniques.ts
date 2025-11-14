import { Technique } from '@/types';

export interface TechniqueParameter {
  name: string;
  label: string;
  type: 'number' | 'text';
  default: number | string;
  min?: number;
  max?: number;
  step?: number;
}

export interface TechniqueDefinition {
  name: Technique;
  label: string;
  description: string;
  parameters: TechniqueParameter[];
  generateSchema: (params: Record<string, any>) => string;
}

export const TECHNIQUE_DEFINITIONS: TechniqueDefinition[] = [
  {
    name: 'Normale',
    label: 'Normale',
    description: 'Esecuzione standard',
    parameters: [],
    generateSchema: () => '',
  },
  {
    name: 'Rest-Pause',
    label: 'Rest-Pause',
    description: 'Pausa breve tra serie per recupero parziale',
    parameters: [
      { name: 'reps', label: 'Reps iniziali', type: 'number', default: 10, min: 1, max: 30 },
      { name: 'pause', label: 'Pausa (sec)', type: 'number', default: 15, min: 5, max: 60 },
      { name: 'miniSets', label: 'Mini-sets', type: 'number', default: 3, min: 2, max: 5 },
    ],
    generateSchema: (params) => {
      const reps = params.reps !== undefined && params.reps !== '' ? params.reps : 10;
      const miniSets = params.miniSets !== undefined && params.miniSets !== '' ? params.miniSets : 3;
      return Array(Number(miniSets)).fill(reps).join('+');
    },
  },
  {
    name: 'Myo-Reps',
    label: 'Myo-Reps',
    description: 'Serie di attivazione + mini-serie',
    parameters: [
      { name: 'activation', label: 'Reps attivazione', type: 'number', default: 12, min: 8, max: 20 },
      { name: 'myoReps', label: 'Reps per myo', type: 'number', default: 5, min: 3, max: 10 },
      { name: 'numMyo', label: 'Numero myo-reps', type: 'number', default: 4, min: 2, max: 6 },
    ],
    generateSchema: (params) => {
      const activation = params.activation !== undefined && params.activation !== '' ? params.activation : 12;
      const myoReps = params.myoReps !== undefined && params.myoReps !== '' ? params.myoReps : 5;
      const numMyo = params.numMyo !== undefined && params.numMyo !== '' ? params.numMyo : 4;
      return `${activation}+${Array(Number(numMyo)).fill(myoReps).join('+')}`;
    },
  },
  {
    name: 'Drop-Set',
    label: 'Drop-Set',
    description: 'Riduzione del carico con continuità',
    parameters: [
      { name: 'drops', label: 'Numero drops', type: 'number', default: 3, min: 2, max: 4 },
      { name: 'repsPerDrop', label: 'Reps per drop', type: 'number', default: 8, min: 5, max: 15 },
    ],
    generateSchema: (params) => {
      const drops = params.drops !== undefined && params.drops !== '' ? params.drops : 3;
      const repsPerDrop = params.repsPerDrop !== undefined && params.repsPerDrop !== '' ? params.repsPerDrop : 8;
      return Array(Number(drops)).fill(repsPerDrop).join('+');
    },
  },
  {
    name: 'Cluster Sets',
    label: 'Cluster Sets',
    description: 'Piccoli cluster di ripetizioni con pause brevi',
    parameters: [
      { name: 'repsPerCluster', label: 'Reps per cluster', type: 'number', default: 3, min: 1, max: 5 },
      { name: 'numClusters', label: 'Numero clusters', type: 'number', default: 5, min: 3, max: 8 },
      { name: 'restBetween', label: 'Pausa (sec)', type: 'number', default: 20, min: 10, max: 45 },
    ],
    generateSchema: (params) => {
      const repsPerCluster = params.repsPerCluster !== undefined && params.repsPerCluster !== '' ? params.repsPerCluster : 3;
      const numClusters = params.numClusters !== undefined && params.numClusters !== '' ? params.numClusters : 5;
      return Array(Number(numClusters)).fill(repsPerCluster).join('+');
    },
  },
  {
    name: 'Reps Scalare',
    label: 'Reps Scalare',
    description: 'Diminuire reps (es. 12-10-8-6)',
    parameters: [
      { name: 'startReps', label: 'Reps iniziali', type: 'number', default: 12, min: 6, max: 20 },
      { name: 'endReps', label: 'Reps finali', type: 'number', default: 6, min: 3, max: 15 },
      { name: 'step', label: 'Decremento', type: 'number', default: 2, min: 1, max: 4 },
    ],
    generateSchema: (params) => {
      const startReps = params.startReps !== undefined && params.startReps !== '' ? params.startReps : 12;
      const endReps = params.endReps !== undefined && params.endReps !== '' ? params.endReps : 6;
      const step = params.step !== undefined && params.step !== '' ? params.step : 2;

      // Se uno dei valori è "MAX", genera uno schema semplice
      if (startReps === 'MAX' || endReps === 'MAX') {
        return `${startReps}+${endReps}`;
      }

      const reps = [];
      for (let r = Number(startReps); r >= Number(endReps); r -= Number(step)) {
        reps.push(r);
      }
      return reps.join('+');
    },
  },
  {
    name: 'Reps Crescente',
    label: 'Reps Crescente',
    description: 'Aumentare reps (es. 6-8-10-12)',
    parameters: [
      { name: 'startReps', label: 'Reps iniziali', type: 'number', default: 6, min: 3, max: 15 },
      { name: 'endReps', label: 'Reps finali', type: 'number', default: 12, min: 6, max: 20 },
      { name: 'step', label: 'Incremento', type: 'number', default: 2, min: 1, max: 4 },
    ],
    generateSchema: (params) => {
      const startReps = params.startReps !== undefined && params.startReps !== '' ? params.startReps : 6;
      const endReps = params.endReps !== undefined && params.endReps !== '' ? params.endReps : 12;
      const step = params.step !== undefined && params.step !== '' ? params.step : 2;

      // Se uno dei valori è "MAX", genera uno schema semplice
      if (startReps === 'MAX' || endReps === 'MAX') {
        return `${startReps}+${endReps}`;
      }

      const reps = [];
      for (let r = Number(startReps); r <= Number(endReps); r += Number(step)) {
        reps.push(r);
      }
      return reps.join('+');
    },
  },
  {
    name: '1.5 Reps',
    label: '1.5 Reps',
    description: 'Esecuzione parziale + completa',
    parameters: [
      { name: 'fullReps', label: 'Reps complete', type: 'number', default: 8, min: 4, max: 12 },
      { name: 'sets', label: 'Sets', type: 'number', default: 1, min: 1, max: 3 },
    ],
    generateSchema: (params) => {
      const fullReps = params.fullReps !== undefined && params.fullReps !== '' ? params.fullReps : 8;
      const sets = params.sets !== undefined && params.sets !== '' ? params.sets : 1;
      return Array(Number(sets)).fill(fullReps).join('+');
    },
  },
];

export function getTechniqueDefinition(name: Technique): TechniqueDefinition | undefined {
  return TECHNIQUE_DEFINITIONS.find((t) => t.name === name);
}

export function generateSchemaFromParams(
  technique: Technique,
  params: Record<string, any>
): string {
  const def = getTechniqueDefinition(technique);
  if (!def) return '';
  return def.generateSchema(params);
}
