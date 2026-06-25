<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const listing = $derived(data.listing);
	const isDraft = $derived(listing.status === 'DRAFT');

	const money = (n: number | null | undefined) =>
		n == null ? '—' : `$${n.toLocaleString()}`;
</script>

<svelte:head>
	<title>{listing.title} · Rentra</title>
</svelte:head>

<section class="shell">
	{#if isDraft}
		<div class="draft-banner">
			<div>
				<strong>This listing is a draft.</strong>
				<span>It's saved but hidden from renters until you publish it.</span>
			</div>
			<form method="POST" action="?/publish" use:enhance>
				<button type="submit">Publish now</button>
			</form>
		</div>
	{/if}

	<p class="eyebrow">{listing.status}</p>
	<h1>{listing.title}</h1>

	{#if listing.address && listing.city}
		<p class="addr">
			{listing.address}{listing.apartmentUnit ? `, ${listing.apartmentUnit}` : ''} · {listing.city}{listing.zip
				? `, ${listing.zip}`
				: ''}
		</p>
	{/if}

	{#if listing.photos.length}
		<div class="photos">
			{#each listing.photos as photo}
				<img src={photo.imageUrl} alt={listing.title} />
			{/each}
		</div>
	{/if}

	<dl>
		<div><dt>Rent</dt><dd>{money(listing.monthlyRent)}/mo</dd></div>
		<div><dt>Deposit</dt><dd>{money(listing.deposit)}</dd></div>
		<div><dt>Lease</dt><dd>{listing.leaseType ?? '—'}</dd></div>
		<div><dt>Rooms</dt><dd>{listing.numberOfRooms ?? '—'}</dd></div>
		<div><dt>Room type</dt><dd>{listing.roomType ?? '—'}</dd></div>
		<div><dt>Max occupants</dt><dd>{listing.maxOccupants ?? '—'}</dd></div>
	</dl>

	<div class="actions">
		<a href="/listings/{listing.id}/edit">Edit</a>
		<a href="/listings/new">+ Add another listing</a>
		<form method="POST" action="?/delete" use:enhance>
			<button type="submit" class="danger">Delete</button>
		</form>
	</div>
</section>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		color: #111;
	}

	.shell {
		max-width: 44rem;
		margin: 0 auto;
		padding: 2.5rem 1.5rem;
	}

	.eyebrow {
		margin: 0;
		color: #2563eb;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.06em;
	}

	h1 {
		margin: 0.25rem 0 0.25rem;
	}

	.addr {
		margin: 0 0 1.5rem;
		color: #666;
	}

	.photos {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.photos img {
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		border-radius: 0.375rem;
	}

	dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: 1rem;
		margin: 0 0 2rem;
	}

	dt {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #888;
	}

	dd {
		margin: 0.15rem 0 0;
		font-size: 1.05rem;
		font-weight: 600;
	}

	.draft-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		border: 1px solid #fde68a;
		background: #fffbeb;
		border-radius: 0.5rem;
	}

	.draft-banner strong {
		display: block;
		font-size: 0.9rem;
	}

	.draft-banner span {
		font-size: 0.8rem;
		color: #92723a;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
		margin-top: 1rem;
	}

	a {
		color: #2563eb;
		font-weight: 600;
		text-decoration: none;
	}

	button {
		padding: 0.5rem 1.1rem;
		border: none;
		border-radius: 0.45rem;
		background: #111;
		color: #fff;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}

	button:hover {
		background: #333;
	}

	button.danger {
		background: #fff;
		color: #c0392b;
		border: 1px solid #f0c0bb;
	}

	button.danger:hover {
		background: #fdecea;
	}
</style>
