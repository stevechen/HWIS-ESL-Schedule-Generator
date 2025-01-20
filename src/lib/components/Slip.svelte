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
		id: '',
		name: { english: '', chinese: '' },
		cClass: '',
		status: { english: '', chinese: '' }
	};

	const defaultAssignment: Assignment = {
		esl: '',
		type: { english: '', chinese: '' },
		assigned: '',
		due: '',
		late: ''
	};

	let { student = defaultStudent, assignment = defaultAssignment, signatureSrc = '' } = $props();
</script>

<div
	class="slip block relative h-[calc((257mm)/3)] p-4 font-sans text-xs
    print:[&:nth-of-type(3n+2)]:border-y print:[&:nth-of-type(3n+2)]:border-dotted
    print:[&:nth-of-type(3n+4)]:break-before-page
    *:border-gray-500 *:box-border"
>
	<h2 class="h-[12%] w-full font-semibold text-center">
		ESL Communication Slip / ESL 課程溝通事項
	</h2>
	<div class="h-[22%] border flex items-center text-sm *:w-1/2 *:px-3 *:leading-6">
		<div class="*:leading-6">
			<h3 class="text-xs pr-1 text-gray-600">Student 學生:</h3>
			<p class="student-info">
				{student.name.chinese} / {student.name.english} ({student.id})
			</p>
		</div>
		<div class="*:leading-6">
			<h3 class="text-xs pr-1 text-gray-600">Class 班級:</h3>
			<p class="class-info">{assignment.esl} / {student.cClass}</p>
		</div>
	</div>

	<div class="h-[22%] border-x border-b flex items-center">
		<p class="assignment-info px-3 leading-6 whitespace-pre-line *:font-semibold">
			The assignment <span>**{assignment.type.english}** {student.status.english}</span>
			and will affect the ESL scores.
			{`貴子弟ESL課程的`}
			<span
				>**{assignment.type.chinese}** {student.status.chinese}
			</span>，將影響ESL平時成績，請家長知悉。
		</p>
	</div>

	<div class="h-[22%] border-x flex flex-row *:border-gray-500 *:content-center *:block">
		<p class="w-[43%] border-r leading-6 text-sm font-semibold pl-3 whitespace-pre-line">
			若於補繳日仍未繳交，此功課成績為零<br />
			<span class="italic text-xs font-normal">*功課內容請查 Google Classroom</span>
		</p>

		<div class="flex w-[19%] pl-1 text-center leading-6">
			<h3 class="text-center leading-6">Assigned 指派日</h3>
			<p class="assigned h-1/2 text-lg">
				{isValidMonthAndDay(assignment.assigned) ? assignment.assigned : ''}
			</p>
		</div>

		<div class="flex w-[19%] pl-1 text-center leading-6 border-x border-gray-500">
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

	<div class="h-[22%] flex flex-row flex-row-grow border *:content-start *:px-3 *:py-2">
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
</style>
