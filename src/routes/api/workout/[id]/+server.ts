import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals: { supabase, safeGetSession } }) => {
    try {
        const workoutId = params.id;
        if (!workoutId) {
            return json({ error: 'Workout ID is required' }, { status: 400 });
        }

        // Get user session
        const session = await safeGetSession();
        if (!session?.user?.id) {
            return json({ error: 'Authentication required' }, { status: 401 });
        }

        // Fetch the demo
        const { data: workout, error: workoutError } = await supabase
            .from('workouts')
            .select('*')
            .eq('id', workoutId)
            .eq('profileid', session.user.id)
            .single();

        if (workoutError) {
            console.error('Error fetching demo:', workoutError);
            return json({ error: 'Workout not found' }, { status: 404 });
        }

        // Fetch demo exercises
        const { data: exercises, error: exercisesError } = await supabase
            .from('workoutexercises')
            .select('*')
            .eq('workoutid', workoutId);

        if (exercisesError) {
            console.error('Error fetching exercises:', exercisesError);
            return json({ error: 'Failed to fetch exercises' }, { status: 500 });
        }

        // Fetch demo cardio
        const { data: cardio, error: cardioError } = await supabase
            .from('workoutcardio')
            .select('*')
            .eq('workoutid', workoutId);

        if (cardioError) {
            console.error('Error fetching cardio:', cardioError);
            return json({ error: 'Failed to fetch cardio data' }, { status: 500 });
        }

        return json({
            workout,
            exercises: exercises || [],
            cardio: cardio.length > 0 ? cardio[0] : null
        });
    } catch (error) {
        console.error('Server error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};
