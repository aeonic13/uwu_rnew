<script lang="ts">
	let {
		values = {},
		errors = {}
	}: {
		values?: Record<string, string>;
		errors?: Record<string, string[] | undefined>;
	} = $props();

	const err = (name: string) => errors[name]?.[0];
	const val = (name: string) => values[name] ?? '';
	const checked = (name: string) => values[name] === 'on';

	// Live mirror of field values, used only for the collapsed summaries and
	// status dots. The inputs themselves stay uncontrolled (value={val()}), so
	// collapsing a section or a failed submit never drops what was typed.
	let current = $state<Record<string, string>>({});
	$effect.pre(() => {
		current = { ...values };
	});

	function track(e: Event) {
		const t = e.target as HTMLInputElement | HTMLSelectElement | null;
		if (!t || !t.name) return;
		if (t instanceof HTMLInputElement && t.type === 'checkbox') {
			current[t.name] = t.checked ? 'on' : '';
		} else {
			current[t.name] = t.value;
		}
	}

	const sectionOrder = [
		'basics',
		'location',
		'pricing',
		'room',
		'requirements',
		'amenities',
		'photos'
	] as const;

	type SectionKey = (typeof sectionOrder)[number];

	const sectionFields: Record<SectionKey, string[]> = {
		basics: ['title'],
		location: [
			'address',
			'apartmentUnit',
			'city',
			'zip',
			'neighborhood',
			'distanceToCampus',
			'hideExactAddress'
		],
		pricing: [
			'monthlyRent',
			'deposit',
			'applicationFee',
			'utilitiesIncluded',
			'leaseType',
			'moveInDate',
			'moveOutDate'
		],
		room: ['numberOfRooms', 'roommateCount', 'roomType', 'bathroomType'],
		requirements: [
			'maxOccupants',
			'incomeRequirement',
			'creditScoreMinimum',
			'quietHours',
			'roommatesAllowed',
			'backgroundCheck',
			'petsAllowed',
			'smokingAllowed'
		],
		amenities: ['furnished', 'laundry', 'parking', 'wifiIncluded', 'gasIncluded', 'waterIncluded'],
		photos: ['photos']
	};

	const sectionKeys = sectionOrder;

	/** Fields that drive the section header error state — not every field in the panel. */
	const sectionErrorFields: Record<SectionKey, string[]> = {
		basics: ['title'],
		location: ['address', 'city', 'zip'],
		pricing: ['monthlyRent'],
		room: ['numberOfRooms'],
		requirements: ['maxOccupants'],
		amenities: [],
		photos: []
	};

	let panelEls: Partial<Record<SectionKey, HTMLElement>> = $state({});
	let visited = $state<Set<SectionKey>>(new Set(['basics']));

	const hasServerError = (key: SectionKey) =>
		sectionErrorFields[key].some((f) => errors[f]?.length);

	/** Header "Needs attention" only after the user has opened the section. */
	const showSectionError = (key: SectionKey) => hasServerError(key) && visited.has(key);

	function markVisited(key: SectionKey) {
		if (visited.has(key)) return;
		visited = new Set([...visited, key]);
	}

	let open = $state<Partial<Record<SectionKey, boolean>>>({ basics: true });
	// After a failed submit, jump to the first section with a required-field error.
	$effect(() => {
		const first = sectionOrder.find((key) => hasServerError(key));
		if (first) {
			markVisited(first);
			openOnly(first);
		}
	});

	function openOnly(key: SectionKey) {
		markVisited(key);
		for (const k of sectionOrder) {
			open[k] = k === key;
		}
	}

	function scrollToPanel(key: SectionKey) {
		queueMicrotask(() => {
			panelEls[key]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		});
	}

	function nextIncomplete(afterKey: SectionKey): SectionKey | null {
		const idx = sectionOrder.indexOf(afterKey);
		for (let i = idx + 1; i < sectionOrder.length; i++) {
			if (statusOf(sectionOrder[i]) !== 'done') return sectionOrder[i];
		}
		return null;
	}

	function closeAndAdvance(key: SectionKey) {
		open[key] = false;
		const next = nextIncomplete(key);
		if (next) {
			openOnly(next);
			scrollToPanel(next);
			focusFirstInSection(next);
		}
	}

	const fieldSelector =
		'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';

	function fieldsInSection(key: SectionKey): HTMLElement[] {
		const panel = panelEls[key];
		if (!panel) return [];
		return [...panel.querySelectorAll<HTMLElement>(fieldSelector)];
	}

	function isLastFieldInSection(field: HTMLElement, key: SectionKey): boolean {
		const fields = fieldsInSection(key);
		const idx = fields.indexOf(field);
		return idx !== -1 && idx === fields.length - 1;
	}

	function focusNextInSection(from: HTMLElement, key: SectionKey) {
		const fields = fieldsInSection(key);
		const idx = fields.indexOf(from);
		if (idx === -1 || idx >= fields.length - 1) return;
		queueMicrotask(() => fields[idx + 1].focus());
	}

	function isSectionRequiredComplete(key: SectionKey): boolean {
		if (hasServerError(key)) return false;
		if (sectionErrorFields[key].length === 0) return true;

		const c = current;
		switch (key) {
			case 'basics':
				return !!c.title;
			case 'location':
				return !!(c.address && c.city && c.zip);
			case 'pricing':
				return !!c.monthlyRent;
			case 'room':
				return !!c.numberOfRooms;
			case 'requirements':
				return !!c.maxOccupants;
			default:
				return true;
		}
	}

	function focusFirstInSection(key: SectionKey) {
		queueMicrotask(() => {
			fieldsInSection(key)[0]?.focus();
		});
	}

	function toggle(key: SectionKey) {
		if (open[key]) {
			open[key] = false;
		} else {
			openOnly(key);
			scrollToPanel(key);
		}
	}

	/** Enter walks every field in the section; only the last field can advance. */
	function onAccordionKeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		const target = e.target as HTMLElement;
		if (target.tagName === 'TEXTAREA') return;
		if (!target.closest('.body')) return;
		if (!target.matches(fieldSelector)) return;

		const key = target.closest<HTMLElement>('[data-section]')?.dataset.section as
			| SectionKey
			| undefined;
		if (!key || !open[key]) return;

		e.preventDefault();

		if (!isLastFieldInSection(target, key)) {
			focusNextInSection(target, key);
			return;
		}

		if (isSectionRequiredComplete(key)) {
			closeAndAdvance(key);
		}
	}

	type Status = 'error' | 'done' | 'empty';
	function statusOf(key: SectionKey): Status {
		if (showSectionError(key)) return 'error';
		const c = current;
		switch (key) {
			case 'basics':
				return c.title ? 'done' : 'empty';
			case 'location':
				return c.address && c.city && c.zip ? 'done' : 'empty';
			case 'pricing':
				return c.monthlyRent ? 'done' : 'empty';
			case 'room':
				return c.numberOfRooms ? 'done' : 'empty';
			case 'requirements':
				return c.maxOccupants ? 'done' : 'empty';
			case 'amenities':
				return sectionFields.amenities.some((f) => c[f] === 'on') ? 'done' : 'empty';
			case 'photos':
				return photoCount() > 0 ? 'done' : 'empty';
			default:
				return 'empty';
		}
	}

	const photoCount = () =>
		(current.photos ?? '').split('\n').filter((l) => l.trim()).length;

	function summaryOf(key: SectionKey): string {
		if (showSectionError(key)) return 'Needs attention';
		const c = current;
		switch (key) {
			case 'basics':
				return c.title || 'Untitled';
			case 'location':
				return [c.address, c.city].filter(Boolean).join(', ') || 'Not started';
			case 'pricing':
				return c.monthlyRent ? `$${Number(c.monthlyRent).toLocaleString()}/mo` : 'Not started';
			case 'room':
				return c.numberOfRooms ? `${c.numberOfRooms} rooms · ${c.roomType || '—'}` : 'Not started';
			case 'requirements':
				return c.maxOccupants ? `Max ${c.maxOccupants} occupants` : 'Optional';
			case 'amenities': {
				const n = sectionFields.amenities.filter((f) => c[f] === 'on').length;
				return n ? `${n} selected` : 'None selected';
			}
			case 'photos': {
				const n = photoCount();
				return n ? `${n} photo${n === 1 ? '' : 's'}` : 'None yet — add before publishing';
			}
			default:
				return '';
		}
	}

	const labels: Record<SectionKey, string> = {
		basics: 'Basics',
		location: 'Location',
		pricing: 'Pricing',
		room: 'Room info',
		requirements: 'Requirements',
		amenities: 'Amenities',
		photos: 'Photos'
	};
