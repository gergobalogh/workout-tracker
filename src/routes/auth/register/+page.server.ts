import type { Actions } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
    default: async ({ request, locals: { supabase } }) => {
        const formData = await request.formData();
        const email = formData.get('email');
        const password = formData.get('password');

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return fail(400, {
                error: 'Please enter a valid email address',
                email
            });
        }

        if (!password || typeof password !== 'string' || password.length < 8) {
            return fail(400, {
                error: 'Password must be at least 8 characters',
                email
            });
        }
        const { error } = await supabase.auth.signUp({
            email,
            password
        });
        if (error) {
            console.error(error);
            return fail(500, {
                error: 'Something went wrong. Please try again.',
                email
            });
        } else {
            redirect(303, '/app/onboarding');
        }
    }
};
