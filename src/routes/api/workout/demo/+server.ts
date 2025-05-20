import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Exercise, Workout } from '$lib/types';
import { tryParseJSON } from '$lib/utils/jsonParser';
import { normalizeExerciseName } from '$lib/utils/normalizer';

export const GET: RequestHandler = async ({ url }) => {
    const workoutType = url.searchParams.get('type') || '';
    const level = url.searchParams.get('level') || 'beginner';

    try {
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
                    writeStep('starting');
                    // Customize the system prompt based on a workout type
                    let systemPrompt = `You are a certified personal trainer and endurance coach with expertise in program design. Create a personalized workout plan based on the user’s goal or workout type. Structure it into warm-up, main workout, (optional cardio), and cool-down. Use bullet points with exercise names, sets, reps/durations, and rest. Ensure the routine is balanced and safe. Adjust exercise complexity, intensity, and volume to match a ${level} fitness level.`;

                    // Customize the user prompt based on a workout type
                    let userPrompt = '';

                    if (typeof workoutType === 'string' && workoutType.trim() !== '') {
                        // Check if it's one of the predefined workout types
                        if (workoutType === 'strength') {
                            userPrompt = `Create a ${level} level a strength-focused workout with multiple exercises. Include sets, reps, rest time, and suggested starting weights. End with a short cardio component. Use metric units.`;
                        } else if (workoutType === 'cardio') {
                            userPrompt = `Create a ${level} level cardio-focused workout with multiple cardio exercises. Include duration, intensity, and rest times. Use metric units.`;
                        } else if (workoutType === 'hiit') {
                            userPrompt = `Create a ${level} level HIIT workout with multiple high-intensity exercises. Include work/rest intervals, sets, and intensity guidelines. End with a cool-down cardio component. Use metric units.`;
                        } else {
                            // Handle custom workout goal input
                            userPrompt = `Create a personalized ${level} level a  workout for the following fitness goal: "${workoutType}". Include appropriate exercises, sets, reps, rest time, and suggested weights where applicable. Include at least one cardio component. Use metric units.`;
                        }
                    } else {
                        // Default workout if no type specified
                        userPrompt = `Create a single ${level} full-body gym workout with multiple exercises. Include sets, reps, rest time, and suggested starting weights. End with one cardio component (e.g., treadmill, rowing machine). Use metric units.`;
                    }

                    const workoutText = await fetchOpenAI({
                        model: 'gpt-3.5-turbo',
                        system: systemPrompt,
                        user: userPrompt
                    });
                    writeStep('planning');

                    const critique = await fetchOpenAI({
                        model: 'gpt-3.5-turbo',
                        system: `You are a certified strength and conditioning coach and experienced workout reviewer. Critically evaluate the following ${level} level workout plan. For each section (warm-up, main exercises, etc.), briefly note strengths and weaknesses regarding safety, balance (muscle group coverage), exercise variety, progression, and effectiveness. Give clear, actionable recommendations for improvement. Present your feedback as concise bullet points.`,
                        user: `Review the ${level} level workout plan below (sections labeled). Provide a structured critique pointing out any missing elements, unsafe recommendations, or imbalances. Use bullet points to list positives and suggested fixes or enhancements.:\n\n${workoutText}`
                    });

                    const ultimate = await fetchOpenAI({
                        model: 'gpt-3.5-turbo',
                        system: `You are an elite personal trainer and program design specialist. Using the feedback above, revise and improve the workout plan to address any issues. Maintain the original goal and appropriate intensity. Provide a clear, organized plan with sections: Warm-up, Main Workout (or circuits), (if relevant) Cardio, and Cool-down. For each section list exercises with details (sets, reps or duration, rest). Make sure the final routine is balanced, safe, and progressive for someone at a ${level} fitness level. Use bullet or numbered lists for easy reading.`,
                        user: `Workout:\n${workoutText}\n\nFeedback:\n${critique}`
                    });
                    writeStep('finalizing');

                    const workoutJson = await fetchOpenAI({
                        model: 'gpt-3.5-turbo',
                        system: `Convert this workout into JSON with the following structure:\n{
workout_name: string,
difficulty: string,
warm_up: string,
exercises: [{ name: string, sets: number, reps: string, rest: number,}],
cardio: { type: string, distance: number, description: string },
cool_down: string
} . Output only this JSON object (omit empty sections). Ensure all values match the types and the JSON is valid.`,
                        user: ultimate
                    });

                    const parsedWorkout: Workout = tryParseJSON(workoutJson);
                    parsedWorkout.exercises.map((exercise: Exercise) => {
                        exercise.normalized_name = normalizeExerciseName(exercise.name);
                    });
                    writeStep('complete');
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ result: parsedWorkout })}\n\n`)
                    );
                    controller.close();
                } catch (error) {
                    console.error('Error during workout generation process:', error);
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

// Helper function to fetch OpenAI data
async function fetchOpenAI({
    model,
    system,
    user
}: {
    model: 'gpt-3.5-turbo' | 'gpt-4';
    system: string;
    user: string;
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
    return data.choices?.[0]?.message?.content || 'No response.';
}
