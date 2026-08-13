# Domain model — HWIS Class Scheduler

A scheduling + communication-record tool for a Hong Kong international school teacher. Built in Svelte 5 + SvelteKit, bundled by Vite, tested with Vitest (node unit + browser-mode component) and Playwright (e2e).

## Core domain concepts

**School year** — the live school-year prefix (e.g. `2025-2026-2`) drives the data file loaded by the schedule page. Computed from today's date by `getSchoolYearAndSemesterPrefix`. Data files live in `src/lib/data/`.

**School events (TSV)** — the raw schedule data: a plain-text table of class/meet-day rows (countdown, date, weekday, description, note). Parsed by `getDates` into `ClassDay[]` and sliced by `getClassDaysByType`.

**Class type** — one of `CLIL` | `Comm` | `G9` | `H`. The schedule page toggles the selected class type (radio bound to `classType: ClassType`), which re-derives the displayed table and CSV and the download filename. `getGradeForClassType` maps class type → grade text.

**Class day** — a single class/meet row: countdown, date, weekday, description, note. Derived from the school-events TSV.

**Checked days** — a 5-element boolean array (Mon…Fri) selecting which weekdays appear. Stored as `checkedDaysState`; the route derives Monday-indexed weekday numbers from it.

**Schedule name** — the computed download filename stem `"<shortYear> S<semester> <classType> schedule"`.

**Communication record** — a saved slip: assignment type, dates (assigned/due/late), the set of students+classes, signature image, and the grade/class context. Persisted under localStorage `communicationRecords`. Lives in the communication page's `CommunicationStore` via `RecordManager`.

**Student** — a row in the student table: name, class, status code, optional selection flag. The `CommunicationStore` parses pasted text into `studentsParsed`, resolves status via `STATUSES`, and derives the `selected` subset shown on slips.

**Assignment** — a code from the `AssignmentCode` set (`basic`, `workbook`, `passport`, `oral`, etc.), filtered by grade/class type (`assignmentTypes`). Drives the bilingual slip content (`Slip.svelte`).

**Signature** — a base64 data-URL image pasted/uploaded once and persisted to localStorage `signatureImage`; shown on each slip.

**White Slip** — the printed communication slip (bilingual: Traditional Chinese + English). A `Slip.svelte` instance per student.

**ZipGrade sheet** — the multiple-choice answer sheet: 65 questions × 5 bubbles (A–E). Answers toggle per-question; persisted to localStorage `zipgradeAnswers`; the print page renders a static copy from a freshly-constructed store.

## Architecture / test terms

These are the *design vocabulary* (from `/codebase-design`); use them for architectural suggestions, not domain nouns.

- **Module** — a unit of interface + implementation: the `CommunicationStore`, the `ZipGradeStore`, `RecordManager`, the schedule route component, the `compareDates`/`getDates` utilities.
- **Interface** — what a caller/test must know: the store methods (`handlePaste`, `toggle`, `apply`, `reset`, `loadRecordData`), the record lifecycle (`isSaveable`/`isModified`, clear flow).
- **Depth** / **deep** — a module whose behaviour exceeds its interface.
- **Seam** — where a module's interface lives; the place tests cross.
- **Adapter** — a concrete provider of an interface: localStorage, the dev-server data file, a Playwright page.
- **Leverage** — callers gain per unit of interface learned.
- **Locality** — change/bugs concentrate in one module.
- **Shallow** — a module whose interface is nearly as complex as its implementation.

## Test layers (current)

- **Unit** (`vite.config.js`) — node-env Vitest; `src/tests/unit/**`. Pure functions.
- **Component** (`vitest.component.config.ts`) — browser-mode Vitest via `@vitest/browser-playwright` + `vitest-browser-svelte`; `tests/**`. Renders real `.svelte` modules in headless Chromium. New (Aug 2026).
- **E2e / integration** (`playwright.config.js`) — full dev server (`bun run dev` on 5173) + real browser; `src/tests/integration/**`.

## Conventions

- Svelte 5 runes (`$state`, `$derived`, `$effect`); stores are class-based with `$` prefix convention (`store.svelte.ts`).
- SvelteKit 2, adapter-vercel, Tailwind CSS 4.
- Package manager: `bun`.
- Linting/format: `prettier --check .` + `eslint .`.
