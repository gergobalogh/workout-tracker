<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation'
	let { data, children } = $props()
	let { session, supabase } = $derived(data)
	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth')
			}
		})
		return () => data.subscription.unsubscribe()
	})
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
	<Navbar user={!!session?.user} />

	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<!-- Page content will be inserted here -->
		{@render children()}
	</main>
</div>