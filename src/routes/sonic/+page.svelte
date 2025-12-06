<script lang="ts">
	// Created as a deterence tool for talkative students. Adults genearlly can't hear the higher pitch frequencies. Therefore, playing high pitch frequencies can help deter talkative students while the teacher isn't affected. It saves the last frequency and volume in local storage so that it can be restored when the page is reloaded.
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let frequency = $state(440); // Default to A4 note
	let volume = $state(30); // Default to 30% volume
	let isPlaying = $state(false);
	let audioContext: AudioContext | null = null;
	let oscillator: OscillatorNode | null = null;
	let gainNode: GainNode | null = null;

	const MIN_FREQ = 20;
	const MAX_FREQ = 20000;

	// Load saved frequency and volume from localStorage
	onMount(() => {
		if (browser) {
			const savedFreq = localStorage.getItem('lastFrequency');
			if (savedFreq) {
				const parsed = parseInt(savedFreq, 10);
				if (!isNaN(parsed) && parsed >= MIN_FREQ && parsed <= MAX_FREQ) {
					frequency = parsed;
				}
			}

			const savedVolume = localStorage.getItem('lastVolume');
			if (savedVolume) {
				const parsed = parseInt(savedVolume, 10);
				if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) volume = parsed;
			}
		}
	});

	// Save frequency, volume to localStorage whenever they changes
	$effect(() => {
		if (browser) {
			localStorage.setItem('lastFrequency', frequency.toString());
			localStorage.setItem('lastVolume', volume.toString());
		}
	});

	// Cleanup on component destroy
	onDestroy(() => {
		stopSound();
		if (audioContext) audioContext.close();
	});

	function adjustFrequency(delta: number) {
		const newFreq = frequency + delta;
		if (newFreq >= MIN_FREQ && newFreq <= MAX_FREQ) {
			frequency = newFreq;
			if (isPlaying && oscillator)
				oscillator.frequency.setValueAtTime(frequency, audioContext!.currentTime);
		}
	}

	function handleFrequencySlider(event: Event) {
		const target = event.target as HTMLInputElement;
		frequency = parseInt(target.value, 10);
		if (isPlaying && oscillator) {
			oscillator.frequency.setValueAtTime(frequency, audioContext!.currentTime);
		}
	}

	function handleVolumeSlider(event: Event) {
		const target = event.target as HTMLInputElement;
		volume = parseInt(target.value, 10);
		if (isPlaying && gainNode)
			gainNode.gain.setValueAtTime(volume / 100, audioContext!.currentTime);
	}

	const togglePlay = () => (isPlaying ? stopSound() : startSound());

	function startSound() {
		if (!audioContext) audioContext = new AudioContext();

		// Resume audio context if suspended (required by some browsers)
		if (audioContext.state === 'suspended') audioContext.resume();

		// Create oscillator and gain node
		oscillator = audioContext.createOscillator();
		gainNode = audioContext.createGain();

		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

		// Start with gain at 0 to prevent clicking
		const now = audioContext.currentTime;
		gainNode.gain.setValueAtTime(0, now);

		// Connect nodes BEFORE starting oscillator
		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		// Start oscillator
		oscillator.start(now);

		// Smoothly ramp up to target volume over 100ms using linear ramp
		gainNode.gain.linearRampToValueAtTime(volume / 100, now + 0.1);

		isPlaying = true;
	}

	function stopSound() {
		if (oscillator && gainNode && audioContext) {
			const now = audioContext.currentTime;

			// Cancel any scheduled changes and set to current value
			gainNode.gain.cancelScheduledValues(now);
			gainNode.gain.setValueAtTime(gainNode.gain.value, now);

			// Smoothly fade out over 100ms using linear ramp
			gainNode.gain.linearRampToValueAtTime(0, now + 0.1);

			// Stop the oscillator after the fade out completes
			oscillator.stop(now + 0.1);

			// Clean up after stopping
			setTimeout(() => {
				if (oscillator) {
					oscillator.disconnect();
					oscillator = null;
				}
				if (gainNode) {
					gainNode.disconnect();
					gainNode = null;
				}
			}, 150); // Wait longer than the fade out
		}
		isPlaying = false;
	}
</script>

<svelte:head>
	<title>Frequency Generator</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-4"
