<script lang='ts'>
	export let form: {
		email: FormDataEntryValue | null;
		password: FormDataEntryValue | null;
		error: string | null;
		success: string | null;
	};

	let email = form?.email ?? '';
	let password = form?.password ?? '';

	$: error = form?.error ?? '';
	$: success = form?.success ?? '';
</script>

<svelte:head>
	<title>Register | Workout Tracker</title>
</svelte:head>

<div class='min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
	<div class='max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'>
		<!-- Header -->
		<div class='text-center'>
			<h1 class='text-3xl font-extrabold text-stone-950 dark:text-white'>
				Create your account
			</h1>
			<p class='mt-2 text-sm text-stone-600 dark:text-stone-400'>
				Or <a href='/auth/login'
							class='font-medium text-stone-600 hover:text-stone-500 dark:text-stone-400 dark:hover:text-stone-300'>
				sign in to your existing account
			</a>
			</p>
		</div>

		<!-- Form -->
		<form class='mt-8 space-y-6' method='POST'>
			<!-- Error alert -->
			{#if error}
				<div class='bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 rounded-md'>
					<div class='flex'>
						<div class='flex-shrink-0'>
							<!-- SVG Icon -->
							<svg class='h-5 w-5 text-red-400' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'
									 fill='currentColor' aria-hidden='true'>
								<path fill-rule='evenodd'
											d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
											clip-rule='evenodd' />
							</svg>
						</div>
						<div class='ml-3'>
							<p class='text-sm text-red-700 dark:text-red-300'>{error}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Success alert -->
			{#if success}
				<div class='bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 p-4 rounded-md'>
					<div class='flex'>
						<div class='flex-shrink-0'>
							<!-- SVG Icon -->
							<svg class='h-5 w-5 text-green-400' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'
									 fill='currentColor' aria-hidden='true'>
								<path fill-rule='evenodd'
											d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
											clip-rule='evenodd' />
							</svg>
						</div>
						<div class='ml-3'>
							<p class='text-sm text-green-700 dark:text-green-300'>{success}</p>
						</div>
					</div>
				</div>
			{/if}

			<div class='-space-y-px'>
				<!-- Email Field -->
				<div class='mb-4'>
					<label for='email' class='block text-sm font-medium text-stone-700 dark:text-stone-300'>Email address</label>
					<input
						id='email'
						name='email'
						type='email'
						value={email}
						class='mt-1 block w-full px-3 py-2 border dark:border-gray-700 rounded-md sm:text-sm bg-white dark:bg-gray-700 text-stone-900 focus:ring-stone-500 dark:text-white'
						autocomplete='email'
					/>

				<!-- Password Field -->
					<div class='mb-4'>
						<div class='flex justify-between'>
							<label for='password' class='block text-sm font-medium text-stone-700 dark:text-stone-300'>Password</label>
						</div>
						<input
							id='password'
							name='password'
							type='password'
							class='mt-1 block w-full px-3 py-2 border dark:border-gray-700 rounded-md sm:text-sm bg-white dark:bg-gray-700 text-stone-900 focus:ring-stone-500 dark:text-white'
							autocomplete='current-password'
						/>
					</div>
			</div>

			<!-- Submit Button -->
			<div>
				<button
					type='submit'
					class='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800 disabled:opacity-50'
				>
            <span class='absolute left-0 inset-y-0 flex items-center pl-3'>
              <!-- Lock icon -->
              <svg class='h-5 w-5 text-stone-400 group-hover:text-stone-300' xmlns='http://www.w3.org/2000/svg'
									 viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
                <path fill-rule='evenodd'
											d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
											clip-rule='evenodd' />
              </svg>
            </span>
					Sign up
				</button>
			</div>
		</form>

		<!-- Additional Info Section -->
<!--		<div class='mt-6'>-->
<!--			<div class='relative'>-->
<!--				<div class='absolute inset-0 flex items-center'>-->
<!--					<div class='w-full border-t border-gray-300 dark:border-gray-700'></div>-->
<!--				</div>-->
<!--				<div class='relative flex justify-center text-sm'>-->
<!--          <span class='px-2 bg-white dark:bg-gray-800 text-stone-600 dark:text-stone-400'>-->
<!--            Or continue with-->
<!--          </span>-->
<!--				</div>-->
<!--			</div>-->

<!--			<div class='mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2'>-->
<!--				&lt;!&ndash; Social Sign-up Buttons &ndash;&gt;-->
<!--				<button type='button'-->
<!--								class='w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-gray-50 dark:hover:bg-gray-600'>-->
<!--					<svg class='w-5 h-5 mr-2' fill='currentColor' viewBox='0 0 20 20' aria-hidden='true'>-->
<!--						<path fill-rule='evenodd'-->
<!--									d='M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z'-->
<!--									clip-rule='evenodd' />-->
<!--					</svg>-->
<!--					<span>GitHub</span>-->
<!--				</button>-->
<!--				<button type='button'-->
<!--								class='w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-gray-50 dark:hover:bg-gray-600'>-->
<!--					<svg class='w-5 h-5 mr-2' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>-->
<!--						<path-->
<!--							d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'-->
<!--							fill='#4285F4' />-->
<!--						<path-->
<!--							d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'-->
<!--							fill='#34A853' />-->
<!--						<path-->
<!--							d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'-->
<!--							fill='#FBBC05' />-->
<!--						<path-->
<!--							d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'-->
<!--							fill='#EA4335' />-->
<!--					</svg>-->
<!--					<span>Google</span>-->
<!--				</button>-->
<!--			</div>-->
<!--		</div>-->

		<!-- Terms of Service -->
		<div class='text-center text-xs text-stone-500 dark:text-stone-400 mt-4'>
			By signing up, you agree to our
			<a href='/terms' class='text-stone-600 hover:text-stone-500 dark:text-stone-400 dark:hover:text-stone-300'>Terms
				of Service</a>
			and
			<a href='/privacy' class='text-stone-600 hover:text-stone-500 dark:text-stone-400 dark:hover:text-stone-300'>Privacy
				Policy</a>
		</div>
	</div>
</div>