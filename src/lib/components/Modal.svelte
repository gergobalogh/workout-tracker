<script>
	export let showModal = false;
	export let modalTitle = '';
	export let modalContent = '';
	export let editMode = false;
	export let exerciseNotes = '';
	export let saveExerciseNotes;
	export let closeModal;
	export let handleBackdropClick;
</script>

{#if showModal}
	<div class='modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4' on:click={handleBackdropClick}>
		<div class='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-auto'>
			<div class='p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
				<h3 class='text-xl font-bold text-stone-800 dark:text-white'>{modalTitle}</h3>
				<button on:click={closeModal} class='text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 focus:outline-none'>
					<svg class='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'></path>
					</svg>
				</button>
			</div>
			<div class='p-6'>
				{#if editMode}
					<textarea bind:value={exerciseNotes} class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-500 dark:focus:ring-stone-400 h-48" placeholder="Add your notes here..."></textarea>
				{:else}
					<p class='text-stone-700 dark:text-stone-300 whitespace-pre-line'>{modalContent}</p>
				{/if}
			</div>
			<div class='p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2'>
				{#if editMode}
					<button on:click={saveExerciseNotes} class='py-2 px-4 text-white bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800'>Save Notes</button>
				{/if}
				<button on:click={closeModal} class='py-2 px-4 text-white bg-stone-500 hover:bg-stone-600 dark:bg-stone-600 dark:hover:bg-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-offset-gray-800'>{editMode ? 'Cancel' : 'Close'}</button>
			</div>
		</div>
	</div>
{/if}
