<script lang='ts'>
    export let form;

    $: formData = form?.data ?? {};
    $: email = formData?.email ?? '';
    $: rememberMe = formData?.rememberMe ?? false;

    $: error = form?.error ?? '';
    $: success = form?.success ?? '';
    $: errors = form?.errors ?? {};
</script>

<svelte:head>
    <title>Login | Workout Tracker</title>
</svelte:head>

<div class='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
    <div class='max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'>
        <div class='text-center'>
            <h1 class='mt-6 text-3xl font-extrabold text-stone-950 dark:text-white'>Sign in to your account</h1>
        </div>

        {#if error}
            <div class='bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 mt-4'>
                <p class='text-sm text-red-700 dark:text-red-300'>{error}</p>
            </div>
        {/if}

        {#if success}
            <div class='bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 p-4 mt-4'>
                <p class='text-sm text-green-700 dark:text-green-300'>{success}</p>
            </div>
        {/if}

        <form method='POST' class='mt-8 space-y-6'>
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
                {#if errors?.email}
                    <p class='mt-1 text-xs text-red-600 dark:text-red-400'>{errors.email}</p>
                {/if}
            </div>

            <div class='mb-4'>
                <div class='flex justify-between'>
                    <label for='password' class='block text-sm font-medium text-stone-700 dark:text-stone-300'>Password</label>
                    <a href='/forgot-password' class='text-sm text-stone-600 hover:text-stone-500 dark:text-stone-400 dark:hover:text-stone-300'>Forgot your password?</a>
                </div>
                <input
                  id='password'
                  name='password'
                  type='password'
                  class='mt-1 block w-full px-3 py-2 border dark:border-gray-700 rounded-md sm:text-sm bg-white dark:bg-gray-700 text-stone-900 focus:ring-stone-500 dark:text-white'
                  autocomplete='current-password'
                />
                {#if errors?.password}
                    <p class='mt-1 text-xs text-red-600 dark:text-red-400'>{errors.password}</p>
                {/if}
            </div>

            <div class='flex items-center'>
                <input
                  id='remember-me'
                  name='remember-me'
                  type='checkbox'
                  checked={rememberMe}
                  class='h-4 w-4 text-stone-600 dark:text-stone-500 border-gray-300 dark:border-gray-600 rounded focus:ring-stone-500 dark:focus:ring-stone-400 dark:bg-gray-700'
                />
                <label for='remember-me' class='ml-2 text-sm text-stone-600 dark:text-stone-400'>Remember me</label>
            </div>

            <button
              type='submit'
              class='w-full py-2 px-4 text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800'
            >
                Sign in
            </button>
        </form>

        <p class='text-center text-sm text-gray-600 dark:text-gray-400 mt-4'>
            Don't have an account? <a href='/auth/register' class='text-stone-600 hover:text-stone-500 dark:text-stone-400 dark:hover:text-stone-300'>Sign up</a>
        </p>
    </div>
</div>