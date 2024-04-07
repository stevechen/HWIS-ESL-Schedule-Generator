<script>
	import { assignment, isValidDate } from '$lib/stores/commslip';
	export let student = {
		id: '',
		name: { english: '', chinese: '' },
		cClass: '',
		status: { english: "hasn't been submitted", chinese: '未繳交' }
	};
	export let signatureSrc = '';
</script>

<div class="slip">
	<div class="title row">
		<h2 class="form-title">ESL Communication Slip / ESL 課程溝通事項</h2>
	</div>
	<div class="studentInfo row">
		<div>
			<p class="student-id">Student ID 學號: {student.id}</p>
			<p class="chinese-class">Chinese Class 班級: {student.cClass}</p>
		</div>
		<div>
			<p class="name">
				Chinese / English Name 姓名: <span class="chinese-name">{student.name.chinese}</span> /
				<span class="english-name">{student.name.english}</span>
			</p>
			<p class="esl-class">ESL Class ESL 組別: {$assignment.esl}</p>
		</div>
	</div>
	<div class="assignment row">
		<div>
			<p class="assignment name">
				The following assignment
				<span class="stress">
					[{$assignment.type.english}] {student.status.english}
				</span> and will affect the ESL scores.
			</p>
			<p class="assignment name chinese">
				貴子弟ESL課程的功課 <span class="stress"
					>{$assignment.type.chinese} {student.status.chinese}</span
				>， 將影響ESL平時成績，請家長知悉。
			</p>
		</div>
	</div>
	<div class="status row">
		<div class="info">
			<p class="stress zero">若未於補繳日前繳交，此功課成績為零。</p>
			<p class="note">*功課內容請查 Google Classroom.</p>
		</div>
		<div class="date assigned">
			<p>
				Assigned date<br />指派日：<br />{isValidDate($assignment.assigned)
					? $assignment.assigned
					: ''}
			</p>
		</div>
		<div class="date due">
			<p>Due date<br />繳交日：<br />{isValidDate($assignment.due) ? $assignment.due : ''}</p>
		</div>
		<div class="date late stress">
			<p>
				Make up date<br />
				<span>補繳日：<br /> {isValidDate($assignment.late) ? $assignment.late : ''}</span>
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

<style>
	* {
		font-family: Helvetica, Verdana, Geneva, Tahoma, sans-serif;
		font-size: 12px;
	}

	p {
		margin: 0.8em 0;
	}

	.slip {
		width: 90%;
		max-height: 125mm;
		margin-top: 0;
		margin-bottom: 1em;
		/* margin: 3.5mm 0; */
		margin-left: 5%;
		margin-right: 5%;
		padding: 0;
		display: table;
		flex-flow: column;
		border-collapse: collapse;
		border-left: 1px solid gray;
		border-top: 1px solid gray;
	}

	@media print {
		@page {
			margin: 0;
			padding: 0;
		}

		.slip {
			display: block;
			margin-bottom: 12.844mm;
			page-break-inside: avoid;
		}

		/* no margin-top for the first card, because it's auto added for unknown reason*/
		.slip:nth-of-type(3n + 4) {
			break-before: page;
			margin-top: 6.422mm;
		}

		.slip:nth-of-type(3n) {
			margin-bottom: 0;
		}
	}

	.row {
		display: table-cell;
		border-collapse: collapse;
		display: table;
		width: 100%;
	}

	.row div,
	.form-title {
		display: table-cell;
		border-right: 1px solid gray;
		border-bottom: 1px solid gray;
		padding: 0 0.5em;
	}

	.form-title {
		text-align: center;
		font-weight: 900;
		padding: 0.5em;
	}

	.stress {
		font-weight: 900;
		margin: 0.5em 0;
	}

	.stress.zero {
		margin-top: 0;
	}

	.note {
		font-size: 0.9em;
		font-style: italic;
		margin: 0;
	}

	.date {
		width: 7em;
	}

	.teacher,
	.parent {
		width: 50%;
	}

	.teacher {
		position: relative;
	}

	.teacher.signature img {
		position: absolute;
		top: 2mm;
		left: 34mm;
		height: 14mm;
	}

	.pen {
		font-family: Arial, Helvetica, sans-serif;
	}
</style>
