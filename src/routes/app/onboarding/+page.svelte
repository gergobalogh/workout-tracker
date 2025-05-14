<script lang='ts'>
	import { onMount } from 'svelte';

	// Form data
	let username = '';
	let currentWeight = '';
	let goalWeight = '';
	let fitnessGoal = 'lose_weight'; // Default option
	let customGoal = '';
	// For form validation
	let errors = {
		username: '',
		currentWeight: '',
		goalWeight: ''
	};

	// Step management
	let currentStep = 1;
	let totalSteps = 3;
	let isVideoPlaying = false;

	// Handle form submission
	async function handleSubmit() {
		// Validate current step
		if (currentStep === 1) {
			if (!username || username.length < 3) {
				errors.username = 'Username must be at least 3 characters';
				return;
			} else {
				errors.username = '';
			}
		} else if (currentStep === 2) {
			// Validate weight inputs
			if (!currentWeight || isNaN(Number(currentWeight)) || Number(currentWeight) <= 0) {
				errors.currentWeight = 'Please enter a valid weight';
				return;
			} else {
				errors.currentWeight = '';
			}

			if (!goalWeight || isNaN(Number(goalWeight)) || Number(goalWeight) <= 0) {
				errors.goalWeight = 'Please enter a valid goal weight';
				return;
			} else {
				errors.goalWeight = '';
			}
		}

		// If it's the last step, submit the form
		if (currentStep === totalSteps) {
			// Here you would typically submit the data to your backend
			console.log('Form submitted', { username, currentWeight, goalWeight, fitnessGoal });
			// Redirect to dashboard or main app page
			window.location.href = '/app/dashboard';
		} else {
			// Go to next step
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	function playPauseVideo() {
		const video = document.getElementById('tutorial-video') as HTMLVideoElement;
		if (video) {
			if (isVideoPlaying) {
				video.pause();
			} else {
				video.play();
			}
			isVideoPlaying = !isVideoPlaying;
		}
	}

	onMount(() => {
		// Any initialization needed
		const video = document.getElementById('tutorial-video') as HTMLVideoElement;
		if (video) {
			video.addEvenListener('play', () => { isVideoPlaying = true; });
			video.addEventListener('pause', () => { isVideoPlaying = false; });
		}
	});
</script>

<svelte:head>
	<title>Onboarding | Workout Tracker</title>
</svelte:head>

<div class='min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
	<div class='max-w-3xl w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md'>
		<!-- Header -->
		<div class='text-center'>
			<h1 class='text-3xl font-extrabold text-stone-950 dark:text-white'>
				Welcome to Workout Tracker
			</h1>
			<p class='mt-2 text-sm text-stone-600 dark:text-stone-400'>
				Let's set up your profile to get you started
			</p>
		</div>

		<!-- Progress Steps -->
		<div class='relative'>
			<div class='overflow-hidden h-2 mb-4 text-xs flex rounded bg-stone-200 dark:bg-stone-700'>
				<div style='width: {(currentStep / totalSteps) * 100}%' class='shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-stone-500 dark:bg-stone-600 transition-all duration-500'></div>
			</div>
			<div class='flex justify-between'>
				{#each Array(totalSteps) as _, i}
					<div class='flex flex-col items-center'>
						<div class={`rounded-full transition-all duration-500 h-8 w-8 flex items-center justify-center ${i + 1 <= currentStep ? 'bg-stone-500 dark:bg-stone-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'}`}>
							{i + 1}
						</div>
						<div class='text-xs mt-1 text-stone-600 dark:text-stone-400'>
							{i === 0 ? 'Profile' : i === 1 ? 'Goals' : 'Tutorial'}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Form Content -->
		<div class='mt-8'>
			<form on:submit|preventDefault={handleSubmit} class='space-y-6'>
				<!-- Step 1: Username -->
				{#if currentStep === 1}
					<div>
						<label for='username' class='block text-sm font-medium text-stone-700 dark:text-stone-300'>
							Choose a username
						</label>
						<div class='mt-1'>
							<input
								id='username'
								name='username'
								type='text'
								required
								bind:value={username}
								class='appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-500 dark:placeholder-gray-400 text-stone-900 dark:text-white focus:outline-none focus:ring-stone-500 focus:border-stone-500 dark:focus:ring-stone-400 dark:focus:border-stone-400 dark:bg-gray-700 sm:text-sm'
								placeholder='Username'
							/>
						</div>
						{#if errors.username}
							<p class='mt-2 text-sm text-red-600 dark:text-red-400'>{errors.username}</p>
						{/if}
						<p class='mt-2 text-sm text-stone-500 dark:text-stone-400'>
							So that we'll get to know eachother better.
						</p>
					</div>
				{/if}

				<!-- Step 2: Weight and Goals -->
				{#if currentStep === 2}
					<div class='space-y-4'>
						<div>
							<label for='currentWeight' class='block text-sm font-medium text-stone-700 dark:text-stone-300'>
								Current Weight (kg)
							</label>
							<div class='mt-1'>
								<input
									id='currentWeight'
									name='currentWeight'
									type='number'
									min='1'
									required
									bind:value={currentWeight}
									class='appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-500 dark:placeholder-gray-400 text-stone-900 dark:text-white focus:outline-none focus:ring-stone-500 focus:border-stone-500 dark:focus:ring-stone-400 dark:focus:border-stone-400 dark:bg-gray-700 sm:text-sm'
									placeholder='Current weight in kg'
								/>
							</div>
							{#if errors.currentWeight}
								<p class='mt-2 text-sm text-red-600 dark:text-red-400'>{errors.currentWeight}</p>
							{/if}
						</div>

						<div>
							<label for='goalWeight' class='block text-sm font-medium text-stone-700 dark:text-stone-300'>
								Goal Weight (kg)
							</label>
							<div class='mt-1'>
								<input
									id='goalWeight'
									name='goalWeight'
									type='number'
									min='1'
									required
									bind:value={goalWeight}
									class='appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-500 dark:placeholder-gray-400 text-stone-900 dark:text-white focus:outline-none focus:ring-stone-500 focus:border-stone-500 dark:focus:ring-stone-400 dark:focus:border-stone-400 dark:bg-gray-700 sm:text-sm'
									placeholder='Goal weight in kg'
								/>
							</div>
							{#if errors.goalWeight}
								<p class='mt-2 text-sm text-red-600 dark:text-red-400'>{errors.goalWeight}</p>
							{/if}
						</div>

						<div>
							<label class='block text-sm font-medium text-stone-700 dark:text-stone-300'>
								Your Primary Fitness Goal
							</label>
							<div class='mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3'>

								<!-- Lose Weight -->
								<label class={`${fitnessGoal === 'lose_weight' ? 'border-stone-500 dark:border-stone-400 bg-stone-50 dark:bg-stone-900/30' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'} relative border rounded-lg shadow-sm p-4 flex cursor-pointer focus:outline-none`}>
									<input type='radio' name='fitnessGoal' value='lose_weight' bind:group={fitnessGoal} class='sr-only' />
									<div class='flex items-center'>
										<svg class="w-5 h-5 text-stone-700 dark:text-stone-300 mr-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 3.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM10.5 7.5l1.5 3h3l-1.5 2.5h-3L8 18.5m4.5-5.5l-2 2.5 1 2M14.5 13.5l2 1.5-.5 3" />
										</svg>
										<div class='text-sm'>
											<span class='font-medium text-stone-900 dark:text-white'>Lose Weight</span>
										</div>
									</div>
									{#if fitnessGoal === 'lose_weight'}
										<div class='absolute -inset-px rounded-lg border-2 border-stone-500 dark:border-stone-400 pointer-events-none'></div>
									{/if}
								</label>

								<!-- Build Muscle -->
								<label class={`${fitnessGoal === 'build_muscle' ? 'border-stone-500 dark:border-stone-400 bg-stone-50 dark:bg-stone-900/30' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'} relative border rounded-lg shadow-sm p-4 flex cursor-pointer focus:outline-none`}>
									<input type='radio' name='fitnessGoal' value='build_muscle' bind:group={fitnessGoal} class='sr-only' />
									<div class='flex items-center'>
										<svg class="w-5 h-5 text-stone-700 dark:text-stone-300 mr-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h3v4H3v-4zm15 0h3v4h-3v-4zM6 11h12v2H6v-2zM8 9v6m8-6v6" />
										</svg>
										<div class='text-sm'>
											<span class='font-medium text-stone-900 dark:text-white'>Build Muscle</span>
										</div>
									</div>
									{#if fitnessGoal === 'build_muscle'}
										<div class='absolute -inset-px rounded-lg border-2 border-stone-500 dark:border-stone-400 pointer-events-none'></div>
									{/if}
								</label>

								<!-- Get in Shape -->
								<label class={`${fitnessGoal === 'get_in_shape' ? 'border-stone-500 dark:border-stone-400 bg-stone-50 dark:bg-stone-900/30' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'} relative border rounded-lg shadow-sm p-4 flex cursor-pointer focus:outline-none`}>
									<input type='radio' name='fitnessGoal' value='get_in_shape' bind:group={fitnessGoal} class='sr-only' />
									<div class='flex items-center'>
										<svg class="w-5 h-5 text-stone-700 dark:text-stone-300 mr-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 4a2 2 0 110 4 2 2 0 010-4zM8 21l1.5-6L6 13.5m12 7.5l-1.5-6L18 13.5M10 12h4l1-2-3-1-3 1 1 2z" />
										</svg>
										<div class='text-sm'>
											<span class='font-medium text-stone-900 dark:text-white'>Get in shape</span>
										</div>
									</div>
									{#if fitnessGoal === 'get_in_shape'}
										<div class='absolute -inset-px rounded-lg border-2 border-stone-500 dark:border-stone-400 pointer-events-none'></div>
									{/if}
								</label>
								<!-- Custom Goal -->
								<label
									class={`${
    fitnessGoal === 'custom'
      ? 'border-stone-500 dark:border-stone-400 bg-stone-50 dark:bg-stone-900/30'
      : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
  } relative border rounded-lg shadow-sm p-4 flex flex-col cursor-pointer focus:outline-none transition-all duration-200`}
								>
									<input type="radio" name="fitnessGoal" value="custom" bind:group={fitnessGoal} class="sr-only" aria-labelledby="custom-goal-label" />
									<div class="flex items-center">
										<svg
											class="w-5 h-5 text-stone-700 dark:text-stone-300 mr-2"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M12 20h9m-9 0v-6m0 6l-3-3m3 3l3-3M3 5h18M3 10h18"
											/>
										</svg>
										<div class="text-sm">
											<span id="custom-goal-label" class="font-medium text-stone-900 dark:text-white">Add your own</span>
										</div>
									</div>
									{#if fitnessGoal === 'custom'}
										<div class="mt-3">
											<input
												type="text"
												name="customGoal"
												placeholder="Describe your goal..."
												bind:value={customGoal}
												class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-500 dark:placeholder-gray-400 text-stone-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-stone-500 focus:border-stone-500 dark:focus:ring-stone-400 dark:focus:border-stone-400 sm:text-sm transition-all duration-200"
												required
												aria-label="Custom fitness goal"
											/>
										</div>
									{/if}
									{#if fitnessGoal === 'custom'}
										<div
											class="absolute -inset-px rounded-lg border-2 border-stone-500 dark:border-stone-400 pointer-events-none"
										></div>
									{/if}
								</label>
							</div>
						</div>

					</div>
				{/if}

				<!-- Step 3: Tutorial Video -->
				{#if currentStep === 3}
					<div class='space-y-4'>
						<h2 class='text-xl font-semibold text-stone-800 dark:text-white'>How to use Workout Tracker</h2>
						<p class='text-stone-600 dark:text-stone-400'>
							Watch this quick tutorial to get started with tracking your workouts.
						</p>

						<div class='relative aspect-video bg-black rounded-lg overflow-hidden'>
							<!-- Replace with your actual video source -->
							<video
								id='tutorial-video'
								class='w-full h-full object-cover'
								poster='/images/tutorial-poster.jpg'
								controls
							>
								<source src='/videos/tutorial.mp4' type='video/mp4'>
								Your browser does not support the video tag.
							</video>

							<!-- Play/Pause button overlay -->
							<button
								type='button'
								on:click={playPauseVideo}
								class='absolute inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-30 group hover:bg-opacity-50'
							>
								<span class={`${isVideoPlaying ? 'opacity-0' : 'opacity-100'} group-hover:opacity-100 transition-opacity duration-300 bg-stone-800 bg-opacity-70 rounded-full p-4`}>
									<svg xmlns='http://www.w3.org/2000/svg' class='h-12 w-12 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
										<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' />
										<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
									</svg>
								</span>
							</button>
						</div>

						<div class='mt-4'>
							<p class='text-stone-600 dark:text-stone-400'>
								You're all set to start your fitness journey! Click "Complete Setup" to access your dashboard.
							</p>
						</div>
					</div>
				{/if}

				<!-- Navigation buttons -->
				<div class='flex justify-between pt-4'>
					{#if currentStep > 1}
						<button
							type='button'
							on:click={prevStep}
							class='flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800'
						>
							Back
						</button>
					{:else}
						<!-- Empty div to maintain layout -->
						<div></div>
					{/if}

					<button
						type='submit'
						class='flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800'
					>
						{currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>