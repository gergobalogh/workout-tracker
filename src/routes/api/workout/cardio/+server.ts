import { json } from '@sveltejs/kit';

export async function POST({ request, locals: { supabase, safeGetSession } }) {
    try {
        const session = await safeGetSession();
        if (!session || !session.user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { workoutId, type, distance, completed, workout_name } = data;

        // First, check if we need to create a new demo
        let currentWorkoutId = workoutId;
        if (!currentWorkoutId) {
            // Create a new demo entry
            const { data: workoutData, error: workoutError } = await supabase
                .from('workouts')
                .insert({
                    user_id: session.user?.id,
                    workout_name,
                    created_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (workoutError) {
                console.error('Error creating demo:', workoutError);
                return json({ error: 'Failed to create demo' }, { status: 500 });
            }
            currentWorkoutId = workoutData.id;
        }

        // Check if cardio already exists for this demo
        const { data: existingCardio, error: queryError } = await supabase
            .from('workoutcardio')
            .select('workout_cardio_id')
            .eq('workoutid', currentWorkoutId)
            .eq('user_id', session.user?.id);

        if (queryError) {
            console.error('Error querying for existing cardio:', queryError);
            return json({ error: 'Failed to query database' }, { status: 500 });
        }

        let result;
        if (existingCardio && existingCardio.length > 0) {
            // Update existing cardio
            const cardioId = existingCardio[0].workout_cardio_id;
            const updateData = {
                type,
                distance,
                completed
            };

            const { data: updateResult, error: updateError } = await supabase
                .from('workoutcardio')
                .update(updateData)
                .eq('workout_cardio_id', cardioId)
                .select();

            if (updateError) {
                console.error('Error updating cardio:', updateError);
                return json({ error: 'Failed to update cardio' }, { status: 500 });
            }

            result = updateResult;
        } else {
            // Insert new cardio
            const { data: insertResult, error: insertError } = await supabase
                .from('workoutcardio')
                .insert({
                    workoutid: currentWorkoutId,
                    user_id: session.user?.id,
                    type,
                    distance,
                    completed,
                    created_at: new Date().toISOString()
                })
                .select();

            if (insertError) {
                console.error('Error inserting cardio:', insertError);
                return json({ error: 'Failed to insert cardio' }, { status: 500 });
            }

            result = insertResult;
        }

        return json({
            success: true,
            workoutId: currentWorkoutId,
            cardio: result[0]
        });
    } catch (error) {
        console.error('Server error processing demo cardio:', error);
        return json({ error: 'Server error' }, { status: 500 });
    }
}
