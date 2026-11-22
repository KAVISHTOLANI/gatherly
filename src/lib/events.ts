export type Rsvp = 'going' | 'interested' | 'waitlist' | null;

export interface EventItem {
  id: string;
  title: string;
  category: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string;
  location: string;
  description: string;
  host: string;
  capacity: number | null; // null = unlimited
  othersGoing: number; // attendees other than you
  rsvp: Rsvp;
  demo?: boolean;
}

export const CATEGORIES = ['Social', 'Learning', 'Outdoors', 'Arts', 'Volunteering', 'Sport', 'Food'];

export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split('-').map(Number);
  return toISO(new Date(y, m - 1, d + n));
}

export function goingCount(e: EventItem) {
  return e.othersGoing + (e.rsvp === 'going' ? 1 : 0);
}

export function spotsLeft(e: EventItem): number | null {
  return e.capacity == null ? null : Math.max(0, e.capacity - goingCount(e));
}

export function isPast(e: EventItem, now: Date) {
  return `${e.date}T${e.end}` < `${toISO(now)}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export type Availability = 'past' | 'full' | 'few' | 'open';
export function availability(e: EventItem, now: Date): Availability {
  if (isPast(e, now)) return 'past';
  const left = spotsLeft(e);
  if (left === 0 && e.rsvp !== 'going') return 'full';
  if (left != null && left <= 3) return 'few';
  return 'open';
}

/** Applies an RSVP choice. Going on a full event becomes a waitlist place; past events cannot change. */
export function applyRsvp(e: EventItem, choice: Rsvp, now: Date): { event: EventItem; message: string; kind: 'success' | 'error' | 'info' } {
  if (isPast(e, now)) return { event: e, message: 'This event has already ended, so RSVPs are closed.', kind: 'error' };
  if (choice === 'going' && e.rsvp !== 'going' && spotsLeft(e) === 0) {
    return { event: { ...e, rsvp: 'waitlist' }, message: 'The event is full — you are on the waitlist.', kind: 'info' };
  }
  const next = { ...e, rsvp: e.rsvp === choice ? null : choice };
  const msg = next.rsvp === 'going' ? 'You’re going! It’s in My RSVPs.' : next.rsvp === 'interested' ? 'Marked as interested.' : 'RSVP removed.';
  return { event: next, message: msg, kind: 'success' };
}

export type Range = 'upcoming' | 'week' | 'month' | 'past' | 'all';

export function filterEvents(list: EventItem[], f: { query: string; category: string; range: Range }, now: Date) {
  const today = toISO(now);
  const q = f.query.trim().toLowerCase();
  return list
    .filter((e) => f.category === 'all' || e.category === f.category)
    .filter((e) => !q || [e.title, e.location, e.description, e.host].some((s) => s.toLowerCase().includes(q)))
    .filter((e) => {
      const past = isPast(e, now);
      if (f.range === 'all') return true;
      if (f.range === 'past') return past;
      if (past) return false;
      if (f.range === 'week') return e.date <= addDays(today, 7);
      if (f.range === 'month') return e.date <= addDays(today, 31);
      return true;
    })
    .sort((a, b) => (f.range === 'past' ? -1 : 1) * `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
}

export function monthGrid(year: number, month: number): (string | null)[] {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(toISO(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function validateEvent(input: { title: string; category: string; date: string; start: string; end: string; location: string; capacity: string; host: string }, now: Date) {
  const errors: Partial<Record<keyof typeof input, string>> = {};
  if (!input.title.trim()) errors.title = 'Give the event a title.';
  else if (input.title.trim().length > 90) errors.title = 'Keep the title under 90 characters.';
  if (!CATEGORIES.includes(input.category)) errors.category = 'Choose a category.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) errors.date = 'Pick a date.';
  else if (input.date < toISO(now)) errors.date = 'The date is in the past.';
  if (!/^\d{2}:\d{2}$/.test(input.start)) errors.start = 'Pick a start time.';
  if (!/^\d{2}:\d{2}$/.test(input.end)) errors.end = 'Pick an end time.';
  else if (!errors.start && input.end <= input.start) errors.end = 'The event must end after it starts.';
  if (!input.location.trim()) errors.location = 'Say where it happens.';
  if (!input.host.trim()) errors.host = 'Who is hosting?';
  if (input.capacity.trim()) {
    const c = Number(input.capacity);
    if (!Number.isInteger(c) || c < 1 || c > 10000) errors.capacity = 'Capacity must be a whole number from 1 to 10,000, or left empty for unlimited.';
  }
  return errors;
}
