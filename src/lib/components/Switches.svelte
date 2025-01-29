<script lang="ts">
	let {
		title = 'Days',
		days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
		checkedDays = [true, false, true, false, true]
	} = $props();

	let proxy = $state(checkedDays);
</script>

<div
	class="my-2 box-border flex h-max w-max items-center justify-center rounded-lg bg-linear-[270deg,#444,#222] px-3 py-[2px] shadow-[0px_0px_3px_1px_rgba(0,_0,_0,_1),inset_0_8px_3px_-8px_rgba(255,_255,_255,_0.4)]"
>
	<h3 class="text-white mr-4 text-sm">{title}</h3>
	{#each days as day, i}
		<div
			class="back group m-[0_1px] box-border block h-[38px] w-[46px] rounded-[4px] bg-black px-[2px] py-[1px] text-sm shadow-[10px_10px_10px_-5px_rgba(0,_0,_0,_0.3),-10px_10px_10px_-5px_rgba(0,_0,_0,_0.3),0_10px_10px_0px_rgba(0,_0,_0,_0.3),inset_0_-1px_0_0_#444] transition-all duration-200 hover:*:cursor-pointer has-[input:checked]:p-[2px] has-[input:checked]:shadow-[10px_10px_10px_-2px_rgba(0,_0,_0,_0.1),-10px_10px_10px_-2px_rgba(0,_0,_0,_0.1),0_10px_10px_0px_rgba(0,_0,_0,_0.2),inset_0_1px_2px_0_rgba(0,_0,_0,_0.6)] bg-linear-[0deg,transparent_30%,transparent_70%,0deg,rgba(150,150,150,0)_30%,rgba(150,150,150,0.1)_50%,rgba(150,150,150,0)_70%]"
		>
			<label
				class="relative mt-[5px] block h-6 w-[42px] rounded-sm border-b-0 bg-[#272727] shadow-[inset_0_-3px_2px_-2px_rgba(200,_200,_200,_0.5),0_3px_3px_-2px_rgba(0,_0,_0,_1),inset_0_-70px_20px_-60px_rgba(255,_255,_255,_0.2),inset_0_70px_14px_-60px_rgba(0,_0,_0,_0.3)] transition-all duration-200 has-[input:checked]:bg-[#232323] has-[input:checked]:shadow-[inset_8px_-4px_5px_-7px_rgba(0,_0,_0,_1),0_-5px_8px_-2px_rgba(250,_250,_250,_0.4),0_-3px_8px_-4px_rgba(250,_250,_250,_0.4),inset_0_3px_4px_-2px_rgba(10,_10,_10,_1),inset_0_90px_10px_-60px_rgba(0,_0,_0,_0.2),inset_0_-60px_40px_-60px_rgba(180,_180,_180,_0.2)] has-[input:checked]:bg-radial-gradient-[50%_15%,circle_closest-corner,rgba(0,_0,_0,_0.3),rgba(0,_0,_0,_0)]"
				for={day}
			>
				<input type="checkbox" id={day} class="hidden peer" name={day} bind:checked={proxy[i]} />
				<span
					class="absolute top-[10%] m-auto block w-full select-none text-center text-[#555] transition-all duration-100 peer-checked:scale-y-[0.75] peer-checked:text-[#bbb] text-shadow-[inset_1px_1px_1px_black]"
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

	.back:has(input:checked) {
		background-image:
			-webkit-linear-gradient(90deg, black 30%, transparent 70%),
			-webkit-linear-gradient(
					180deg,
					rgba(250, 250, 250, 0) 0%,
					rgba(250, 250, 250, 0.4) 50%,
					rgba(150, 150, 150, 0) 100%
				);
	}
</style>
