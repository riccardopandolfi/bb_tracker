import { Program, LoggedSession, LoggedSet } from '@/types';

// Helper per calcolare progressione carico (+2.5% per settimana)
const progressLoad = (baseLoad: number, weekNum: number): number => {
  if (baseLoad === 0) return 0; // Corpo libero
  return baseLoad * (1 + (weekNum - 1) * 0.025);
};

// Helper per calcolare progressione serie (varia nel mesociclo)
const progressSets = (weekNum: number): number => {
  // Week 1-2: 3, Week 3-4: 4, Week 5-6: 4, Week 7: 3 (deload), Week 8: 5 (peak)
  if (weekNum <= 2) return 3;
  if (weekNum <= 6) return 4;
  if (weekNum === 7) return 3; // deload
  return 5; // peak
};

export function generateDemoPrograms(): Program[] {
  // Programma 1: Push Pull Legs (8 settimane)
  const program1: Program = {
    id: 999,
    name: 'Demo 1 - Push Pull Legs (8W)',
    description: 'Programma PPL con volume progressivo su 8 settimane. ~20 serie per gruppo muscolare principale.',
    createdAt: new Date().toISOString(),
    weeks: {},
  };

  for (let weekNum = 1; weekNum <= 8; weekNum++) {
    const sets = progressSets(weekNum);

    program1.weeks[weekNum] = {
      days: [
        // Day 1: Push
        {
          name: 'Push - Petto, Spalle, Tricipiti',
          exercises: [
            {
              exerciseName: 'Panca Piana Bilanciere',
              exerciseType: 'resistance',
              blocks: [
                {
                  sets,
                  repsBase: '8',
                  repRange: '6-8',
                  rest: 180,
                  targetLoads: Array(sets).fill(0).map((_, i) => progressLoad(80 + i * 2.5, weekNum).toFixed(1)),
                  targetRPE: 8.5,
                  technique: 'Normale',
                  techniqueSchema: `${sets}x8`,
                  techniqueParams: {},
                  coefficient: 1.0,
                  blockRest: 120,
                },
                {
                  sets: Math.max(2, sets - 1),
                  repsBase: '12',
                  repRange: '8-12',
                  rest: 150,
                  targetLoads: Array(Math.max(2, sets - 1)).fill(0).map(() => progressLoad(60, weekNum).toFixed(1)),
                  targetRPE: 8.0,
                  technique: 'Normale',
                  techniqueSchema: `${Math.max(2, sets - 1)}x12`,
                  techniqueParams: {},
                  coefficient: 0.85,
                  blockRest: 120,
                }
              ],
              notes: '',
            },
            {
              exerciseName: 'Military Press',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '10',
                repRange: '8-12',
                rest: 150,
                targetLoads: Array(sets).fill(0).map((_, i) => progressLoad(40 + i * 2.5, weekNum).toFixed(1)),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x10`,
                techniqueParams: {},
                coefficient: 0.9,
                blockRest: 90,
              }],
              notes: '',
            },
            {
              exerciseName: 'Alzate Laterali',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '15',
                repRange: '12-20',
                rest: 90,
                targetLoads: Array(sets).fill(0).map(() => progressLoad(10, weekNum).toFixed(1)),
                targetRPE: 7.5,
                technique: 'Normale',
                techniqueSchema: `${sets}x15`,
                techniqueParams: {},
                coefficient: 0.75,
                blockRest: 60,
              }],
              notes: '',
            },
            {
              exerciseName: 'Dips',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '10',
                repRange: '8-12',
                rest: 120,
                targetLoads: Array(sets).fill('0'),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x10`,
                techniqueParams: {},
                coefficient: 0.85,
                blockRest: 90,
              }],
              notes: '',
            },
            {
              exerciseName: 'French Press',
              exerciseType: 'resistance',
              blocks: [{
                sets: Math.max(2, sets - 1),
                repsBase: '12',
                repRange: '8-12',
                rest: 120,
                targetLoads: Array(Math.max(2, sets - 1)).fill(0).map(() => progressLoad(25, weekNum).toFixed(1)),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${Math.max(2, sets - 1)}x12`,
                techniqueParams: {},
                coefficient: 0.8,
                blockRest: undefined,
              }],
              notes: '',
            },
          ],
        },
        // Day 2: Pull
        {
          name: 'Pull - Dorso, Bicipiti',
          exercises: [
            {
              exerciseName: 'Trazioni',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '8',
                repRange: '6-8',
                rest: 180,
                targetLoads: Array(sets).fill('0'),
                targetRPE: 8.5,
                technique: 'Normale',
                techniqueSchema: `${sets}x8`,
                techniqueParams: {},
                coefficient: 1.0,
                blockRest: 120,
              }],
              notes: '',
            },
            {
              exerciseName: 'Rematore Bilanciere',
              exerciseType: 'resistance',
              blocks: [
                {
                  sets,
                  repsBase: '10',
                  repRange: '8-12',
                  rest: 150,
                  targetLoads: Array(sets).fill(0).map((_, i) => progressLoad(60 + i * 5, weekNum).toFixed(1)),
                  targetRPE: 8.0,
                  technique: 'Normale',
                  techniqueSchema: `${sets}x10`,
                  techniqueParams: {},
                  coefficient: 0.95,
                  blockRest: 90,
                },
                {
                  sets: Math.max(2, sets - 1),
                  repsBase: '15',
                  repRange: '12-20',
                  rest: 120,
                  targetLoads: Array(Math.max(2, sets - 1)).fill(0).map(() => progressLoad(50, weekNum).toFixed(1)),
                  targetRPE: 7.5,
                  technique: 'Normale',
                  techniqueSchema: `${Math.max(2, sets - 1)}x15`,
                  techniqueParams: {},
                  coefficient: 0.8,
                  blockRest: 90,
                }
              ],
              notes: '',
            },
            {
              exerciseName: 'Pulley',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '12',
                repRange: '12-20',
                rest: 90,
                targetLoads: Array(sets).fill(0).map(() => progressLoad(50, weekNum).toFixed(1)),
                targetRPE: 7.5,
                technique: 'Normale',
                techniqueSchema: `${sets}x12`,
                techniqueParams: {},
                coefficient: 0.85,
                blockRest: 60,
              }],
              notes: '',
            },
            {
              exerciseName: 'Curl Bilanciere',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '10',
                repRange: '8-12',
                rest: 120,
                targetLoads: Array(sets).fill(0).map(() => progressLoad(25, weekNum).toFixed(1)),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x10`,
                techniqueParams: {},
                coefficient: 0.8,
                blockRest: undefined,
              }],
              notes: '',
            },
          ],
        },
        // Day 3: Legs
        {
          name: 'Legs - Gambe',
          exercises: [
            {
              exerciseName: 'Squat',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '8',
                repRange: '6-8',
                rest: 240,
                targetLoads: Array(sets).fill(0).map((_, i) => progressLoad(100 + i * 10, weekNum).toFixed(1)),
                targetRPE: 9.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x8`,
                techniqueParams: {},
                coefficient: 1.0,
                blockRest: 120,
              }],
              notes: '',
            },
            {
              exerciseName: 'Leg Press',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '12',
                repRange: '8-12',
                rest: 150,
                targetLoads: Array(sets).fill(0).map((_, i) => progressLoad(140 + i * 10, weekNum).toFixed(1)),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x12`,
                techniqueParams: {},
                coefficient: 0.9,
                blockRest: 90,
              }],
              notes: '',
            },
            {
              exerciseName: 'Leg Press',
              exerciseType: 'resistance',
              blocks: [{
                sets: Math.max(2, sets - 1),
                repsBase: '20',
                repRange: '12-20',
                rest: 120,
                targetLoads: Array(Math.max(2, sets - 1)).fill(0).map(() => progressLoad(100, weekNum).toFixed(1)),
                targetRPE: 7.5,
                technique: 'Normale',
                techniqueSchema: `${Math.max(2, sets - 1)}x20`,
                techniqueParams: {},
                coefficient: 0.75,
                blockRest: 90,
              }],
              notes: 'Serie pompa',
            },
            {
              exerciseName: 'Leg Curl',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '12',
                repRange: '12-20',
                rest: 90,
                targetLoads: Array(sets).fill(0).map(() => progressLoad(40, weekNum).toFixed(1)),
                targetRPE: 7.5,
                technique: 'Normale',
                techniqueSchema: `${sets}x12`,
                techniqueParams: {},
                coefficient: 0.85,
                blockRest: 60,
              }],
              notes: '',
            },
            {
              exerciseName: 'Calf Raise',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '15',
                repRange: '12-20',
                rest: 90,
                targetLoads: Array(sets).fill(0).map(() => progressLoad(60, weekNum).toFixed(1)),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x15`,
                techniqueParams: {},
                coefficient: 0.75,
                blockRest: undefined,
              }],
              notes: '',
            },
          ],
        },
      ],
    };
  }

  // Programma 2: Upper Lower (8 settimane)
  const program2: Program = {
    id: 998,
    name: 'Demo 2 - Upper Lower (8W)',
    description: 'Programma Upper/Lower con volume alto su 8 settimane. ~20 serie per gruppo muscolare principale.',
    createdAt: new Date().toISOString(),
    weeks: {},
  };

  for (let weekNum = 1; weekNum <= 8; weekNum++) {
    const sets = progressSets(weekNum);

    program2.weeks[weekNum] = {
      days: [
        // Day 1: Upper Power
        {
          name: 'Upper Power',
          exercises: [
            {
              exerciseName: 'Panca Piana Bilanciere',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '6',
                repRange: '6-8',
                rest: 240,
                targetLoads: Array(sets).fill(0).map((_, i) => progressLoad(85 + i * 2.5, weekNum).toFixed(1)),
                targetRPE: 9.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x6`,
                techniqueParams: {},
                coefficient: 1.0,
                blockRest: 180,
              }],
              notes: 'Focus forza',
            },
            {
              exerciseName: 'Trazioni',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '6',
                repRange: '6-8',
                rest: 240,
                targetLoads: Array(sets).fill('0'),
                targetRPE: 9.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x6`,
                techniqueParams: {},
                coefficient: 1.0,
                blockRest: 180,
              }],
              notes: 'Focus forza',
            },
            {
              exerciseName: 'Military Press',
              exerciseType: 'resistance',
              blocks: [{
                sets: Math.max(3, sets - 1),
                repsBase: '8',
                repRange: '6-8',
                rest: 180,
                targetLoads: Array(Math.max(3, sets - 1)).fill(0).map((_, i) => progressLoad(42.5 + i * 2.5, weekNum).toFixed(1)),
                targetRPE: 8.5,
                technique: 'Normale',
                techniqueSchema: `${Math.max(3, sets - 1)}x8`,
                techniqueParams: {},
                coefficient: 0.95,
                blockRest: 120,
              }],
              notes: '',
            },
            {
              exerciseName: 'Rematore Bilanciere',
              exerciseType: 'resistance',
              blocks: [{
                sets: Math.max(3, sets - 1),
                repsBase: '8',
                repRange: '8-12',
                rest: 150,
                targetLoads: Array(Math.max(3, sets - 1)).fill(0).map((_, i) => progressLoad(65 + i * 5, weekNum).toFixed(1)),
                targetRPE: 8.5,
                technique: 'Normale',
                techniqueSchema: `${Math.max(3, sets - 1)}x8`,
                techniqueParams: {},
                coefficient: 0.95,
                blockRest: undefined,
              }],
              notes: '',
            },
          ],
        },
        // Day 2: Lower Power
        {
          name: 'Lower Power',
          exercises: [
            {
              exerciseName: 'Squat',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '6',
                repRange: '6-8',
                rest: 300,
                targetLoads: Array(sets).fill(0).map((_, i) => progressLoad(110 + i * 10, weekNum).toFixed(1)),
                targetRPE: 9.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x6`,
                techniqueParams: {},
                coefficient: 1.0,
                blockRest: 180,
              }],
              notes: 'Focus forza',
            },
            {
              exerciseName: 'Leg Press',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '10',
                repRange: '8-12',
                rest: 180,
                targetLoads: Array(sets).fill(0).map((_, i) => progressLoad(150 + i * 10, weekNum).toFixed(1)),
                targetRPE: 8.5,
                technique: 'Normale',
                techniqueSchema: `${sets}x10`,
                techniqueParams: {},
                coefficient: 0.95,
                blockRest: 120,
              }],
              notes: '',
            },
            {
              exerciseName: 'Leg Curl',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '10',
                repRange: '8-12',
                rest: 120,
                targetLoads: Array(sets).fill(0).map(() => progressLoad(42.5, weekNum).toFixed(1)),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x10`,
                techniqueParams: {},
                coefficient: 0.85,
                blockRest: undefined,
              }],
              notes: '',
            },
          ],
        },
        // Day 3: Upper Hypertrophy
        {
          name: 'Upper Hypertrophy',
          exercises: [
            {
              exerciseName: 'Panca Piana Bilanciere',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '10',
                repRange: '8-12',
                rest: 150,
                targetLoads: Array(sets).fill(0).map(() => progressLoad(70, weekNum).toFixed(1)),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x10`,
                techniqueParams: {},
                coefficient: 0.9,
                blockRest: 120,
              }],
              notes: 'Focus ipertrofia',
            },
            {
              exerciseName: 'Dips',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '12',
                repRange: '8-12',
                rest: 120,
                targetLoads: Array(sets).fill('0'),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x12`,
                techniqueParams: {},
                coefficient: 0.85,
                blockRest: 90,
              }],
              notes: '',
            },
            {
              exerciseName: 'Pulley',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '12',
                repRange: '12-20',
                rest: 90,
                targetLoads: Array(sets).fill(0).map(() => progressLoad(52.5, weekNum).toFixed(1)),
                targetRPE: 7.5,
                technique: 'Normale',
                techniqueSchema: `${sets}x12`,
                techniqueParams: {},
                coefficient: 0.85,
                blockRest: 60,
              }],
              notes: '',
            },
            {
              exerciseName: 'Alzate Laterali',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '15',
                repRange: '12-20',
                rest: 90,
                targetLoads: Array(sets).fill(0).map(() => progressLoad(10, weekNum).toFixed(1)),
                targetRPE: 7.5,
                technique: 'Normale',
                techniqueSchema: `${sets}x15`,
                techniqueParams: {},
                coefficient: 0.75,
                blockRest: 60,
              }],
              notes: '',
            },
            {
              exerciseName: 'Curl Bilanciere',
              exerciseType: 'resistance',
              blocks: [{
                sets: Math.max(3, sets - 1),
                repsBase: '12',
                repRange: '8-12',
                rest: 120,
                targetLoads: Array(Math.max(3, sets - 1)).fill(0).map(() => progressLoad(22.5, weekNum).toFixed(1)),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${Math.max(3, sets - 1)}x12`,
                techniqueParams: {},
                coefficient: 0.8,
                blockRest: 60,
              }],
              notes: '',
            },
            {
              exerciseName: 'French Press',
              exerciseType: 'resistance',
              blocks: [{
                sets: Math.max(3, sets - 1),
                repsBase: '12',
                repRange: '8-12',
                rest: 120,
                targetLoads: Array(Math.max(3, sets - 1)).fill(0).map(() => progressLoad(22.5, weekNum).toFixed(1)),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${Math.max(3, sets - 1)}x12`,
                techniqueParams: {},
                coefficient: 0.8,
                blockRest: undefined,
              }],
              notes: '',
            },
          ],
        },
        // Day 4: Lower Hypertrophy
        {
          name: 'Lower Hypertrophy',
          exercises: [
            {
              exerciseName: 'Leg Press',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '15',
                repRange: '12-20',
                rest: 150,
                targetLoads: Array(sets).fill(0).map(() => progressLoad(120, weekNum).toFixed(1)),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${sets}x15`,
                techniqueParams: {},
                coefficient: 0.85,
                blockRest: 120,
              }],
              notes: 'Focus ipertrofia',
            },
            {
              exerciseName: 'Squat',
              exerciseType: 'resistance',
              blocks: [{
                sets: Math.max(3, sets - 1),
                repsBase: '12',
                repRange: '8-12',
                rest: 180,
                targetLoads: Array(Math.max(3, sets - 1)).fill(0).map(() => progressLoad(85, weekNum).toFixed(1)),
                targetRPE: 8.0,
                technique: 'Normale',
                techniqueSchema: `${Math.max(3, sets - 1)}x12`,
                techniqueParams: {},
                coefficient: 0.9,
                blockRest: 120,
              }],
              notes: '',
            },
            {
              exerciseName: 'Leg Curl',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '15',
                repRange: '12-20',
                rest: 90,
                targetLoads: Array(sets).fill(0).map(() => progressLoad(37.5, weekNum).toFixed(1)),
                targetRPE: 7.5,
                technique: 'Normale',
                techniqueSchema: `${sets}x15`,
                techniqueParams: {},
                coefficient: 0.8,
                blockRest: 60,
              }],
              notes: '',
            },
            {
              exerciseName: 'Calf Raise',
              exerciseType: 'resistance',
              blocks: [{
                sets,
                repsBase: '20',
                repRange: '12-20',
                rest: 90,
                targetLoads: Array(sets).fill(0).map(() => progressLoad(55, weekNum).toFixed(1)),
                targetRPE: 7.5,
                technique: 'Normale',
                techniqueSchema: `${sets}x20`,
                techniqueParams: {},
                coefficient: 0.7,
                blockRest: undefined,
              }],
              notes: '',
            },
          ],
        },
      ],
    };
  }

  return [program1, program2];
}