</script>

{#snippet panel(key: SectionKey, body: import('svelte').Snippet)}
	{@const status = statusOf(key)}
	<section
		class="panel"
		class:open={open[key]}
		class:has-error={status === 'error'}
		data-section={key}
		bind:this={panelEls[key]}
	>
		<button type="button" class="head" aria-expanded={open[key]} onclick={() => toggle(key)}>
			<span class="dot {status}" aria-hidden="true"></span>
			<span class="title">{labels[key]}</span>
			<span class="summary">{summaryOf(key)}</span>
			<span class="chev" aria-hidden="true">▾</span>
		</button>
		<div class="body" hidden={!open[key]}>
			{@render body()}
		</div>
	</section>
{/snippet}

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="accordion" role="group" aria-label="Listing sections" oninput={track} onchange={track} onkeydown={onAccordionKeydown}>
	{@render panel('basics', basicsBody)}
	{@render panel('location', locationBody)}
	{@render panel('pricing', pricingBody)}
	{@render panel('room', roomBody)}
	{@render panel('requirements', requirementsBody)}
	{@render panel('amenities', amenitiesBody)}
	{@render panel('photos', photosBody)}
</div>

{#snippet basicsBody()}
	<label>
		Title
		<input name="title" value={val('title')} placeholder="Sunny 2BR near campus" />
		{#if err('title')}<span class="error">{err('title')}</span>{/if}
	</label>
{/snippet}

{#snippet locationBody()}
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
	<label class="check">
		<input type="checkbox" name="hideExactAddress" checked={checked('hideExactAddress')} />
		Hide exact address
	</label>
{/snippet}

{#snippet pricingBody()}
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
{/snippet}

{#snippet roomBody()}
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
{/snippet}

{#snippet requirementsBody()}
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
{/snippet}

{#snippet amenitiesBody()}
	<div class="checks">
		<label class="check"><input type="checkbox" name="furnished" checked={checked('furnished')} /> Furnished</label>
		<label class="check"><input type="checkbox" name="laundry" checked={checked('laundry')} /> Laundry</label>
		<label class="check"><input type="checkbox" name="parking" checked={checked('parking')} /> Parking</label>
		<label class="check"><input type="checkbox" name="wifiIncluded" checked={checked('wifiIncluded')} /> WiFi included</label>
		<label class="check"><input type="checkbox" name="gasIncluded" checked={checked('gasIncluded')} /> Gas included</label>
		<label class="check"><input type="checkbox" name="waterIncluded" checked={checked('waterIncluded')} /> Water included</label>
	</div>
{/snippet}

{#snippet photosBody()}
	<label>
		Image URLs (one per line — first is the cover)
		<textarea name="photos" rows="3" placeholder="https://...">{val('photos')}</textarea>
	</label>
{/snippet}

<style>
	.accordion {
		display: grid;
		gap: 0.6rem;
		margin-bottom: 1.25rem;
	}

	.panel {
		border: 1px solid #e5e5e5;
		border-radius: 0.5rem;
		background: #fff;
		overflow: hidden;
	}

	.panel.has-error {
		border-color: #f0c0bb;
	}

	.head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.85rem 1rem;
		border: none;
		background: none;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.head:hover {
		background: #fafafa;
	}

	.dot {
		flex: none;
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
		background: #d4d4d4;
	}

	.dot.done {
		background: #16a34a;
	}

	.dot.error {
		background: #c0392b;
	}

	.title {
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #444;
	}

	.summary {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: #888;
		font-size: 0.85rem;
	}

	.panel.has-error .summary {
		color: #c0392b;
	}

	.chev {
		flex: none;
		color: #aaa;
		transition: transform 0.15s ease;
	}

	.panel.open .chev {
		transform: rotate(180deg);
	}

	.body {
		padding: 0.25rem 1rem 1.1rem;
		border-top: 1px solid #f0f0f0;
	}

	label {
		display: block;
		font-size: 0.85rem;
		font-weight: 500;
		margin-bottom: 0.75rem;
	}

	label:last-child {
		margin-bottom: 0;
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
</style>
