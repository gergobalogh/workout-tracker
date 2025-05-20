import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    try {
        // Get user session
        const session = await safeGetSession();
        if (!session?.user?.id) {
            return { profile: null, workouts: [] };
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            return { profile: null, workouts: [] };
        }

        // Fetch demo history
        const { data: workouts, error: workoutsError } = await supabase
            .from('workouts')
            .select(
                `
                workoutid,
                workout_date,
                workout_name,
                notes
            `
            )
            .eq('user_id', session.user.id)
            .order('workout_date', { ascending: false });

        if (workoutsError) {
            console.error('Error fetching workouts:', workoutsError);
            return { profile, workouts: [] };
        }

        return {
            profile,
            workouts: workouts || []
        };
    } catch (error) {
        console.error('Server error:', error);
        return { profile: null, workouts: [] };
    }
};
