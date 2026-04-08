<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header class="bg-white border-b border-gray-200 sticky top-0 z-50">
	<div class="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
		<a href="/" class="flex items-center gap-2 font-bold text-lg text-green-800">
			<span class="bg-green-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">N</span>
			Nyrevennlig
		</a>
		<nav class="hidden md:flex items-center gap-6 text-sm text-gray-600">
			<a href="/" class="hover:text-green-700">Oppskrifter</a>
			<a href="/matvarer" class="hover:text-green-700">Matvarer</a>
			<a href="/admin" class="hover:text-green-700">Admin</a>
		</nav>
	</div>
</header>

{@render children()}
