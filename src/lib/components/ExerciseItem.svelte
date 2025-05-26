<script lang='ts'>
	import type {
		Exercise,
		handleWeightChangeFunction,
		openExerciseNotesModalFunction,
		toggleExerciseCompletedFunction
	} from '$lib/types';

	let showHint = false;
	let swipeState = {
		active: false,
		direction: '',
		startX: 0,
		currentX: 0,
		thresholdPassed: false
	};
	// Accordion state
	let isAccordionOpen = false;
	let exerciseImageUrl: string | null = null;
	let exerciseInstructions: string | null = null;
	let imageLoading = false;
	let instructionsLoading = false;
	let imageError = false;
	let instructionsError = false;

	// Swipe threshold to trigger actions (in pixels)
	const swipeThreshold = 60;
	// Props
	export let exercise: Exercise;
	export let index = 0;
	export let showRestTime: boolean;
	export let openExerciseNotesModal: openExerciseNotesModalFunction;
	export let toggleExerciseCompleted: toggleExerciseCompletedFunction;
	export let handleWeightChange: handleWeightChangeFunction;
	export let saveWorkoutExercise: (
		exercise: Exercise,
	) => Promise<{ success: boolean; workoutId: string; exercise: any }>;


	const ALGOLIA_APP_ID = 'OK539HIHRS';
	const ALGOLIA_API_KEY = 'REMOVED_ALGOLIA_KEY';
	const ALGOLIA_INDEX_NAME = 'exercises';
	const SUPABASE_IMAGE_URL_BASE = 'https://kblntpobgrtueucxxnlm.supabase.co/storage/v1/object/public/exercise-images/';
	// Handle touch events to track swipe in progress
	function handleTouchStart(event: TouchEvent) {
		swipeState.active = true;
		swipeState.startX = event.touches[0].clientX;
		swipeState.currentX = 0;
		swipeState.direction = '';
		swipeState.thresholdPassed = false;
	}

	function handleTouchMove(event: TouchEvent) {
		if (!swipeState.active) return;

		const currentX = event.touches[0].clientX;
		const diffX = currentX - swipeState.startX;
		swipeState.currentX = diffX;

		// Determine swipe direction for visual cues
		if (Math.abs(diffX) > 20) {
			swipeState.direction = diffX > 0 ? 'right' : 'left';
		} else {
			swipeState.direction = '';
		}

		// Check if threshold passed for the first time
		if (!swipeState.thresholdPassed && Math.abs(diffX) > swipeThreshold) {
			swipeState.thresholdPassed = true;
			// Provide haptic feedback when threshold is crossed
			if ('vibrate' in navigator) {
				navigator.vibrate(50); // Vibrate for 50ms
			}
		}
	}
	function scrollToNextExercise() {
		// Only attempt to scroll on mobile devices
		if (window.innerWidth <= 768) {
			// Get all exercise cards
			const exerciseCards = document.querySelectorAll('.exercise-card');

			// If there are more exercises after this one
			if (index < exerciseCards.length - 1) {
				// Get the next exercise element
				const nextExerciseElement = exerciseCards[index + 1] as HTMLElement;

				if (nextExerciseElement) {
					// Scroll the next exercise into view with smooth behavior
					nextExerciseElement.scrollIntoView({
						behavior: 'smooth',
						block: 'center'
					});
				}
			}
		}
	}

	async function completeExercise(index: number) {
		if(!exercise.completed) {
			showHint = true;
			setTimeout(() => {
				scrollToNextExercise();
			}, 300); // Short delay to allow the state to update
		}
		try {
			await saveWorkoutExercise(exercise);
		} catch (error) {
			console.error('Error saving exercise completion status:', error);
			// You might want to add some error handling UI here
		}
		toggleExerciseCompleted(index);
		setTimeout(() => {
			showHint = false;
		},  3500)
	}
	function handleTouchEnd() {
		if (swipeState.active && swipeState.direction) {
			// Trigger the appropriate action if the threshold was passed
			if (Math.abs(swipeState.currentX) > swipeThreshold) {
				if (swipeState.direction === 'right') {
				toggleExerciseCompleted(index);
					if (!exercise.completed) {
						setTimeout(() => {
							scrollToNextExercise();
						}, 300); // Short delay to allow state to update
					}
				} else if (swipeState.direction === 'left') {
					openExerciseNotesModal(index);
				}
			}
		}

		// Reset swipe state
		swipeState.active = false;
		swipeState.direction = '';
		swipeState.currentX = 0;
		swipeState.thresholdPassed = false;
	}

	// Calculate transform style based on swipe state
	$: swipeTransform = swipeState.active && swipeState.currentX !== 0
		? `translateX(${Math.min(Math.max(swipeState.currentX * 0.2, -15), 15)}px)`
		: 'translateX(0)';

	// Calculate background gradient based on swipe direction
	$: swipeBackground = swipeState.active && swipeState.direction
		? swipeState.direction === 'right'
			? 'linear-gradient(90deg, rgba(134, 239, 172, 0.2), transparent 70%)'
			: 'linear-gradient(-90deg, rgba(96, 165, 250, 0.2), transparent 70%)'
		: 'none';
	// Toggle accordion and load content
	async function toggleAccordion() {
		isAccordionOpen = !isAccordionOpen;
		if (isAccordionOpen) {
			// Only fetch if data isn't cached
			if (!exerciseImageUrl && !imageError) {
				await loadExerciseImage();
			}
			if (!exerciseInstructions && !instructionsError) {
				await loadExerciseInstructions();
			}
		}
	}

	async function loadExerciseImage() {
		imageLoading = true;
		imageError = false;
		try {
			const response = await fetch(
				`https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX_NAME}/query`,
				{
					method: 'POST',
					headers: {
						'X-Algolia-API-Key': ALGOLIA_API_KEY,
						'X-Algolia-Application-Id': ALGOLIA_APP_ID,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						query: exercise.name,
						hitsPerPage: 1
					}),
				}
			);
			const result = await response.json();
			if (!result.hits || result.hits.length === 0) {
				imageError = true;
				return;
			}
			exerciseImageUrl = `${SUPABASE_IMAGE_URL_BASE}${result.hits[0].fileName}`;
		} catch (error) {
			console.error('Error fetching exercise image:', error);
			imageError = true;
		} finally {
			imageLoading = false;
		}
	}
	async function loadExerciseInstructions() {
		instructionsLoading = true;
		instructionsError = false;
		try {
			const response = await fetch('/api/workout/exercise/instructions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					exerciseName: exercise.name
				})
			});

			const data = await response.json();
			exerciseInstructions = data.instruction || "No instructions available.";
		} catch (error) {
			console.error('Error fetching exercise instructions:', error);
			instructionsError = true;
			exerciseInstructions = 'Failed to load instructions';
		} finally {
			instructionsLoading = false;
		}
	}
