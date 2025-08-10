<script lang="ts">
	import { isValidMonthAndDay } from '$lib/utils.ts.svelte';

	// Marked Interfaces
	interface Student {
		id: string;
		name: { english: string; chinese: string };
		cClass: string;
		status: { english: string; chinese: string };
	}

	interface Assignment {
		esl: string;
		type: { english: string; chinese: string };
		assigned: string | null;
		due: string | null;
		late: string | null;
	}

	//#region  Default objects
	const defaultStudent: Student = {
		id: '123456',
		name: { english: 'Daniel Wang', chinese: '王小明' },
		cClass: 'J101',
		status: { english: "hasn't been submitted", chinese: '未繳交' }
	};

	const defaultAssignment: Assignment = {
		esl: 'G7 Elementary 1 Comm',
		type: { english: 'Passport', chinese: '英文護照' },
		assigned: '',
		due: '',
		late: ''
	};

	let { student = defaultStudent, assignment = defaultAssignment, signatureSrc = '' } = $props();
</script>

<div
	class="block *:box-border relative bg-white shadow-indigo-950 shadow-md print:shadow-none p-4 border-gray-800 *:border-gray-500 print:nth-of-type-[3n+2]:border-y print:nth-of-type-[3n+2]:border-dotted h-[calc((257mm)/3)] font-sans text-xs print:nth-of-type-[3n+4]:break-before-page slip"
>
	<h2 class="w-full h-[12%] font-semibold text-center">
		ESL Communication Slip / ESL 課程溝通事項
	</h2>
	<div class="flex items-center *:px-3 border *:w-1/2 h-[22%] text-sm *:leading-6">
		<div class="*:leading-6">
			<h3 class="pr-1 text-gray-600 text-xs">Student 學生:</h3>
			<p class="student-info">
				{student.name.chinese} / {student.name.english} ({student.id})
			</p>
		</div>
		<div class="*:leading-6">
			<h3 class="pr-1 text-gray-600 text-xs">Class 班級:</h3>
			<p class="class-info">{assignment.esl} / {student.cClass}</p>
		</div>
	</div>

	<div class="flex items-center border-x border-b h-[22%]">
		<p class="px-3 *:font-semibold leading-6 whitespace-pre-line assignment-info">
			The assignment <span>**{assignment.type.english}** {student.status.english}</span>
			and will affect the ESL scores.
			{`貴子弟ESL課程的`}
			<span
				>**{assignment.type.chinese}** {student.status.chinese}
			</span>，將影響ESL平時成績，請家長知悉。
		</p>
	</div>

	<div class="*:block flex flex-row *:content-center border-x *:border-gray-500 h-[22%]">
		<p class="pl-3 border-r w-[43%] font-semibold text-sm leading-6 whitespace-pre-line">
			若於補繳日仍未繳交，此功課成績為零<br />
			<span class="font-normal text-xs italic">*功課內容請查 Google Classroom</span>
		</p>

		<div class="flex pl-1 w-[19%] text-center leading-6">
			<h3 class="text-center leading-6">Assigned 指派日</h3>
			<p class="h-1/2 text-lg assigned">
				{isValidMonthAndDay(assignment.assigned) ? assignment.assigned : ''}
			</p>
		</div>

		<div class="flex pl-1 border-gray-500 border-x w-[19%] text-center leading-6">
			<h3 class="text-center leading-6">Due 繳交日</h3>
			<p class="h-1/2 text-lg due">
				{isValidMonthAndDay(assignment.due) ? assignment.due : ''}
			</p>
		</div>

		<div class="flex pl-1 w-[19%] text-center leading-6">
			<h3 class="text-center leading-6">Make up 補繳日</h3>
			<p class="h-1/2 font-semibold text-lg late">
				{isValidMonthAndDay(assignment.late) ? assignment.late : ''}
			</p>
		</div>
	</div>

	<div class="flex flex-row flex-row-grow *:content-start *:px-3 *:py-2 border h-[22%]">
		<h3 class="relative border-gray-500 border-r w-1/2 whitespace-pre-line">
			{`Teacher's signature
                ESL 老師簽名`}
			{#if signatureSrc}
				<img
					class="top-[2mm] left-[32mm] absolute h-[14mm]"
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
		/* fix tailwindcss print: variant not working on Safari problem */
		.print\:shadow-none {
			--tw-shadow: 0 0 #0000;
			box-shadow:
				var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow),
				var(--tw-ring-shadow), var(--tw-shadow);
		}

		.print\:nth-of-type-\[3n\+2\]\:border-y:nth-of-type(3n + 2) {
			border-top-width: 1px;
			border-bottom-width: 1px;
		}

		.print\:nth-of-type-\[3n\+2\]\:border-dotted:nth-of-type(3n + 2) {
			border-style: dotted;
		}

		.print\:nth-of-type-\[3n\+4\]\:break-before-page:nth-of-type(3n + 4) {
			break-before: page;
		}
	}
</style>
