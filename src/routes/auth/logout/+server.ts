import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals: { supabase } }) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        return json({ success: false, message: error.message }, { status: 500 });
    }

    return json({ success: true });
};
