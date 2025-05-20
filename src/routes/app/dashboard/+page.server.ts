import type { PageServerLoad } from './$types';
import { ltc } from '../../../lib/log';
//@TODO peak performance days
export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    try {
        // Get user session
        const session = await safeGetSession();
        if (!session?.user?.id) {
            return { profile: null };
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            throw new Error('Failed to load user profile');
        }

        if (!profile) {
            return { profile: null };
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

        // Calculate date range for workouts (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch workouts
        const { data: workouts, error: workoutsError } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', session.user.id)
            .gte('workout_date', sevenDaysAgo.toISOString());

        if (workoutsError) {
            console.error('Error fetching workouts:', workoutsError);
            throw new Error('Failed to load workouts');
        }

        // If no workouts, return early with default values
        if (!workouts || workouts.length === 0) {
            return {
                profile,
                workouts: [],
                workoutExercises: [],
                weights: [],
                cardio: [],
                progressLevels: progressLevels || []
            };
        }
        // Get all demo IDs
        const workoutIds = workouts.map((workout) => workout.workoutid);
        // Use Promise.all to fetch cardio and demo exercises concurrently
        const [cardioResult, workoutExercisesResult, weightResult] = await Promise.all([
            supabase.from('workoutcardio').select('*').in('workoutid', workoutIds),
            supabase.from('workoutexercises').select('*').in('workoutid', workoutIds),
            supabase.from('user_weights').select('*').eq('user_id', session.user.id)
        ]);

        // Check for errors in parallel queries
        if (cardioResult.error) {
            console.error('Error fetching cardio data:', cardioResult.error);
            throw new Error('Failed to load cardio data');
        }

        if (workoutExercisesResult.error) {
            console.error('Error fetching demo exercises:', workoutExercisesResult.error);
            throw new Error('Failed to load demo exercises');
        }

        if (weightResult.error) {
            console.error('Error fetching user weights:', weightResult.error);
            throw new Error('Failed to load user weights');
        }

        // Return all the data
        return {
            profile,
            workouts,
            weights: weightResult.data || [],
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
