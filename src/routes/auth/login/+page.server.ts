import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    default: async ({ request, locals: { supabase } }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString() || '';
        const password = data.get('password')?.toString() || '';
        const rememberMe = data.get('remember-me') === 'on';

        const errors: Record<string, string> = {};

        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!password) {
            errors.password = 'Password is required';
        }

        if (Object.keys(errors).length > 0) {
            return {
                success: false,
                errors,
                data: { email, rememberMe }
            };
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return fail(400, { message: 'Invalid login' });
        } else {
            redirect(303, '/app/dashboard');
        }
    }
};
