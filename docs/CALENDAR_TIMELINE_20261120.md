# Calendar Timeline, 20 November 2026

## Behavior

Calendar now offers Mingguan, Bulanan and Timeline. The default remains Bulanan
until the user chooses another view. The choice persists in
`ichikara-calendar-view`; an unavailable localStorage does not block rendering.
Timeline shows seven days starting Monday. The other views retain their behavior.

- One assignment strip, no duplicated plan lane or permanent detail panel.
- Reguler uses the existing grey palette, Project the existing interpreter colors.
- Companies group by explicit `company`, then linked Order `client_name`. Legacy
  records with neither retain their full title as the row label. No abbreviation
  or company is guessed, and records are not modified to normalize company names.
- Only identical assignments on consecutive calendar dates join visually.
  Weekends/missing dates, changed interpreter, job, location or time break strips.
  Each strip keeps the original daily records and IDs. A pointer click selects
  the date under that point; keyboard activation selects the first date.
- Several jobs on the same company/date get separate lanes, including jobs at
  different times. None are discarded or drawn on top of another strip.
- Click a date header for the existing Project creation form. Click a blank row
  cell to prefill that date, company/title and type. A Reguler cell preselects
  exactly that date as its range, including its weekday; the user may deliberately
  extend it in the existing recurrence form. No interpreter is automatically assigned.
- Click a strip or highlight card to open the existing EventModal directly.
- Timeline highlights support Hari ini, Besok and arbitrary dates. Changing the
  highlight date moves Timeline to that week. Week navigation does not silently
  change the highlighted date. Real dates, no fixed November fixture, are used.
- Midnight/focus refresh updates Today. A deliberately selected date is retained.
  Unassigned duties appear first. Up to six cards are shown initially, with an
  explicit Lihat semua/Ringkas toggle. The expanded list can scroll on short screens.
  Cards are grouped by interpreter, except unassigned jobs remain individual.
- Highlights show all duties, even when calendar filters hide some assignments.
  Timeline respects the existing interpreter/Reguler filters and offers reset.

## Data, safety and limitations

No schema, RLS, Storage, RPC, Edge Function or WhatsApp change. Existing CRUD,
authentication and Realtime feed the new view. No production schedules were
inserted/updated/deleted for verification. Public/TV calendar is unchanged.

The real schema has no confirmed substitute, leave or pending-response fields.
Those simulated draft states are not fabricated in production. A regular
interpreter change is visualized from the actual per-date assignments, without
claiming a documented reason or historical handover. Existing daily edit/delete
semantics remain intact. Structured leave/handover audit history is separate work.

Gold stars reuse the existing important-change 24-hour logic. A red urgent mark
means an actual assignment for today's local calendar date still has no interpreter,
using the verified placeholder/null/name helper. It does not mean attendance is
confirmed or infer a pending response. Regular conflict protection and the existing
legacy Project/Project conflict behavior are unchanged. Date boundaries follow the
same browser-local calendar convention as the existing calendar.

## Files

- `src/pages/CalendarPage.jsx`: third view, persisted choice, modal prefills/date selection.
- `src/hooks/useCalendar.js`: expose the existing current-date setter.
- `src/hooks/useTodayDate.js`: local-day rollover/focus/visibility refresh.
- `src/utils/timelineLayout.js`: pure grouping, consecutive runs, lanes and daily hit selection.
- `src/components/calendar/TimelineGrid.jsx`: actual strips, cells and compact legend.
- `src/components/calendar/TimelineDutyHighlights.jsx`: selectable date and duty cards.
- `src/components/calendar/timeline.css`: responsive, theme-token based styles.
- `scripts/timeline-layout.test.mjs`: layout/date integrity regression cases.

## Verification

Automated pure tests cover month/year boundaries, legacy company fallback, order
client resolution, independent Reguler/Project groups, merging/splitting, duplicate
same-date records, collision-free lanes, replacement continuity, pointer/keyboard
date selection, deterministic input order and no input mutation.

Browser fixture uses the real CalendarPage, AppLayout/sidebar, stores, EventModal
and CRUD service with synthetic data and mocked HTTP. It is ignored/excluded from
Vercel; its credentials are fake. Verified:

- Mixed types, urgent placeholder, highlight tomorrow/custom date and empty day.
- Date header -> one Project POST, correct date/company payload.
- Sunday Reguler cell -> exactly one INSERT-array row for that Sunday.
- Click second day of a merged strip -> PATCH only that original daily ID.
- Saving splits changed strips; other dates remain in the store.
- Existing monthly/weekly views and Reguler toggle still work; highlight remains
  unfiltered. localStorage view choice survives reload.
- Midnight rollover changes Today without resetting an explicitly selected date.
- Root horizontal overflow is zero at 390, 1024 and 1440px, light and dark, with
  the real sidebar layout. Grid scrolling stays internal.
- A separate screenshot review checked legibility and collisions. The highlight
  list now has explicit expansion and prioritizes unassigned jobs. Toasts in the
  frozen browser clock test were allowed their real 3-second lifetime before capture;
  shared production Toast behavior was not changed.

Positive logged-in production CRUD and two-user Realtime are not claimed from
mocked browser tests. Production deployment status is verified separately by Vercel.

## Manual acceptance checklist

- [ ] Login as management; Calendar -> Timeline, then reload: choice remains.
- [ ] Check Reguler grey, Project interpreter colors and all concurrent jobs visible.
- [ ] Check Hari ini, Besok, chosen date, empty day, Lihat semua and Ringkas.
- [ ] Click blank cell/date: correct prefill; save only an intentional test schedule.
- [ ] Click desired date within merged strip: correct original record in form;
      editing one date must not edit the surrounding dates or the contract series.
- [ ] Check a conflicting Reguler assignment is rejected through existing checks.
- [ ] Use two management sessions: create/edit on one, confirm Timeline refreshes
      through the existing Realtime store on the other.
- [ ] Check legend and cards on mobile, light/dark, and both existing calendar views.

## Checkpoint, release and rollback

Before changes: `codex/checkpoint-before-timeline-20261120` points to
`4cccbf71a362a3ed423d37382a8ab52b017c7582`. Its source tree was verified equal
to the release checkout before the new work. The previous Production deployment is
`https://interpretasync-pj8jlk0u9-secretiveploters-projects.vercel.app`
(`dpl_y1acvxcQp2HrtJ6Gz8Mj64rubeTn`).

Use an isolated clean checkout or an explicit file allowlist. Do not include the
user-owned dirty `.gitignore`, `.local`, `.playwright-cli`, `.env*`, or Supabase CLI
temp files. No secrets or fixtures belong in the commit/package.

For rollback, promote that previous deployment in Vercel, or revert the Timeline
feature commit on main and deploy again. The old application ignores the new
localStorage view key. There is no DB migration to roll back and no schedule data
needs deletion. Keep later unrelated commits when reverting code.
