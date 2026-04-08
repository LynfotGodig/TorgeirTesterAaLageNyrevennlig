<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<nav class="bg-green-700 text-white px-6 py-4 flex items-center justify-between">
	<a href="/" class="text-xl font-bold">🥗 Nyrevennlig Mat</a>
	<div class="flex gap-4 text-sm">
		<a href="/" class="hover:underline">Oppskrifter</a>
		<a href="/admin" class="hover:underline">Admin</a>
	</div>
</nav>

<main class="max-w-5xl mx-auto px-4 py-8">
	{@render children()}
</main>
