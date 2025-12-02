<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let data;

	onMount(() => {
		// Redirect to workout page immediately
		goto('/workout');
	});
</script>

<svelte:head>
	<title>Workout Tracker</title>
</svelte:head>

<!-- Loading state while redirecting -->
<div class="min-h-screen flex items-center justify-center">
	<div class="text-center">
		<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-stone-500 mx-auto mb-4"></div>
		<p class="text-stone-600 dark:text-stone-300">Loading your workout...</p>
	</div>
</div>