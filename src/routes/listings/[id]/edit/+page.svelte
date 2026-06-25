<script lang="ts">
	import { enhance } from '$app/forms';
	import ListingFields from '$lib/components/ListingFields.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const errors = $derived((form?.errors ?? {}) as Record<string, string[] | undefined>);
	const values = $derived(
		(form?.values ?? data.values) as Record<string, string>
	);
	const isDraft = $derived(data.status === 'DRAFT');
</script>

<svelte:head>
	<title>Edit listing · Rentra</title>
</svelte:head>

<section class="shell">
	<header>
		<p class="eyebrow">Property manager · {data.status}</p>
		<h1>Edit listing</h1>
	</header>

	{#if errors._form}
		<p class="form-error">{errors._form[0]}</p>
	{/if}

	<form method="POST" use:enhance>
		<ListingFields {values} {errors} />

		<div class="form-actions">
			{#if isDraft}
				<button type="submit" formaction="?/publish">Publish listing</button>
				<button type="submit" class="secondary" formaction="?/saveDraft">Save changes</button>
				<button
					type="submit"
					class="cancel"
					formaction="?/cancel"
					onclick={(e) => {
						if (!confirm('Delete this draft? Your changes will not be saved.')) e.preventDefault();
					}}
				>
					Cancel
				</button>
			{:else}
				<button type="submit" formaction="?/saveDraft">Save changes</button>
				<a href="/listings/{data.listingId}" class="cancel">Cancel</a>
			{/if}
		</div>
	</form>
</section>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		background: #fafafa;
		color: #111;
	}

	.shell {
		max-width: 44rem;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
	}

	.eyebrow {
		margin: 0 0 0.25rem;
		color: #666;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0 0 1.5rem;
		font-size: 1.5rem;
	}

	.form-error {
		padding: 0.75rem 1rem;
		border: 1px solid #f0c0bb;
		background: #fdecea;
		color: #c0392b;
		border-radius: 0.375rem;
		font-size: 0.85rem;
	}

	.form-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	button {
		padding: 0.65rem 1.4rem;
		border: none;
		border-radius: 0.5rem;
		background: #111;
		color: #fff;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
	}

	button:hover {
		background: #333;
	}

	button.secondary {
		background: #fff;
		color: #111;
		border: 1px solid #d4d4d4;
	}

	button.secondary:hover {
		background: #f3f3f3;
	}

	button.cancel,
	a.cancel {
		margin-left: auto;
		padding: 0.65rem 1.4rem;
		border-radius: 0.5rem;
		border: 1px solid #f0c0bb;
		background: #fff;
		color: #c0392b;
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}

	button.cancel:hover,
	a.cancel:hover {
		background: #fdecea;
	}
</style>
