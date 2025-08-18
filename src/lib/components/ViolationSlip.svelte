<script lang="ts">
	import { isValidMonthAndDay } from '$lib/utils.ts.svelte';

	// Marked Interfaces
	interface Student {
		id: string;
		name: { english: string; chinese: string };
		cClass: string;
		status: { english: string; chinese: string };
	}

	//#region  Default objects
	const defaultStudent: Student = {
		id: '123456',
		name: { english: 'Daniel Wang', chinese: '王小明' },
		cClass: 'J101',
		status: { english: "hasn't been submitted", chinese: '未繳交' }
	};

	let {
		student = defaultStudent,
		ESL = 'G7 Elementary 1 Comm',
		dateAndTime = '2025/01/30/8',
		violation = { english: 'Absentminded', chinese: '上課不專心' },
		times = 3,
		signatureSrc = '/sig.png'
	} = $props();
</script>

<div
	class="slip relative block h-[calc((257mm)/3)] p-4 font-sans text-xs *:box-border *:border-gray-500 print:nth-of-type-[3n+2]:border-y print:nth-of-type-[3n+2]:border-dotted print:nth-of-type-[3n+4]:break-before-page"
>
	<h2 class="h-[12%] w-full text-center font-semibold">
		Hong Wen High School Student Violation Slip<br />
		弘文中學學生違規紀錄單
	</h2>
	<div class="flex h-[22%] items-center border text-sm *:block *:px-3 *:leading-6">
		<div class="w-[40%] *:leading-6">
			<h3 class="pr-1 text-xs text-gray-600">Student 學生:</h3>
			<p class="student-info">
				{student.name.chinese} / {student.name.english} ({student.id})
			</p>
		</div>
		<div class="w-[40%] *:leading-6">
			<h3 class="pr-1 text-xs text-gray-600">Class 班級:</h3>
			<p class="class-info">{ESL} / {student.cClass}</p>
		</div>
		<div class="w-[20%] *:leading-6">
			<h3 class="pr-1 text-xs text-gray-600">Date & Time 日期:</h3>
			<p class="date-info">{dateAndTime}</p>
		</div>
	</div>

	<div class="flex h-[22%] items-start border-x border-b">
		<h3 class="px-3 py-2 text-xs text-gray-600">Violation <br /> 違規行為</h3>
		<div class="w-3/4 px-3 py-2 *:text-center">
			<p class="leading-6 *:font-semibold">{violation.english}</p>
			<p class="leading-6 *:font-semibold">{violation.chinese}</p>
		</div>
	</div>

	<div class="flex h-[22%] border-x *:grow *:border-gray-500 *:px-3 *:py-2">
		<h3 class="relative w-1/2 border-r border-gray-500 pt-3 *:block">
			Teacher's signature<br />
			ESL 老師簽名
			{#if signatureSrc}
				<img
					class="absolute top-[5mm] left-[20mm] h-[12mm]"
					src={signatureSrc}
					alt="Teacher's Signature"
				/>
			{/if}
		</h3>

		<h3 class="w-1/3 border-r border-gray-500">導師簽名</h3>
		<h3 class="w-1/3 border-r border-gray-500">家長簽名</h3>
		<h3 class="w-1/3 self-center text-center font-semibold underline">
			登記次數達三次者,<br />
			於第四次開始記警告.
		</h3>
	</div>

	<div class="flex h-[22%] flex-row border *:px-3 *:py-2">
		<h3 class="w-1/2 border-r border-gray-500">
			登記次數<br />
			Times recorded
		</h3>

		{#each Array(3) as _, i}
			<div class="w-1/2 border-r border-gray-500 last-of-type:border-none">
				<h3 class="">{i + 1}</h3>
				<p class="text-center text-2xl">{times >= i + 1 ? '✓' : ''}</p>
			</div>
		{/each}
	</div>
</div>

<style>
	* {
		font-family: 'Microsoft JhengHei', 'Arial Unicode MS', Helvetica, Verdana, Tahoma, sans-serif;
	}
</style>
