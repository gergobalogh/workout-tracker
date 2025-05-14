import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// Load the profile data from Supabase
export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    const session = await safeGetSession();

    if (!session?.user?.id) {
        return {
            profile: null
        };
    }

    // Fetch the user's profile data
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        return {
            profile: null
        };
    }

    return {
        profile
    };
};

export const actions: Actions = {
    updateProfile: async ({ request, locals: { supabase, safeGetSession } }) => {
        const session = await safeGetSession();

        if (!session?.user?.id) {
            return fail(401, { message: 'You must be logged in to update your profile' });
        }

        const data = await request.formData();

        const username = data.get('username')?.toString() || '';
        const age = Number(data.get('age')) || null;
        const height = Number(data.get('height')) || null;
        const currentWeight = Number(data.get('current-weight')) || null;
        const goalWeight = Number(data.get('goal-weight')) || null;
        const goal = data.get('goal')?.toString() || '';
        const showRestTime = data.get('show-rest-time') === 'on';
        const errors: Record<string, string> = {};

        // Validate the form data
        if (!username.trim()) {
            errors.username = 'Username is required';
        } else if (username.length > 255) {
            errors.username = 'Username must be less than 255 characters';
        }

        if (age !== null && (age < 1 || age > 120)) {
            errors.age = 'Please enter a valid age between 1 and 120';
        }

        if (height !== null && height <= 0) {
            errors.height = 'Please enter a valid height';
        }

        if (currentWeight !== null && currentWeight <= 0) {
            errors.currentWeight = 'Please enter a valid weight';
        }

        if (goalWeight !== null && goalWeight <= 0) {
            errors.goalWeight = 'Please enter a valid goal weight';
        }

        if (Object.keys(errors).length > 0) {
            return {
                success: false,
                errors,
                data: {
                    username,
                    age,
                    height,
                    currentWeight,
                    goalWeight,
                    goal,
                    showRestTime
                }
            };
        }

        // Update the profile in Supabase
        const { error } = await supabase
            .from('profiles')
            .update({
                username,
                age,
                height,
                current_weight: currentWeight,
                goal_weight: goalWeight,
                goal,
                show_rest_time: showRestTime,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', session.user.id);

        if (error) {
            return fail(400, { message: 'Failed to update profile' });
        }

        return {
            success: true,
            message: 'Profile updated successfully'
        };
    }
};
