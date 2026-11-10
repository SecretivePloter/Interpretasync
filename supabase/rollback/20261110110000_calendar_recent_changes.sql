-- First deploy the previous frontend (84b2276), then remove only feature 4 metadata.
begin;
drop function if exists ichikara.public_display_calendar_v2(date, date);
drop trigger if exists events_track_calendar_change on ichikara.events;
drop function if exists ichikara.track_calendar_change();
alter table ichikara.events drop column if exists calendar_changed_at;
alter table ichikara.events drop column if exists calendar_change_fields;
commit;
