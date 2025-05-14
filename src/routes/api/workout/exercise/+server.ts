import { json } from '@sveltejs/kit';

export async function POST({ request, locals: { supabase, safeGetSession } }) {
    try {
        // Get the session from locals
        const session = await safeGetSession();
        if (!session || !session.user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse the request body
        const data = await request.json();
        const {
            workoutId,
            exercise_name,
            workout_name,
            normalized_name,
            sets,
            reps,
            weight,
            notes,
            completed
        } = data;
        console.log(data);
        // First, check if we need to create a new workout
        let currentWorkoutId = workoutId;
        if (!currentWorkoutId) {
            // Create a new workout entry
            const { data: workoutData, error: workoutError } = await supabase
                .from('workouts')
                .insert({
                    user_id: session.user.id,
                    workout_name: workout_name,
                    created_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (workoutError) {
                console.error('Error creating workout:', workoutError);
                return json({ error: 'Failed to create workout' }, { status: 500 });
            }
            currentWorkoutId = workoutData.id;
        }

        // Check if this exercise already exists for this workout
        const { data: existingExercises, error: queryError } = await supabase
            .from('workoutexercises')
            .select('workout_exercise_id')
            .eq('workoutid', currentWorkoutId)
            .eq('exercise_name', exercise_name)
            .eq('user_id', session.user.id);

        if (queryError) {
            console.error('Error querying for existing exercise:', queryError);
            return json({ error: 'Failed to query database' }, { status: 500 });
        }

        let result;
        if (existingExercises && existingExercises.length > 0) {
            // Update existing exercise
            const exerciseId = existingExercises[0].workout_exercise_id;
            const updateData = {
                sets,
                reps,
                weight,
                notes,
                completed,
                normalized_name,
                completed_at: new Date().toISOString()
            };

            const { data: updateResult, error: updateError } = await supabase
                .from('workoutexercises')
                .update(updateData)
                .eq('workout_exercise_id', exerciseId)
                .select();

            if (updateError) {
                console.error('Error updating exercise:', updateError);
                return json({ error: 'Failed to update exercise' }, { status: 500 });
            }

            result = updateResult;
        } else {
            // Insert new exercise
            const { data: insertResult, error: insertError } = await supabase
                .from('workoutexercises')
                .insert({
                    workoutid: currentWorkoutId,
                    user_id: session.user.id,
                    exercise_name,
                    normalized_name,
                    sets,
                    reps,
                    weight,
                    notes,
                    completed,
                    started_at: new Date().toISOString()
                })
                .select();

            if (insertError) {
                console.error('Error inserting exercise:', insertError);
                return json({ error: 'Failed to insert exercise' }, { status: 500 });
            }

            result = insertResult;
        }

        return json({
            success: true,
            workoutId: currentWorkoutId,
            exercise: result[0]
        });
    } catch (error) {
        console.error('Server error processing workout exercise:', error);
        return json({ error: 'Server error' }, { status: 500 });
    }
}
