<script lang='ts'>
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { onMount, afterUpdate } from 'svelte';
	import { safeLocalStorageGet } from '../utils/localStorage';
	export let user: boolean;
	// Track if the mobile menu is open
	let isMenuOpen = false;
	// Track dark mode
	let isDarkMode = false;
	// Store current path to track navigation
	let currentPath = '';

	// Toggle mobile menu
	const toggleMenu = () => {
		isMenuOpen = !isMenuOpen;
	};

	// Close mobile menu
	const closeMenu = () => {
		if (isMenuOpen) {
			isMenuOpen = false;
		}
	};

	// Toggle dark mode
	const toggleDarkMode = () => {
		isDarkMode = !isDarkMode;

		if (browser) {
			if (isDarkMode) {
				document.documentElement.classList.add('dark');
				localStorage.setItem('theme', 'dark');
			} else {
				document.documentElement.classList.remove('dark');
				localStorage.setItem('theme', 'light');
			}
		}
	};

	// Check for saved theme preference on mount
	onMount(() => {
		// Check local storage or system preference
		const savedTheme = safeLocalStorageGet('theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

		isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);

		if (isDarkMode) {
			document.documentElement.classList.add('dark');
		}

		currentPath = page.url.pathname;
	});

	// Close menu when navigation occurs
	afterUpdate(() => {
		if (currentPath !== page.url.pathname) {
			closeMenu();
			currentPath = page.url.pathname;
		}
	});
