<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';

	type Food = { id: number; name: string; sodium: number; potassium: number; phosphorus: number };
	type Ingredient = { food_id: number; food_name: string; amount: number; unit: string };

	let foods: Food[] = $state([]);
	let foodSearch = $state('');
	let filteredFoods = $derived(
		foodSearch.length > 1
			? foods.filter((f) => f.name.toLowerCase().includes(foodSearch.toLowerCase())).slice(0, 10)
			: []
	);

	let title = $state('');
	let description = $state('');
	let instructions = $state('');
	let servings = $state(4);
	let ingredients: Ingredient[] = $state([]);
	let saving = $state(false);
	let saved = $state(false);

	let selectedFood: Food | null = $state(null);
	let ingredientAmount = $state(100);
	let ingredientUnit = $state('g');

	onMount(async () => {
		const { data } = await supabase.from('foods').select('id, name, sodium, potassium, phosphorus').order('name');
		foods = data ?? [];
	});

	function selectFood(food: Food) {
		selectedFood = food;
		foodSearch = food.name;
		filteredFoods;
	}

	function addIngredient() {
		if (!selectedFood) return;
		ingredients = [
			...ingredients,
			{ food_id: selectedFood.id, food_name: selectedFood.name, amount: ingredientAmount, unit: ingredientUnit }
		];
		selectedFood = null;
		foodSearch = '';
		ingredientAmount = 100;
	}

	function removeIngredient(index: number) {
		ingredients = ingredients.filter((_, i) => i !== index);
	}

	async function save() {
		if (!title) return;
		saving = true;

		const { data: recipe, error } = await supabase
			.from('recipes')
			.insert({ title, description, instructions, servings })
			.select()
			.single();

		if (error || !recipe) { saving = false; return; }

		if (ingredients.length > 0) {
			await supabase.from('recipe_ingredients').insert(
				ingredients.map((ing) => ({ ...ing, recipe_id: recipe.id }))
			);
		}

		saving = false;
		saved = true;
		title = ''; description = ''; instructions = ''; servings = 4; ingredients = [];
		setTimeout(() => (saved = false), 3000);
	}
</script>

<h1 class="text-2xl font-bold text-green-800 mb-6">Legg til oppskrift</h1>

<div class="grid md:grid-cols-2 gap-8">
	<!-- Left: recipe info -->
	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">Tittel *</label>
			<input bind:value={title} class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="F.eks. Kyllingsuppe" />
		</div>
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
			<input bind:value={description} class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Kort beskrivelse" />
		</div>
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">Porsjoner</label>
			<input bind:value={servings} type="number" min="1" class="w-24 border rounded-lg px-3 py-2 text-sm" />
		</div>
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">Fremgangsmåte</label>
			<textarea bind:value={instructions} rows="6" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Steg for steg..."></textarea>
		</div>
	</div>

	<!-- Right: ingredients -->
	<div>
		<h2 class="text-lg font-semibold text-gray-800 mb-3">Ingredienser</h2>

		<!-- Search -->
		<div class="relative mb-3">
			<input
				bind:value={foodSearch}
				class="w-full border rounded-lg px-3 py-2 text-sm"
				placeholder="Søk etter matvare..."
			/>
			{#if filteredFoods.length > 0}
				<ul class="absolute z-10 bg-white border rounded-lg shadow w-full mt-1 max-h-48 overflow-y-auto">
					{#each filteredFoods as food}
						<li>
							<button
								onclick={() => selectFood(food)}
								class="w-full text-left px-3 py-2 text-sm hover:bg-green-50"
							>{food.name}</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		{#if selectedFood}
			<div class="flex gap-2 mb-3">
				<input bind:value={ingredientAmount} type="number" min="1" class="w-24 border rounded-lg px-3 py-2 text-sm" />
				<select bind:value={ingredientUnit} class="border rounded-lg px-3 py-2 text-sm">
					<option>g</option>
					<option>ml</option>
					<option>dl</option>
					<option>stk</option>
					<option>ts</option>
					<option>ss</option>
				</select>
				<button onclick={addIngredient} class="bg-green-700 text-white px-4 py-2 rounded-lg text-sm">Legg til</button>
			</div>
		{/if}

		{#if ingredients.length > 0}
			<ul class="divide-y border rounded-xl overflow-hidden">
				{#each ingredients as ing, i}
					<li class="flex justify-between items-center px-3 py-2 text-sm bg-white">
						<span>{ing.food_name}</span>
						<span class="text-gray-500 mr-3">{ing.amount} {ing.unit}</span>
						<button onclick={() => removeIngredient(i)} class="text-red-400 hover:text-red-600">×</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<div class="mt-6">
	<button
		onclick={save}
		disabled={saving || !title}
		class="bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
	>
		{saving ? 'Lagrer...' : 'Lagre oppskrift'}
	</button>
	{#if saved}
		<span class="ml-3 text-green-600 text-sm">✓ Oppskrift lagret!</span>
	{/if}
</div>