export function generateDemoLoggedSessions(): LoggedSession[] {
  const sessions: LoggedSession[] = [];
  const programs = generateDemoPrograms();
  let sessionId = 10000;

  const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  // Helper per generare set con progressione realistica
  const generateSets = (
    numSets: number,
    baseReps: string,
    targetLoads: string[],
    weekNum: number
  ): { sets: LoggedSet[]; totalReps: number; avgRPE: number } => {
    const sets: LoggedSet[] = [];
    let totalReps = 0;
    let totalRPE = 0;
    const repsNum = parseInt(baseReps);

    for (let i = 0; i < numSets; i++) {
      const load = parseFloat(targetLoads[i] || targetLoads[0]);
      const reps = Math.max(Math.floor(repsNum - i * 0.5), Math.floor(repsNum - 2));
      const rpe = 7 + i * 0.4 + (weekNum - 1) * 0.15 + Math.random() * 0.3;

      sets.push({
        setNum: i + 1,
        clusterNum: 0,
        reps: reps.toString(),
        load: (load * (1 + (Math.random() * 0.04 - 0.02))).toFixed(1),
        rpe: Math.min(rpe, 10).toFixed(1),
      });

      totalReps += reps;
      totalRPE += rpe;
    }

    return { sets, totalReps, avgRPE: totalRPE / numSets };
  };

  // Program 1 (999) - PPL - fatto da 16 settimane fa a 9 settimane fa
  const program1 = programs[0];
  for (let weekNum = 1; weekNum <= 8; weekNum++) {
    const week = program1.weeks[weekNum];
    const weekDaysOffset = (16 - weekNum) * 7; // Week 1 = 16 settimane fa, Week 8 = 9 settimane fa

    week.days.forEach((day, dayIndex) => {
      const dayOffset = weekDaysOffset + dayIndex; // Spaziare i giorni nella settimana

      day.exercises.forEach((exercise) => {
        exercise.blocks.forEach((block, blockIndex) => {
          // Skip blocks with missing required fields
          if (!block.sets || !block.repsBase || !block.targetLoads || !block.technique ||
              !block.techniqueSchema || !block.repRange || block.coefficient === undefined ||
              block.targetRPE === undefined) {
            return;
          }

          const sessionData = generateSets(
            block.sets,
            block.repsBase,
            block.targetLoads,
            weekNum
          );

          sessions.push({
            id: sessionId++,
            programId: 999,
            date: daysAgo(dayOffset),
            weekNum,
            exercise: exercise.exerciseName,
            dayIndex,
            dayName: day.name,
            blockIndex,
            technique: block.technique,
            techniqueSchema: block.techniqueSchema,
            repRange: block.repRange,
            coefficient: block.coefficient,
            targetLoads: block.targetLoads,
            targetRPE: block.targetRPE,
            sets: sessionData.sets,
            totalReps: sessionData.totalReps,
            targetReps: block.sets * parseInt(block.repsBase),
            avgRPE: sessionData.avgRPE,
            completion: (sessionData.totalReps / (block.sets * parseInt(block.repsBase))) * 100,
            blockRest: block.blockRest || 0,
          });
        });
      });
    });
  }

  // Program 2 (998) - Upper/Lower - fatto da 8 settimane fa a 1 settimana fa
  // IMPORTANTE: usa weekNum 9-16 per continuità progressiva (non ripete 1-8)
  const program2 = programs[1];
  for (let cycleWeek = 1; cycleWeek <= 8; cycleWeek++) {
    const week = program2.weeks[cycleWeek]; // Usa la settimana del programma (1-8)
    const weekNum = cycleWeek + 8; // Ma logga con weekNum progressivo (9-16)
    const weekDaysOffset = (8 - cycleWeek) * 7; // Week 1 del ciclo = 8 settimane fa, Week 8 = 1 settimana fa

    week.days.forEach((day, dayIndex) => {
      const dayOffset = weekDaysOffset + dayIndex; // Spaziare i giorni nella settimana

      day.exercises.forEach((exercise) => {
        exercise.blocks.forEach((block, blockIndex) => {
          // Skip blocks with missing required fields
          if (!block.sets || !block.repsBase || !block.targetLoads || !block.technique ||
              !block.techniqueSchema || !block.repRange || block.coefficient === undefined ||
              block.targetRPE === undefined) {
            return;
          }

          const sessionData = generateSets(
            block.sets,
            block.repsBase,
            block.targetLoads,
            cycleWeek // Usa cycleWeek (1-8) per la progressione del carico
          );

          sessions.push({
            id: sessionId++,
            programId: 998,
            date: daysAgo(dayOffset),
            weekNum, // Usa weekNum progressivo (9-16)
            exercise: exercise.exerciseName,
            dayIndex,
            dayName: day.name,
            blockIndex,
            technique: block.technique,
            techniqueSchema: block.techniqueSchema,
            repRange: block.repRange,
            coefficient: block.coefficient,
            targetLoads: block.targetLoads,
            targetRPE: block.targetRPE,
            sets: sessionData.sets,
            totalReps: sessionData.totalReps,
            targetReps: block.sets * parseInt(block.repsBase),
            avgRPE: sessionData.avgRPE,
            completion: (sessionData.totalReps / (block.sets * parseInt(block.repsBase))) * 100,
            blockRest: block.blockRest || 0,
          });
        });
      });
    });
  }

  return sessions;
}
