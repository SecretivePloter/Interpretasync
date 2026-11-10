-- Deploy previous frontend first. Dropping this table also removes publication membership.
begin;
drop trigger if exists calendar_display_events_changed on ichikara.events;
drop trigger if exists calendar_display_interpreters_changed on ichikara.interpreters;
drop function if exists ichikara.notify_calendar_display_change();
drop table if exists ichikara.calendar_display_revision;
commit;
