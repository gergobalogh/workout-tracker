import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Workout } from '$lib/types';
import { tryParseJSON } from '$lib/utils/jsonParser';
import { normalizeExerciseName } from '$lib/utils/normalizer';

export const GET: RequestHandler = async ({ locals: { supabase } }) => {
    // Single user mode - no authentication required
    const userId = '57d01906-a126-4809-aeff-37570d7ff2c6';

    try {
        const { profile, previousWorkoutData, previousCardioData } = await loadUserData(
            userId,
            supabase
        );

        // Create a response with streaming capabilities
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                const writeStep = (step: string) => {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ loadingStep: step })}\n\n`)
                    );
                };

                try {
                    // STEP 0: loading history is implicit
                    if (!previousWorkoutData || !previousCardioData) {
                        writeStep('generate');
                        const workoutJson = await generateWorkoutWithoutPreviousData(
                            profile.goal,
                            userId,
                            supabase
                        );
                        writeStep('complete');
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ result: workoutJson })}\n\n`)
                        );
                        controller.close();
                        return;
                    }

                    writeStep('generate');
                    const workoutText = await fetchOpenAI({
                        model: 'gpt-3.5-turbo',
                        system:
                            "You are a certified personal trainer and endurance coach. The user's goal is: " +
                            profile.goal +
                            '. Create effective full-body strength workouts using basic gym equipment, followed by a gym cardio segment. Ensure progression, balance, and recovery.',
                        user: `Based on the following previous weeks workout data:\n\n${previousWorkoutData}\n\n${previousCardioData}\n\nGive me a single full-body gym workout with multiple exercises. Include sets, reps, rest time. End with one cardio component (e.g., treadmill, rowing machine). Use metric units.;`,
                        userId,
                        supabase
                    });

                    writeStep('critique');
                    const critique = await fetchOpenAI({
                        model: 'gpt-3.5-turbo',
                        system: `You are a certified strength and conditioning coach. Assess this workout based on the user's goal: ${profile.goal}. Focus on balance, safety, effectiveness, and progression. Provide recommendations.`,
                        user: `Review the following workout:\n\n${workoutText}`,
                        userId,
                        supabase
                    });

                    const ultimate = await fetchOpenAI({
                        model: 'gpt-3.5-turbo',
                        system: 'You are an elite personal trainer. Optimize workouts based on critique while preserving intensity and purpose. Provide a clear, structured output with warm-up, exercises, cardio, and cool-down.',
                        user: `Workout:\n${workoutText}\n\nFeedback:\n${critique}`,
                        userId,
                        supabase
                    });

                    writeStep('json_conversion');
                    const workoutJson = await fetchOpenAI({
                        model: 'gpt-3.5-turbo',
                        system: `Convert this workout into JSON with the following structure:\n{
                                    workout_name: string,
                                    warm_up: string,
                                    exercises: [{ name: string, sets: number, reps: , // Either a plain number (e.g., "12"), or a duration for isometric exercises (e.g., "30 seconds"), rest: string }],
                                    cardio: { type: string, distance: number, description: string },
                                    cool_down: string
                                }`,
                        user: ultimate,
                        userId,
                        supabase
                    });

                    const parsedWorkout: Workout = tryParseJSON(workoutJson);
                    if (
                        parsedWorkout &&
                        parsedWorkout.exercises &&
                        Array.isArray(parsedWorkout.exercises)
                    ) {
                        writeStep('adding_weights');
                        await Promise.all(
                            parsedWorkout.exercises.map(async (exercise, index) => {
                                const normalizedName = normalizeExerciseName(exercise.name);

                                const { data: matches, error: matchError } = await supabase.rpc(
                                    'search_workout_exercises',
                                    {
                                        query: normalizedName,
                                        uid: userId
                                    }
                                );
                                console.log('-------------------');
                                console.log(normalizedName);
                                if (matches && !matchError) {
                                    // Find the best match using Levenshtein ratio
                                    const bestMatch = matches.find((match: any) => {
                                        const maxLength = Math.max(
                                            normalizedName.length,
                                            match.normalized_name.length
                                        );
                                        const ratio = match.distance / maxLength;
                                        return ratio <= 0.15; // Accept match if 85%+ similar
                                    });

                                    if (bestMatch) {
                                        console.log(bestMatch.normalized_name);
                                        console.log('-------------------');

                                        // Replace name with matched one for consistency
                                        exercise.name = bestMatch.exercise_name;
                                        exercise.normalized_name = bestMatch.normalized_name;

                                        // Add the latest weight from best match
                                        exercise.weight = bestMatch.weight;
                                        return;
                                    }
                                }

                                // If no match found, fallback to last known weight for exact exercise name
                                const { data: fallback, error: fallbackError } = await supabase
                                    .from('workoutexercises')
                                    .select('*')
                                    .eq('user_id', userId)
                                    .eq('exercise_name', exercise.name)
                                    .eq('completed', true)
                                    .order('workout_date', { ascending: false })
                                    .limit(1)
                                    .maybeSingle();

                                if (fallback && !fallbackError) {
                                    exercise.weight = fallback.weight;
                                }
                                exercise.normalized_name = normalizedName;
                            })
                        );
                    }

                    writeStep('complete');
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ result: parsedWorkout })}\n\n`)
                    );
                    controller.close();
                } catch (error) {
                    console.error('Error during demo generation process:', error);
                    if (error instanceof Error) {
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({ loadingStep: 'error', error: error.message })}\n\n`
                            )
                        );
                        controller.close();
                    }
                }
            }
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive'
            }
        });
    } catch (error) {
        console.error('Error in demo generation API:', error);
        let errorMessage = 'An unknown error occurred';

        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return json({ error: errorMessage }, { status: 500 });
    }
};

