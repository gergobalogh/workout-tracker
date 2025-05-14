import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';

export async function POST({ request }: RequestEvent) {
    try {
        const body = await request.json();
        const exerciseName = body.exerciseName;

        if (!exerciseName) {
            throw error(400, 'Error: No exercise name provided');
        }

        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content:
                            'Provide a really short and concise instruction for the given gym exercise.'
                    },
                    { role: 'user', content: `How do I perform ${exerciseName}?` }
                ],
                max_tokens: 100
            })
        });

        if (!openAiResponse.ok) {
            throw new Error(`OpenAI API error: ${openAiResponse.statusText}`);
        }

        const jsonResponse = await openAiResponse.json();
        const instruction =
            jsonResponse.choices?.[0]?.message?.content || 'No instruction available.';

        return json({
            exercise: exerciseName,
            instruction
        });
    } catch (error: unknown) {
        console.error('Error generating exercise instruction:', error);

        if (
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            error['status'] === 400 &&
            'body' in error &&
            typeof error['body'] === 'object' &&
            error['body'] !== null &&
            'message' in error['body']
        ) {
            return json({ error: (error.body as { message: string }).message }, { status: 400 });
        }

        return json({ error: 'Failed to fetch exercise instructions.' }, { status: 500 });
    }
}
