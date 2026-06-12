/**
 * Typed test fixtures derived from volt-data.js.
 * These match the data shapes used in the prototype and will align with
 * src/types/supabase.ts once Backend publishes generated types.
 */

// ---------------------------------------------------------------------------
// Domain types (provisional — will be replaced by generated Supabase types)
// ---------------------------------------------------------------------------

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  body: string;
  equipment: string;
  met: number;
  secondary: string[];
  cues: string[];
}

export interface RoutineExercise {
  exId: string;
  sets: number;
  reps: number;
  weight: number;
  rest: number;
}

export interface Routine {
  id: string;
  name: string;
  focus: string;
  lastDone: string;
  exercises: RoutineExercise[];
}

/** [reps, weight_kg] tuple as used in VOLT_LAST */
export type SetTuple = [number, number];

export interface LastPerformance {
  date: string;
  sets: SetTuple[];
}

export type LastPerformanceMap = Record<string, LastPerformance>;

// ---------------------------------------------------------------------------
// Exercise fixtures (14 exercises from volt-data.js)
// ---------------------------------------------------------------------------

export const EXERCISES: Exercise[] = [
  {
    id: 'bench',
    name: 'Barbell Bench Press',
    muscle: 'Chest',
    body: 'Upper body',
    equipment: 'Barbell',
    met: 6.0,
    secondary: ['Front Delts', 'Triceps'],
    cues: [
      'Set shoulder blades back and down on the bench.',
      'Lower the bar to mid-chest with elbows ~45°.',
      'Press up and slightly back toward the rack.',
    ],
  },
  {
    id: 'incline',
    name: 'Incline Dumbbell Press',
    muscle: 'Chest',
    body: 'Upper body',
    equipment: 'Dumbbell',
    met: 6.0,
    secondary: ['Front Delts', 'Triceps'],
    cues: [
      'Set the bench to 30–45°.',
      'Lower dumbbells to the outside of your chest.',
      'Press up without letting the weights drift forward.',
    ],
  },
  {
    id: 'ohp',
    name: 'Overhead Press',
    muscle: 'Shoulders',
    body: 'Upper body',
    equipment: 'Barbell',
    met: 6.0,
    secondary: ['Triceps', 'Core'],
    cues: [
      'Brace your glutes and core before the press.',
      'Press the bar in a straight line, moving your head back.',
      'Lock out with biceps by your ears.',
    ],
  },
  {
    id: 'lateral',
    name: 'Lateral Raise',
    muscle: 'Shoulders',
    body: 'Upper body',
    equipment: 'Dumbbell',
    met: 4.5,
    secondary: ['Traps'],
    cues: [
      'Lead with your elbows, slight bend in the arm.',
      'Raise to shoulder height, no higher.',
      'Lower slowly — no swinging.',
    ],
  },
  {
    id: 'pushdown',
    name: 'Triceps Rope Pushdown',
    muscle: 'Triceps',
    body: 'Upper body',
    equipment: 'Cable',
    met: 4.5,
    secondary: ['Forearms'],
    cues: [
      'Pin elbows to your sides.',
      'Split the rope at the bottom of each rep.',
      'Control the return to stretch.',
    ],
  },
  {
    id: 'squat',
    name: 'Barbell Back Squat',
    muscle: 'Quads',
    body: 'Lower body',
    equipment: 'Barbell',
    met: 6.5,
    secondary: ['Glutes', 'Hamstrings', 'Core'],
    cues: [
      'Bar over mid-foot, big breath, brace.',
      'Sit down between your hips, knees out.',
      'Drive the floor away to stand.',
    ],
  },
  {
    id: 'rdl',
    name: 'Romanian Deadlift',
    muscle: 'Hamstrings',
    body: 'Lower body',
    equipment: 'Barbell',
    met: 6.5,
    secondary: ['Glutes', 'Lower Back'],
    cues: [
      'Push hips back with soft knees.',
      'Keep the bar dragging along your thighs.',
      'Stop at hamstring stretch, then stand tall.',
    ],
  },
  {
    id: 'legpress',
    name: 'Leg Press',
    muscle: 'Quads',
    body: 'Lower body',
    equipment: 'Machine',
    met: 5.5,
    secondary: ['Glutes', 'Hamstrings'],
    cues: [
      'Feet shoulder-width on the platform.',
      'Lower until thighs near your chest.',
      'Press without locking knees hard.',
    ],
  },
  {
    id: 'pullup',
    name: 'Pull-Up',
    muscle: 'Back',
    body: 'Upper body',
    equipment: 'Bodyweight',
    met: 8.0,
    secondary: ['Biceps', 'Forearms'],
    cues: [
      'Start from a dead hang, shoulders engaged.',
      'Pull your chest toward the bar.',
      'Lower with control to full extension.',
    ],
  },
  {
    id: 'row',
    name: 'Barbell Row',
    muscle: 'Back',
    body: 'Upper body',
    equipment: 'Barbell',
    met: 6.5,
    secondary: ['Biceps', 'Rear Delts'],
    cues: [
      'Hinge to ~45°, flat back.',
      'Pull the bar to your lower ribs.',
      'Pause, then lower under control.',
    ],
  },
  {
    id: 'cablerow',
    name: 'Seated Cable Row',
    muscle: 'Back',
    body: 'Upper body',
    equipment: 'Cable',
    met: 5.0,
    secondary: ['Biceps', 'Rear Delts'],
    cues: [
      'Sit tall, chest up.',
      'Drive elbows back, squeeze shoulder blades.',
      'Let the weight stretch you forward slowly.',
    ],
  },
  {
    id: 'curl',
    name: 'Dumbbell Biceps Curl',
    muscle: 'Biceps',
    body: 'Upper body',
    equipment: 'Dumbbell',
    met: 4.0,
    secondary: ['Forearms'],
    cues: [
      'Elbows pinned at your sides.',
      'Curl without swinging your torso.',
      'Lower slowly for full range.',
    ],
  },
  {
    id: 'lunge',
    name: 'Walking Lunge',
    muscle: 'Glutes',
    body: 'Lower body',
    equipment: 'Dumbbell',
    met: 6.0,
    secondary: ['Quads', 'Hamstrings'],
    cues: [
      'Long step, torso upright.',
      'Back knee kisses the floor.',
      'Push through the front heel to step through.',
    ],
  },
  {
    id: 'plank',
    name: 'Plank',
    muscle: 'Core',
    body: 'Core',
    equipment: 'Bodyweight',
    met: 3.5,
    secondary: ['Shoulders', 'Glutes'],
    cues: [
      'Elbows under shoulders.',
      'Squeeze glutes, tuck ribs.',
      "Breathe — don't hold your breath.",
    ],
  },
];

