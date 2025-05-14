export type Exercise = {
    name: string;
    sets: number;
    reps: string;
    rest?: string;
    weight: number;
    completed: boolean;
    instructions: string;
    note?: string;
    duration?: string;
    normalized_name: string;
};

export type Cardio = {
    type: string;
    distance: number;
    description: string;
    completed: boolean;
};

export type Workout = {
    id?: string;
    workout_name: string;
    warm_up: string;
    exercises: Exercise[];
    cardio: Cardio;
    cool_down: string;
    workout_date: string;
};

export type CardioType = 'Running' | 'Cycling' | 'Swimming' | 'Rowing' | 'Walking'; // Expand as needed

export type Profile = {
    userid: string;
    username: string;
    email: string;
    lastUpdated: string;
    weight: number;
    goal: string;
    age?: string;
    monthly_progress_level: number;
};

export type DatabaseExercise = Exercise & {
    id: string;
    userId: string;
};

export type DatabaseCardio = Cardio & {
    id: string;
    userId: string;
};

export type DatabaseWorkout = Workout & {
    id: string;
    userId: string;
    exercises: DatabaseExercise[];
    cardio: DatabaseCardio;
};

export type openExerciseNotesModalFunction = (index: number) => void;
export type handleWeightChangeFunction = (index: number, newWeight: number) => void;
export type toggleExerciseCompletedFunction = (index: number) => void;
