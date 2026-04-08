<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';

	type Recipe = {
		id: string;
		title: string;
		description: string;
		image_url: string;
		servings: number;
	};

	let recipes: Recipe[] = $state([]);
	let loading = $state(true);

	onMount(async () => {
		const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
		recipes = data ?? [];
		loading = false;
	});
</script>

<h1 class="text-3xl font-bold text-green-800 mb-2">Nyrevennlige oppskrifter</h1>
<p class="text-gray-500 mb-8">Tilpasset nyretransplanterte – med full oversikt over natrium, kalium og fosfor.</p>

{#if loading}
	<p class="text-gray-400">Laster oppskrifter...</p>
{:else if recipes.length === 0}
	<p class="text-gray-500">Ingen oppskrifter lagt til ennå. <a href="/admin" class="text-green-700 underline">Legg til den første!</a></p>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each recipes as recipe}
			<a href="/oppskrift/{recipe.id}" class="block bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden border border-gray-100">
				{#if recipe.image_url}
					<img src={recipe.image_url} alt={recipe.title} class="w-full h-48 object-cover" />
				{:else}
					<div class="w-full h-48 bg-green-50 flex items-center justify-center text-4xl">🥗</div>
				{/if}
				<div class="p-4">
					<h2 class="font-semibold text-lg text-gray-800">{recipe.title}</h2>
					{#if recipe.description}
						<p class="text-sm text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
					{/if}
					<p class="text-xs text-gray-400 mt-2">{recipe.servings} porsjoner</p>
				</div>
			</a>
		{/each}
	</div>
{/if}
