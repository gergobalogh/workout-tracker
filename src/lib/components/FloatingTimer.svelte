<script lang="ts">
	import { slide, fade } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';

	// Exercise rest time props
	export let restSeconds = 60; // Default rest time in seconds
	export let exerciseCompleted = false; // Bind to detect exercise completion
	// Reactive timer state
	let isPanelOpen = false;
	let isRunning = false;
	let seconds = 0;
	let interval: NodeJS.Timeout | null = null;
	let timerCompleted = false;
	let showRestTimeText = false; // New state for "Rest time" text visibility

	// Watch for exercise completion to reset timer with new rest time
	$: if (exerciseCompleted) {
		resetTimer();
		// Only auto-start if there's a valid rest time
		if (restSeconds > 0) {
			startTimer();
		}
		// Reset the flag after handling
		exerciseCompleted = false;
	}

	// Store for accessibility focus
	const focusedElement = writable<HTMLElement | null>(null);

	// Timer logic
	function toggleTimer() {
		if (isRunning) {
			pauseTimer();
		} else {
			if (timerCompleted) {
				resetTimer();
			}
			startTimer();
		}
	}

	function startTimer() {
		interval = setInterval(() => {
			seconds += 1;
			// Auto-pause when time reaches rest time
			if (seconds >= restSeconds && restSeconds > 0) {
				pauseTimer();
				timerCompleted = true;
			}
		}, 1000);
		isRunning = true;
		// Show "Rest time" text and hide after 3 seconds
		showRestTimeText = true;
		setTimeout(() => {
			showRestTimeText = false;
		}, 3000);
		// Close the panel when starting the timer
		isPanelOpen = false;
	}

	function pauseTimer() {
		if (interval) clearInterval(interval);
		interval = null;
		isRunning = false;
	}

	function resetTimer() {
		if (interval) clearInterval(interval);
		interval = null;
		seconds = 0;
		isRunning = false;
		timerCompleted = false;
		showRestTimeText = false;
	}

	// Handle outside click
	function handleOutsideClick(event: MouseEvent) {
		const target = event.target as Node;
		const panel = document.querySelector('.timer-panel');
		const icon = document.querySelector('.timer-icon');
		if (panel && !panel.contains(target) && icon && !icon.contains(target)) {
			isPanelOpen = false;
		}
	}

	// Keyboard accessibility
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isPanelOpen) {
			isPanelOpen = false;
		}
	}

	// Svelte action for outside click detection
	function clickOutside(node: HTMLElement) {
		const handleClick = (event: MouseEvent) => {
			if (!node.contains(event.target as Node)) {
				handleOutsideClick(event);
			}
		};
		// Add slight delay to avoid capturing the initial click
		setTimeout(() => {
			document.addEventListener('click', handleClick);
		}, 0);
		return {
			destroy() {
				document.removeEventListener('click', handleClick);
			}
		};
	}

	// Lifecycle
	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
			if (interval) clearInterval(interval);
		};
	});

	// Format time with remaining time calculation
	$: formattedTime = `${Math.floor(seconds / 60)
		.toString()
		.padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

	// Calculate remaining time (if rest time is set)
	$: remainingSeconds = restSeconds > 0 ? Math.max(0, restSeconds - seconds) : 0;
	$: formattedRemainingTime = `${Math.floor(remainingSeconds / 60)
		.toString()
		.padStart(2, '0')}:${(remainingSeconds % 60).toString().padStart(2, '0')}`;
</script>

<div class="fixed bottom-4 right-4 z-50">
	<!-- Floating Icon with Timer Count -->
	<div class="relative">
		<!-- Small transparent timer display next to icon -->
		{#if isRunning}
			<div
				class="absolute top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white px-2 py-1 rounded text-sm font-mono whitespace-nowrap"
				class:-left-37={showRestTimeText}
				class:-left-16={!showRestTimeText}
				transition:fade={{ duration: 200 }}
			>
				<span>{showRestTimeText ? 'Rest time: ' : ''}{formattedRemainingTime}</span>
			</div>
		{/if}

		<!-- Timer Icon Button -->
		<button
			class="timer-icon h-12 w-12 flex items-center justify-center rounded-full bg-stone-500 text-white hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800 transition-transform {isRunning ? 'bg-green-500 hover:bg-green-600' : ''} {remainingSeconds === 0 && seconds >= restSeconds ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}"
			on:click|stopPropagation={() => (isPanelOpen = !isPanelOpen)}
			aria-label="Toggle timer panel"
		>
			<svg
				class="h-6 w-6"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
		</button>
	</div>

	<!-- Timer Panel -->
	{#if isPanelOpen}
		<div
			use:clickOutside
			class="timer-panel absolute bottom-16 right-0 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-64 sm:bottom-20 sm:right-2"
			transition:slide={{ duration: 300 }}
			role="dialog"
			aria-labelledby="timer-panel-title"
		>
			<button
				class="absolute top-2 right-2 text-stone-600 hover:text-stone-500 dark:text-stone-400 dark:hover:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-500"
				on:click={() => (isPanelOpen = false)}
				aria-label="Close timer panel"
			>
				<svg
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
			</button>

			<h2 id="timer-panel-title" class="text-lg font-medium text-stone-950 dark:text-white mb-4">
				Rest Timer
			</h2>

			{#if restSeconds > 0}
				<div class="flex justify-between items-center mb-2">
					<span class="text-stone-600 dark:text-stone-300">Rest time:</span>
					<span class="text-sm font-medium text-stone-700 dark:text-stone-200">{Math.floor(restSeconds / 60)}:{(restSeconds % 60).toString().padStart(2, '0')}</span>
				</div>
				<div class="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full mb-3">
					<div
						class="bg-stone-500 dark:bg-stone-400 h-2 rounded-full transition-all duration-300 ease-out"
						style="width: {Math.min(100, (seconds / restSeconds) * 100)}%"
					></div>
				</div>
			{/if}

			<div class="text-2xl font-mono text-stone-900 dark:text-white mb-4">
				{restSeconds > 0 ? formattedRemainingTime : formattedTime}
			</div>

			<div class="flex space-x-2">
				<button
					class="flex-1 py-2 px-4 text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800"
					on:click={toggleTimer}
				>
					{isRunning ? 'Pause' : 'Start'}
				</button>
				<button
					class="flex-1 py-2 px-4 text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800"
					on:click={resetTimer}
				>
					Reset
				</button>
			</div>
		</div>
	{/if}
</div>