export interface MobilityExercise {
  id: string;
  name: string;
  duration: number; // seconds
  description: string;
}

export interface MobilityRoutine {
  id: 'morning' | 'evening';
  name: string;
  goal: string;
  totalMinutes: number;
  color: { from: string; text: string; bg: string };
  exercises: MobilityExercise[];
}

export const MOBILITY_ROUTINES: MobilityRoutine[] = [
  {
    id: 'morning',
    name: 'Morning Routine',
    goal: 'Activate, lubricate joints, prime the nervous system.',
    totalMinutes: 12,
    color: { from: '#f97316', text: '#fdba74', bg: '#7c2d12' },
    exercises: [
      {
        id: 'hip-switches',
        name: '90/90 Hip Switches',
        duration: 120,
        description: 'Sit on the floor, one leg in front at 90°, one behind. Slowly rotate side to side with control.',
      },
      {
        id: 'worlds-greatest',
        name: "World's Greatest Stretch",
        duration: 120,
        description: 'From a lunge, place your same-side hand inside your foot, rotate your top arm to the ceiling, then transition through thoracic extension. Switch sides halfway.',
      },
      {
        id: 'cat-cow',
        name: 'Cat-Cow',
        duration: 60,
        description: 'Hands and knees, slowly arch and round the spine with breath. Mobilises the full spinal column.',
      },
      {
        id: 'thoracic-rotations',
        name: 'Thoracic Spine Rotations',
        duration: 120,
        description: 'Quadruped, hand behind head, rotate elbow up to the ceiling then down. Switch sides halfway.',
      },
      {
        id: 'ankle-circles',
        name: 'Ankle Circles + Calf CARs',
        duration: 60,
        description: 'Slow controlled circles through the full ankle range — 30 seconds each ankle.',
      },
      {
        id: 'dead-hang',
        name: 'Dead Hang',
        duration: 120,
        description: 'Passive hang from a bar or door frame. Break into sets if needed. Decompresses the spine and opens the shoulder girdle.',
      },
      {
        id: 'deep-squat',
        name: 'Deep Squat Hold',
        duration: 120,
        description: 'Feet shoulder-width, toes slightly out, sink into the deepest comfortable squat. Keep heels down and breathe.',
      },
    ],
  },
  {
    id: 'evening',
    name: 'Evening Routine',
    goal: 'Parasympathetic activation, tissue recovery, reduce tension.',
    totalMinutes: 15,
    color: { from: '#6366f1', text: '#a5b4fc', bg: '#1e1b4b' },
    exercises: [
      {
        id: 'legs-up-wall',
        name: 'Legs Up the Wall',
        duration: 180,
        description: 'Lie on your back, legs straight up a wall. Arms relaxed. Breathe slowly through the nose.',
      },
      {
        id: 'figure-4',
        name: 'Supine Figure-4',
        duration: 240,
        description: 'Cross one ankle over the opposite knee and gently pull the bottom thigh towards your chest. 2 min each side.',
      },
      {
        id: 'childs-pose',
        name: "Child's Pose with Lat Reach",
        duration: 120,
        description: 'Knees wide, big toes touching, sit hips back to heels. Walk hands forward and reach actively through fingertips.',
      },
      {
        id: 'forward-fold',
        name: 'Seated Forward Fold',
        duration: 120,
        description: 'Legs extended, hinge from the hips, reach forward and hold. Let gravity do the work — don\'t force it.',
      },
      {
        id: 'pec-stretch',
        name: 'Doorway Pec Stretch',
        duration: 120,
        description: 'Forearms against a door frame at 90°, step one foot forward and lean gently. Switch sides halfway.',
      },
      {
        id: 'spinal-twist',
        name: 'Supine Spinal Twist',
        duration: 120,
        description: 'Lying on your back, bring one knee across the body, extend the opposite arm out. 1 min each side.',
      },
    ],
  },
];
