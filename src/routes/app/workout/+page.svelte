<script lang='ts'>
	import { workoutStore } from '$lib/stores/workoutStore';
	import { onMount } from 'svelte';
	import { tick } from 'svelte';
	import type { DatabaseWorkout, Exercise, openExerciseNotesModalFunction, Workout } from '$lib/types';
	import ExerciseItem from '$lib/components/ExerciseItem.svelte';

	export let data;

	let loadingStep: string = null;
	let workout: Workout = null;
	let error = null;
	let isGenerating = false;
	let eventSource = null;
	let isSaving = false;

	// State for modal
	let showModal = false;
	let modalContent = '';
	let modalTitle = '';
	let editMode = false;
	let currentExerciseIndex = -1;
	let exerciseNotes = '';

	// Function to toggle cardio completion
	const toggleCardioCompleted = async () => {
		if (workout && workout.cardio) {
			workout.cardio.completed = !workout.cardio.completed;
			saveCardioChanges();
		}
	};


	function getLoadingMessage(step: string) {
		switch (step) {
			case 'generate':
				return 'Generating your demo...';
			case 'critique':
				return 'Evaluating demo effectiveness...';
			case 'json_conversion':
				return 'Formatting demo details...';
			case 'adding_weights':
				return 'Adding your previous weights...';
			case 'complete':
				return 'Workout generation complete!';
			case 'error':
				return 'Error generating demo';
			default:
				return 'Processing...';
		}
	}

	// Function to open exercise notes modal
	const openExerciseNotesModal: openExerciseNotesModalFunction = (index: number) => {
		currentExerciseIndex = index;
		const exercise = workout.exercises[index];
		modalTitle = `Notes for ${exercise.name}`;
		exerciseNotes = exercise.note || '';
		editMode = true;
		showModal = true;
	};
	const handleWeightChange = (index: number, newWeight: number) => {
		workoutStore.update(workout => {
			if (workout.exercises && workout.exercises[index]) {
				workout.exercises = [...workout.exercises]; // create a shallow copy
				workout.exercises[index] = {
					...workout.exercises[index],
					weight: newWeight
				};
			}
			return workout;
		});
	};

	// Function to toggle exercise completion
	const toggleExerciseCompleted = (index: number) => {
		workoutStore.update(workout => {
			if (workout.exercises && workout.exercises[index]) {
				workout.exercises = [...workout.exercises]; // create a shallow copy
				workout.exercises[index] = {
					...workout.exercises[index],
					completed: !workout.exercises[index].completed
				};
			}
			return workout;
		});
	};
	// Function to save exercise notes
	const saveExerciseNotes = () => {
		if (currentExerciseIndex >= 0 && workout && workout.exercises) {
			workoutStore.update(workout => {
				if (workout.exercises && workout.exercises[currentExerciseIndex]) {
					workout.exercises[currentExerciseIndex].note = exerciseNotes
					workout.exercises = [...workout.exercises]; // create a shallow copy
					workout.exercises[currentExerciseIndex] = {
						...workout.exercises[currentExerciseIndex],
						note: exerciseNotes
					};
				}
				return workout;
			});
		}
		closeModal();

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


	// Function to save cardio changes to the server
	const saveCardioChanges = async () => {
		if (!workout) return;
		if(!workout.cardio) return;
		let cardio = workout.cardio
		isSaving = true;
		try {
			const response = await fetch('/api/workout/cardio', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					workoutId: workout.id,
					type: cardio.type,
					distance: cardio.distance,
					description: cardio.description || '',
					completed: cardio.completed || false,
					workout_name: workout.workout_name
				})
			});

			if (!response.ok) {
				throw new Error('Failed to save cardio changes');
			}

			const result: DatabaseWorkout = await response.json();

			// If this is the first save and we got a workoutId back, save it to the demo
			if (!workout.id && result.id) {
				workout.id = result.id;
			}

		} catch (err) {
			console.error('Error saving cardio:', err);
			error = 'Failed to save cardio changes. Please try again.';
		} finally {
			isSaving = false;
		}
	};
	const saveWorkoutExercise = async (
		exercise: Exercise,
	) => {
		try {
			const response = await fetch('/api/workout/exercise', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					workoutId: workout.id,
					exercise_name: exercise.name,
					sets: exercise.sets,
					reps: exercise.reps,
					weight: exercise.weight || 0,
					notes: exercise.note || exercise.instructions,
					completed: exercise.completed,
					normalized_name: exercise.normalized_name,
					workout_name: workout.workout_name
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to save exercise');
			}

			const data = await response.json();

			workoutStore.update(current => ({
				...current,
				id: data.workoutId
			}));
		} catch (error) {
			console.error('Error saving demo exercise:', error);
			throw error;
		}
	};
	onMount(() => {
		const unsubscribe = workoutStore.subscribe(async (newWorkout) => {
			if (newWorkout) {
				workout = newWorkout;
				loadingStep = 'complete';
				isGenerating = false;
				isSaving = false;
				error = null;
			} else {
				workout = {
					workout_name: '',
					warm_up: '',
					exercises: [],
					cardio: {
						type: '',
						distance: 0,
						description: '',
						completed: false
					},
					cool_down: '',
				};
				loadingStep = 'starting';
			}
		});
		return () => {
			if (eventSource) {
				eventSource.close();
			}
		};
	});

	async function generateWorkout() {
		// Close any existing connection
		if (eventSource) {
			eventSource.close();
		}

		isGenerating = true;
		loadingStep = 'starting';
		error = null;
		workout = null;

		try {
			// Start the generation process with Server-Sent Events
			eventSource = new EventSource('/api/demo');

			eventSource.onmessage = async (event) => {
				try {
					const data = JSON.parse(event.data);

					if (data.loadingStep) {
						loadingStep = data.loadingStep;
						await tick();

						if (data.loadingStep === 'error') {
							error = data.error || 'An error occurred during demo generation';
							eventSource.close();
							isGenerating = false;
						}
					}

					if (data.result) {
						workout = data.result;
						workoutStore.set(workout);
						// Initialize notes and completed fields for each exercise if not present
						if (workout.exercises) {
							workout.exercises.forEach(exercise => {
								if (!exercise.hasOwnProperty('notes')) {
									exercise.note = '';
								}
								if (!exercise.hasOwnProperty('completed')) {
									exercise.completed = false;
								}
								if(!exercise.weight) exercise.weight = 0;
							});
						}
						// Initialize completed field for cardio if not present
						if (workout.cardio && !workout.cardio.hasOwnProperty('completed')) {
							workout.cardio.completed = false;
						}
						await tick();
						eventSource.close();
						isGenerating = false;
					}
				} catch (parseErr) {
					console.error('Failed to parse event data:', parseErr, event.data);
				}
			};

			eventSource.onerror = (err) => {
				console.error('EventSource error:', err);
				error = 'Connection error. Please try again.';
				eventSource.close();
				isGenerating = false;
			};
		} catch (err) {
			console.error('Error starting demo generation:', err);
			error = err.message || 'An error occurred';
			isGenerating = false;
		}
	}