</script>

<style>
    @keyframes bounce-left {
        0%, 100% {
            transform: translateX(0);
        }
        20% {
            transform: translateX(-10px);
        }
        40% {
            transform: translateX(0);
        }
        60% {
            transform: translateX(-6px);
        }
        80% {
            transform: translateX(0);
        }
    }

    @keyframes bounce-right {
        0%, 100% {
            transform: translateX(0);
        }
        20% {
            transform: translateX(10px);
        }
        40% {
            transform: translateX(0);
        }
        60% {
            transform: translateX(6px);
        }
        80% {
            transform: translateX(0);
        }
    }

    .animate-bounce-left {
        animation: bounce-left 1s ease-in-out 3;
    }

    .animate-bounce-right {
        animation: bounce-right 1s ease-in-out 3;
    }

    .swipe-indicator-left::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 8px;
        height: 100%;
        background-color: rgba(59, 130, 246, 0.5);
        border-radius: 8px 0 0 8px;
    }

    .swipe-indicator-right::before {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 8px;
        height: 100%;
        background-color: rgba(34, 197, 94, 0.5);
        border-radius: 0 8px 8px 0;
    }

    .accordion-content {
        transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
        overflow: hidden;
    }

    .accordion-content.closed {
        max-height: 0;
        opacity: 0;
    }

    .accordion-content.open {
        max-height: 500px; /* Adjust based on your content */
        opacity: 1;
    }

    .exercise-image {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin-top: 1rem;
    }
</style>

<div
	class="exercise-card relative p-4 my-3 rounded-lg shadow-md transition-all duration-200
    bg-stone-100 text-stone-800 dark:bg-gray-700 dark:text-stone-200
    {exercise.completed ? 'border-l-4 border-green-500 dark:border-green-400' : 'border-l-4 border-transparent'}
    {swipeState.direction === 'left' ? 'swipe-indicator-left' : ''}
    {swipeState.direction === 'right' ? 'swipe-indicator-right' : ''}"
	on:touchstart={handleTouchStart}
	on:touchmove={handleTouchMove}
	on:touchend={handleTouchEnd}
	on:touchcancel={handleTouchEnd}
	style="transform: {swipeTransform}; background-image: {swipeBackground}; transition: transform 0.1s ease-out;"
