<script lang="ts">
	let {
		title = 'Days',
		days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
		checkedDays = [true, false, true, false, true]
	} = $props();

	let proxy = $state(checkedDays);
</script>

<div
	class="panel my-2 box-border flex h-max w-max items-center justify-center rounded-lg px-3 py-[2px]"
>
	<h3 class="text-white mr-4 text-sm">{title}</h3>
	{#each days as day, i}
		<div
			class="back block m-[0_1px] box-border h-[38px] w-[46px] rounded-[4px] bg-black px-[2px] py-[1px] text-sm transition-all duration-200 *:hover:cursor-pointer has-[input:checked]:p-[2px]"
		>
			<label
				class="but relative mt-[5px] block h-6 w-[42px] rounded-sm border-b-0 bg-[#272727] transition-all duration-200
					has-[input:checked]:bg-[#232323]"
				for={day}
			>
				<input type="checkbox" id={day} class="hidden peer" name={day} bind:checked={proxy[i]} />
				<span
					class="day absolute top-[10%] m-auto block w-full select-none text-center text-[#555] transition-all duration-100 peer-checked:scale-y-[0.75] peer-checked:text-[#bbb]"
					>{day}</span
				>
			</label>
		</div>
	{/each}
</div>

<style>
	/**
    * Round switch button in css with animation cleaned up,
    as seen on:
    https://psd.tutsplus.com/tutorials/interface-tutorials/round-switch-button/
    
    Use box-shadow for inner-div's sharp-bottom-highlight and border-gradient on top
    */
	.panel {
		background: -webkit-linear-gradient(270deg, #444, #222);
		box-shadow:
			0px 0px 3px 1px rgba(0, 0, 0, 1),
			inset 0 8px 3px -8px rgba(255, 255, 255, 0.4);
	}
	.day {
		-webkit-text-shadow: inset 1px 1px 1px black;
		text-shadow: inset 1px 1px 1px black;
	}
	.but {
		box-shadow:
			/* inset 2px 4px 3px -2px rgba(0, 0, 0, 1),
			inset -1px 4px 3px -2px rgba(0, 0, 0, 1), */
			inset 0 -3px 2px -2px rgba(200, 200, 200, 0.5),
			0 3px 3px -2px rgba(0, 0, 0, 1),
			inset 0 -70px 20px -60px rgba(255, 255, 255, 0.2),
			inset 0 70px 14px -60px rgba(0, 0, 0, 0.3);
	}
	.back {
		background-image:
			-webkit-linear-gradient(0deg, transparent 30%, transparent 70%),
			-webkit-linear-gradient(
					0deg,
					rgba(150, 150, 150, 0) 30%,
					rgba(150, 150, 150, 0.1) 50%,
					rgba(150, 150, 150, 0) 70%
				);
		box-shadow:
			10px 10px 10px -5px rgba(0, 0, 0, 0.3),
			-10px 10px 10px -5px rgba(0, 0, 0, 0.3),
			0 10px 10px 0px rgba(0, 0, 0, 0.3),
			inset 0 -1px 0 0 #444;
	}
	input:checked + .day {
		text-shadow: inset 1px 1px 1px black;
	}
	.but:has(input:checked) {
		background-image: -webkit-radial-gradient(
			50% 15%,
			circle closest-corner,
			rgba(0, 0, 0, 0.3),
			rgba(0, 0, 0, 0)
		);
		box-shadow:
			inset 8px -4px 5px -7px rgba(0, 0, 0, 1),
			0 -5px 8px -2px rgba(250, 250, 250, 0.4),
			0 -3px 8px -4px rgba(250, 250, 250, 0.4),
			inset 0 3px 4px -2px rgba(10, 10, 10, 1),
			inset 0 90px 10px -60px rgba(0, 0, 0, 0.2),
			inset 0 -60px 40px -60px rgba(180, 180, 180, 0.2);
	}
	.back:has(input:checked) {
		background-image:
			-webkit-linear-gradient(90deg, black 30%, transparent 70%),
			-webkit-linear-gradient(
					180deg,
					rgba(250, 250, 250, 0) 0%,
					rgba(250, 250, 250, 0.4) 50%,
					rgba(150, 150, 150, 0) 100%
				);
		box-shadow:
			10px 10px 10px -2px rgba(0, 0, 0, 0.1),
			-10px 10px 10px -2px rgba(0, 0, 0, 0.1),
			0 10px 10px 0px rgba(0, 0, 0, 0.2),
			inset 0 1px 2px 0 rgba(0, 0, 0, 0.6);
	}
</style>
