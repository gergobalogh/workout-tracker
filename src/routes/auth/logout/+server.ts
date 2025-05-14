import { type Actions } from '@sveltejs/kit';

export const actions = {
    POST: async ({ request, locals: { supabase } }) => {
        //	const { error } = await supabase.auth.signOut();
    }
} satisfies Actions;