async function generateWorkoutWithoutPreviousData(goal: string, userId: string, supabase: any) {
    console.log(`Generating workout without previous data for userId: ${userId}`);
    const workoutText = await fetchOpenAI({
        model: 'gpt-3.5-turbo',
        system: `You are a certified personal trainer and endurance coach. The user's goal is: ${goal}. Create an effective full-body strength workout for a beginner to intermediate level, using kettlebells, dumbbells, barbells, followed by a gym cardio segment. Ensure balance and safety.`,
        user: `Create a single full-body gym workout with multiple exercises. Include sets, reps, rest time, and suggested starting weights. End with one cardio component (e.g., treadmill, rowing machine). Use metric units.`,
        userId,
        supabase
    });
    const critique = await fetchOpenAI({
        model: 'gpt-3.5-turbo',
        system: `You are a certified strength and conditioning coach. Assess this workout based on the user's goal: ${goal}. Focus on balance, safety, effectiveness, and progression. Provide recommendations.`,
        user: `Review the following workout:\n\n${workoutText}`,
        userId,
        supabase
    });

    const ultimate = await fetchOpenAI({
        model: 'gpt-3.5-turbo',
        system: 'You are an elite personal trainer. Optimize workouts based on critique while preserving intensity and purpose. Provide a clear, structured output with warm-up, exercises, cardio, and cool-down.',
        user: `Workout:\n${workoutText}\n\nFeedback:\n${critique}`,
        userId,
        supabase
    });
    const workoutJson = await fetchOpenAI({
        model: 'gpt-3.5-turbo',
        system: `Convert this workout into JSON with the following structure:\n{
      workout_name: string,
      warm_up: string,
      exercises: [{ name: string, sets: number, reps: string, rest: string,}],
      cardio: { type: string, distance: number, description: string },
      cool_down: string
    }`,
        user: ultimate,
        userId,
        supabase
    });

    const parsedWorkout: Workout = tryParseJSON(workoutJson);
    parsedWorkout.exercises.map((exercise) => {
        exercise.normalized_name = normalizeExerciseName(exercise.name);
    });
    const { data, error } = await supabase.rpc('increment_generations_used', { p_user_id: userId });

    if (error) {
        console.error('Error incrementing generations_used:', error);
    } else {
        console.log('Generations used incremented successfully:', data);
    }
    return parsedWorkout;
}

// Helper function to fetch OpenAI data
async function fetchOpenAI({
    model,
    system,
    user,
    userId,
    supabase
}: {
    model: 'gpt-3.5-turbo' | 'gpt-4';
    system: string;
    user: string;
    userId: string;
    supabase: any;
}) {
    if (!OPENAI_API_KEY) {
        throw new Error('Missing OpenAI API Key');
    }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user }
            ],
            temperature: 0.7
        })
    });
    const data = await res.json();
    const responseContent = data.choices?.[0]?.message?.content || 'No response.';
    const { error } = await supabase.from('openai_requests').insert([
        {
            user_id: userId,
            model,
            system_prompt: system,
            user_prompt: user,
            openai_response: responseContent
        }
    ]);

    if (error) {
        console.error('Error saving OpenAI request:', error);
    }
    return responseContent;
}

// Helper functions - reused from your original code
async function loadUserData(userId: string, supabase: any) {
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    // If no profile found (e.g., in demo mode), use default profile
    let userProfile = profile;
    if (profileError || !profile) {
        console.log('No profile found, using default profile for demo/single-user mode');
        userProfile = {
            user_id: userId,
            goal: 'General fitness and strength building',
            fitness_level: 'intermediate',
            available_equipment: 'gym equipment',
            workout_frequency: 3
        };
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
            profile: userProfile,
            previousWorkoutData: '',
            previousCardioData: ''
        };
    }

    // Get all demo IDs
    const workoutIds = workouts.map((workout: Workout) => workout.id);

    // Use Promise.all to fetch cardio and demo exercises concurrently
    const [cardioResult, workoutExercisesResult] = await Promise.all([
        supabase.from('workoutcardio').select('*').in('workoutid', workoutIds),
        supabase.from('workoutexercises').select('*').in('workoutid', workoutIds)
    ]);

    if (cardioResult.error || workoutExercisesResult.error) {
        throw new Error('Failed to load cardio or demo exercises');
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
                        `- ${w.name}: ${w.sets} sets, ${w.reps} reps with weight: ${w.weight}kg ${w.notes ? `(Notes: ${w.notes})` : ''}`
                )
                .join('\n');
            return `${date}:\n${dayExercises}`;
        })
        .join('\n');

    // Format cardio data for display
    const formattedCardioDisplayData = formatCardioData(cardioResult.data)
        .map((cardio) => {
            return `${cardio.date}: ${cardio.type} ${cardio.distance} km. Notes: ${cardio.notes}`;
        })
        .join('\n');
    return {
        profile: userProfile,
        previousWorkoutData: formattedGroupedData,
        previousCardioData: formattedCardioDisplayData
    };
}

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
        distance: cardioEntry.distance,
        notes: cardioEntry.notes || ''
    }));
}
