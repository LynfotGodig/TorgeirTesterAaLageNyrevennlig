<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';

	type Food = { id: number; name: string; sodium: number; potassium: number; phosphorus: number };
	type Ingredient = { food_id: number; food_name: string; amount: number; unit: string };
	type Recipe = { id: string; title: string; description: string; image_url: string; category: string; difficulty: string; servings: number; prep_time: number; cook_time: number; instructions: string };

	const categories = ['Frokost', 'Lunsj', 'Middag', 'Dessert', 'Snacks', 'Suppe', 'Salat', 'Baking'];
	const difficulties = ['Enkel', 'Middels', 'Krevende'];

	// View state
	let view: 'list' | 'form' = $state('list');
	let editingId: string | null = $state(null);

	// Recipes list
	let recipes: Recipe[] = $state([]);

	// Foods for ingredient search
	let foods: Food[] = $state([]);
	let foodSearch = $state('');
	let filteredFoods = $derived(
		foodSearch.length > 1
			? foods.filter((f) => f.name.toLowerCase().includes(foodSearch.toLowerCase())).slice(0, 10)
			: []
	);

	// Form fields
	let title = $state('');
	let description = $state('');
	let instructions = $state('');
	let servings = $state(4);
	let prepTime = $state<number | null>(null);
	let cookTime = $state<number | null>(null);
	let difficulty = $state('Enkel');
	let category = $state('Middag');
	let imageUrl = $state('');
	let ingredients: Ingredient[] = $state([]);
	let saving = $state(false);
	let saved = $state(false);

	// Ingredient form
	let selectedFood: Food | null = $state(null);
	let ingredientAmount = $state(100);
	let ingredientUnit = $state('g');

	onMount(async () => {
		const [{ data: f }, { data: r }] = await Promise.all([
			supabase.from('foods').select('id, name, sodium, potassium, phosphorus').order('name'),
			supabase.from('recipes').select('*').order('created_at', { ascending: false })
		]);
		foods = f ?? [];
		recipes = r ?? [];
	});

	async function startEdit(recipe: Recipe) {
		editingId = recipe.id;
		title = recipe.title;
		description = recipe.description ?? '';
		instructions = recipe.instructions ?? '';
		servings = recipe.servings ?? 4;
		prepTime = recipe.prep_time ?? null;
		cookTime = recipe.cook_time ?? null;
		difficulty = recipe.difficulty ?? 'Enkel';
		category = recipe.category ?? 'Middag';
		imageUrl = recipe.image_url ?? '';

		// Load existing ingredients
		const { data } = await supabase
			.from('recipe_ingredients')
			.select('food_id, food_name, amount, unit')
			.eq('recipe_id', recipe.id);
		ingredients = data ?? [];
		view = 'form';
	}

	function startNew() {
		editingId = null;
		title = ''; description = ''; instructions = ''; imageUrl = '';
		servings = 4; prepTime = null; cookTime = null;
		difficulty = 'Enkel'; category = 'Middag';
		ingredients = [];
		view = 'form';
	}

	async function deleteRecipe(id: string) {
		if (!confirm('Sikker på at du vil slette denne oppskriften?')) return;
		await supabase.from('recipes').delete().eq('id', id);
		recipes = recipes.filter(r => r.id !== id);
	}

	function selectFood(food: Food) {
		selectedFood = food;
		foodSearch = '';
	}

	function addIngredient() {
		if (!selectedFood) return;
		ingredients = [...ingredients, { food_id: selectedFood.id, food_name: selectedFood.name, amount: ingredientAmount, unit: ingredientUnit }];
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

		const fields = { title, description, instructions, servings, prep_time: prepTime, cook_time: cookTime, difficulty, category, image_url: imageUrl || null };

		if (editingId) {
			await supabase.from('recipes').update(fields).eq('id', editingId);
			await supabase.from('recipe_ingredients').delete().eq('recipe_id', editingId);
			if (ingredients.length > 0) {
				await supabase.from('recipe_ingredients').insert(ingredients.map(ing => ({ ...ing, recipe_id: editingId })));
			}
		} else {
			const { data: recipe, error } = await supabase.from('recipes').insert(fields).select().single();
			if (error || !recipe) { saving = false; return; }
			if (ingredients.length > 0) {
				await supabase.from('recipe_ingredients').insert(ingredients.map(ing => ({ ...ing, recipe_id: recipe.id })));
			}
		}

		// Refresh list
		const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
		recipes = data ?? [];

		saving = false;
		saved = true;
		setTimeout(() => { saved = false; view = 'list'; }, 1500);
	}
</script>

