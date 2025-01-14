<script lang="ts">
	import { isValidMonthAndDay } from '$lib/utils.ts.svelte';

	//#region Interfaces
	interface Student {
		id: string;
		name: {
			english: string;
			chinese: string;
		};
		cClass: string;
		status: {
			english: string;
			chinese: string;
		};
	}

	interface Assignment {
		esl: string;
		type: {
			english: string;
			chinese: string;
		};
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

<!-- MARK: HTML -->
<div class="slip">
	<div class="title row">
		<h2 class="form-title">ESL Communication Slip / ESL 課程溝通事項</h2>
	</div>
	<div class="studentInfo row">
		<div>
			<p class="student-id">ID 學號: {student.id}</p>
			<p class="chinese-class">Chinese Class 班級: {student.cClass}</p>
		</div>
		<div>
			<p class="name">
				Chinese / English Name 中/英姓名: <span class="chinese-name">{student.name.chinese}</span> /
				<span class="english-name">{student.name.english}</span>
			</p>
			<p class="esl-class">ESL Class ESL 組別: {assignment.esl}</p>
		</div>
	</div>
	<div class="assignment row">
		<div>
			<p class="assignment name">
				The assignment
				<span class="stress">
					[{assignment.type.english}] {student.status.english}
				</span> and will affect the ESL scores.
			</p>
			<p class="assignment name chinese">
				貴子弟ESL課程的 <span class="stress"
					>{assignment.type.chinese} 功課{student.status.chinese}</span
				>， 將影響ESL平時成績，請家長知悉。
			</p>
		</div>
	</div>
	<div class="status row">
		<div class="info">
			<p class="stress">若未於補繳日前繳交，此功課成績為零。</p>
			<p class="footnote">*功課內容請查 Google Classroom.</p>
		</div>
		<div class="date assigned">
			<p>
				Assigned date<br />指派日：<br />{isValidMonthAndDay(assignment.assigned)
					? assignment.assigned
					: ''}
			</p>
		</div>
		<div class="date due">
			<p>Due date<br />繳交日：<br />{isValidMonthAndDay(assignment.due) ? assignment.due : ''}</p>
		</div>
		<div class="date late stress">
			<p>
				Make up date<br />
				<span>補繳日：<br /> {isValidMonthAndDay(assignment.late) ? assignment.late : ''}</span>
			</p>
		</div>
	</div>
	<div class="signature row">
		<div class="teacher signature">
			<p>Teacher's signature</p>
			<p class="title chinese">ESL 老師簽名：</p>
			{#if signatureSrc}
				<img src={signatureSrc} alt="Teacher's Signature" />
			{/if}
		</div>
		<div class="parent signature stress">
			<p class="title chinese">家長簽名 <span class="pen">🖊️</span></p>
		</div>
	</div>
</div>

<!-- MARK: STYLE -->
<style>
	* {
		font-family: 'Arial Unicode MS', Helvetica, Verdana, Tahoma, sans-serif;
		font-size: 11.4px;
	}

	p {
		margin: 0.8em 0;
	}

	.slip {
		width: 90%;
		max-height: 125mm;
		margin: 0 5% 1em 5%;
		padding: 0;
		display: table;
		flex-flow: column;
		border-collapse: collapse;
		border-left: 1px solid gray;
		border-top: 1px solid gray;
	}

	.form-title {
		display: table-cell;
		border-right: 1px solid gray;
		border-bottom: 1px solid gray;
		text-align: center;
		font-weight: 900;
		padding: 0.5em;
	}

	.row {
		display: table-cell;
		border-collapse: collapse;
		display: table;
		width: 100%;

		& > div {
			display: table-cell;
			border-right: 1px solid gray;
			border-bottom: 1px solid gray;
			padding: 0 0.5em;
		}
	}

	.stress {
		font-weight: 900;
		margin: 0.5em 0;
	}

	.footnote {
		font-size: 0.9em;
		font-style: italic;
		margin: 0;
	}

	.date {
		width: 10em;
	}

	.signature.row > div {
		width: 50%;
	}

	.teacher {
		position: relative;
		&.signature img {
			position: absolute;
			top: 2mm;
			left: 34mm;
			height: 14mm;
		}
	}

	.pen {
		font-family: Arial, Helvetica, sans-serif;
	}

	/* #region @media print */
	@media print {
		@page {
			margin: 0;
			padding: 0;
		}

		.slip {
			position: relative;
			display: block;
			margin-bottom: 12.844mm;
			margin-left: 3%;
			page-break-inside: avoid;
		}

		.slip:nth-of-type(3n + 2)::before,
		.slip:nth-of-type(3n + 2)::after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			border-top: 1px dotted dimgray; /* divider line color */
		}

		.slip:nth-of-type(3n + 2)::before {
			top: -6.422mm; /* line position */
		}

		.slip:nth-of-type(3n + 2)::after {
			bottom: -6.422mm; /* line position */
		}

		.slip:nth-of-type(3n + 4) {
			break-before: page;
			margin-top: 4.422mm;
		}
		.slip:nth-of-type(3n) {
			margin-bottom: 0;
		}

		/* Safari only */
		/* @media print and (-webkit-min-device-pixel-ratio: 0) {
			* {
				font-size: 11.3px;
			}

			.slip:first-of-type {
				margin-top: 15.422mm;
			}
			.slip:nth-of-type(3n + 4) {
				margin-top: 10.422mm;
			}
		} */
	}
</style>
