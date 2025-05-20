import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Profile } from '../../../lib/types';
import { ltc } from '../../../lib/log';

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
        // Get current_weight from database since it's not in the form
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
                    goalWeight,
                    goal,
                    showRestTime
                }
            };
        }

        // Get the current profile to preserve the current_weight value
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('current_weight')
            .eq('user_id', session.user.id)
            .single();

        // Update the profile in Supabase
        const { data: updatedProfiles, error } = await supabase
            .from('profiles')
            .update({
                username,
                age,
                height,
                current_weight: currentProfile?.current_weight || null, // Preserve existing value
                goal_weight: goalWeight,
                goal,
                show_rest_time: showRestTime,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', session.user.id)
            .select();

        const updatedProfile: Profile = updatedProfiles?.[0];

        if (error) {
            return fail(400, {
                success: false,
                error: 'Failed to update profile'
            });
        }

        return {
            success: true,
            message: 'Profile updated successfully',
            username: updatedProfile?.username,
            age: updatedProfile?.age,
            goalWeight: updatedProfile?.goal_weight,
            goal: updatedProfile?.goal,
            showRestTime: updatedProfile?.show_rest_time
        };
    }
};
