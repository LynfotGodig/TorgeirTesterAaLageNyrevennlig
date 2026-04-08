<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';

	type Recipe = {
		id: string;
		title: string;
		description: string;
		image_url: string;
		servings: number;
		prep_time: number;
		cook_time: number;
		difficulty: string;
		category: string;
	};

	const categories = ['Alle', 'Frokost', 'Lunsj', 'Middag', 'Dessert', 'Snacks', 'Suppe', 'Salat', 'Baking'];

	let recipes: Recipe[] = $state([]);
	let loading = $state(true);
	let activeCategory = $state('Alle');

	let filtered = $derived(
		activeCategory === 'Alle' ? recipes : recipes.filter(r => r.category === activeCategory)
	);

	onMount(async () => {
		const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
		recipes = data ?? [];
		loading = false;
	});
</script>

<!-- Hero -->
<div class="bg-gradient-to-b from-green-50 to-white py-14 px-6 text-center">
	<h1 class="text-4xl font-bold text-green-900 mb-3">God mat for belastede nyrer</h1>
	<p class="text-gray-500 max-w-xl mx-auto">Oppskrifter tilpasset nyretransplanterte — med full oversikt over natrium, kalium og fosfor</p>
</div>

<div class="max-w-6xl mx-auto px-6 pb-16">
	<!-- Category filters -->
	<div class="flex flex-wrap gap-2 mb-8">
		{#each categories as cat}
			<button
				onclick={() => (activeCategory = cat)}
				class="px-4 py-1.5 rounded-full text-sm border transition {activeCategory === cat
					? 'bg-green-700 text-white border-green-700'
					: 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}"
			>{cat}</button>
		{/each}
	</div>

	<!-- Recipe grid -->
	{#if loading}
		<p class="text-gray-400">Laster oppskrifter...</p>
	{:else if filtered.length === 0}
		<p class="text-gray-500">Ingen oppskrifter. <a href="/admin" class="text-green-700 underline">Legg til den første!</a></p>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
			{#each filtered as recipe}
				<a href="/oppskrift/{recipe.id}" class="group bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden flex flex-col">
					{#if recipe.image_url}
						<img src={recipe.image_url} alt={recipe.title} class="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
					{:else}
						<div class="w-full h-44 bg-green-50 flex items-center justify-center text-4xl">🥗</div>
					{/if}
					<div class="p-4 flex flex-col flex-1">
						<h2 class="font-semibold text-gray-800 mb-1">{recipe.title}</h2>
						{#if recipe.description}
							<p class="text-xs text-gray-500 line-clamp-2 mb-3">{recipe.description}</p>
						{/if}
						<div class="mt-auto flex items-center gap-3 text-xs text-gray-400">
							{#if recipe.prep_time || recipe.cook_time}
								<span>⏱ {(recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)} min</span>
							{/if}
							<span>👤 {recipe.servings} pors.</span>
							{#if recipe.difficulty}
								<span class="ml-auto bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{recipe.difficulty}</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<!-- Footer -->
<footer class="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
	<p>Dette er et hobbyprosjekt og gir ikke medisinsk rådgivning.</p>
	<p class="mt-1">Næringsdata fra <a href="https://www.matvaretabellen.no" class="underline">Matvaretabellen</a> (Mattilsynet)</p>
</footer>
