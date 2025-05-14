<script lang='ts'>
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { Exercise, Workout } from '$lib/types';

	Chart.register(...registerables);
	export let data: PageData;

	const {
		profile,
		workouts = [],
		workoutExercises = [],
		weights = [],
		cardio = [],
		progressLevels = []
	} = data;

	let username = profile?.username || 'Athlete';

	// Calculate workout stats
	const totalWorkouts = workouts.length;
	const totalCardioSessions = cardio.length;

	// Calculate total duration and calories (placeholder values since these aren't in your schema)
	// In a real implementation, you might calculate these from your exercise data
	const totalDuration = calculateTotalDuration(workoutExercises,);
	const caloriesBurned = calculateTotalCalories(workoutExercises);

	// Group workouts by day for the chart
	const workoutsByDay = groupWorkoutsByDay(workouts);

	// Animation variables
	let animatedTotalWorkouts = 0;
	let animatedTotalCardioSessions = 0;
	let animatedTotalDuration = 0;
	let animatedCaloriesBurned = 0;

	// Progress tracking
	let currentLevel = progressLevels.find(level => level.level_id === profile?.monthly_progress_level) || null;
	let nextLevel = progressLevels.find(level => level.level_id === (profile?.monthly_progress_level + 1)) || null;

	let goalName = currentLevel?.level_name || 'Beginner';
	let nextGoalName = nextLevel?.level_name || 'Intermediate';

	let monthlyWorkoutGoal = currentLevel?.workouts_required || 10;
	let monthlyDurationGoal = currentLevel?.minutes_required || 300;
	let monthlyCaloriesGoal = currentLevel?.calories_required || 1500;

	function calculateTotalDuration(exercises: Exercise[]): number {
		// For workout exercises, assume duration based on sets (e.g., 2 minutes per set)
		const exercisesDuration = exercises.reduce((sum, ex) => sum + (ex.sets * 2 || 0), 0);

		return exercisesDuration;
	}

	function calculateTotalCalories(exercises: Exercise[]): number {
		// Estimate calories for workout exercises (very rough approximation)
		const exercisesCalories = exercises.reduce((sum, ex) => {
			// Rough estimate: 3 calories per rep * weight in kg / 10
			const repsCount = typeof ex.reps === 'string' ? parseInt(ex.reps, 10) || 1 : ex.reps || 1;
			return sum + (3 * repsCount * (ex.weight || 0) / 10);
		}, 0);

		// // Estimate calories for cardio (very rough approximation)
		// const cardioCalories = cardioEntries.reduce((sum, cardio) => {
		// 	// Rough estimate: 10 calories per minute of cardio
		// 	return sum + ((cardio.duration || 0) * 10);
		// }, 0);

		return Math.round(exercisesCalories);
	}

	function groupWorkoutsByDay(workoutsData: Workout[]): { day: string, count: number }[] {
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const result = days.map((day) => ({ day, count: 0 }));

		workoutsData.forEach((workout: Workout) => {
			if (workout.workout_date) {
				const date = new Date(workout.workout_date);
				const dayIndex = date.getDay();
				result[dayIndex].count += 1;
			}
		});

		return result;
	}

	function prepareWeightData(weightData: any[]): { date: string, weight: number }[] {
		if (!weightData || weightData.length === 0) return [];

		// Sort weights by date
		const sortedWeights = [...weightData].sort((a, b) => {
			return new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime();
		});

		// Get the last 10 entries or all if less than 10
		const recentWeights = sortedWeights.slice(-10);

		return recentWeights.map(entry => ({
			date: new Date(entry.measured_at).toLocaleDateString(),
			weight: entry.weight
		}));
	}


	const weightChartData = prepareWeightData(weights);

	// Calculate weight stats
	const currentWeight = weights.length > 0
		? weights.sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())[0].weight
		: null;

	const initialWeight = weights.length > 0
		? weights.sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())[0].weight
		: null;

	const weightChange = currentWeight !== null && initialWeight !== null
		? (currentWeight - initialWeight).toFixed(1)
		: null;

	function animateValue(from: number, to: number, duration: number, callback: (value: number) => void) {
		const start = performance.now();
		const step = (currentTime: number) => {
			const progress = Math.min((currentTime - start) / duration, 1);
			const value = Math.floor(progress * (to - from) + from);
			callback(value);
			if (progress < 1) {
				requestAnimationFrame(step);
			}
		};
		requestAnimationFrame(step);
	}

	const fitnessFacts = [
		'Did you know that regular exercise can improve your mood and reduce stress?',
		'Fun fact: Your bones get stronger when you challenge your muscles!',
		'Tip: Even 15 minutes of exercise a day can make a big difference to your health.',
		'Did you know that drinking water during your workout can boost your performance?',
		'Fun fact: Muscle tissue burns more calories at rest than fat tissue.',
		'Tip: Consistency is key! Try to schedule your workouts like any other important appointment.',
		'Did you know that sleep plays a crucial role in muscle recovery and growth?',
		'Fun fact: Exercise can improve your sleep quality.',
		'Tip: Don\'t forget to warm up before your workout to prevent injuries!',
		'Did you know that varying your workouts can help prevent boredom and plateauing?'
	];

	let currentFact = fitnessFacts[Math.floor(Math.random() * fitnessFacts.length)];
	let chartElement: HTMLCanvasElement;
	let weightChartElement: HTMLCanvasElement;
	const goalWeight = profile?.goal_weight || null;


	onMount(() => {
		const ctx = chartElement?.getContext('2d');
		if (ctx) {
			new Chart(ctx, {
				type: 'bar',
				data: {
					labels: workoutsByDay.map(item => item.day),
					datasets: [{
						label: 'Workouts',
						data: workoutsByDay.map(item => item.count),
						backgroundColor: '#737373',
						borderColor: '#525252',
						borderWidth: 1
					}]
				},
				options: {
					responsive: true,
					scales: {
						x: {
							title: {
								display: false,
								text: 'Days of the Week'
							}
						},
						y: {
							beginAtZero: true,
							title: {
								display: true,
								text: 'Workouts'
							},
							ticks: {
								stepSize: 1,
								callback: function(value) {
									return value.toFixed(0);
								}
							}
						}
					},
					plugins: {
						legend: {
							display: false
						}
					}
				}
			});
			const weightCtx = weightChartElement?.getContext('2d');
			if (weightCtx && weightChartData.length > 0) {
				new Chart(weightCtx, {
					type: 'line',
					data: {
						labels: weightChartData.map(item => item.date),
						datasets: [
							{
								label: 'Weight',
								data: weightChartData.map(item => item.weight),
								backgroundColor: 'rgba(6, 182, 212, 0.2)',
								borderColor: 'rgba(6, 182, 212, 1)',
								borderWidth: 2,
								pointBackgroundColor: 'rgba(6, 182, 212, 1)',
								pointBorderColor: '#fff',
								pointBorderWidth: 1,
								pointRadius: 4,
								tension: 0.2
							},
							// Add goal weight as a horizontal line if available
							...(goalWeight ? [{
								label: 'Goal Weight',
								data: Array(weightChartData.length).fill(goalWeight),
								borderColor: 'rgba(234, 88, 12, 0.8)',
								borderWidth: 2,
								borderDash: [5, 5],
								pointRadius: 0,
								fill: false,
								tension: 0
							}] : [])
						]
					},
					options: {
						responsive: true,
						scales: {
							x: {
								title: {
									display: false,
									text: 'Date'
								}
							},
							y: {
								beginAtZero: false,
								title: {
									display: true,
									text: 'Weight'
								}
							}
						},
						plugins: {
							legend: {
								display: true
							},
							tooltip: {
								callbacks: {
									label: function(context) {
										if (context.dataset.label === 'Goal Weight') {
											return `Goal: ${context.raw} kg`;
										}
										return `Weight: ${context.raw} kg`;
									}
								}
							}
						}
					}
				});
			}
		}

		animateValue(0, totalWorkouts, 1000, value => (animatedTotalWorkouts = value));
		animateValue(0, totalCardioSessions, 1000, value => (animatedTotalCardioSessions = value));
		animateValue(0, totalDuration, 2000, value => (animatedTotalDuration = value));
		animateValue(0, caloriesBurned, 2000, value => (animatedCaloriesBurned = value));
	});

	function handleGenerateWorkout() {
		goto('/app/workout');
	}

	function handleGenerateCustomWorkout(workoutType: string) {
		goto(`/app/workout/?type=${workoutType}`);
	}

	function handleAddWeight() {
		goto('/app/profile/weight');
	}
