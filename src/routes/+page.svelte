<script>
	import moment from 'moment';

	let day1 = moment('2024-01-01');
	let day2 = moment('2024-01-01');
	let difference = day1.isSame(day2);
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<p>difference: {difference}</p>
