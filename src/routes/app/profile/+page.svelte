<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	export let data: PageData;
	export let form;

	$: profile = data.profile || {};
	$: formData = form?.data ?? {};

	$: username = formData.username ?? profile.username ?? '';
	$: age = formData.age ?? profile.age ?? '';
	$: height = formData.height ?? profile.height ?? '';
	$: goalWeight = formData.goalWeight ?? profile.goal_weight ?? '';
	$: goal = formData.goal ?? profile.goal ?? '';
	$: showRestTime = formData.showRestTime ?? profile.show_rest_time ?? false;
	$: error = form?.error ?? '';
	$: message = form?.message ?? '';
	$: success = form?.success ?? false;
	$: errors = form?.errors ?? {};

	// Enhanced form submission with page refresh on success
	const handleEnhance = () => {
		return async ({ result, update }) => {
			// Update the form state
			await update();

			// If the submission was successful, invalidate all data to refresh
			if (result.type === 'success' && result.data?.success) {
				await invalidateAll();
			}
		};
	};
</script>

<svelte:head>
	<title>Profile | Workout Tracker</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-2xl mx-auto space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
		<div class="text-center">
			<h1 class="text-3xl font-extrabold text-stone-950 dark:text-white">Your Profile</h1>
			<p class="mt-2 text-sm text-stone-600 dark:text-stone-400">
				Update your personal information and workout preferences
			</p>
		</div>

		{#if error}
			<div class="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 mt-4">
				<p class="text-sm text-red-700 dark:text-red-300">{error}</p>
			</div>
		{/if}

		{#if success}
			<div class="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 p-4 mt-4">
				<p class="text-sm text-green-700 dark:text-green-300">{message}</p>
			</div>
		{/if}

		<form method="POST" action="?/updateProfile" class="space-y-6" use:enhance={handleEnhance}>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Username -->
				<div>
					<label for="username" class="block text-sm font-medium text-stone-700 dark:text-stone-300">
						Username
					</label>
					<input
						id="username"
						name="username"
						type="text"
						value={username}
						class="mt-1 block w-full px-3 py-2 border dark:border-gray-700 rounded-md sm:text-sm bg-white dark:bg-gray-700 text-stone-900 focus:ring-stone-500 dark:text-white"
					/>
					{#if errors?.username}
						<p class="mt-1 text-xs text-red-600 dark:text-red-400">{errors.username}</p>
					{/if}
				</div>

				<!-- Age -->
				<div>
					<label for="age" class="block text-sm font-medium text-stone-700 dark:text-stone-300">
						Age
					</label>
					<input
						id="age"
						name="age"
						type="number"
						min="1"
						max="120"
						value={age}
						class="mt-1 block w-full px-3 py-2 border dark:border-gray-700 rounded-md sm:text-sm bg-white dark:bg-gray-700 text-stone-900 focus:ring-stone-500 dark:text-white"
					/>
					{#if errors?.age}
						<p class="mt-1 text-xs text-red-600 dark:text-red-400">{errors.age}</p>
					{/if}
				</div>

				<!-- Height -->
				<div>
					<label for="height" class="block text-sm font-medium text-stone-700 dark:text-stone-300">
						Height (cm)
					</label>
					<input
						id="height"
						name="height"
						type="number"
						step="0.01"
						min="0"
						value={height}
						class="mt-1 block w-full px-3 py-2 border dark:border-gray-700 rounded-md sm:text-sm bg-white dark:bg-gray-700 text-stone-900 focus:ring-stone-500 dark:text-white"
					/>
					{#if errors?.height}
						<p class="mt-1 text-xs text-red-600 dark:text-red-400">{errors.height}</p>
					{/if}
				</div>
				<!-- Goal Weight -->
				<div>
					<label for="goal-weight" class="block text-sm font-medium text-stone-700 dark:text-stone-300">
						Goal Weight (kg)
					</label>
					<input
						id="goal-weight"
						name="goal-weight"
						type="number"
						step="0.1"
						min="0"
						value={goalWeight}
						class="mt-1 block w-full px-3 py-2 border dark:border-gray-700 rounded-md sm:text-sm bg-white dark:bg-gray-700 text-stone-900 focus:ring-stone-500 dark:text-white"
					/>
					{#if errors?.goalWeight}
						<p class="mt-1 text-xs text-red-600 dark:text-red-400">{errors.goalWeight}</p>
					{/if}
				</div>

				<!-- Goal -->
				<div>
					<label for="goal" class="block text-sm font-medium text-stone-700 dark:text-stone-300">
						Fitness Goal
					</label>
					<input
						id="goal"
						name="goal"
						type="text"
						value={goal}
						class="mt-1 block w-full px-3 py-2 border dark:border-gray-700 rounded-md sm:text-sm bg-white dark:bg-gray-700 text-stone-900 focus:ring-stone-500 dark:text-white"
					/>
					{#if errors?.goal}
						<p class="mt-1 text-xs text-red-600 dark:text-red-400">{errors.goal}</p>
					{/if}
				</div>
			</div>

			<!-- Show Rest Time Toggle -->
			<div class="flex items-center">
				<input type="hidden" name="show-rest-time-submitted" value="true">

				<input
					id="show-rest-time"
					name="show-rest-time"
					type="checkbox"
					checked={showRestTime}
					class="h-4 w-4 text-stone-600 dark:text-stone-500 border-gray-300 dark:border-gray-600 rounded focus:ring-stone-500 dark:focus:ring-stone-400 dark:bg-gray-700"
				/>
				<label for="show-rest-time" class="ml-2 text-sm text-stone-600 dark:text-stone-400">
					Show rest time between exercises
				</label>
			</div>

			<div class="flex justify-end gap-4">
				<a
					href='/app/dashboard'
					class="py-2 px-4 text-stone-600 bg-gray-100 hover:bg-gray-200 dark:text-stone-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800"
				>
					Cancel
				</a>
				<button
					type="submit"
					class="py-2 px-4 text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800"
				>
					Save Changes
				</button>
			</div>
		</form>

		<div class="pt-6 border-t border-gray-200 dark:border-gray-700">
			<div class="flex justify-between items-center">
				<h2 class="text-lg font-medium text-stone-900 dark:text-white">Account Information</h2>
				<a
					href='/app/account/'
					class="text-sm text-stone-600 hover:text-stone-500 dark:text-stone-400 dark:hover:text-stone-300"
				>
					Manage account settings
				</a>
			</div>
			<p class="mt-2 text-sm text-stone-600 dark:text-stone-400">
				To change your email address or password, please visit the account settings page.
			</p>
		</div>
	</div>
</div>