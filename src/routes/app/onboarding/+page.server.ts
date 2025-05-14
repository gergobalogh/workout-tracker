import type { Actions } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, locals: { supabase, safeGetSession } }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const currentWeight = formData.get('currentWeight');
		const goalWeight = formData.get('goalWeight');
		const fitnessGoal = formData.get('fitnessGoal');
		const customGoal = formData.get('customGoal');
		// Determine which step we're processing based on the form data
		let step = 1;
		if (fitnessGoal) {
			step = 3; // The final step with all form data
		} else if (currentWeight) {
			step = 2; // The weight and goals step
		}

		// Process each step accordingly
		try {
			if (step === 1) {
				// Validate username
				if (!username || typeof username !== 'string' || username.length < 3) {
					return fail(400, {
						error: 'Username must be at least 3 characters',
						username
					});
				}

				// Store username temporarily (you might want to use cookies or session for this)
				return {
					success: 'Username is available',
					username
				};
			}

			if (step === 2) {
				// Validate weight inputs
				if (!currentWeight || isNaN(Number(currentWeight)) || Number(currentWeight) <= 0) {
					return fail(400, {
						error: 'Please enter a valid current weight',
						username: formData.get('username'),
						currentWeight
					});
				}

				if (!goalWeight || isNaN(Number(goalWeight)) || Number(goalWeight) <= 0) {
					return fail(400, {
						error: 'Please enter a valid goal weight',
						username: formData.get('username'),
						currentWeight,
						goalWeight
					});
				}

				// Store weight data temporarily
				return {
					success: 'Weight data saved',
					username: formData.get('username'),
					currentWeight,
					goalWeight
				};
			}

			if (step === 3) {
				let finalGoal = fitnessGoal;
				if (fitnessGoal === 'custom') {
					if (!customGoal || typeof customGoal !== 'string' || customGoal.trim().length < 3) {
						return fail(400, {
							error: 'Please enter a valid custom goal',
							username,
							currentWeight,
							goalWeight,
							fitnessGoal,
							customGoal
						});
					}

					finalGoal = customGoal.trim();
				}
				const session = await safeGetSession();
				if (!session.user) {
					throw Error('there is no session user at this point');
				}
				// Final step - save all user data
				const { error: profileError } = await supabase.from('profiles').upsert({
					id: session.user.id,
					username,
					current_weight: Number(currentWeight),
					goal_weight: Number(goalWeight),
					goal: finalGoal,
					onboarding_completed: true,
					updated_at: new Date().toISOString()
				});

				if (profileError) {
					console.error(profileError);
					return fail(500, {
						error: 'Failed to save profile data',
						username,
						currentWeight,
						goalWeight,
						fitnessGoal
					});
				}

				// Redirect to dashboard after successful onboarding
				redirect(303, '/dashboard');
			}
		} catch (err) {
			console.error(err);
			return fail(500, {
				error: 'Something went wrong. Please try again.',
				username,
				currentWeight,
				goalWeight,
				fitnessGoal
			});
		}
	}
};

// This ensures users who have completed onboarding can't access this page again
export async function load({ locals: { supabase, safeGetSession } }) {
	const session = await safeGetSession();

	if (!session || !session.user || !session.user.id) {
		redirect(303, '/auth/login');
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('onboarding_completed')
		.eq('id', session.user.id)
		.single();

	if (profile?.onboarding_completed) {
		redirect(303, '/dashboard');
	}

	return {};
}
