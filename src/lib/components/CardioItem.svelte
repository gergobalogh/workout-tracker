<script>
	export let cardio;
	export let toggleCardioCompleted;
</script>

<div class='mb-6'>
	<h2 class='text-xl font-bold text-stone-800 dark:text-stone-200 mb-2'>Cardio</h2>
	<div class={`bg-stone-100 dark:bg-gray-700 p-4 rounded-md ${cardio.completed ? 'border-l-4 border-green-500' : ''}`}>
		<div class="flex items-center mb-2">
			<input type="checkbox" id="cardio-completed" class="h-5 w-5 text-green-500 rounded border-gray-300 focus:ring-green-400" checked={cardio.completed || false} on:change={toggleCardioCompleted} />
			<h3 class={`font-semibold text-stone-800 dark:text-stone-200 ml-2 ${cardio.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{cardio.type}</h3>
		</div>
		<div class='mt-2 flex flex-wrap -mx-1'>
			<div class='w-1/2 px-1 mb-2'>
				<div class='bg-white dark:bg-gray-600 p-2 rounded h-full'>
					<span class='font-medium text-stone-600 dark:text-stone-300'>Distance:</span>
					<span class='text-stone-800 dark:text-white ml-1'>{cardio.distance} km</span>
				</div>
			</div>
			<div class='w-1/2 px-1 mb-2'>
				<div class='bg-white dark:bg-gray-600 p-2 rounded h-full'>
					<span class='font-medium text-stone-600 dark:text-stone-300'>Duration:</span>
					<span class='text-stone-800 dark:text-white ml-1'>{cardio.duration}</span>
				</div>
			</div>
		</div>
		{#if cardio.description}
			<div class='bg-white dark:bg-gray-600 p-2 rounded mt-2'>
				<span class='font-medium text-stone-600 dark:text-stone-300'>Instructions:</span>
				<p class='text-stone-700 dark:text-stone-300 text-sm mt-1'>{cardio.description}</p>
			</div>
		{/if}
	</div>
</div>
