<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { page } from '$app/stores';

	type Ingredient = {
		id: string;
		food_name: string;
		amount: number;
		unit: string;
		foods: {
			sodium: number;
			potassium: number;
			phosphorus: number;
			energy_kcal: number;
			protein: number;
			fat: number;
			carbohydrates: number;
		} | null;
	};

	type Recipe = {
		id: string;
		title: string;
		description: string;
		instructions: string;
		image_url: string;
		servings: number;
		prep_time: number;
		cook_time: number;
		difficulty: string;
		category: string;
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
			.select('*, foods(sodium, potassium, phosphorus, energy_kcal, protein, fat, carbohydrates)')
			.eq('recipe_id', id);
		ingredients = ing ?? [];
		loading = false;
	});

	function total(nutrient: keyof NonNullable<Ingredient['foods']>) {
		return ingredients.reduce((sum, ing) => {
			const val = ing.foods?.[nutrient] ?? 0;
			return sum + (val * ing.amount) / 100;
		}, 0);
	}

	function level(value: number, low: number, high: number) {
		if (value <= low) return { label: 'Lavt', color: 'text-green-600 bg-green-50' };
		if (value <= high) return { label: 'Moderat', color: 'text-yellow-600 bg-yellow-50' };
		return { label: 'Høyt', color: 'text-red-600 bg-red-50' };
	}
</script>

{#if loading}
	<div class="flex items-center justify-center h-64 text-gray-400">Laster...</div>
{:else if !recipe}
	<div class="max-w-6xl mx-auto px-6 py-16 text-center text-gray-500">Oppskrift ikke funnet.</div>
{:else}
	<!-- Hero image -->
	{#if recipe.image_url}
		<div class="w-full h-72 md:h-96 overflow-hidden">
			<img src={recipe.image_url} alt={recipe.title} class="w-full h-full object-cover" />
		</div>
	{/if}

	<div class="max-w-4xl mx-auto px-6 py-8">
		<a href="/" class="text-sm text-green-700 hover:underline mb-4 inline-block">← Alle oppskrifter</a>

		<div class="grid md:grid-cols-3 gap-8">
			<!-- Main content -->
			<div class="md:col-span-2">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
				{#if recipe.description}
					<p class="text-gray-500 mb-6">{recipe.description}</p>
				{/if}

				<!-- Meta -->
				<div class="flex flex-wrap gap-4 text-sm text-gray-500 mb-8 pb-8 border-b">
					{#if recipe.prep_time}
						<div><span class="font-medium text-gray-700">Forberedelse</span><br>{recipe.prep_time} min</div>
					{/if}
					{#if recipe.cook_time}
						<div><span class="font-medium text-gray-700">Koketid</span><br>{recipe.cook_time} min</div>
					{/if}
					{#if recipe.prep_time || recipe.cook_time}
						<div><span class="font-medium text-gray-700">Totalt</span><br>{(recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)} min</div>
					{/if}
					<div><span class="font-medium text-gray-700">Porsjoner</span><br>{recipe.servings}</div>
					{#if recipe.difficulty}
						<div><span class="font-medium text-gray-700">Vanskelighet</span><br>
							<span class="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs">{recipe.difficulty}</span>
						</div>
					{/if}
				</div>

				<!-- Ingredients -->
				{#if ingredients.length > 0}
					<h2 class="text-xl font-semibold text-gray-800 mb-4">Ingredienser</h2>
					<ul class="space-y-2 mb-8">
						{#each ingredients as ing}
							<li class="flex justify-between text-sm py-2 border-b border-gray-50">
								<span class="text-gray-700">{ing.food_name}</span>
								<span class="text-gray-400">{ing.amount} {ing.unit}</span>
							</li>
						{/each}
					</ul>
				{/if}

				<!-- Instructions -->
				{#if recipe.instructions}
					<h2 class="text-xl font-semibold text-gray-800 mb-4">Fremgangsmåte</h2>
					<div class="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{recipe.instructions}</div>
				{/if}
			</div>

			<!-- Nutrition sidebar -->
			<div class="md:col-span-1">
				<div class="bg-gray-50 rounded-2xl p-5 sticky top-24">
					<h2 class="font-semibold text-gray-800 mb-4">Næringsverdier <span class="text-xs font-normal text-gray-400">per porsjon</span></h2>

					{@const sodium = total('sodium') / recipe.servings}
					{@const potassium = total('potassium') / recipe.servings}
					{@const phosphorus = total('phosphorus') / recipe.servings}
					{@const energy = total('energy_kcal') / recipe.servings}
					{@const protein = total('protein') / recipe.servings}
					{@const fat = total('fat') / recipe.servings}
					{@const carbs = total('carbohydrates') / recipe.servings}

					<!-- Key kidney nutrients -->
					<div class="space-y-3 mb-4">
						{@const naLevel = level(sodium, 200, 400)}
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-700">Natrium</p>
								<p class="text-lg font-bold text-gray-900">{sodium.toFixed(0)} <span class="text-xs font-normal text-gray-400">mg</span></p>
							</div>
							<span class="text-xs px-2 py-1 rounded-full {naLevel.color}">{naLevel.label}</span>
						</div>
						{@const kLevel = level(potassium, 400, 800)}
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-700">Kalium</p>
								<p class="text-lg font-bold text-gray-900">{potassium.toFixed(0)} <span class="text-xs font-normal text-gray-400">mg</span></p>
							</div>
							<span class="text-xs px-2 py-1 rounded-full {kLevel.color}">{kLevel.label}</span>
						</div>
						{@const pLevel = level(phosphorus, 200, 400)}
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-700">Fosfor</p>
								<p class="text-lg font-bold text-gray-900">{phosphorus.toFixed(0)} <span class="text-xs font-normal text-gray-400">mg</span></p>
							</div>
							<span class="text-xs px-2 py-1 rounded-full {pLevel.color}">{pLevel.label}</span>
						</div>
					</div>

					<div class="border-t border-gray-200 pt-4 space-y-2 text-sm">
						<div class="flex justify-between text-gray-600">
							<span>Kalorier</span><span class="font-medium">{energy.toFixed(0)} kcal</span>
						</div>
						<div class="flex justify-between text-gray-600">
							<span>Protein</span><span class="font-medium">{protein.toFixed(1)} g</span>
						</div>
						<div class="flex justify-between text-gray-600">
							<span>Fett</span><span class="font-medium">{fat.toFixed(1)} g</span>
						</div>
						<div class="flex justify-between text-gray-600">
							<span>Karbohydrater</span><span class="font-medium">{carbs.toFixed(1)} g</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<footer class="border-t border-gray-100 py-8 text-center text-xs text-gray-400 mt-8">
		<p>Dette er et hobbyprosjekt og gir ikke medisinsk rådgivning.</p>
		<p class="mt-1">Næringsdata fra <a href="https://www.matvaretabellen.no" class="underline">Matvaretabellen</a> (Mattilsynet)</p>
	</footer>
{/if}
