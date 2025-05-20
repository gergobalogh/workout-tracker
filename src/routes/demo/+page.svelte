<script lang='ts'>
	import { workoutStore } from '$lib/stores/workoutStore';
	import { onMount } from 'svelte';
	import { tick } from 'svelte';
	import type { DatabaseWorkout, Exercise, openExerciseNotesModalFunction, Workout } from '$lib/types';
	import ExerciseItem from '$lib/components/ExerciseItem.svelte';
	import FloatingTimer from '$lib/components/FloatingTimer.svelte';

	export let data;

	let loadingStep: string = '';
	let workout: Workout = null;
	let error = null;
	let isGenerating = false;
	let eventSource = null;
	let isSaving = false;
	let currentRestSeconds = 0;
	let exerciseCompleted = false;
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

	function getFitnessLevel() {
		const radioButtons = document.getElementsByName('fitnessLevel');
		for (const radioButton of radioButtons) {
			if (radioButton.checked) {
				return radioButton.value;
			}
		}
		return 'beginner'; // Default to beginner if somehow nothing is selected
	}

	function getLoadingMessage(step: string) {
		switch (step) {
			case 'starting':
				return 'Lacing up your workout shoes...';
			case 'planning':
				return 'Taking a deep breath before we begin...';
			case 'finalizing':
				return "You've got this! Let's crush it today..."
			case 'complete':
				return 'Workout generation complete!';
			case 'error':
				return 'Error generating workout';
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

				// Toggle completion status
				const wasCompleted = workout.exercises[index].completed;
				workout.exercises[index] = {
					...workout.exercises[index],
					completed: !wasCompleted
				};

				// If an exercise was just marked as completed, set rest time for next exercise
				if (!wasCompleted && index < workout.exercises.length - 1) {
					// Get rest time from the next exercise
					currentRestSeconds = workout.exercises[index + 1].rest || 60;
					// Trigger timer reset
					exerciseCompleted = true;
				}
			}
			return workout;
		});
	};
	// Function to save exercise notes
	const saveExerciseNotes = () => {
		if (currentExerciseIndex >= 0 && workout && workout.exercises) {
			workoutStore.update(workout => {
				if (workout.exercises && workout.exercises[currentExerciseIndex]) {
					workout.exercises[currentExerciseIndex].note = exerciseNotes;
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
	};
	const saveWorkoutExercise = async (
		exercise: Exercise
	) => {
	};
	onMount(() => {
		const unsubscribe = workoutStore.subscribe(async (newWorkout) => {
			if (newWorkout) {
				// Check if the workout has actual content (exercises or a name)
				if ((newWorkout.exercises && newWorkout.exercises.length > 0) || newWorkout.workout_name) {
					if (newWorkout.exercises && newWorkout.exercises.length > 0 && !currentRestSeconds) {
						currentRestSeconds = newWorkout.exercises[0].rest || 60;
					}
					workout = newWorkout;
					loadingStep = 'complete';
					isGenerating = false;
					isSaving = false;
					error = null;
				} else {
					// If the workout is empty, treat it as no workout
					workout = null;
					loadingStep = '';
				}
			} else {
				// No workout in the store
				workout = null;
				loadingStep = '';
			}
		});

		return () => {
			if (eventSource) {
				eventSource.close();
			}
			unsubscribe();
		};
	});



	async function generateWorkout(workoutType = 'default') {
		// Close any existing connection
		if (eventSource) {
			eventSource.close();
		}

		isGenerating = true;
		loadingStep = 'starting';
		error = null;
		workout = null;
		workoutStore.set(null);

		try {
			let level = getFitnessLevel()
			// Start the generation process with Server-Sent Events
			eventSource = new EventSource(`/api/workout/demo?type=${workoutType}&level=${level}`);

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
								if (!exercise.weight) exercise.weight = 0;
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
	{#if !isGenerating && !workout}
		<div class='min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
			<div class='max-w-md w-full space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md'>
				<h1 class="text-3xl font-bold text-stone-800 dark:text-stone-100 text-center">Get Moving Today!</h1>
				<!-- Fitness Level Selection (Moved up) -->
				<div class="mb-6">
					<p class="text-stone-600 dark:text-stone-300 mb-3 text-base font-medium">Select your fitness level:</p>
					<div class="flex flex-col gap-3">
						<label class="cursor-pointer">
							<input
								type="radio"
								name="fitnessLevel"
								value="beginner"
								checked
								class="hidden"
							/>
							<span class="block text-center py-3 px-4 rounded-lg border-2 border-stone-400 dark:border-gray-600 text-stone-700 dark:text-stone-300 bg-white dark:bg-gray-700 transition-all duration-200 hover:bg-stone-100 dark:hover:bg-gray-600 checked:border-stone-600 dark:checked:border-stone-500 checked:bg-stone-100 dark:checked:bg-gray-600">
                        New to Fitness
                    </span>
						</label>
						<label class="cursor-pointer">
							<input
								type="radio"
								name="fitnessLevel"
								value="intermediate"
								class="hidden"
							/>
							<span class="block text-center py-3 px-4 rounded-lg border-2 border-stone-400 dark:border-gray-600 text-stone-700 dark:text-stone-300 bg-white dark:bg-gray-700 transition-all duration-200 hover:bg-stone-100 dark:hover:bg-gray-600 checked:border-stone-600 dark:checked:border-stone-500 checked:bg-stone-100 dark:checked:bg-gray-600">
                        Active Mover
                    </span>
						</label>
						<label class="cursor-pointer">
							<input
								type="radio"
								name="fitnessLevel"
								value="advanced"
								class="hidden"
							/>
							<span class="block text-center py-3 px-4 rounded-lg border-2 border-stone-400 dark:border-gray-600 text-stone-700 dark:text-stone-300 bg-white dark:bg-gray-700 transition-all duration-200 hover:bg-stone-100 dark:hover:bg-gray-600 checked:border-stone-600 dark:checked:border-stone-500 checked:bg-stone-100 dark:checked:bg-gray-600">
                        Pro Athlete
                    </span>
						</label>
					</div>
				</div>

				<!-- Workout Type Buttons -->
				<div class="flex flex-col gap-4 mb-6">
					<p class="text-stone-600 dark:text-stone-300 mb-6 text-lg text-center">Choose your free personalized workout:</p>

					<button
						on:click={() => generateWorkout('strength')}
						class="flex items-center justify-center py-4 px-4 bg-stone-700 hover:bg-stone-800 text-stone-100 rounded-lg font-semibold text-lg transition-all hover:scale-105"
					>
						<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M6 6v12m12-12v12m-7-9h-2m0 6h2"></path>
						</svg>
						Strength
					</button>
					<button
						on:click={() => generateWorkout('cardio')}
						class="flex items-center justify-center py-4 px-4 bg-stone-600 hover:bg-stone-700 text-stone-100 rounded-lg font-semibold text-lg transition-all hover:scale-105"
					>
						<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
						</svg>
						Cardio
					</button>
					<button
						on:click={() => generateWorkout('hiit')}
						class="flex items-center justify-center py-4 px-4 bg-stone-500 hover:bg-stone-600 text-stone-100 rounded-lg font-semibold text-lg transition-all hover:scale-105"
					>
						<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						HIIT
					</button>
				</div>

				<!-- Custom Workout Input (Moved up and improved) -->
				<div class="flex flex-col gap-3">
					<p class="text-stone-600 dark:text-stone-300 mb-2 text-base font-medium">Or describe your fitness goal:</p>
					<div class="flex gap-2">
						<input
							type="text"
							id="customWorkout"
							class="flex-grow px-4 py-3 border dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-stone-900 dark:text-white text-base"
							placeholder="'Lose weight', 'Build muscle', 'Improve endurance'"
						/>
						<button
							on:click={() => generateWorkout(document.getElementById('customWorkout').value)}
							class="bg-stone-600 hover:bg-stone-700 text-white px-4 py-3 rounded-lg font-medium text-base whitespace-nowrap"
						>
							Go
						</button>
					</div>
				</div>
			</div>
		</div>

		<style>
        input[type="radio"]:checked + span {
            border-color: #57534e;
            background-color: #f5f5f4;
        }
        .dark input[type="radio"]:checked + span {
            border-color: #71717a;
            background-color: #4b5563;
        }
		</style>	{/if}

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
					{#each ['starting', 'planning', 'finalizing', 'complete'] as step, i}
						<div class='flex items-center mb-2'>
							<div class={`flex items-center justify-center h-8 w-8 rounded-full
                ${loadingStep === step ? 'bg-stone-500 text-white' :
                ['starting', 'planning', 'finalizing', 'complete'].indexOf(loadingStep) > ['starting', 'planning', 'finalizing', 'complete'].indexOf(step) ? 'bg-green-500 text-white' : 'bg-stone-300 text-stone-700'}`}>
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
				<FloatingTimer
					restSeconds={currentRestSeconds}
					bind:exerciseCompleted={exerciseCompleted}
				/>
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
								showRestTime={true}
							/>
						{/each}
					</div>
				</div>
				<FloatingTimer/>
			{/if}


			<!--{#if demo.cardio}-->
			<!--	<div class='mb-6'>-->
			<!--		<h2 class='text-xl font-bold text-stone-800 dark:text-stone-200 mb-2'>Cardio</h2>-->
			<!--		<div-->
			<!--			class={`bg-stone-100 dark:bg-gray-700 p-4 rounded-md ${demo.cardio.completed ? 'border-l-4 border-green-500' : ''}`}>-->
			<!--			<div class='flex items-center mb-2'>-->
			<!--				<input-->
			<!--					type='checkbox'-->
			<!--					id='cardio-completed'-->
			<!--					class='h-5 w-5 text-green-500 rounded border-gray-300 focus:ring-green-400'-->
			<!--					checked={demo.cardio.completed || false}-->
			<!--					on:change={toggleCardioCompleted}-->
			<!--				/>-->
			<!--				<h3-->
			<!--					class='font-semibold text-stone-800 dark:text-stone-200 ml-2'>-->
			<!--					{demo.cardio.type}-->
			<!--				</h3>-->
			<!--			</div>-->
			<!--			<div class='mt-2 flex flex-wrap -mx-1'>-->
			<!--				<div class='w-1/2 px-1 mb-2'>-->
			<!--					<div class='bg-white dark:bg-gray-600 p-2 rounded h-full'>-->
			<!--						<span class='font-medium text-stone-600 dark:text-stone-300'>Distance:</span>-->
			<!--						<span class='text-stone-800 dark:text-white ml-1'>{demo.cardio.distance} km</span>-->
			<!--					</div>-->
			<!--				</div>-->
			<!--				<div class='w-1/2 px-1 mb-2'>-->

			<!--				</div>-->
			<!--			</div>-->
			<!--			{#if demo.cardio.description}-->
			<!--				<div class='bg-white dark:bg-gray-600 p-2 rounded mt-2'>-->
			<!--					<p class='text-stone-700 dark:text-stone-300 text-sm mt-1'>{demo.cardio.description}</p>-->
			<!--				</div>-->
			<!--			{/if}-->
			<!--		</div>-->
			<!--	</div>-->
			<!--{/if}-->

			{#if workout.cool_down}
				<div class='mb-6'>
					<h2 class='text-xl font-bold text-stone-800 dark:text-stone-200 mb-2'>Cool Down</h2>
					<div class='bg-stone-100 dark:bg-gray-700 p-4 rounded-md'>
						<p class='text-stone-700 dark:text-stone-300'>{workout.cool_down}</p>
					</div>
				</div>
			{/if}
			{#if !workout.exercises}
			<!-- Generate New Workout buttons when demo is displayed -->
			<div class='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
				<button
					on:click={() => generateWorkout('strength')}
					class='w-full py-3 px-4 bg-stone-600 hover:bg-stone-700 text-white rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-colors'
				>
					New Strength Workout
				</button>
				<button
					on:click={() => generateWorkout('cardio')}
					class='w-full py-3 px-4 bg-stone-600 hover:bg-stone-700 text-white rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-colors'
				>
					New Cardio Workout
				</button>
				<button
					on:click={() => generateWorkout('hiit')}
					class='w-full py-3 px-4 bg-stone-600 hover:bg-stone-700 text-white rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-colors'
				>
					New HIIT Workout
				</button>
			</div>
				{/if}
			<!-- Create account CTA -->
			<div class='mt-8 text-center'>
				<a href='/auth/register'
					 class='py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors inline-block'>
					Create an account to save progress
				</a>
			</div>
		</div>
	{/if}
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