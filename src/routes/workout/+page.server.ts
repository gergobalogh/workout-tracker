import type { PageServerLoad } from './$types';
import { json } from '@sveltejs/kit';
import type { Workout, Exercise, Cardio } from '../../lib/types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
    try {
        const [{ previousWorkoutData, previousCardioData }, incompleteWorkout] = await Promise.all([
            loadUserData(supabase),
            loadIncompleteWorkout(supabase)
        ]);

        return {
            profile: { show_rest_time: true }, // Default profile for single user
            previousWorkoutData,
            previousCardioData,
            incompleteWorkout
        };
    } catch (error) {
        console.error('Error in load function:', error);
        return {
            profile: { show_rest_time: true },
            previousWorkoutData: '',
            previousCardioData: '',
            incompleteWorkout: null
        };
    }
};

async function loadIncompleteWorkout(supabase: any): Promise<Workout | null> {
    // Fetch the most recent workout
    const { data: lastWorkout, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    console.log('Last workout:', lastWorkout, 'Error:', workoutError);

    if (workoutError || !lastWorkout) {
        return null;
    }

    // Fetch exercises for this workout
    const { data: exercises, error: exercisesError } = await supabase
        .from('workoutexercises')
        .select('*')
        .eq('workoutid', lastWorkout.id);

    console.log('Exercises:', exercises, 'Error:', exercisesError);

    if (exercisesError) {
        console.error('Error fetching exercises:', exercisesError);
        return null;
    }

    // Check if all exercises are completed
    const allCompleted = exercises && exercises.length > 0 &&
        exercises.every((exercise: any) => exercise.completed === true);

    console.log('All completed:', allCompleted, 'Exercise count:', exercises?.length);

    // If all exercises are completed, don't return the workout
    if (allCompleted) {
        return null;
    }

    // Fetch cardio for this workout
    const { data: cardioData, error: cardioError } = await supabase
        .from('workoutcardio')
        .select('*')
        .eq('workoutid', lastWorkout.id)
        .single();

    // Transform database exercises to Exercise type
    const transformedExercises: Exercise[] = exercises ? exercises.map((ex: any) => ({
        name: ex.exercise_name,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest || 60,
        weight: ex.weight || 0,
        completed: ex.completed || false,
        instructions: ex.notes || '',
        note: ex.notes || '',
        normalized_name: ex.normalized_name || ''
    })) : [];

    // Transform cardio data
    const cardio: Cardio = cardioData ? {
        type: cardioData.type || '',
        distance: cardioData.distance || 0,
        description: cardioData.description || '',
        completed: cardioData.completed || false
    } : {
        type: '',
        distance: 0,
        description: '',
        completed: false
    };

    return {
        id: lastWorkout.id,
        workout_name: lastWorkout.workout_name || '',
        warm_up: lastWorkout.warm_up || '',
        exercises: transformedExercises,
        cardio,
        cool_down: lastWorkout.cool_down || '',
        workout_date: lastWorkout.workout_date || ''
    };
}

async function loadUserData(supabase: any) {
    // Fetch workouts from the last 7 days (no user filtering for single-user mode)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .gte('workout_date', sevenDaysAgo.toISOString())
        .order('workout_date', { ascending: false });

    if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError);
        return {
            previousWorkoutData: '',
            previousCardioData: ''
        };
    }

    if (!workouts || workouts.length === 0) {
        return {
            previousWorkoutData: '',
            previousCardioData: ''
        };
    }

    // Get all workout IDs
    const workoutIds = workouts.map((workout: Workout) => workout.id);

    // Use Promise.all to fetch cardio and workout exercises concurrently
    const [cardioResult, workoutExercisesResult] = await Promise.all([
        supabase.from('workoutcardio').select('*').in('workoutid', workoutIds),
        supabase.from('workoutexercises').select('*').in('workoutid', workoutIds)
    ]);

    if (cardioResult.error || workoutExercisesResult.error) {
        return {
            previousWorkoutData: '',
            previousCardioData: ''
        };
    }

    const groupedByDate = formatWorkoutData(workoutExercisesResult.data).reduce(
        (acc, workout) => {
            if (!acc[workout.date]) {
                acc[workout.date] = [];
            }
            acc[workout.date].push(workout);
            return acc;
        },
        {} as Record<string, any[]>
    );

    // Format grouped strength data
    const formattedGroupedData = Object.entries(groupedByDate)
        .map(([date, workouts]) => {
            const dayExercises = workouts
                .map(
                    (w) =>
                        `- ${w.name}: ${w.sets}x${w.reps} @ ${w.weight}kg (Notes: ${w.notes || ''})`
                )
                .join('\n');
            return `${date}:\n${dayExercises}`;
        })
        .join('\n');

    // Format cardio data for display
    const formattedCardioDisplayData = formatCardioData(cardioResult.data)
        .map((cardio) => {
            return `${cardio.date}: ${cardio.type} ${cardio.distance} km in ${cardio.duration} min. Notes: ${cardio.notes}`;
        })
        .join('\n');
    return {
        previousWorkoutData: formattedGroupedData,
        previousCardioData: formattedCardioDisplayData
    };
}

// Remaining helper functions (formatWorkoutData, formatCardioData, tryParseJSON)
function formatWorkoutData(workoutExercises: any[]) {
    return workoutExercises.map((exercise) => ({
        date: exercise.started_at ? exercise.started_at.split('T')[0] : 'Unknown',
        name: exercise.exercise_name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        notes: exercise.notes || ''
    }));
}

function formatCardioData(cardio: any[]) {
    return cardio.map((cardioEntry) => ({
        date: cardioEntry.created_at ? cardioEntry.created_at.split('T')[0] : 'Unknown',
        type: cardioEntry.type,
        duration: cardioEntry.duration,
        distance: cardioEntry.distance,
        notes: cardioEntry.notes || ''
    }));
}

function tryParseJSON(str: string) {
    try {
        return JSON.parse(str);
    } catch (e) {
        console.error('JSON parse error', e);
        return { error: 'Could not parse JSON output.' };
    }
}
