<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const errors = $derived((form?.errors ?? {}) as Record<string, string[] | undefined>);
	const values = $derived((form?.values ?? {}) as Record<string, string>);

	const err = (name: string) => errors[name]?.[0];
	const val = (name: string) => values[name] ?? '';
	const checked = (name: string) => values[name] === 'on';
</script>

<svelte:head>
	<title>Add listing · Rentra</title>
</svelte:head>

<section class="shell">
	<header>
		<p class="eyebrow">Property manager</p>
		<h1>Add a listing</h1>
	</header>

	{#if errors._form}
		<p class="form-error">{errors._form[0]}</p>
	{/if}

	<form method="POST" use:enhance>
		<fieldset>
			<legend>Basics</legend>
			<label>
				Title
				<input name="title" value={val('title')} placeholder="Sunny 2BR near campus" />
				{#if err('title')}<span class="error">{err('title')}</span>{/if}
			</label>
		</fieldset>

		<fieldset>
			<legend>Location</legend>
			<label>
				Address
				<input name="address" value={val('address')} />
				{#if err('address')}<span class="error">{err('address')}</span>{/if}
			</label>
			<div class="row">
				<label>
					Unit
					<input name="apartmentUnit" value={val('apartmentUnit')} />
				</label>
				<label>
					City
					<input name="city" value={val('city')} />
					{#if err('city')}<span class="error">{err('city')}</span>{/if}
				</label>
				<label>
					ZIP
					<input name="zip" value={val('zip')} />
					{#if err('zip')}<span class="error">{err('zip')}</span>{/if}
				</label>
			</div>
			<div class="row">
				<label>
					Neighborhood
					<input name="neighborhood" value={val('neighborhood')} />
				</label>
				<label>
					Distance to campus (mi)
					<input name="distanceToCampus" type="number" step="0.1" value={val('distanceToCampus')} />
				</label>
			</div>
			<div class="row">
				<label>
					Latitude
					<input name="latitude" type="number" step="any" value={val('latitude')} />
				</label>
				<label>
					Longitude
					<input name="longitude" type="number" step="any" value={val('longitude')} />
				</label>
			</div>
			<label class="check">
				<input type="checkbox" name="hideExactAddress" checked={checked('hideExactAddress')} />
				Hide exact address
			</label>
		</fieldset>

		<fieldset>
			<legend>Pricing</legend>
			<div class="row">
				<label>
					Monthly rent ($)
					<input name="monthlyRent" type="number" value={val('monthlyRent')} />
					{#if err('monthlyRent')}<span class="error">{err('monthlyRent')}</span>{/if}
				</label>
				<label>
					Deposit ($)
					<input name="deposit" type="number" value={val('deposit')} />
				</label>
				<label>
					Application fee ($)
					<input name="applicationFee" type="number" value={val('applicationFee')} />
				</label>
			</div>
			<div class="row">
				<label>
					Lease type
					<select name="leaseType">
						<option value="MONTH_TO_MONTH" selected={val('leaseType') === 'MONTH_TO_MONTH'}>Month to month</option>
						<option value="SIX_MONTH" selected={val('leaseType') === 'SIX_MONTH'}>6 months</option>
						<option value="TWELVE_MONTH" selected={val('leaseType') === 'TWELVE_MONTH'}>12 months</option>
						<option value="CUSTOM" selected={val('leaseType') === 'CUSTOM'}>Custom</option>
					</select>
				</label>
				<label>
					Move-in date
					<input name="moveInDate" type="date" value={val('moveInDate')} />
				</label>
				<label>
					Move-out date
					<input name="moveOutDate" type="date" value={val('moveOutDate')} />
				</label>
			</div>
			<label class="check">
				<input type="checkbox" name="utilitiesIncluded" checked={checked('utilitiesIncluded')} />
				Utilities included
			</label>
		</fieldset>

		<fieldset>
			<legend>Room info</legend>
			<div class="row">
				<label>
					Number of rooms
					<input name="numberOfRooms" type="number" value={val('numberOfRooms')} />
				</label>
				<label>
					Roommate count
					<input name="roommateCount" type="number" value={val('roommateCount')} />
				</label>
			</div>
			<div class="row">
				<label>
					Room type
					<select name="roomType">
						<option value="PRIVATE" selected={val('roomType') === 'PRIVATE'}>Private</option>
						<option value="SHARED" selected={val('roomType') === 'SHARED'}>Shared</option>
					</select>
				</label>
				<label>
					Bathroom type
					<select name="bathroomType">
						<option value="PRIVATE" selected={val('bathroomType') === 'PRIVATE'}>Private</option>
						<option value="SHARED" selected={val('bathroomType') === 'SHARED'}>Shared</option>
					</select>
				</label>
			</div>
		</fieldset>

		<fieldset>
			<legend>Requirements</legend>
			<div class="row">
				<label>
					Max occupants
					<input name="maxOccupants" type="number" value={val('maxOccupants')} />
					{#if err('maxOccupants')}<span class="error">{err('maxOccupants')}</span>{/if}
				</label>
				<label>
					Min income ($)
					<input name="incomeRequirement" type="number" value={val('incomeRequirement')} />
				</label>
				<label>
					Min credit score
					<input name="creditScoreMinimum" type="number" value={val('creditScoreMinimum')} />
				</label>
			</div>
			<label>
				Quiet hours
				<input name="quietHours" value={val('quietHours')} placeholder="10pm–8am" />
			</label>
			<div class="checks">
				<label class="check"><input type="checkbox" name="roommatesAllowed" checked={checked('roommatesAllowed')} /> Roommates allowed</label>
				<label class="check"><input type="checkbox" name="backgroundCheck" checked={checked('backgroundCheck')} /> Background check</label>
				<label class="check"><input type="checkbox" name="petsAllowed" checked={checked('petsAllowed')} /> Pets allowed</label>
				<label class="check"><input type="checkbox" name="smokingAllowed" checked={checked('smokingAllowed')} /> Smoking allowed</label>
			</div>
		</fieldset>

		<fieldset>
			<legend>Amenities</legend>
			<div class="checks">
				<label class="check"><input type="checkbox" name="furnished" checked={checked('furnished')} /> Furnished</label>
				<label class="check"><input type="checkbox" name="laundry" checked={checked('laundry')} /> Laundry</label>
				<label class="check"><input type="checkbox" name="parking" checked={checked('parking')} /> Parking</label>
				<label class="check"><input type="checkbox" name="wifiIncluded" checked={checked('wifiIncluded')} /> WiFi included</label>
				<label class="check"><input type="checkbox" name="gasIncluded" checked={checked('gasIncluded')} /> Gas included</label>
				<label class="check"><input type="checkbox" name="waterIncluded" checked={checked('waterIncluded')} /> Water included</label>
			</div>
		</fieldset>

		<fieldset>
			<legend>Photos</legend>
			<label>
				Image URLs (one per line — first is the cover)
				<textarea name="photos" rows="3" placeholder="https://...">{val('photos')}</textarea>
			</label>
		</fieldset>

		<button type="submit">Create listing</button>
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

	fieldset {
		border: 1px solid #e5e5e5;
		border-radius: 0.5rem;
		padding: 1rem 1.25rem 1.25rem;
		margin: 0 0 1.25rem;
		background: #fff;
	}

	legend {
		padding: 0 0.4rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #555;
	}

	label {
		display: block;
		font-size: 0.85rem;
		font-weight: 500;
		margin-bottom: 0.75rem;
	}

	input,
	select,
	textarea {
		display: block;
		width: 100%;
		box-sizing: border-box;
		margin-top: 0.3rem;
		padding: 0.5rem 0.6rem;
		border: 1px solid #d4d4d4;
		border-radius: 0.375rem;
		font: inherit;
		font-size: 0.875rem;
	}

	.row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: 0 1rem;
	}

	.checks {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
		gap: 0.25rem 1rem;
	}

	label.check {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 400;
	}

	label.check input {
		display: inline;
		width: auto;
		margin: 0;
	}

	.error {
		display: block;
		margin-top: 0.25rem;
		color: #c0392b;
		font-size: 0.75rem;
		font-weight: 400;
	}

	.form-error {
		padding: 0.75rem 1rem;
		border: 1px solid #f0c0bb;
		background: #fdecea;
		color: #c0392b;
		border-radius: 0.375rem;
		font-size: 0.85rem;
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
</style>
