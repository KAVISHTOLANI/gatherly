import { describe, expect, it } from 'vitest';
import { applyRsvp, availability, filterEvents, monthGrid, spotsLeft, validateEvent, type EventItem } from './events';

const now = new Date(2026, 2, 10, 12, 0); // Tue 10 Mar 2026 12:00
const ev = (o: Partial<EventItem>): EventItem => ({ id: 'e', title: 'Board games', category: 'Social', date: '2026-03-12', start: '18:00', end: '21:00', location: 'Library', description: '', host: 'Club', capacity: 10, othersGoing: 4, rsvp: null, ...o });

describe('capacity and RSVP', () => {
  it('counts spots including you', () => {
    expect(spotsLeft(ev({}))).toBe(6);
    expect(spotsLeft(ev({ rsvp: 'going' }))).toBe(5);
    expect(spotsLeft(ev({ capacity: null }))).toBeNull();
  });
  it('labels availability', () => {
    expect(availability(ev({ othersGoing: 10 }), now)).toBe('full');
    expect(availability(ev({ othersGoing: 8 }), now)).toBe('few');
    expect(availability(ev({ date: '2026-03-09' }), now)).toBe('past');
    expect(availability(ev({ date: '2026-03-10', end: '11:59' }), now)).toBe('past');
    expect(availability(ev({}), now)).toBe('open');
  });
  it('moves you to the waitlist when full and blocks past events', () => {
    expect(applyRsvp(ev({ othersGoing: 10 }), 'going', now)).toMatchObject({ event: { rsvp: 'waitlist' }, kind: 'info' });
    expect(applyRsvp(ev({}), 'going', now)).toMatchObject({ event: { rsvp: 'going' }, kind: 'success' });
    expect(applyRsvp(ev({ rsvp: 'going' }), 'going', now).event.rsvp).toBeNull();
    expect(applyRsvp(ev({ date: '2026-03-01' }), 'going', now).kind).toBe('error');
  });
});

describe('filtering and calendar', () => {
  const list = [ev({ id: 'a', date: '2026-03-11' }), ev({ id: 'b', date: '2026-04-30', category: 'Arts', title: 'Life drawing' }), ev({ id: 'c', date: '2026-03-01' })];
  it('filters by range, category and text', () => {
    expect(filterEvents(list, { query: '', category: 'all', range: 'upcoming' }, now).map((e) => e.id)).toEqual(['a', 'b']);
    expect(filterEvents(list, { query: '', category: 'all', range: 'week' }, now).map((e) => e.id)).toEqual(['a']);
    expect(filterEvents(list, { query: '', category: 'all', range: 'past' }, now).map((e) => e.id)).toEqual(['c']);
    expect(filterEvents(list, { query: 'drawing', category: 'all', range: 'all' }, now).map((e) => e.id)).toEqual(['b']);
    expect(filterEvents(list, { query: '', category: 'Arts', range: 'all' }, now).map((e) => e.id)).toEqual(['b']);
  });
  it('builds a Monday-first month grid', () => {
    const g = monthGrid(2026, 2);
    expect(g[6]).toBe('2026-03-01');
    expect(g.length % 7).toBe(0);
  });
  it('validates events', () => {
    const e = validateEvent({ title: '', category: '', date: '2026-03-01', start: '18:00', end: '17:00', location: '', capacity: '0', host: '' }, now);
    expect(Object.keys(e).sort()).toEqual(['capacity', 'category', 'date', 'end', 'host', 'location', 'title']);
    expect(validateEvent({ title: 'Picnic', category: 'Food', date: '2026-03-20', start: '12:00', end: '14:00', location: 'Park', capacity: '', host: 'Me' }, now)).toEqual({});
  });
});
