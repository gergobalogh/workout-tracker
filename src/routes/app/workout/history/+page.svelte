<script lang="ts">
	import { onMount } from 'svelte';
	import { tick } from 'svelte';

	export let data;

	// State for workout details
	let selectedWorkout = null;
	let workoutDetails = null;
	let isLoading = false;
	let error = null;

	// State for modal
	let showModal = false;
	let modalContent = '';
	let modalTitle = '';
	let editMode = false;
	let currentExerciseIndex = -1;
	let exerciseNotes = '';

	// Format date
	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	// Format time only
	function formatTime(dateString) {
		const date = new Date(dateString);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	// Function to get workout details
	async function getWorkoutDetails(workoutId: number) {
		isLoading = true;
		error = null;
		selectedWorkout = workoutId;

		try {
			const response = await fetch(`/api/workout/${workoutId}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to fetch workout details');
			}

			const data = await response.json();
			workoutDetails = data;
			await tick();
		} catch (err) {
			console.error('Error fetching workout details:', err);
			error = err.message || 'An error occurred';
			workoutDetails = null;
		} finally {
			isLoading = false;
		}
	}

	// Function to open modal with notes
	const openNotesModal = (notes, title) => {
		modalTitle = title || 'Workout Notes';
		modalContent = notes || 'No notes available';
		editMode = false;
		showModal = true;
	};

	// Function to close modal
	const closeModal = () => {
		showModal = false;
		currentExerciseIndex = -1;
	};

	// Close modal when clicking outside
	const handleBackdropClick = (e) => {
		if (e.target.classList.contains('modal-backdrop')) {
			closeModal();
		}
	};

	// Clear workout details when returning to list
	function clearWorkoutDetails() {
		workoutDetails = null;
		selectedWorkout = null;
	}
</script>

<svelte:head>
	<title>Workout History | Workout Tracker</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
	<div class="max-w-3xl mx-auto">
		<!-- Profile section -->
		{#if data.profile}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
				<h1 class="text-3xl font-extrabold text-stone-950 dark:text-white mb-2">Workout History</h1>
				<p class="text-stone-700 dark:text-stone-300 mb-6">
					Track your progress and review past workouts
				</p>
			</div>
		{:else}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center">
				<p class="text-stone-700 dark:text-stone-300">
					Please sign in to view your workout history.
				</p>
			</div>
		{/if}

		<!-- Loading state -->
		{#if isLoading}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
				<div class="flex flex-col items-center justify-center py-12">
					<!-- Spinner -->
					<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-stone-500 mb-4"></div>
					<h2 class="text-xl font-bold text-stone-800 dark:text-stone-200 mb-2 text-center">
						Loading workout details...
					</h2>
				</div>
			</div>
		{/if}

		<!-- Error state -->
		{#if error}
			<div class="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-6">
				<strong class="font-bold">Error:</strong>
				<span class="block sm:inline">{error}</span>
				<button
					class="mt-4 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
					on:click={() => selectedWorkout ? getWorkoutDetails(selectedWorkout) : clearWorkoutDetails()}
				>
					Try Again
				</button>
			</div>
		{/if}

		<!-- Workout List (shown when no workout is selected) -->
		{#if data.profile && !workoutDetails && !isLoading}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
				{#if data.workouts && data.workouts.length > 0}
					<div class="space-y-4">
						{#each data.workouts as workout}
							<div class="bg-stone-100 dark:bg-gray-700 p-4 rounded-md hover:bg-stone-200 dark:hover:bg-gray-600 transition-colors">
								<div class="flex justify-between items-start">
									<div>
										<h3 class="font-semibold text-stone-800 dark:text-stone-200 text-lg">
											{workout.workout_name}
										</h3>
										<p class="text-stone-600 dark:text-stone-400 text-sm">
											{formatDate(workout.workout_date)}
										</p>
									</div>
									<button
										on:click={() => getWorkoutDetails(workout.id)}
										class="py-1 px-3 bg-stone-600 hover:bg-stone-700 text-white text-sm rounded-md font-medium shadow-sm focus:outline-none transition-colors"
									>
										View Details
									</button>
								</div>
								{#if workout.notes}
									<div class="mt-3 text-right">
										<button
											on:click={() => openNotesModal(workout.notes, `Notes for ${workout.workout_name}`)}
											class="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
										>
											View Notes
										</button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-10">
						<p class="text-stone-700 dark:text-stone-300 mb-4">You don't have any workout history yet.</p>
						<a
							href='/app/workout'
							class="inline-block py-2 px-4 bg-stone-600 hover:bg-stone-700 text-white rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-colors"
						>
							Create a Workout
						</a>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Workout Detail View (shown when a workout is selected) -->
		{#if workoutDetails && !isLoading}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
				<div class="flex justify-between items-center mb-6">
					<h1 class="text-2xl font-extrabold text-stone-950 dark:text-white">
						{workoutDetails.workout.workout_name}
					</h1>
					<button
						on:click={clearWorkoutDetails}
						class="py-1 px-3 bg-stone-500 hover:bg-stone-600 text-white text-sm rounded-md font-medium shadow-sm focus:outline-none transition-colors"
					>
						Back to History
					</button>
				</div>

				<div class="mb-4 text-stone-600 dark:text-stone-400">
					<p>{formatDate(workoutDetails.workout.workout_date)}</p>
				</div>

				<!-- Exercises -->
				{#if workoutDetails.exercises && workoutDetails.exercises.length > 0}
					<div class="mb-6">
						<h2 class="text-xl font-bold text-stone-800 dark:text-stone-200 mb-2">Exercises</h2>
						<div class="space-y-4">
							{#each workoutDetails.exercises as exercise, i}
								<div class="bg-stone-100 dark:bg-gray-700 p-4 rounded-md">
									<div class="flex justify-between items-center mb-2">
										<h3 class="font-semibold text-stone-800 dark:text-stone-200 text-lg">
											{i + 1}. {exercise.exercise_name}
										</h3>
										<span class="text-sm px-2 py-1 rounded-full {exercise.completed ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'}">
											{exercise.completed ? 'Completed' : 'Not Completed'}
										</span>
									</div>

									<!-- Mobile-friendly exercise details -->
									<div class="mt-2 space-y-2">
										<div class="flex flex-wrap -mx-1">
											<div class="w-1/2 px-1 mb-2">
												<div class="bg-white dark:bg-gray-600 p-2 rounded h-full">
													<span class="font-medium text-stone-600 dark:text-stone-300">Sets:</span>
													<span class="text-stone-800 dark:text-white ml-1">{exercise.sets}</span>
												</div>
											</div>
											<div class="w-1/2 px-1 mb-2">
												<div class="bg-white dark:bg-gray-600 p-2 rounded h-full">
													<span class="font-medium text-stone-600 dark:text-stone-300">Reps:</span>
													<span class="text-stone-800 dark:text-white ml-1">{exercise.reps}</span>
												</div>
											</div>
											<div class="w-1/2 px-1 mb-2">
												<div class="bg-white dark:bg-gray-600 p-2 rounded h-full">
													<span class="font-medium text-stone-600 dark:text-stone-300">Weight:</span>
													<span class="text-stone-800 dark:text-white ml-1">{exercise.weight} kg</span>
												</div>
											</div>
											{#if exercise.completed_at}
												<div class="w-1/2 px-1 mb-2">
													<div class="bg-white dark:bg-gray-600 p-2 rounded h-full">
														<span class="font-medium text-stone-600 dark:text-stone-300">Completed:</span>
														<span class="text-stone-800 dark:text-white ml-1">{formatTime(exercise.completed_at)}</span>
													</div>
												</div>
											{/if}
										</div>

										{#if exercise.notes}
											<div class="bg-white dark:bg-gray-600 p-2 rounded">
												<span class="font-medium text-stone-600 dark:text-stone-300">Notes:</span>
												<p class="text-stone-700 dark:text-stone-300 text-sm mt-1 italic">{exercise.notes}</p>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Cardio -->
				{#if workoutDetails.cardio}
					<div class="mb-6">
						<h2 class="text-xl font-bold text-stone-800 dark:text-stone-200 mb-2">Cardio</h2>
						<div class="bg-stone-100 dark:bg-gray-700 p-4 rounded-md">
							<div class="flex justify-between items-center mb-2">
								<h3 class="font-semibold text-stone-800 dark:text-stone-200">
									{workoutDetails.cardio.type}
								</h3>
								<span class="text-sm px-2 py-1 rounded-full {workoutDetails.cardio.completed ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'}">
									{workoutDetails.cardio.completed ? 'Completed' : 'Not Completed'}
								</span>
							</div>
							<div class="mt-2 flex flex-wrap -mx-1">
								{#if workoutDetails.cardio.distance !== null}
									<div class="w-1/2 px-1 mb-2">
										<div class="bg-white dark:bg-gray-600 p-2 rounded h-full">
											<span class="font-medium text-stone-600 dark:text-stone-300">Distance:</span>
											<span class="text-stone-800 dark:text-white ml-1">{workoutDetails.cardio.distance} km</span>
										</div>
									</div>
								{/if}
								{#if workoutDetails.cardio.duration !== null}
									<div class="w-1/2 px-1 mb-2">
										<div class="bg-white dark:bg-gray-600 p-2 rounded h-full">
											<span class="font-medium text-stone-600 dark:text-stone-300">Duration:</span>
											<span class="text-stone-800 dark:text-white ml-1">{workoutDetails.cardio.duration} min</span>
										</div>
									</div>
								{/if}
							</div>
							{#if workoutDetails.cardio.notes}
								<div class="bg-white dark:bg-gray-600 p-2 rounded mt-2">
									<span class="font-medium text-stone-600 dark:text-stone-300">Notes:</span>
									<p class="text-stone-700 dark:text-stone-300 text-sm mt-1">{workoutDetails.cardio.notes}</p>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Workout Notes -->
				{#if workoutDetails.workout.notes}
					<div class="mt-6">
						<button
							on:click={() => openNotesModal(workoutDetails.workout.notes, `Notes for ${workoutDetails.workout.workout_name}`)}
							class="w-full py-2 px-4 text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 rounded-md"
						>
							View Workout Notes
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Dashboard Button -->
		<div class="text-center">
			<a
				href='/app/dashboard'
				class="inline-block py-2 px-4 text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 rounded-md"
			>
				Back to Dashboard
			</a>
		</div>
	</div>
</div>

<!-- Modal for notes -->
{#if showModal}
	<div
		class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
		on:click={handleBackdropClick}
	>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-auto">
			<div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
				<h3 class="text-xl font-bold text-stone-800 dark:text-white">{modalTitle}</h3>
				<button
					on:click={closeModal}
					class="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 focus:outline-none"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
			<div class="p-6">
				<p class="text-stone-700 dark:text-stone-300 whitespace-pre-line">{modalContent}</p>
			</div>
			<div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
				<button
					on:click={closeModal}
					class="py-2 px-4 text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}