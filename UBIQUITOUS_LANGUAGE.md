# Ubiquitous Language

## Schedule domain

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **School year** | The live academic period (e.g. `2025-2026-2`) that drives which data file the schedule page loads. | Term, semester |
| **School events** | A plain-text TSV of class/meet-day rows that the schedule renders; the source data passed into the schedule derivation. | Events, data file |
| **Class type** | One of `CLIL` \| `Comm` \| `G9` \| `H` — the radio-bound selector that re-derives the displayed table, CSV, and download filename. | Class, subject |
| **Class day** | A single class/meet row derived from school events: countdown, date, weekday, description, note. | Day, record |
| **Checked days** | A 5-element boolean set (Mon…Fri) selecting which weekdays appear in the schedule. | Filters, days |
| **Schedule name** | The computed download filename stem `"<shortYear> S<semester> <classType> schedule"`. | Filename, title |

## Communication domain

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Communication record** | A saved white slip: assignment, dates (assigned/due/late), student set, signature, and grade/class context, persisted in localStorage. | Record, saved record |
| **Student** | A row in the student table: name, class, status code, with an optional selection flag; resolved to statuses on slips. | Row, entry |
| **White Slip** | The printed bilingual (Traditional Chinese + English) communication slip rendered per student. | Slip, printout |
| **Assignment** | A code from the assignment set (`basic`, `workbook`, `passport`, `oral`, …) that drives the bilingual slip content. | Type, assignment type |
| **Signature** | A base64 data-URL image uploaded once, persisted, and shown on each slip. | Sig, teacher signature |

## ZipGrade domain

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **ZipGrade sheet** | The multiple-choice answer sheet: 65 questions × 5 bubbles (A–E), with editor and static print forms. | Sheet, scantron, answer sheet |
| **Answer** | A single question's selected letters (e.g. `['A','C']`), stored per question index 1…65. | Bubble |
| **Bubble** | The on-sheet circle for one (question, letter) pair; clicking toggles one letter of an answer. | Toggle |

## Relationships

- A **School year** selects one **School events** text.
- A **School events** text resolves to many **Class day** rows.
- A **Class type** + **Checked days** + **School events** yield a derived schedule (**Schedule name**, CSV, row set).
- A **Communication record** contains many **Student** rows and one **Assignment**, and shows one **Signature** on each **White Slip**.
- A **ZipGrade sheet** answer set is one **Answer** per question across 65 questions, each made of zero or more toggled **Bubble** letters.

## Example dialogue

> **Dev:** "If a **Class type** changes, should the **Checked days** reset?"
> **Domain expert:** "No — **Checked days** are independent of **Class type**. Switching from `Comm` to `CLIL` just re-derives which **Class day** rows and which **Schedule name** are shown, keeping the same weekday selection."
> **Dev:** "And the **White Slip** — is a new **Communication record** created when the teacher adds a student?"
> **Domain expert:** "Exactly. Each **Student** row on a form maps to one **White Slip** on the print page. The **Signature** is shared across all of them, captured once per **Communication record**."
> **Dev:** "For the **ZipGrade sheet**, does toggling a **Bubble** always add a letter to the **Answer**, or can it clear?"
> **Domain expert:** "It toggles: one click on an already-set **Bubble** removes that letter from the **Answer**. A **ZipGrade sheet** with a fully empty **Answer** for a question is a valid unanswered question."
> **Dev:** "So the print page shares the same answer-set via persistence?"
> **Domain expert:** "Right — the print page constructs a fresh store that reloads the same persisted answers; the persistence seam is what links editor and print."

## Flagged ambiguities

- "slip" vs "record" vs "white slip": the codebase uses both `Slip.svelte` (a single printed sheet) and `recordManager` (the saved JSON). Canonicalise: **Communication record** = the saved bundle; **White Slip** = one printed rendered slip per student. Avoid using "slip" alone.
- "sheet" vs "scantron" vs "zipgrade": the repo was renamed from "Scantron" to "ZipGrade" (commit 3688cff). Canonical term: **ZipGrade sheet**. Drop legacy "scantron" except in git history.
- "schedule" overloaded: the repo is "HWIS Class Scheduler" (the whole app) but the `/` route is the schedule grid. Canonical: **Class day** / **School events** for the grid concepts; "schedule" only as the short adjective in "schedule name" / "schedule page". Avoid "schedule" for individual rows.
