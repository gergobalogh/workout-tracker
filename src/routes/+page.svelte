<script lang="ts">
	// Updated features to match your requirements
	const features = [
		{
			title: "Goal Setting",
			description: "Set specific fitness goals based on your personal aspirations, whether it's building muscle, losing weight, or improving endurance.",
			icon: "🎯"
		},
		{
			title: "Customized Gym Workouts",
			description: "Get tailored demo routines generated specifically for your goals and experience level, designed to maximize your results.",
			icon: "💪"
		},
		{
			title: "Progress Tracking",
			description: "Monitor your improvements over time with detailed progress charts and milestone achievements to stay motivated.",
			icon: "📈"
		},
		{
			title: "Exercise Library",
			description: "Access our extensive database of exercises with proper form instructions to ensure safe and effective workouts.",
			icon: "📚"
		}
	];
</script>

<svelte:head>
	<title>Workout Tracker | Your Personal Fitness Journey</title>
	<meta name="description" content="Track your workouts, monitor your progress, and achieve your fitness goals with our free and easy-to-use workout tracker." />
</svelte:head>

<!-- Hero Section -->
<section class="pt-24 pb-16 px-4 sm:pt-32 sm:pb-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen flex flex-col justify-center">
	<div class="max-w-7xl mx-auto">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
			<div>
				<h1 class="text-4xl sm:text-5xl font-extrabold text-stone-900 dark:text-white tracking-tight">
					Track Your Fitness Journey Like Never Before
				</h1>
				<p class="mt-6 text-xl text-stone-600 dark:text-stone-300 max-w-3xl">
					The smart workout tracker that helps you set goals, generate customized gym workouts, and monitor your progress - completely free.
				</p>
				<div class="mt-10 flex justify-center">
					<a href="/demo"
						 class="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 md:py-4 md:text-lg md:px-10">
						Get Started
					</a>
				</div>
			</div>
			<div class="flex justify-center">
				<div class="relative w-full max-w-md">
					<div class="absolute inset-0 bg-gradient-to-r from-stone-400 to-stone-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
					<div class="relative bg-white dark:bg-gray-800 shadow-lg sm:rounded-3xl p-8 h-96 flex items-center justify-center">
						<!-- You can add an app screenshot here when available -->
						 <img src="/img.png" alt="Workout Tracker App Screenshot" class="rounded-xl shadow-md" />
					</div>
				</div>
			</div>
		</div>
	</div>
</section>


<!-- Features Section -->
<section id="features" class="py-16 bg-white dark:bg-gray-800">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h2 class="text-3xl font-extrabold text-stone-900 dark:text-white sm:text-4xl">
				Features Designed for Your Fitness Success
			</h2>
			<p class="mt-4 max-w-2xl mx-auto text-xl text-stone-600 dark:text-stone-300">
				Everything you need to set goals, generate workouts, and track your progress.
			</p>
		</div>

		<div class="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
			{#each features as feature (feature.title)}
				<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
					<div class="text-4xl mb-4">{feature.icon}</div>
					<h3 class="text-xl font-bold text-stone-900 dark:text-white">{feature.title}</h3>
					<p class="mt-2 text-stone-600 dark:text-stone-300">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="py-16 bg-stone-500 dark:bg-stone-700">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h2 class="text-3xl font-extrabold text-white sm:text-4xl">
			Ready to Transform Your Fitness Journey?
		</h2>
		<p class="mt-4 max-w-2xl mx-auto text-xl text-stone-100">
			Start tracking your fitness journey today with our completely free workout tracker.
		</p>
		<div class="mt-8">
			<a href="/auth/register"
				 class="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50 md:py-4 md:text-lg md:px-10">
				Sign Up Free
			</a>
		</div>
		<p class="mt-3 text-sm text-stone-200">
			No credit card required. Completely free.
		</p>
	</div>
</section>

<!-- Footer -->
<footer class="bg-white dark:bg-gray-800 pt-12 pb-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-2 md:grid-cols-3 gap-8">
			<div>
				<h3 class="text-sm font-semibold text-stone-500 dark:text-stone-300 tracking-wider uppercase">
					Product
				</h3>
				<ul class="mt-4 space-y-2">
					<li><a href="#features" class="text-base text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white">Features</a></li>
					<li><a href="#" class="text-base text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white">FAQ</a></li>
				</ul>
			</div>

			<div>
				<h3 class="text-sm font-semibold text-stone-500 dark:text-stone-300 tracking-wider uppercase">
					Company
				</h3>
				<ul class="mt-4 space-y-2">
					<li><a href="#" class="text-base text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white">About</a></li>
					<li><a href="#" class="text-base text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white">Contact</a></li>
				</ul>
			</div>

			<div>
				<h3 class="text-sm font-semibold text-stone-500 dark:text-stone-300 tracking-wider uppercase">
					Support
				</h3>
				<ul class="mt-4 space-y-2">
					<li><a href="#" class="text-base text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white">Help Center</a></li>
					<li><a href="#" class="text-base text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white">Privacy</a></li>
					<li><a href="#" class="text-base text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white">Terms</a></li>
				</ul>
			</div>
		</div>

		<div class="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
			<p class="text-base text-stone-500 dark:text-stone-400 text-center">
				&copy; {new Date().getFullYear()} WorkoutTracker. All rights reserved.
			</p>
		</div>
	</div>
</footer>