<script lang="ts">
	import {
		ANSWER_CHOICES,
		BUBBLE_RADIUS,
		PAGE_SIZE,
		QUESTION_POSITIONS,
		type AnswerChoice
	} from '$lib/zipgrade/layout';

	interface Props {
		/** Selected letters per question (answers[q - 1]). */
		answers: AnswerChoice[][];
		/** Render one <button>-style bubble per letter; otherwise static filled circles. */
		interactive?: boolean;
		onToggle?: (n: number, letter: AnswerChoice) => void;
		/** Fired once the underlying sheet image has loaded. */
		onload?: () => void;
	}

	let { answers, interactive = false, onToggle = undefined, onload = undefined }: Props = $props();

	// Just under half the ~15pt horizontal letter spacing, so adjacent hit areas
	// never overlap at any zoom level.
	const HIT_RADIUS = 7.2;
</script>

<div class="relative h-full w-full">
	<img
		src="/ZipGrade.svg"
		alt="ZipGrade answer sheet"
		class="points-none layer"
		draggable="false"
		{onload}
	/>
	<svg
		class="layer"
		viewBox="0 0 {PAGE_SIZE.widthPt} {PAGE_SIZE.heightPt}"
		aria-hidden={!interactive}
	>
		{#each QUESTION_POSITIONS as q (q.n)}
			{#each ANSWER_CHOICES as letter (letter)}
				{@const selected = (answers[q.n - 1] ?? []).includes(letter)}
				{#if interactive}
					<circle
						cx={q[letter][0]}
						cy={q[letter][1]}
						r={BUBBLE_RADIUS}
						class={selected ? 'bubble--filled' : 'bubble--empty'}
						fill={selected ? '#000' : 'transparent'}
					/>
					<circle
						cx={q[letter][0]}
						cy={q[letter][1]}
						r={HIT_RADIUS}
						class="bubble-hit"
						fill="transparent"
						role="button"
						tabindex="0"
						aria-pressed={selected}
						aria-label={`Question ${q.n}, answer ${letter}`}
						onclick={() => onToggle?.(q.n, letter)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								onToggle?.(q.n, letter);
							}
						}}
					/>
				{:else if selected}
					<circle cx={q[letter][0]} cy={q[letter][1]} r={BUBBLE_RADIUS} fill="#000" />
				{/if}
			{/each}
		{/each}
	</svg>
</div>

<style>
	.layer {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	}

	.points-none {
		pointer-events: none;
	}

	.bubble--filled,
	.bubble--empty {
		pointer-events: none;
	}

	.bubble-hit {
		cursor: pointer;
		pointer-events: all;
		stroke: transparent;
		stroke-width: 1.5;
		transition: stroke 0.1s ease;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}

	.bubble-hit:hover,
	.bubble-hit:focus-visible {
		stroke: #2563eb;
		outline: none;
	}
</style>