</script>
<nav class='bg-white dark:bg-gray-800 shadow-md'>
	<div class='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
		<div class='flex justify-between h-16'>
			<div class='flex items-center'>
				<!-- Logo -->
				<a href='/' class='flex-shrink-0 flex items-center'>
					<span class='text-xl font-bold text-stone-950 dark:text-white'>WorkoutTracker</span>
				</a>

				<!-- Desktop Navigation Links -->
				<div class='hidden sm:ml-6 sm:flex sm:space-x-8'>


					{#if user}
						<a
							href='/app/dashboard'
							class="{page.url.pathname.startsWith('/dashboard') ?
			'border-stone-500 text-stone-950 dark:text-white' :
			'border-transparent text-stone-600 dark:text-gray-300 hover:text-stone-700 dark:hover:text-white'}
			inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
						>
							Dashboard
						</a>
						<a
							href='/app/workout'
							class="{page.url.pathname.startsWith('/app/workout') ?
			'border-stone-500 text-stone-950 dark:text-white' :
			'border-transparent text-stone-600 dark:text-gray-300 hover:text-stone-700 dark:hover:text-white'}
			inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
						>
							Workout
						</a>
					{:else }
						<a
							href='/'
							class="{page.url.pathname === '/' ?
              'border-stone-500 text-stone-950 dark:text-white' :
              'border-transparent text-stone-600 dark:text-gray-300 hover:text-stone-700 dark:hover:text-white'}
              inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
						>
							Home
						</a>
					{/if}
				</div>
			</div>

			<!-- Right side buttons -->
			<div class='hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4'>
				<!-- Dark Mode Toggle -->
				<button
					type='button'
					on:click={toggleDarkMode}
					class='p-2 rounded-full text-stone-600 hover:text-stone-700 dark:text-stone-400 dark:hover:text-white focus:outline-none cursor-pointer'
					aria-label='Toggle dark mode'
				>
					{#if isDarkMode}
						<!-- Sun icon -->
						<svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
							<path fill-rule='evenodd'
										d='M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z'
										clip-rule='evenodd' />
						</svg>
					{:else}
						<!-- Moon icon -->
						<svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
							<path d='M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z' />
						</svg>
					{/if}
				</button>

				<!-- Authentication Links -->
				{#if user}
					<a
						href='/app/profile'
						class="{page.url.pathname.startsWith('/profile') ?
           'bg-stone-50 dark:bg-gray-700 border-stone-500 text-stone-700 dark:text-white' :
           'border-transparent text-stone-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-stone-700 dark:hover:text-white'}
           px-3 py-2 rounded-md text-sm font-medium"
					>
						<div class="flex items-center">
							<div class="relative w-8 h-8 mr-2 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
								<svg class="absolute w-10 h-10 text-gray-400 -left-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
							</div>
							Profile
						</div>
					</a>
					<a
						href='/app/logout'
						class='bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800'
					>
						Logout
					</a>
				{:else }
					<a
						href='/auth/login'
						class='text-stone-600 dark:text-stone-400 hover:text-stone-500 dark:hover:text-stone-300 px-3 py-2 rounded-md text-sm font-medium'
					>
						Login
					</a>
					<a
						href='/auth/register'
						class='bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800'
					>
						Register
					</a>
				{/if}
			</div>

			<!-- Mobile menu button -->
			<div class='flex items-center sm:hidden'>
				<!-- Dark Mode Toggle -->
				<button
					type='button'
					on:click={toggleDarkMode}
					class='p-2 rounded-full text-stone-600 hover:text-stone-700 dark:text-stone-400 dark:hover:text-white focus:outline-none mr-2'
					aria-label='Toggle dark mode'
				>
					{#if isDarkMode}
						<!-- Sun icon -->
						<svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
							<path fill-rule='evenodd'
										d='M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z'
										clip-rule='evenodd' />
						</svg>
					{:else}
						<!-- Moon icon -->
						<svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
							<path d='M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z' />
						</svg>
					{/if}
				</button>

				<button
					type='button'
					on:click={toggleMenu}
					class='inline-flex items-center justify-center p-2 rounded-md text-stone-600 hover:text-stone-700 dark:text-stone-400 dark:hover:text-white focus:outline-none'
					aria-controls='mobile-menu'
					aria-expanded={isMenuOpen}
				>
					<span class='sr-only'>Open main menu</span>
					<!-- Hamburger icon when menu is closed -->
					<svg
						class:hidden={isMenuOpen}
						class='h-6 w-6'
						xmlns='http://www.w3.org/2000/svg'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
						aria-hidden='true'
					>
						<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 6h16M4 12h16M4 18h16' />
					</svg>
					<!-- X icon when menu is open -->
					<svg
						class:hidden={!isMenuOpen}
						class='h-6 w-6'
						xmlns='http://www.w3.org/2000/svg'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
						aria-hidden='true'
					>
						<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12' />
					</svg>
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile menu, show/hide based on menu state -->
	{#if isMenuOpen}
		<div class='sm:hidden' id='mobile-menu'>
			<div class='pt-2 pb-3 space-y-1'>
				<a
					href='/'
					class="{page.url.pathname === '/' ?
            'bg-stone-50 dark:bg-gray-700 border-stone-500 text-stone-700 dark:text-white' :
            'border-transparent text-stone-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-stone-700 dark:hover:text-white'}
            block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
				>
					Home
				</a>
				{#if user}
					<a
						href='/app/dashboard'
						class="{page.url.pathname.startsWith('/dashboard') ?
			'bg-stone-50 dark:bg-gray-700 border-stone-500 text-stone-700 dark:text-white' :
			'border-transparent text-stone-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-stone-700 dark:hover:text-white'}
			block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
					>
						Dashboard
					</a>
					<a
						href='/app/workout'
						class="{page.url.pathname.startsWith('/app/workout') ?
			'bg-stone-50 dark:bg-gray-700 border-stone-500 text-stone-700 dark:text-white' :
			'border-transparent text-stone-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-stone-700 dark:hover:text-white'}
			block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
					>
						Workout
					</a>
				{/if}

				<!-- Authentication Links -->
				{#if user}
					<a
						href='/app/profile'
						class="{page.url.pathname.startsWith('/profile') ?
           'bg-stone-50 dark:bg-gray-700 border-stone-500 text-stone-700 dark:text-white' :
           'border-transparent text-stone-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-stone-700 dark:hover:text-white'}
           block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
					>
						<div class="flex items-center">
							<div class="relative w-8 h-8 mr-2 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
								<svg class="absolute w-10 h-10 text-gray-400 -left-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
							</div>
							Profile
						</div>
					</a>
					<a
						href='/app/logout'
						class='border-transparent text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
					>
						Logout
					</a>
				{:else }
					<a
						href='/auth/login'
						class='border-transparent text-stone-600 dark:text-stone-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-stone-700 dark:hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
					>
						Login
					</a>
					<a
						href='/auth/register'
						class='border-transparent text-stone-600 dark:text-stone-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-stone-500 dark:hover:text-stone-300 block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
					>
						Register
					</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>