>
	<div class="w-full max-w-md rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
		<!-- Title -->
		<h1 class="mb-8 text-center text-4xl font-bold text-white">Frequency Generator</h1>

		<!-- Frequency Display -->
		<div
			class="mb-8 rounded-xl bg-gradienlinear-to-r from-purple-500 to-pink-500 p-6 text-center shadow-lg"
		>
			<div class="text-sm font-semibold uppercase tracking-wider text-white/80">
				Current Frequency
			</div>
			<div class="mt-2 text-5xl font-bold text-white">
				{frequency}
				<span class="text-2xl">Hz</span>
			</div>
		</div>

		<!-- Slider -->
		<div class="mb-8">
			<label for="frequency-slider" class="mb-3 block text-sm font-semibold text-white/90">
				Frequency Range: {MIN_FREQ} - {MAX_FREQ} Hz
			</label>
			<input
				id="frequency-slider"
				type="range"
				min={MIN_FREQ}
				max={MAX_FREQ}
				value={frequency}
				oninput={handleFrequencySlider}
				class="h-3 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-purple-500 transition-all hover:bg-white/30"
			/>
		</div>

		<!-- Volume Control -->
		<div class="mb-8">
			<label for="volume-slider" class="mb-3 block text-sm font-semibold text-white/90">
				Volume: {volume}%
			</label>
			<div class="flex items-center gap-4">
				<span class="text-2xl">🔈</span>
				<input
					id="volume-slider"
					type="range"
					min="0"
					max="100"
					value={volume}
					oninput={handleVolumeSlider}
					class="h-3 flex-1 cursor-pointer appearance-none rounded-lg bg-white/20 accent-pink-500 transition-all hover:bg-white/30"
				/>
				<span class="text-2xl">🔊</span>
			</div>
			<!-- Volume indicator bar -->
			<div class="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
				<div
					class="h-full rounded-full bg-linear-to-r from-pink-500 to-purple-500 transition-all duration-200"
					style="width: {volume}%"
				></div>
			</div>
		</div>

		<!-- Stepper Controls -->
		<div class="mb-8 space-y-3">
			<div class="text-sm font-semibold text-white/90">Fine Tune</div>

			<!-- +/- 100 Hz -->
			<div class="flex items-center justify-between gap-3">
				<button
					onclick={() => adjustFrequency(-100)}
					class="flex-1 rounded-lg bg-red-500/80 px-4 py-3 font-semibold text-white transition-all hover:bg-red-500 hover:shadow-lg active:scale-95 disabled:opacity-50"
					disabled={frequency - 100 < MIN_FREQ}
				>
					-100 Hz
				</button>
				<button
					onclick={() => adjustFrequency(100)}
					class="flex-1 rounded-lg bg-green-500/80 px-4 py-3 font-semibold text-white transition-all hover:bg-green-500 hover:shadow-lg active:scale-95 disabled:opacity-50"
					disabled={frequency + 100 > MAX_FREQ}
				>
					+100 Hz
				</button>
			</div>

			<!-- +/- 10 Hz -->
			<div class="flex items-center justify-between gap-3">
				<button
					onclick={() => adjustFrequency(-10)}
					class="flex-1 rounded-lg bg-orange-500/80 px-4 py-3 font-semibold text-white transition-all hover:bg-orange-500 hover:shadow-lg active:scale-95 disabled:opacity-50"
					disabled={frequency - 10 < MIN_FREQ}
				>
					-10 Hz
				</button>
				<button
					onclick={() => adjustFrequency(10)}
					class="flex-1 rounded-lg bg-blue-500/80 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg active:scale-95 disabled:opacity-50"
					disabled={frequency + 10 > MAX_FREQ}
				>
					+10 Hz
				</button>
			</div>

			<!-- +/- 1 Hz -->
			<div class="flex items-center justify-between gap-3">
				<button
					onclick={() => adjustFrequency(-1)}
					class="flex-1 rounded-lg bg-yellow-500/80 px-4 py-3 font-semibold text-white transition-all hover:bg-yellow-500 hover:shadow-lg active:scale-95 disabled:opacity-50"
					disabled={frequency - 1 < MIN_FREQ}
				>
					-1 Hz
				</button>
				<button
					onclick={() => adjustFrequency(1)}
					class="flex-1 rounded-lg bg-cyan-500/80 px-4 py-3 font-semibold text-white transition-all hover:bg-cyan-500 hover:shadow-lg active:scale-95 disabled:opacity-50"
					disabled={frequency + 1 > MAX_FREQ}
				>
					+1 Hz
				</button>
			</div>
		</div>

		<!-- Play/Stop Button -->
		<button
			onclick={togglePlay}
			class="w-full rounded-xl bg-linear-to-r py-4 text-xl font-bold text-white shadow-xl transition-all hover:shadow-2xl active:scale-95 {isPlaying
				? 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
				: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'}"
		>
			{isPlaying ? '⏸ Stop' : '▶ Play'}
		</button>

		<!-- Info -->
		<div class="mt-6 rounded-lg bg-white/5 p-4 text-center text-sm text-white/70">
			<p>🎵 Generates pure sine wave tones</p>
			<p class="mt-1">Your frequency and volume are automatically saved</p>
		</div>
	</div>
</div>

<style>
	/* Custom slider styling for better cross-browser support */
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: linear-gradient(135deg, #a855f7, #ec4899);
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(168, 85, 247, 0.5);
		transition: all 0.2s;
	}

	input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 12px rgba(168, 85, 247, 0.7);
	}

	input[type='range']::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: linear-gradient(135deg, #a855f7, #ec4899);
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 8px rgba(168, 85, 247, 0.5);
		transition: all 0.2s;
	}

	input[type='range']::-moz-range-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 12px rgba(168, 85, 247, 0.7);
	}
</style>
