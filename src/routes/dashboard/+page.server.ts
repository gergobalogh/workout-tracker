import type { PageServerLoad } from './$types';

// Single user mode - hardcoded user ID (matches API routes)
const SINGLE_USER_ID = '57d01906-a126-4809-aeff-37570d7ff2c6';

//@TODO peak performance days
export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    try {
        // Get user session or use single-user mode
        const session = await safeGetSession();
        const userId = session?.user?.id || SINGLE_USER_ID;

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

        if (!profile) {
            return {
                profile: null,
                workouts: [],
                workoutExercises: [],
                weights: [],
                cardio: [],
                progressLevels: []
            };
        }

        // Fetch progress levels
        const { data: progressLevels, error: progressLevelError } = await supabase
            .from('progress_levels')
            .select('*')
            .in('level_id', [profile.monthly_progress_level, profile.monthly_progress_level + 1]);

        if (progressLevelError) {
            console.error('Error fetching progress levels:', progressLevelError);
            throw new Error('Failed to load progress levels');
        }

        // Calculate date range for workouts (last 30 days for monthly progress)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch workouts (single-user mode - no user_id filter needed)
        const { data: workouts, error: workoutsError } = await supabase
            .from('workouts')
            .select('*')
            .gte('workout_date', thirtyDaysAgo.toISOString())
            .order('workout_date', { ascending: false });

        if (workoutsError) {
            console.error('Error fetching workouts:', workoutsError);
            throw new Error('Failed to load workouts');
        }

        // Fetch user weights (independent of workouts)
        const { data: weights, error: weightError } = await supabase
            .from('user_weights')
            .select('*')
            .eq('user_id', userId);

        if (weightError) {
            console.error('Error fetching user weights:', weightError);
        }

        // If no workouts, return early with default values (but include weights)
        if (!workouts || workouts.length === 0) {
            return {
                profile,
                workouts: [],
                workoutExercises: [],
                weights: weights || [],
                cardio: [],
                progressLevels: progressLevels || []
            };
        }

        // Get all workout IDs
        const workoutIds = workouts.map((workout) => workout.id);

        // Fetch cardio and workout exercises concurrently
        const [cardioResult, workoutExercisesResult] = await Promise.all([
            supabase.from('workoutcardio').select('*').in('workoutid', workoutIds),
            supabase.from('workoutexercises').select('*').in('workoutid', workoutIds)
        ]);

        // Check for errors in parallel queries
        if (cardioResult.error) {
            console.error('Error fetching cardio data:', cardioResult.error);
            throw new Error('Failed to load cardio data');
        }

        if (workoutExercisesResult.error) {
            console.error('Error fetching workout exercises:', workoutExercisesResult.error);
            throw new Error('Failed to load workout exercises');
        }

        // Return all the data
        return {
            profile,
            workouts,
            weights: weights || [],
            workoutExercises: workoutExercisesResult.data || [],
            cardio: cardioResult.data || [],
            progressLevels: progressLevels || []
        };
    } catch (error) {
        console.error('Unexpected error in load function:', error);
        // Return a more structured error response
        return {
            error: true,
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
            profile: null,
            workouts: [],
            weights: [],
            workoutExercises: [],
            cardio: [],
            progressLevels: []
        };
    }
};
