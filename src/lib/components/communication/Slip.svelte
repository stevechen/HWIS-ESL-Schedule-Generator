<script lang="ts">
	import { isValidMonthAndDay } from '$lib/utils/dateValidation';

	let { student, index, signatureSrc, assignment } = $props();
</script>

<div
	class="slip relative block h-[calc((257mm)/3)] border-gray-800 bg-white p-4 font-sans text-xs shadow-md shadow-indigo-950 *:box-border *:border-gray-500 print:shadow-none
	{index % 3 === 1 ? 'print:border-y print:border-dotted' : ''}
	{index > 0 && index % 3 === 0 ? 'print:break-before-page' : ''}"
	data-testid="communication-slip"
>
	<h2 class="h-[12%] w-full text-center font-semibold">
		ESL Communication Slip / ESL 課程溝通事項
	</h2>
	<div class="flex h-[22%] items-center border text-sm *:w-1/2 *:px-3 *:leading-6">
		<div class="*:leading-6">
			<h3 class="pr-1 text-xs text-gray-600">Student 學生:</h3>
			<p class="student-info">
				{student.name.chinese} / {student.name.english} ({student.id})
			</p>
		</div>
		<div class="*:leading-6">
			<h3 class="pr-1 text-xs text-gray-600">Class 班級:</h3>
			<p class="class-info">{assignment.esl} / {student.cClass}</p>
		</div>
	</div>

	<div class="flex h-[22%] items-center border-x border-b">
		<p class="assignment-info px-3 leading-6 whitespace-pre-line *:font-semibold">
			The assignment <span>**{assignment.type.english}** {student.status.english}</span>
			and will affect the ESL scores. 貴子弟ESL課程的
			<span
				>**{assignment.type.chinese}** {student.status.chinese}
			</span>，將影響ESL平時成績，請家長知悉。
		</p>
	</div>

	<div class="flex h-[22%] flex-row border-x *:block *:content-center *:border-gray-500">
		<p class="w-[43%] border-r pl-3 text-sm leading-6 font-semibold whitespace-pre-line">
			若於補繳日仍未繳交，此功課成績為零<br />
			<span class="text-xs font-normal italic">*功課內容請查 Google Classroom</span>
		</p>

		<div class="flex w-[19%] pl-1 text-center leading-6">
			<h3 class="text-center leading-6">Assigned 指派日</h3>
			<p class="assigned h-1/2 text-lg">
				{isValidMonthAndDay(assignment.assigned) ? assignment.assigned : ''}
			</p>
		</div>

		<div class="flex w-[19%] border-x border-gray-500 pl-1 text-center leading-6">
			<h3 class="text-center leading-6">Due 繳交日</h3>
			<p class="due h-1/2 text-lg">
				{isValidMonthAndDay(assignment.due) ? assignment.due : ''}
			</p>
		</div>

		<div class="flex w-[19%] pl-1 text-center leading-6">
			<h3 class="text-center leading-6">Make up 補繳日</h3>
			<p class="late h-1/2 text-lg font-semibold">
				{isValidMonthAndDay(assignment.late) ? assignment.late : ''}
			</p>
		</div>
	</div>

	<div class="flex-row-grow flex h-[22%] flex-row border *:content-start *:px-3 *:py-2">
		<h3 class="relative w-1/2 border-r border-gray-500 whitespace-pre-line">
			{`Teacher's signature
                ESL 老師簽名`}
			{#if signatureSrc}
				<img
					class="absolute top-[2mm] left-[32mm] h-[14mm]"
					src={signatureSrc}
					alt="Teacher's Signature"
				/>
			{/if}
		</h3>
		<h3 class="w-1/2">家長簽名 🖊️</h3>
	</div>
</div>

<style>
	* {
		font-family: 'Microsoft JhengHei', 'Arial Unicode MS', Helvetica, Verdana, Tahoma, sans-serif;
	}

	@media print {
		/* fix tailwindcss print: variant not working in dev mode on Safari problem */
		.print\:shadow-none {
			--tw-shadow: 0 0 #0000;
			box-shadow:
				var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow),
				var(--tw-ring-shadow), var(--tw-shadow);
		}
	}
</style>