</script>

<svelte:head>
	<title>Dashboard | Workout Tracker</title>
</svelte:head>

<div class='container mx-auto px-4 py-8'>
	<div class='flex flex-col md:flex-row justify-between items-start md:items-center mb-8'>
		<div>
			<h1 class='text-3xl font-bold text-stone-800 dark:text-white'>Welcome back, {username}</h1>
			<p class='text-stone-600 dark:text-stone-300 mt-1'>Here's your workout summary for the last 7 days</p>
		</div>

		<button
			on:click={handleGenerateWorkout}
			class='mt-4 md:mt-0 bg-stone-600 hover:bg-stone-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md flex items-center dark:bg-stone-600 dark:hover:bg-stone-700 cursor-pointer'
		>
			<svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5 mr-2' fill='none' viewBox='0 0 24 24'
					 stroke='currentColor'>
				<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 4v16m8-8H4' />
			</svg>
			Generate New Workout
		</button>
	</div>

	<!-- Fact Overview -->
	<div class='bg-stone-100 dark:bg-stone-800/50 rounded-lg p-4 mb-6 border border-stone-200 dark:border-stone-700'>
		<p class='text-stone-700 dark:text-stone-300 italic text-sm'>
			{currentFact}
		</p>
	</div>

	<!-- Stats Overview -->
	<div class='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
		<!-- Each card -->
		{#each [
			{ label: 'Total Workouts', value: animatedTotalWorkouts, iconBg: 'bg-yellow-100 dark:bg-yellow-200/90' },
			{ label: 'Cardio Sessions', value: animatedTotalCardioSessions, iconBg: 'bg-teal-100 dark:bg-teal-200/90' },
			{ label: 'Total Duration', value: `${animatedTotalDuration} min`, iconBg: 'bg-green-100 dark:bg-green-200/90' },
			{ label: 'Calories Burned', value: animatedCaloriesBurned, iconBg: 'bg-red-100 dark:bg-red-200/90' }
		] as stat, i}
			<div
				class='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-default transition-transform duration-200 hover:scale-105'>
				<div class='flex items-center'>
					<div class={`p-3 rounded-full ${stat.iconBg}`}>
						<!-- Directly include the SVG for each stat -->
						{#if stat.label === 'Total Workouts'}
							<svg xmlns='http://www.w3.org/2000/svg' class='h-6 w-6 text-stone-600' fill='none' viewBox='0 0 24 24'
									 stroke='currentColor'>
								<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2'
											d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
							</svg>
						{/if}

						{#if stat.label === 'Cardio Sessions'}
							<svg xmlns='http://www.w3.org/2000/svg' class='h-6 w-6 text-stone-600' fill='none' viewBox='0 0 24 24'
									 stroke='currentColor'>
								<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 10V3L4 14h7v7l9-11h-7z' />
							</svg>
						{/if}

						{#if stat.label === 'Total Duration'}
							<svg xmlns='http://www.w3.org/2000/svg' class='h-6 w-6 text-stone-600' fill='none' viewBox='0 0 24 24'
									 stroke='currentColor'>
								<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2'
											d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
							</svg>
						{/if}

						{#if stat.label === 'Calories Burned'}
							<svg xmlns='http://www.w3.org/2000/svg' class='h-6 w-6 text-stone-600' fill='none' viewBox='0 0 24 24'
									 stroke='currentColor'>
								<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2'
											d='M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' />
								<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2'
											d='M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z' />
							</svg>
						{/if}
					</div>

					<div class='ml-4'>
						<h2 class='text-lg font-semibold text-stone-700 dark:text-stone-300'>{stat.label}</h2>
						<p class='text-3xl font-bold text-stone-800 dark:text-white'>{stat.value}</p>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Weekly Overview -->
	<div class='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
		<!-- Activity Chart -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
			<h2 class="text-xl font-bold text-stone-800 dark:text-white mb-4">Weekly Activity</h2>
			<div class="h-64">
				<canvas bind:this={chartElement}></canvas>
			</div>
		</div>

		<!-- Weight Chart -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-bold text-stone-800 dark:text-white">Weight Tracking</h2>
				<button
					on:click={handleAddWeight}
					class="text-sm bg-stone-600 hover:bg-stone-700 text-white py-1 px-3 rounded-md transition-colors shadow-sm flex items-center dark:bg-stone-600 dark:hover:bg-stone-700 cursor-pointer"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Add Weight
				</button>
			</div>

			{#if weights.length > 0}
				<div class="flex justify-between items-center mb-3">
					<div class="flex items-center">
						<div class="p-2 rounded-full bg-cyan-100 dark:bg-cyan-200/90 mr-2">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
							</svg>
						</div>
						<div>
							<p class="text-sm text-stone-500 dark:text-stone-400">Current</p>
							<p class="text-lg font-semibold text-stone-800 dark:text-white">{currentWeight} kg</p>
						</div>
					</div>

					{#if weightChange !== null}
						<div class="text-right">
							<p class="text-sm text-stone-500 dark:text-stone-400">Overall Change</p>
							<p class="text-lg font-semibold {Number(weightChange) < 0 ? 'text-green-600 dark:text-green-400' : Number(weightChange) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}">
								{weightChange > 0 ? '+' : ''}{weightChange} kg
							</p>
						</div>
					{/if}

					{#if goalWeight}
						<div class="flex items-center">
							<div class="p-2 rounded-full bg-orange-100 dark:bg-orange-200/90 mr-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
							</div>
							<div>
								<p class="text-sm text-stone-500 dark:text-stone-400">Goal</p>
								<p class="text-lg font-semibold text-orange-600 dark:text-orange-400">{goalWeight} kg</p>
							</div>
						</div>
					{/if}
				</div>

				<div class="h-52">
					<canvas bind:this={weightChartElement}></canvas>
				</div>
			{:else}
				<div class="text-center py-12">
					<div class="mx-auto p-3 rounded-full bg-cyan-100 dark:bg-cyan-200/90 w-16 h-16 flex items-center justify-center mb-3">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
						</svg>
					</div>
					<p class="text-stone-500 dark:text-stone-400 mb-4">No weight records found.</p>
					<button
						on:click={handleAddWeight}
						class="text-sm bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded-md transition-colors shadow-md flex items-center mx-auto dark:bg-cyan-600 dark:hover:bg-cyan-700"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Track your first weight
					</button>
				</div>
			{/if}
		</div>

		<!-- Recent Workouts -->
		<div class='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
			<h2 class='text-xl font-bold text-stone-800 dark:text-white mb-4'>Recent Workouts</h2>

			{#if workouts.length === 0 && cardio.length === 0}
				<div class='text-center py-8'>
					<p class='text-stone-500 dark:text-stone-400'>No recent workouts found.</p>
					<button
						on:click={handleGenerateWorkout}
						class='mt-4 bg-stone-600 hover:bg-stone-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm dark:bg-stone-600 dark:hover:bg-stone-700'
					>
						Start your first workout
					</button>
				</div>
			{:else}
				<div class='space-y-4'>
					{#if workoutExercises.length > 0}
						{#each workoutExercises.slice(0, 3) as exercise}
							<div
								class='flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md hover:scale-[1.02] transition-transform duration-200 px-2'>
								<div>
									<h3 class='font-medium text-stone-800 dark:text-white'>{exercise.exercise_name}</h3>
									<p class='text-sm cursor-default text-stone-500 dark:text-stone-400'>
										{#if workouts.find(w => w.id === exercise.workoutid)}
											{new Date(workouts.find(w => w.id === exercise.workoutid).workout_date).toLocaleDateString()}
										{:else}
											Recent
										{/if}
									</p>
								</div>
								<div class='text-sm font-medium cursor-default text-stone-700 dark:text-stone-300'>
									{exercise.sets} sets
								</div>
							</div>
						{/each}
					{/if}

					{#if cardio.length > 0}
						{#each cardio.slice(0, 3) as cardioItem}
							<div
								class='flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md hover:scale-[1.02] transition-transform duration-200 px-2'>
								<div>
									<h3 class='font-medium text-stone-800 dark:text-white'>{cardioItem.type} Cardio</h3>
									<p class='text-sm text-stone-500 dark:text-stone-400'>
										{#if workouts.find(w => w.id === cardioItem.workoutid)}
											{new Date(workouts.find(w => w.id === cardioItem.workoutid).workout_date).toLocaleDateString()}
										{:else}
											Recent
										{/if}
									</p>
								</div>
								<div class='text-sm font-medium text-stone-700 dark:text-stone-300'>
									{cardioItem.duration || 0} min
								</div>
							</div>
						{/each}
					{/if}

					<a href='/app/workout/history'
						 class='block text-center text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white font-medium mt-4'>
						View all workouts →
					</a>
				</div>
			{/if}
		</div>
	</div>

	<!-- Workout Suggestions -->
	<div class='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
		<h2 class='text-xl font-bold text-stone-800 dark:text-white mb-4 cursor-default'>Workout Suggestions</h2>
		<div class='grid grid-cols-1 md:grid-cols-3 gap-4'>
			<div
				class='bg-blue-50 dark:bg-blue-900/30 rounded-lg p-5 cursor-default hover:bg-blue-100 dark:hover:bg-blue-700/30 transition-transform duration-200 hover:scale-105'>
				<h3 class='font-semibold text-stone-700 dark:text-white mb-2'>Upper Body Focus</h3>
				<p class='text-sm text-stone-600 dark:text-stone-300'>Perfect for strengthening chest, shoulders and arms.</p>
				<button class='mt-4 px-4 py-2 bg-stone-500 cursor-pointer text-white rounded-md hover:bg-stone-600'
								on:click={() => handleGenerateCustomWorkout('upper-body')}>
					Start Now
				</button>
			</div>

			<div
				class='bg-red-50 dark:bg-red-900/30 rounded-lg p-5 cursor-default hover:bg-red-100 dark:hover:bg-red-700/30 transition-transform duration-200 hover:scale-105'>
				<h3 class='font-semibold text-stone-700 dark:text-white mb-2'>HIIT Cardio</h3>
				<p class='text-sm text-stone-600 dark:text-stone-300'>High intensity interval training to burn calories
					quickly.</p>
				<button class='mt-4 px-4 py-2 bg-stone-500 cursor-pointer text-white rounded-md hover:bg-stone-600'
								on:click={() => handleGenerateCustomWorkout('hiit-cardio')}>
					Start Now
				</button>
			</div>

			<div
				class='bg-teal-50 dark:bg-teal-900/30 rounded-lg p-5 cursor-default hover:bg-teal-100 dark:hover:bg-teal-700/30 transition-transform duration-200 hover:scale-105'>
				<h3 class='font-semibold text-stone-700 dark:text-white mb-2'>Lower Body Strength</h3>
				<p class='text-sm text-stone-600 dark:text-stone-300'>Focus on building leg and core strength.</p>
				<button class='mt-4 px-4 py-2 bg-stone-500 cursor-pointer text-white rounded-md hover:bg-stone-600'
								on:click={() => handleGenerateCustomWorkout('lower-body')}>
					Start Now
				</button>
			</div>
		</div>
	</div>

	<!-- Progress Tracker -->
	{#if profile && progressLevels.length > 0}
		<div class='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-8'>
			<h2 class='text-xl font-bold text-stone-800 dark:text-white mb-1 cursor-default'>
				Monthly Progress
			</h2>
			<p class='text-sm text-stone-600 dark:text-stone-300 mb-4 cursor-default'>
				Current Level: {goalName}
			</p>

			<div class='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<!-- Workouts -->
				<div class='text-center cursor-default transition-transform duration-200 hover:scale-105'>
					<p class='text-stone-600 dark:text-stone-300'>Workouts</p>
					<p class='text-2xl font-bold text-stone-800 dark:text-white'>
						{totalWorkouts} / {monthlyWorkoutGoal}
					</p>
					<div class='w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700'>
						<div
							class='bg-yellow-200 h-2.5 rounded-full'
							style='width: {Math.min((totalWorkouts / monthlyWorkoutGoal) * 100, 100)}%'>
						</div>
					</div>
				</div>

				<!-- Duration -->
				<div class='text-center cursor-default transition-transform duration-200 hover:scale-105'>
					<p class='text-stone-600 dark:text-stone-300'>Duration (mins)</p>
					<p class='text-2xl font-bold text-stone-800 dark:text-white'>
						{totalDuration} / {monthlyDurationGoal}
					</p>
					<div class='w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700'>
						<div
							class='bg-green-500/50 h-2.5 rounded-full'
							style='width: {Math.min((totalDuration / monthlyDurationGoal) * 100, 100)}%'>
						</div>
					</div>
				</div>

				<!-- Calories Burned -->
				<div class='text-center cursor-default transition-transform duration-200 hover:scale-105'>
					<p class='text-stone-600 dark:text-stone-300'>Calories Burned (kcal)</p>
					<p class='text-2xl font-bold text-stone-800 dark:text-white'>
						{caloriesBurned} / {monthlyCaloriesGoal}
					</p>
					<div class='w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700'>
						<div
							class='bg-red-500/50 h-2.5 rounded-full'
							style='width: {Math.min((caloriesBurned / monthlyCaloriesGoal) * 100, 100)}%'>
						</div>
					</div>
				</div>
			</div>

			<!-- Next Level -->
			{#if nextGoalName}
				<p class='mt-6 text-sm text-stone-600 dark:text-stone-300 text-center cursor-default'>
					Next Level: <span class='font-semibold text-stone-800 dark:text-white'>{nextGoalName}</span>
				</p>
			{/if}
		</div>
	{/if}
</div>