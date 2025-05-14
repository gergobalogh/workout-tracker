import type { PageServerLoad } from './$types';
import { json } from '@sveltejs/kit';
import type { Workout } from '../../../lib/types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    try {
        const session = await safeGetSession();
        if (!session?.user?.id) {
            return { profile: null };
        }

        const userId = session.user.id;

        const { profile, previousWorkoutData, previousCardioData } = await loadUserData(
            userId,
            supabase
        );
        // Instead of starting the generation process here,
        // we'll just return the user data
        return {
            profile,
            previousWorkoutData,
            previousCardioData
        };
    } catch (error) {
        console.error('Error in load function:', error);
        throw error;
    }
};

// Create a POST endpoint to start workout generation
export const actions = {
    generateWorkout: async ({ request, locals: { supabase, safeGetSession } }) => {
        const session = await safeGetSession();
        if (!session?.user?.id) {
            return json({ error: 'Not authenticated' }, { status: 401 });
        }
        console.log("this function is called. check if it's needed");
        const userId = session.user.id;

        try {
            const { profile } = await loadUserData(userId, supabase);

            // For starting the generation process
            // Just return a success response; the actual data will be fetched via API
            return json({
                success: true,
                message: 'Workout generation started',
                generationId: Date.now().toString() // Use as a unique ID for this generation
            });
        } catch (error: unknown) {
            console.error('Error starting workout generation:', error);

            let errorMessage = 'An unknown error occurred';

            if (error instanceof Error) {
                errorMessage = error.message;
            }

            return json({ error: errorMessage }, { status: 500 });
        }
    }
};

async function loadUserData(userId: string, supabase: any) {
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to load user profile');
    }

    // Fetch workouts from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .gte('workout_date', sevenDaysAgo.toISOString());

    if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError);
        throw new Error('Failed to load workouts');
    }
    if (!workouts || workouts.length === 0) {
        return {
            profile,
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
        throw new Error('Failed to load cardio or workout exercises');
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
        profile,
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
