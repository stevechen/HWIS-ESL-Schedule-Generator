# ADR 0001: Display repeated assignment reminders once per range

- Status: Accepted
- Date: 2026-08-25

## Context

School event data can list the same assignment reminder at multiple dates. The source schedule uses those dates to describe a due-date window for Passport, Recording, Workbook, and Unit test work. The generated schedule is filtered by selected class weekdays and must remain easy to copy into a spreadsheet.

The same date can also contain unrelated events, and exams may intentionally occupy multiple separate dates. Therefore, repeated reminder handling must be narrower than general event deduplication.

## Decision

Treat two or more occurrences of the same recognized assignment reminder as one inclusive reminder range. Recognize reminders case-insensitively, tolerating extra whitespace and known source-data wording variants or typos. Match the reminder identity using its normalized displayed text and event type.

Remove the repeated reminder from its source dates and display it once on the latest selected weekday within the inclusive range that is an actual class day. A class day marked `Off` or containing `no class` is not eligible. A reminder with only one source occurrence remains on its original date. If no eligible selected class day exists, omit the reminder.

Do not apply range handling to exams or other events. Preserve unrelated events on their original dates. If the selected destination date already contains events, merge descriptions independently from notes, preserving source order, omitting blank fields, and removing identical displayed text. Join multiple values with `; ` so each date remains one row and each schedule field remains spreadsheet-safe.

Apply this behavior generically to all school-event data files, including legacy files.

## Consequences

- A repeated reminder appears once rather than once per source boundary date.
- Selected weekday choices affect the destination date of a reminder.
- Same-day events remain in one schedule row and copy cleanly into spreadsheet columns.
- The event parser or schedule transformation must retain enough source-event information to distinguish reminder ranges from independent events.
- Existing exam and non-reminder event behavior remains unchanged.

## Examples

- `Passport 1 due` on Monday and Friday displays on the latest eligible selected class day between those dates.
- Three `Exam` entries remain three separate exam events.
- A reminder destination containing an exam keeps both values in the same row, with each field joined by `; ` as needed.
