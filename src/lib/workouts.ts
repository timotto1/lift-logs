export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  rest: number; // seconds
}

export interface WorkoutColor {
  from: string;
  to: string;
  text: string;
  bg: string;
}

export interface Workout {
  id: number;
  name: string;
  short: string;
  accent: string;
  color: WorkoutColor;
  exercises: Exercise[];
}

export const WORKOUTS: Workout[] = [
  {
    id: 1,
    name: 'Chest / Back / Arms',
    short: 'Upper',
    accent: 'rose',
    color: { from: '#f43f5e', to: '#fb7185', text: '#fda4af', bg: '#881337' },
    exercises: [
      { id: 'incbench', name: 'Barbell Incline Bench Press', sets: 3, reps: 10, rest: 120 },
      { id: 'incrow', name: 'Dumbbell Incline Row', sets: 4, reps: 12, rest: 90 },
      { id: 'dip', name: 'Parallel Bar Dip', sets: 3, reps: 12, rest: 90 },
      { id: 'pulldown', name: 'Cable Straight Arm Pulldown', sets: 2, reps: 12, rest: 60 },
      { id: 'inccurl', name: 'Seated DB Incline Curl', sets: 3, reps: 12, rest: 60 },
      { id: 'tricep', name: 'Cable OH Tricep Extension', sets: 3, reps: 15, rest: 60 },
    ],
  },
  {
    id: 2,
    name: 'Legs & Abs',
    short: 'Lower',
    accent: 'violet',
    color: { from: '#8b5cf6', to: '#a78bfa', text: '#c4b5fd', bg: '#4c1d95' },
    exercises: [
      { id: 'legext', name: 'Leg Extension (Primal)', sets: 5, reps: 10, rest: 90 },
      { id: 'revcrunch', name: 'Reverse Incline Crunch', sets: 4, reps: 15, rest: 60 },
      { id: 'smithcalf', name: 'Smith Calf Raise (Block)', sets: 3, reps: 20, rest: 60 },
      { id: 'cablecrunch', name: 'Cable Kneeling Crunch', sets: 3, reps: 15, rest: 60 },
      { id: 'rdl', name: 'DB Romanian Deadlift', sets: 3, reps: 15, rest: 120 },
    ],
  },
  {
    id: 3,
    name: 'Shoulders / Back',
    short: 'Upper',
    accent: 'amber',
    color: { from: '#f59e0b', to: '#fbbf24', text: '#fcd34d', bg: '#78350f' },
    exercises: [
      { id: 'pullup', name: 'Pull-Up (Overhand)', sets: 3, reps: 10, rest: 120 },
      { id: 'ohp', name: 'DB Standing OHP', sets: 3, reps: 12, rest: 90 },
      { id: 'rearfly', name: 'Seated Rear Cable Fly', sets: 3, reps: 15, rest: 60 },
      { id: 'lateral', name: 'Cable Lateral Raise', sets: 4, reps: 12, rest: 60 },
      { id: 'curl', name: 'Seated DB Incline Curl', sets: 4, reps: 12, rest: 60 },
    ],
  },
  {
    id: 4,
    name: 'Legs (Gym)',
    short: 'Lower',
    accent: 'sky',
    color: { from: '#0ea5e9', to: '#38bdf8', text: '#7dd3fc', bg: '#0c4a6e' },
    exercises: [
      { id: 'legpress', name: 'Leg Press (Plate-Loaded)', sets: 3, reps: 10, rest: 120 },
      { id: 'legcurl', name: 'Machine Lying Leg Curl', sets: 4, reps: 10, rest: 90 },
      { id: 'calfraise', name: 'Machine Seated Calf Raise', sets: 3, reps: 15, rest: 60 },
      { id: 'adduction', name: 'Machine Seated Hip Adduction', sets: 2, reps: 12, rest: 60 },
      { id: 'hipthrust', name: 'Machine Hip Thrust', sets: 2, reps: 15, rest: 90 },
      { id: 'pendulum', name: 'Pendulum Squat', sets: 2, reps: 15, rest: 120 },
    ],
  },
];

export function getWorkoutById(id: number): Workout | undefined {
  return WORKOUTS.find((w) => w.id === id);
}

export function getNextWorkoutId(lastWorkoutId: number | null): number {
  if (lastWorkoutId === null) return 1;
  return (lastWorkoutId % 4) + 1;
}

export function getAllExercises(): Array<Exercise & { workout: Workout }> {
  return WORKOUTS.flatMap((w) => w.exercises.map((ex) => ({ ...ex, workout: w })));
}
