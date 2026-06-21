<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const listing = $derived(data.listing);

	const money = (n: number | null | undefined) =>
		n == null ? '—' : `$${n.toLocaleString()}`;
</script>

<svelte:head>
	<title>{listing.title} · Rentra</title>
</svelte:head>

<section class="shell">
	<p class="eyebrow">{listing.status}</p>
	<h1>{listing.title}</h1>

	{#if listing.location}
		<p class="addr">
			{listing.location.address}{listing.location.apartmentUnit
				? `, ${listing.location.apartmentUnit}`
				: ''} · {listing.location.city}, {listing.location.zip}
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
		<div><dt>Rent</dt><dd>{money(listing.pricing?.monthlyRent)}/mo</dd></div>
		<div><dt>Deposit</dt><dd>{money(listing.pricing?.deposit)}</dd></div>
		<div><dt>Lease</dt><dd>{listing.pricing?.leaseType ?? '—'}</dd></div>
		<div><dt>Rooms</dt><dd>{listing.roomInfo?.numberOfRooms ?? '—'}</dd></div>
		<div><dt>Room type</dt><dd>{listing.roomInfo?.roomType ?? '—'}</dd></div>
		<div><dt>Max occupants</dt><dd>{listing.requirements?.maxOccupants ?? '—'}</dd></div>
	</dl>

	<a href="/listings/new">+ Add another listing</a>
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

	a {
		color: #2563eb;
		font-weight: 600;
		text-decoration: none;
	}
</style>