</script>

<svelte:head>
	<title>{isGenerating ? 'Generating Workout...' : (workout?.workout_name || 'Workout')} | Workout Tracker</title>
</svelte:head>

<div class='max-w-3xl mx-auto'>
	<!-- Profile section -->
	{#if data.profile}
		<div class='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6'>
			<h1 class='text-3xl font-extrabold text-stone-950 dark:text-white mb-2'>Hello, {data.profile.username || 'there'}
				!</h1>
			<p class='text-stone-700 dark:text-stone-300 mb-6'>
				Your goal: <span class='font-medium'>{data.profile.goal || 'General fitness'}</span>
			</p>

			{#if !isGenerating && !workout}
				<button
					on:click={generateWorkout}
					class='w-full py-3 px-4 bg-stone-600 hover:bg-stone-700 text-white rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-colors'
				>
					Generate New Workout
				</button>
			{/if}
		</div>
	{:else}
		<div class='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center'>
			<p class='text-stone-700 dark:text-stone-300'>
				Please sign in to generate workouts.
			</p>
		</div>
	{/if}

	<!-- Loading state -->
	{#if isGenerating}
		<div class='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6'>
			<div class='flex flex-col items-center justify-center py-12'>
				<!-- Spinner -->
				<div class='animate-spin rounded-full h-16 w-16 border-b-2 border-stone-500 mb-4'></div>

				<!-- Dynamic loading message -->
				<h2 class='text-xl font-bold text-stone-800 dark:text-stone-200 mb-2 text-center'>
					{getLoadingMessage(loadingStep)}
				</h2>

				<!-- Progress steps visualization -->
				<div class='mt-6 w-full max-w-md'>
					{#each ['starting', 'generate', 'critique', 'optimize', 'json_conversion', 'adding_weights', 'complete'] as step, i}
						<div class='flex items-center mb-2'>
							<div class={`flex items-center justify-center h-8 w-8 rounded-full
                                    ${loadingStep === step ? 'bg-stone-500 text-white' :
                                    ['generate', 'critique', 'optimize', 'json_conversion', 'adding_weights', 'complete'].indexOf(loadingStep) > ['generate', 'critique', 'optimize', 'json_conversion', 'adding_weights', 'complete'].indexOf(step) ? 'bg-green-500 text-white' : 'bg-stone-300 text-stone-700'}`}>
								{i + 1}
							</div>
							<div class='ml-4 text-stone-800 dark:text-stone-200 capitalize'>
								{step.replace('_', ' ')}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Error state -->
	{#if error}
		<div
			class='bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-6'>
			<strong class='font-bold'>Error:</strong>
			<span class='block sm:inline'>{error}</span>
			<button
				class='mt-4 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium'
				on:click={generateWorkout}
			>
				Try Again
			</button>
		</div>
	{/if}

	<!-- Saving indicator -->
	{#if isSaving}
		<div
			class='fixed top-4 right-4 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 px-4 py-2 rounded shadow-md'>
			<div class='flex items-center'>
				<div class='animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2'></div>
				<span>Saving changes...</span>
			</div>
		</div>
	{/if}

	<!-- Workout display -->
	{#if workout && !isGenerating}
		<div class='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6'>
			<h1 class='text-3xl font-extrabold text-stone-950 dark:text-white text-center mb-6'>
				{workout.workout_name || 'Your Workout Plan'}
			</h1>

			{#if workout.warm_up}
				<div class='mb-6'>
					<h2 class='text-xl font-bold text-stone-800 dark:text-stone-200 mb-2'>Warm Up</h2>
					<div class='bg-stone-100 dark:bg-gray-700 p-4 rounded-md'>
						<p class='text-stone-700 dark:text-stone-300'>{workout.warm_up}</p>
					</div>
				</div>
			{/if}

			{#if workout.exercises?.length}
				<div class='mb-6'>
					<h2 class='text-xl font-bold text-stone-800 dark:text-stone-200 mb-2'>Exercises</h2>
					<div class='space-y-4'>
						{#each workout.exercises as exercise, i}
							<ExerciseItem
								{exercise}
								{openExerciseNotesModal}
								{toggleExerciseCompleted}
								{handleWeightChange}
								{saveWorkoutExercise}
								index={i}
								showRestTime={data.profile.show_rest_time}

							/>
						{/each}
					</div>
				</div>
			{/if}


			{#if workout.cardio}
				<div class='mb-6'>
					<h2 class='text-xl font-bold text-stone-800 dark:text-stone-200 mb-2'>Cardio</h2>
					<div
						class={`bg-stone-100 dark:bg-gray-700 p-4 rounded-md ${workout.cardio.completed ? 'border-l-4 border-green-500' : ''}`}>
						<div class='flex items-center mb-2'>
							<input
								type='checkbox'
								id='cardio-completed'
								class='h-5 w-5 text-green-500 rounded border-gray-300 focus:ring-green-400'
								checked={workout.cardio.completed || false}
								on:change={toggleCardioCompleted}
							/>
							<h3
								class="font-semibold text-stone-800 dark:text-stone-200 ml-2">
								{workout.cardio.type}
							</h3>
						</div>
						<div class='mt-2 flex flex-wrap -mx-1'>
							<div class='w-1/2 px-1 mb-2'>
								<div class='bg-white dark:bg-gray-600 p-2 rounded h-full'>
									<span class='font-medium text-stone-600 dark:text-stone-300'>Distance:</span>
									<span class='text-stone-800 dark:text-white ml-1'>{workout.cardio.distance} km</span>
								</div>
							</div>
							<div class='w-1/2 px-1 mb-2'>

							</div>
						</div>
						{#if workout.cardio.description}
							<div class='bg-white dark:bg-gray-600 p-2 rounded mt-2'>
								<p class='text-stone-700 dark:text-stone-300 text-sm mt-1'>{workout.cardio.description}</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if workout.cool_down}
				<div class='mb-6'>
					<h2 class='text-xl font-bold text-stone-800 dark:text-stone-200 mb-2'>Cool Down</h2>
					<div class='bg-stone-100 dark:bg-gray-700 p-4 rounded-md'>
						<p class='text-stone-700 dark:text-stone-300'>{workout.cool_down}</p>
					</div>
				</div>
			{/if}

			<!-- Generate New Workout button when demo is displayed -->
			<div class='mt-6'>
				<button
					on:click={generateWorkout}
					class='w-full py-3 px-4 bg-stone-600 hover:bg-stone-700 text-white rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-colors'
				>
					Generate New Workout
				</button>
			</div>
		</div>
	{/if}

	<!-- Dashboard Button -->
	<div class='text-center'>
		<a href='/app/dashboard'
			 class='inline-block py-2 px-4 text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 rounded-md'>
			Back to Dashboard
		</a>
	</div>
</div>

<!-- Modal for notes -->
{#if showModal}
	<div
		class='modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
		on:click={handleBackdropClick}
	>
		<div class='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-auto'>
			<div class='p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
				<h3 class='text-xl font-bold text-stone-800 dark:text-white'>{modalTitle}</h3>
				<button
					on:click={closeModal}
					class='text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 focus:outline-none'
				>
					<svg class='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'></path>
					</svg>
				</button>
			</div>
			<div class='p-6'>
				{#if editMode}
					<textarea
						bind:value={exerciseNotes}
						class='w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-500 dark:focus:ring-stone-400 h-48'
						placeholder='Add your notes here...'
					></textarea>
				{:else}
					<p class='text-stone-700 dark:text-stone-300 whitespace-pre-line'>{modalContent}</p>
				{/if}
			</div>
			<div class='p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2'>
				{#if editMode}
					<button
						on:click={saveExerciseNotes}
						class='py-2 px-4 text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800'
					>
						Save Notes
					</button>
				{/if}
				<button
					on:click={closeModal}
					class='py-2 px-4 text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800'
				>
					{editMode ? 'Cancel' : 'Close'}
				</button>
			</div>
		</div>
	</div>
{/if}