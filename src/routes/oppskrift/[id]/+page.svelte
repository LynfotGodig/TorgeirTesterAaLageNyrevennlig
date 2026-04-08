<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { page } from '$app/stores';

	type Ingredient = {
		id: string;
		food_name: string;
		amount: number;
		unit: string;
		food_id: number;
		foods: {
			sodium: number;
			potassium: number;
			phosphorus: number;
			energy_kcal: number;
			protein: number;
		} | null;
	};

	type Recipe = {
		id: string;
		title: string;
		description: string;
		instructions: string;
		image_url: string;
		servings: number;
	};

	let recipe: Recipe | null = $state(null);
	let ingredients: Ingredient[] = $state([]);
	let loading = $state(true);

	onMount(async () => {
		const id = $page.params.id;

		const { data: r } = await supabase.from('recipes').select('*').eq('id', id).single();
		recipe = r;

		const { data: ing } = await supabase
			.from('recipe_ingredients')
			.select('*, foods(sodium, potassium, phosphorus, energy_kcal, protein)')
			.eq('recipe_id', id);
		ingredients = ing ?? [];
		loading = false;
	});

	function total(nutrient: keyof NonNullable<Ingredient['foods']>) {
		return ingredients.reduce((sum, ing) => {
			const val = ing.foods?.[nutrient] ?? 0;
			return sum + (val * ing.amount) / 100;
		}, 0).toFixed(1);
	}
</script>

{#if loading}
	<p class="text-gray-400">Laster...</p>
{:else if !recipe}
	<p>Oppskrift ikke funnet.</p>
{:else}
	<a href="/" class="text-green-700 text-sm hover:underline mb-4 inline-block">← Tilbake</a>

	<div class="grid md:grid-cols-2 gap-8">
		<div>
			{#if recipe.image_url}
				<img src={recipe.image_url} alt={recipe.title} class="w-full rounded-xl object-cover max-h-80" />
			{:else}
				<div class="w-full h-64 bg-green-50 rounded-xl flex items-center justify-center text-6xl">🥗</div>
			{/if}
		</div>

		<div>
			<h1 class="text-3xl font-bold text-green-800 mb-2">{recipe.title}</h1>
			{#if recipe.description}
				<p class="text-gray-600 mb-4">{recipe.description}</p>
			{/if}
			<p class="text-sm text-gray-400 mb-6">{recipe.servings} porsjoner</p>

			<!-- Nutrition summary -->
			<div class="bg-green-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center mb-6">
				<div>
					<p class="text-2xl font-bold text-orange-500">{total('sodium')}</p>
					<p class="text-xs text-gray-500">mg Natrium</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-purple-500">{total('potassium')}</p>
					<p class="text-xs text-gray-500">mg Kalium</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-blue-500">{total('phosphorus')}</p>
					<p class="text-xs text-gray-500">mg Fosfor</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Ingredients -->
	{#if ingredients.length > 0}
		<div class="mt-8">
			<h2 class="text-xl font-semibold text-gray-800 mb-3">Ingredienser</h2>
			<ul class="divide-y border rounded-xl overflow-hidden">
				{#each ingredients as ing}
					<li class="flex justify-between items-center px-4 py-3 bg-white text-sm">
						<span>{ing.food_name}</span>
						<span class="text-gray-500">{ing.amount} {ing.unit}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Instructions -->
	{#if recipe.instructions}
		<div class="mt-8">
			<h2 class="text-xl font-semibold text-gray-800 mb-3">Fremgangsmåte</h2>
			<div class="prose prose-green max-w-none text-gray-700 whitespace-pre-line">
				{recipe.instructions}
			</div>
		</div>
	{/if}
{/if}