export const MUSCLES = ['All', 'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes', 'Triceps', 'Biceps', 'Core'] as const;
export const EQUIPMENT = ['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'] as const;

export type MuscleFilter = typeof MUSCLES[number];
export type EquipmentFilter = typeof EQUIPMENT[number];

// ---------------------------------------------------------------------------
// Routine fixtures
// ---------------------------------------------------------------------------

export const ROUTINES: Routine[] = [
  {
    id: 'push-a',
    name: 'Push Day A',
    focus: 'Chest · Shoulders · Triceps',
    lastDone: '2 days ago',
    exercises: [
      { exId: 'bench',    sets: 4, reps: 8,  weight: 60,   rest: 120 },
      { exId: 'incline',  sets: 3, reps: 10, weight: 22.5, rest: 90 },
      { exId: 'ohp',      sets: 3, reps: 8,  weight: 40,   rest: 120 },
      { exId: 'lateral',  sets: 3, reps: 15, weight: 8,    rest: 60 },
      { exId: 'pushdown', sets: 3, reps: 12, weight: 25,   rest: 60 },
    ],
  },
  {
    id: 'pull-a',
    name: 'Pull Day A',
    focus: 'Back · Biceps',
    lastDone: '4 days ago',
    exercises: [
      { exId: 'pullup',   sets: 4, reps: 8,  weight: 0,  rest: 120 },
      { exId: 'row',      sets: 4, reps: 8,  weight: 65, rest: 120 },
      { exId: 'cablerow', sets: 3, reps: 12, weight: 55, rest: 90 },
      { exId: 'curl',     sets: 3, reps: 12, weight: 12, rest: 60 },
    ],
  },
  {
    id: 'legs',
    name: 'Leg Day',
    focus: 'Quads · Hamstrings · Glutes',
    lastDone: 'Last week',
    exercises: [
      { exId: 'squat',    sets: 4, reps: 6,  weight: 90,  rest: 180 },
      { exId: 'rdl',      sets: 3, reps: 10, weight: 70,  rest: 120 },
      { exId: 'legpress', sets: 3, reps: 12, weight: 160, rest: 90 },
      { exId: 'lunge',    sets: 3, reps: 20, weight: 14,  rest: 90 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Last-performance fixtures
// ---------------------------------------------------------------------------

export const LAST_PERFORMANCE: LastPerformanceMap = {
  bench:    { date: 'Mon', sets: [[8, 60], [8, 60], [7, 60], [6, 60]] },
  incline:  { date: 'Mon', sets: [[10, 22.5], [10, 22.5], [9, 22.5]] },
  ohp:      { date: 'Mon', sets: [[8, 40], [7, 40], [6, 40]] },
  lateral:  { date: 'Mon', sets: [[15, 8], [14, 8], [12, 8]] },
  pushdown: { date: 'Mon', sets: [[12, 25], [12, 25], [11, 25]] },
  pullup:   { date: 'Sat', sets: [[8, 0], [7, 0], [6, 0], [5, 0]] },
  row:      { date: 'Sat', sets: [[8, 65], [8, 65], [7, 65], [7, 65]] },
  cablerow: { date: 'Sat', sets: [[12, 55], [12, 55], [10, 55]] },
  curl:     { date: 'Sat', sets: [[12, 12], [11, 12], [10, 12]] },
  squat:    { date: 'Thu', sets: [[6, 90], [6, 90], [5, 90], [5, 90]] },
  rdl:      { date: 'Thu', sets: [[10, 70], [10, 70], [9, 70]] },
  legpress: { date: 'Thu', sets: [[12, 160], [12, 160], [11, 160]] },
  lunge:    { date: 'Thu', sets: [[20, 14], [20, 14], [18, 14]] },
  plank:    { date: 'Thu', sets: [[60, 0], [45, 0]] },
};

export const SAMPLE_PROFILE = { weightKg: 75 };
