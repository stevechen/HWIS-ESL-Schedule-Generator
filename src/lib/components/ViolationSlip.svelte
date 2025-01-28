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

	let {
		student = defaultStudent,
		ESL = 'G7 Elementary 1 Comm',
		times = 3,
		signatureSrc = ''
	} = $props();
</script>

<div
	class="slip relative block h-[calc((257mm)/3)] p-4 font-sans text-xs
    *:box-border *:border-gray-500
    print:[&:nth-of-type(3n+2)]:border-y
    print:[&:nth-of-type(3n+2)]:border-dotted print:[&:nth-of-type(3n+4)]:break-before-page"
>
	<h2 class="h-[12%] w-full text-center font-semibold whitespace-pre-line">
		{`Hong Wen High School Student Violation Slip
		弘文中學學生違規紀錄單`}
	</h2>
	<div class="flex h-[22%] items-center border text-sm *:px-3 *:leading-6 *:block">
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
			<p class="class-info">2025/01/30/8</p>
		</div>
	</div>

	<div class="flex h-[22%] items-start border-x border-b">
		<h3 class="px-3 py-2 text-xs text-gray-600">Violation 違規行為</h3>
		<div class="px-3 py-2">
			<p class="assignment-info whitespace-pre-line leading-6 *:font-semibold">
				Violation Description
			</p>
			<p class="assignment-info whitespace-pre-line leading-6 *:font-semibold">違規說明</p>
		</div>
	</div>

	<div class="flex h-[22%] border-x *:border-gray-500 *:px-3 *:py-2 *:grow">
		<h3 class="relative w-1/2 *:block border-r border-gray-500 whitespace-pre-line mt-3">
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

		<h3 class="w-1/2 border-r border-gray-500 whitespace-pre-line">導師簽名</h3>
		<h3 class="w-1/2 border-r border-gray-500 whitespace-pre-line">家長簽名</h3>
		<h3 class="w-1/2 self-end text-center whitespace-pre-line">
			{`登記次數達三次者,
			於第四次開始記警告.`}
		</h3>
	</div>

	<div class="flex h-[22%] flex-row border *:px-3 *:py-2">
		<h3 class="w-1/2 border-r border-gray-500 whitespace-pre-line">
			{`登記次數
		Times recorded`}
		</h3>
		<h3 class="w-1/2 border-r border-gray-500 whitespace-pre-line">1</h3>
		<h3 class="w-1/2 border-r border-gray-500 whitespace-pre-line">2</h3>
		<h3 class="w-1/2 whitespace-pre-line">3</h3>
	</div>
</div>

<style>
	* {
		font-family: 'Microsoft JhengHei', 'Arial Unicode MS', Helvetica, Verdana, Tahoma, sans-serif;
	}
</style>