<div class="max-w-6xl mx-auto px-6 py-8">

	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-2xl font-bold text-gray-900">
			{view === 'list' ? 'Oppskrifter' : editingId ? 'Rediger oppskrift' : 'Legg til oppskrift'}
		</h1>
		{#if view === 'list'}
			<button onclick={startNew} class="bg-green-700 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-800 transition">
				+ Ny oppskrift
			</button>
		{:else}
			<button onclick={() => (view = 'list')} class="text-sm text-gray-500 hover:text-gray-700">← Tilbake til liste</button>
		{/if}
	</div>

	<!-- LIST VIEW -->
	{#if view === 'list'}
		{#if recipes.length === 0}
			<p class="text-gray-400 text-center py-16">Ingen oppskrifter ennå.</p>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each recipes as recipe}
					<div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
						{#if recipe.image_url}
							<img src={recipe.image_url} alt={recipe.title} class="w-full h-40 object-cover" />
						{:else}
							<div class="w-full h-40 bg-green-50 flex items-center justify-center text-4xl">🥗</div>
						{/if}
						<div class="p-4">
							<h2 class="font-semibold text-gray-800 mb-1">{recipe.title}</h2>
							<p class="text-xs text-gray-400 mb-4">{recipe.category} · {recipe.difficulty}</p>
							<div class="flex gap-2">
								<button onclick={() => startEdit(recipe)} class="flex-1 border border-green-700 text-green-700 py-1.5 rounded-lg text-sm hover:bg-green-50 transition">Rediger</button>
								<button onclick={() => deleteRecipe(recipe.id)} class="flex-1 border border-red-300 text-red-500 py-1.5 rounded-lg text-sm hover:bg-red-50 transition">Slett</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

	<!-- FORM VIEW -->
	{:else}
		<div class="grid md:grid-cols-2 gap-10">
			<!-- Left: recipe info -->
			<div class="space-y-5">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Tittel *</label>
					<input bind:value={title} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="F.eks. Kyllingsuppe" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
					<input bind:value={description} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Kort beskrivelse" />
				</div>

				<!-- Image -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Bilde (URL)</label>
					<input bind:value={imageUrl} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="https://..." />
					{#if imageUrl}
						<img src={imageUrl} alt="Forhåndsvisning" class="mt-2 w-full h-48 object-cover rounded-xl border border-gray-100" onerror="this.style.display='none'" />
					{:else}
						<div class="mt-2 w-full h-48 bg-green-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">Ingen bilde valgt</div>
					{/if}
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
						<select bind:value={category} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
							{#each categories as cat}<option>{cat}</option>{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Vanskelighet</label>
						<select bind:value={difficulty} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
							{#each difficulties as d}<option>{d}</option>{/each}
						</select>
					</div>
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Porsjoner</label>
						<input bind:value={servings} type="number" min="1" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Forb.tid (min)</label>
						<input bind:value={prepTime} type="number" min="0" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Koketid (min)</label>
						<input bind:value={cookTime} type="number" min="0" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Fremgangsmåte</label>
					<textarea bind:value={instructions} rows="8" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Steg for steg..."></textarea>
				</div>
			</div>

			<!-- Right: ingredients -->
			<div>
				<h2 class="text-lg font-semibold text-gray-800 mb-4">Ingredienser</h2>
				<div class="relative mb-4">
					<input
						bind:value={foodSearch}
						class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
						placeholder={foods.length > 0 ? `Søk blant ${foods.length} matvarer...` : 'Laster matvarer...'}
					/>
					{#if filteredFoods.length > 0}
						<ul class="absolute z-10 bg-white border border-gray-200 rounded-xl shadow-lg w-full mt-1 max-h-52 overflow-y-auto">
							{#each filteredFoods as food}
								<li>
									<button onclick={() => selectFood(food)} class="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50">{food.name}</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				{#if selectedFood}
					<div class="flex gap-2 mb-4 p-3 bg-green-50 rounded-xl">
						<span class="text-sm text-green-800 flex-1 self-center">{selectedFood.name}</span>
						<input bind:value={ingredientAmount} type="number" min="1" class="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
						<select bind:value={ingredientUnit} class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
							<option>g</option><option>ml</option><option>dl</option><option>stk</option><option>ts</option><option>ss</option>
						</select>
						<button onclick={addIngredient} class="bg-green-700 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap">+ Legg til</button>
					</div>
				{/if}

				{#if ingredients.length > 0}
					<ul class="divide-y border border-gray-100 rounded-xl overflow-hidden">
						{#each ingredients as ing, i}
							<li class="flex items-center justify-between px-4 py-3 text-sm bg-white">
								<span class="text-gray-700">{ing.food_name}</span>
								<div class="flex items-center gap-3">
									<span class="text-gray-400">{ing.amount} {ing.unit}</span>
									<button onclick={() => removeIngredient(i)} class="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200 rounded-xl">Ingen ingredienser lagt til ennå</p>
				{/if}
			</div>
		</div>

		<div class="mt-8 flex items-center gap-4">
			<button onclick={save} disabled={saving || !title} class="bg-green-700 text-white px-8 py-3 rounded-xl font-medium disabled:opacity-50 hover:bg-green-800 transition">
				{saving ? 'Lagrer...' : editingId ? 'Lagre endringer' : 'Lagre oppskrift'}
			</button>
			{#if saved}<span class="text-green-600 text-sm">✓ Lagret!</span>{/if}
		</div>
	{/if}
</div>