>
	<!-- Header -->
	<div class='flex justify-between items-center mb-3'>
		<div class='flex items-center gap-2'>
			<input
				type='checkbox'
				checked={exercise.completed}
				on:change={() => completeExercise(index)}
				class='w-5 h-5 accent-green-500 dark:accent-green-400'
			/>
			<h3 class="text-lg font-medium">
				{exercise.name}
			</h3>
		</div>

		<div class='flex gap-2 items-center'>
			<!-- Notes button -->
			<button
				class='text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white p-2'
				on:click={() => openExerciseNotesModal(index)}
				aria-label='Edit notes'
			>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					class='h-5 w-5'
					viewBox='0 0 20 20'
					fill='currentColor'
				>
					<path
						d='M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z'
					/>
				</svg>
			</button>
			<!-- Accordion toggle button -->
			<button
				class='text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white p-2'
				on:click={toggleAccordion}
				aria-label={isAccordionOpen ? 'Close accordion' : 'Open accordion'}
			>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					class='h-5 w-5 transition-transform duration-300 {isAccordionOpen ? 'rotate-180' : ''}'
        viewBox='0 0 20 20'
        fill='currentColor'
      >
        <path
				fill-rule='evenodd'
				d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
				clip-rule='evenodd'
			/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Exercise parameters -->
	<div class='grid grid-cols-3 gap-2 mb-3'>
		<!-- Sets -->
		<div class='bg-white dark:bg-gray-600 rounded-md p-2 text-center'>
			<span class='text-xs text-stone-600 dark:text-stone-400 block'>Sets</span>
			<span class="font-medium ">
        {exercise.sets}
      </span>
		</div>

		<!-- Reps -->
		<div class='bg-white dark:bg-gray-600 rounded-md p-2 text-center'>
			<span class='text-xs text-stone-600 dark:text-stone-400 block'>Reps</span>
			<span class="font-medium ">
        {exercise.reps}
      </span>
		</div>


		<!-- Weight -->
		<div class='bg-white dark:bg-gray-600 rounded-md p-2 text-center relative'>
			<span class='text-xs text-stone-600 dark:text-stone-400 block'>Weight</span>
			<div class='flex items-center justify-center gap-1'>
				<button
					class='text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
					on:click={() => handleWeightChange(index, Math.max(0, (Number(exercise.weight) || 0) - 5))}
					disabled={Number(exercise.weight) <= 0}
					aria-label='Decrease weight by 5'
				>
					<svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
						<path fill-rule='evenodd' d='M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z' clip-rule='evenodd' />
					</svg>
				</button>

				<input
					type='number'
					min='0'
					step='0.5'
					on:blur={(e) => {
				const value = parseFloat(e.target.value);
				const validatedValue = isNaN(value) || value < 0 ? 0 : value;
				handleWeightChange(index, validatedValue);
			}}
					on:input={(e) => {
				// Prevent negative values during typing
				if (parseFloat(e.target.value) < 0) {
					e.target.value = '0';
				}
			}}
					bind:value={exercise.weight}
					class="w-12 text-center font-medium bg-transparent border-b border-stone-300 dark:border-stone-500 focus:outline-none focus:border-stone-500 dark:focus:border-stone-300"
				/>

				<button
					class='text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
					on:click={() => handleWeightChange(index, (Number(exercise.weight) || 0) + 5)}
					aria-label='Increase weight by 5'
				>
					<svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
						<path fill-rule='evenodd'
									d='M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z'
									clip-rule='evenodd' />
					</svg>
				</button>
			</div>
		</div>
	</div>

	<!-- Rest time (conditionally rendered) -->
	{#if showRestTime && exercise.rest}
		<div class='mb-3 flex items-center gap-2'>
			<svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4 text-stone-600 dark:text-stone-400' viewBox='0 0 20 20'
					 fill='currentColor'>
				<path fill-rule='evenodd'
							d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
							clip-rule='evenodd' />
			</svg>
			<span class='text-sm text-stone-600 dark:text-stone-400'>
        Rest: {exercise.rest}
      </span>
		</div>
	{/if}

	<!-- Notes (if exists) -->
	{#if exercise.note}
		<div
			class='text-sm text-stone-600 dark:text-stone-400 bg-white/50 dark:bg-gray-600/50 p-2 rounded flex items-start gap-2'>
			<svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4 mt-0.5 flex-shrink-0' viewBox='0 0 20 20'
					 fill='currentColor'>
				<path fill-rule='evenodd'
							d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1v-3a1 1 0 00-1-1H9z'
							clip-rule='evenodd' />
			</svg>
			<span>{exercise.note}</span>
		</div>
	{/if}
	<!-- Swipe hint -->
	<div class='text-xs text-stone-500 dark:text-stone-400 mt-2 italic flex justify-between lg:hidden'>
		<span
			class='animate-bounce-left'
		>← Swipe left for notes</span>
		{#if showHint}
			<span
				class='animate-bounce-right'
			>Swipe right to complete →</span>
		{/if}
	</div>
	<!-- Accordion content -->
	<div class="accordion-content {isAccordionOpen ? 'open' : 'closed'}">
		{#if imageLoading}
			<div class="text-sm text-stone-600 dark:text-stone-400 p-2">
				<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-stone-500 mb-2"></div>
				Loading exercise image...
			</div>
		{:else if imageError}
			<div class="text-sm text-red-600 dark:text-red-400 p-2">
				Failed to load image
			</div>
		{:else if exerciseImageUrl}
			<img
				src={exerciseImageUrl}
				alt={exercise.name}
				class="exercise-image"
			/>
		{/if}
		{#if instructionsLoading}
			<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-stone-500 mb-2"></div>
			<div class="text-sm text-stone-600 dark:text-stone-400 p-2">
				Loading instructions...
			</div>
		{:else if instructionsError}
			<div class="text-sm text-red-600 dark:text-red-400 p-2">
				Failed to load instructions
			</div>
		{:else if exerciseInstructions}
			<div class="text-sm text-stone-700 dark:text-stone-300 bg-white/50 dark:bg-gray-600/50 p-2 rounded mt-2">
				<strong>Instructions:</strong> {exerciseInstructions}
			</div>
		{/if}
	</div>
</div>