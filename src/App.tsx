import { useEffect, useMemo, useState } from 'react';
import { DemoTag, EmptyState, Field, Landing, NotFound, Notice, PageHead, Shell, uid, useFlash, usePersistentState, useRoute } from './shared/ui';
import { demoEvents } from './lib/demo';
import { applyRsvp, availability, CATEGORIES, filterEvents, goingCount, monthGrid, spotsLeft, toISO, validateEvent, type EventItem, type Range, type Rsvp } from './lib/events';

const NAV = [
  { to: '/', label: 'Overview' },
  { to: '/events', label: 'Discover' },
  { to: '/mine', label: 'My RSVPs' },
  { to: '/create', label: 'Host an event' },
];

const dateLabel = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, opts);
};

export default function App() {
  const [route, navigate] = useRoute();
  const [events, setEvents] = usePersistentState<EventItem[]>('gatherly:events', () => demoEvents());
  const [flash, setFlash] = useFlash(5000);
  const now = new Date();
  const rsvp = (id: string, choice: Rsvp) => {
    const e = events.find((x) => x.id === id)!;
    const r = applyRsvp(e, choice, new Date());
    setEvents(events.map((x) => (x.id === id ? r.event : x)));
    setFlash({ kind: r.kind, text: r.message });
  };
  const detail = route.match(/^\/event\/(.+)$/);
  let page;
  if (route === '/') page = <Home />;
  else if (route === '/events') page = <Discover events={events} setEvents={setEvents} now={now} />;
  else if (route === '/mine') page = <Mine events={events} now={now} />;
  else if (route === '/create') page = <Create onCreate={(e) => { setEvents([...events, e]); setFlash({ kind: 'success', text: `“${e.title}” is published. You’re listed as going.` }); navigate(`/event/${e.id}`); }} />;
  else if (detail) {
    const e = events.find((x) => x.id === detail[1]);
    page = e ? <Detail e={e} now={now} rsvp={rsvp} flash={flash} clear={() => setFlash(null)} /> : <EmptyState title="Event not found" actions={<a className="btn btn-primary" href="#/events">Browse events</a>}>It may have been removed.</EmptyState>;
  } else page = <NotFound />;
  return (
    <Shell name="Gatherly" wordmark={['Gather', 'ly']} nav={NAV} route={route} cta={{ to: '/events', label: 'Find events' }}>
      {page}
    </Shell>
  );
}

function AvailBadge({ e, now }: { e: EventItem; now: Date }) {
  const a = availability(e, now);
  const left = spotsLeft(e);
  if (a === 'past') return <span className="badge">Ended</span>;
  if (a === 'full') return <span className="badge badge-err">Full · waitlist open</span>;
  if (a === 'few') return <span className="badge badge-warn">{left} spot{left === 1 ? '' : 's'} left</span>;
  return <span className="badge badge-ok">{left == null ? 'Open to all' : `${left} spots left`}</span>;
}

function RsvpTag({ r }: { r: Rsvp }) {
  if (!r) return null;
  return <span className={`rsvp-tag rsvp-${r}`}>{r === 'going' ? '✓ Going' : r === 'interested' ? '☆ Interested' : '⏳ Waitlist'}</span>;
}

function EventCard({ e, now, i = 0 }: { e: EventItem; now: Date; i?: number }) {
  const [, m, d] = e.date.split('-');
  return (
    <a className={`card event-card ${availability(e, now) === 'past' ? 'is-past' : ''}`} href={`#/event/${e.id}`} data-reveal style={{ ['--i' as string]: i % 4 }}>
      <div className="ev-date" aria-hidden="true">
        <span>{dateLabel(e.date, { month: 'short' })}</span>
        <strong>{Number(d)}</strong>
        <span>{dateLabel(e.date, { weekday: 'short' })}</span>
      </div>
      <div className="ev-body">
        <span className="label-mono">{e.category} · {e.start}–{e.end}</span>
        <h3>{e.title}</h3>
        <p className="small muted">{e.location} · hosted by {e.host}</p>
        <div className="row">
          <AvailBadge e={e} now={now} />
          <RsvpTag r={e.rsvp} />
          <span className="small muted">{goingCount(e)} going{e.capacity ? ` of ${e.capacity}` : ''}</span>
          {e.demo && <DemoTag />}
        </div>
      </div>
      <span className="sr-only">{m}</span>
    </a>
  );
}

function Home() {
  const now = new Date();
  const list = filterEvents(demoEvents(now), { query: '', category: 'all', range: 'upcoming' }, now).slice(0, 3);
  return (
    <Landing
      eyebrow="Community events · discover & RSVP"
      title={<>Something good is happening <em>near you this week.</em></>}
      lead="Browse local meetups, workshops and volunteering by date or category, see how many spots are left, and RSVP in a tap. Full events open a waitlist instead of a dead end."
      primary={{ href: '#/events', label: 'Discover events' }}
      secondary={{ href: '#/create', label: 'Host an event' }}
      previewLabel="This week — demo events"
      preview={<div className="hero-events">{list.map((e, i) => <EventCard key={e.id} e={e} now={now} i={i} />)}</div>}
      steps={[
        { title: 'Browse', body: 'Switch between a list and a month calendar; filter by category, date range or keyword.' },
        { title: 'RSVP', body: 'Going, interested, or — when it’s full — the waitlist. Change your mind any time before it starts.' },
        { title: 'Host', body: 'Publish your own event with a capacity, and it appears for everyone using this device.' },
      ]}
      stepsIntro="Gatherly opens with ten labelled demo events around today’s date, including one that is full and one that has ended."
      features={[
        { title: 'Calendar & list', body: 'A Monday-first month view with event dots, or a chronological list with dates at a glance.' },
        { title: 'Honest capacity', body: '“3 spots left”, “Full · waitlist open” and “Ended” are computed, not decorative.' },
        { title: 'My RSVPs', body: 'Everything you are going to, interested in or waitlisted for, upcoming and past.' },
        { title: 'Validated hosting', body: 'Dates in the past, end-before-start and invalid capacities are caught before publishing.' },
      ]}
      note="Gatherly is local-only: events and RSVPs live in this browser, and no one is notified. A shared backend would be needed for real community use."
      closing={{ title: <>Find your next <em>night out.</em></>, action: { href: '#/events', label: 'Discover events' } }}
    />
  );
}

function Discover({ events, setEvents, now }: { events: EventItem[]; setEvents: (e: EventItem[]) => void; now: Date }) {
  const [view, setView] = usePersistentState<'list' | 'calendar'>('gatherly:view', 'list');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [range, setRange] = useState<Range>('upcoming');
  const [cursor, setCursor] = useState(() => ({ y: now.getFullYear(), m: now.getMonth() }));
  const [selected, setSelected] = useState<string | null>(null);
  const list = useMemo(() => filterEvents(events, { query, category, range: view === 'calendar' ? 'all' : range }, now), [events, query, category, range, view, now]);
  const cells = monthGrid(cursor.y, cursor.m);
  const today = toISO(now);
  const move = (d: number) => {
    const x = new Date(cursor.y, cursor.m + d, 1);
    setCursor({ y: x.getFullYear(), m: x.getMonth() });
    setSelected(null);
  };
  useEffect(() => setSelected(null), [view]);
  return (
    <div className="stack">
      <PageHead
        eyebrow="Workspace · Discover"
        title={<>Upcoming <em>events</em></>}
        description={`${events.filter((e) => availability(e, now) !== 'past').length} upcoming · ${events.filter((e) => e.rsvp === 'going' && availability(e, now) !== 'past').length} you’re going to`}
        actions={
          <div className="seg" role="radiogroup" aria-label="View">
            <button type="button" role="radio" aria-checked={view === 'list'} onClick={() => setView('list')}>List</button>
            <button type="button" role="radio" aria-checked={view === 'calendar'} onClick={() => setView('calendar')}>Calendar</button>
          </div>
        }
      />
      <div className="card toolbar">
        <Field label="Search">{(c) => <input type="search" {...c} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title, place or host" />}</Field>
        <Field label="Category">
          {(c) => (
            <select {...c} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map((x) => <option key={x}>{x}</option>)}
            </select>
          )}
        </Field>
        {view === 'list' && (
          <Field label="When">
            {(c) => (
              <select {...c} value={range} onChange={(e) => setRange(e.target.value as Range)}>
                <option value="upcoming">All upcoming</option>
                <option value="week">Next 7 days</option>
                <option value="month">Next 31 days</option>
                <option value="past">Past events</option>
              </select>
            )}
          </Field>
        )}
      </div>
      {events.length === 0 ? (
        <EmptyState title="No events yet" actions={<><a className="btn btn-primary" href="#/create">Host the first one</a><button type="button" className="btn" onClick={() => setEvents(demoEvents())}>Load demo events</button></>}>Events you create or load appear here.</EmptyState>
      ) : view === 'list' ? (
        list.length === 0 ? (
          <EmptyState title="Nothing matches">{range === 'week' ? 'No events in the next 7 days with these filters — try “All upcoming”.' : 'Try another category or search.'}</EmptyState>
        ) : (
          <div className="event-list">{list.map((e, i) => <EventCard key={e.id} e={e} now={now} i={i} />)}</div>
        )
      ) : (
        <div className="cal-layout">
          <section className="card" aria-label="Month calendar">
            <div className="card-title-row">
              <h2>{new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
              <div className="row">
                <button type="button" className="btn btn-sm" onClick={() => move(-1)} aria-label="Previous month">←</button>
                <button type="button" className="btn btn-sm" onClick={() => setCursor({ y: now.getFullYear(), m: now.getMonth() })}>Today</button>
                <button type="button" className="btn btn-sm" onClick={() => move(1)} aria-label="Next month">→</button>
              </div>
            </div>
            <div className="cal">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="cal-head">{d}</div>)}
              {cells.map((c, i) => {
                if (!c) return <div key={`x${i}`} />;
                const dayEvents = list.filter((e) => e.date === c);
                return (
                  <button key={c} type="button" className={`cal-day ${c === today ? 'is-today' : ''} ${selected === c ? 'is-selected' : ''} ${dayEvents.length ? 'has-events' : ''}`} onClick={() => setSelected(c)} aria-label={`${dateLabel(c, { weekday: 'long', day: 'numeric', month: 'long' })}: ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}`} aria-pressed={selected === c}>
                    <span>{Number(c.slice(8))}</span>
                    <span className="cal-dots" aria-hidden="true">{dayEvents.slice(0, 3).map((e) => <i key={e.id} className={e.rsvp === 'going' ? 'going' : ''} />)}</span>
                  </button>
                );
              })}
            </div>
            <div className="legend small" style={{ marginTop: 12 }}><span><i style={{ background: 'var(--accent)' }} />You’re going</span><span><i style={{ background: 'var(--rule)' }} />Other events</span></div>
          </section>
          <section aria-live="polite" className="stack">
            <h2 className="cal-sel-title">{selected ? dateLabel(selected, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Pick a day'}</h2>
            {selected ? (
              list.filter((e) => e.date === selected).length ? list.filter((e) => e.date === selected).map((e) => <EventCard key={e.id} e={e} now={now} />) : <p className="muted">No events on this day.</p>
            ) : (
              <p className="muted">Days with dots have events. Select one to see them here.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Detail({ e, now, rsvp, flash, clear }: { e: EventItem; now: Date; rsvp: (id: string, r: Rsvp) => void; flash: { kind: 'success' | 'error' | 'info' | 'warn'; text: string } | null; clear: () => void }) {
  const a = availability(e, now);
  const left = spotsLeft(e);
  const pct = e.capacity ? Math.min(100, (goingCount(e) / e.capacity) * 100) : null;
  return (
    <div className="stack">
      <PageHead eyebrow={<><a href="#/events">← Discover</a> · {e.category}</>} title={e.title} description={<>{dateLabel(e.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {e.start}–{e.end} {e.demo && <DemoTag />}</>} />
      {flash && <Notice kind={flash.kind} onDismiss={clear}>{flash.text}</Notice>}
      <div className="detail-grid">
        <section className="card stack">
          <h2>About</h2>
          <p>{e.description || 'No description provided.'}</p>
          <dl className="facts">
            <dt>Where</dt><dd>{e.location}</dd>
            <dt>Host</dt><dd>{e.host}</dd>
            <dt>Capacity</dt><dd>{e.capacity ?? 'Unlimited'}</dd>
          </dl>
        </section>
        <aside className="card stack rsvp-card" aria-label="RSVP">
          <div className="row row-between"><AvailBadge e={e} now={now} /><RsvpTag r={e.rsvp} /></div>
          <div>
            <div className="big-count">{goingCount(e)}<small>{e.capacity ? ` / ${e.capacity}` : ''} going</small></div>
            {pct != null && <div className="progress" role="progressbar" aria-label="Places taken" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${pct}%` }} /></div>}
          </div>
          {a === 'past' ? (
            <p className="muted">This event has ended. RSVPs are closed.</p>
          ) : (
            <div className="rsvp-actions">
              <button type="button" className={`btn ${e.rsvp === 'going' || e.rsvp === 'waitlist' ? 'btn-primary' : ''}`} aria-pressed={e.rsvp === 'going' || e.rsvp === 'waitlist'} onClick={() => rsvp(e.id, e.rsvp === 'waitlist' ? 'waitlist' : 'going')}>
                {e.rsvp === 'going' ? '✓ Going — tap to cancel' : e.rsvp === 'waitlist' ? 'Leave waitlist' : left === 0 ? 'Join waitlist' : 'I’m going'}
              </button>
              <button type="button" className={`btn ${e.rsvp === 'interested' ? 'btn-primary' : ''}`} aria-pressed={e.rsvp === 'interested'} onClick={() => rsvp(e.id, 'interested')}>
                {e.rsvp === 'interested' ? '☆ Interested — undo' : 'Interested'}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Mine({ events, now }: { events: EventItem[]; now: Date }) {
  const mine = events.filter((e) => e.rsvp).sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = mine.filter((e) => availability(e, now) !== 'past');
  const past = mine.filter((e) => availability(e, now) === 'past');
  return (
    <div className="stack">
      <PageHead eyebrow="Workspace · My RSVPs" title={<>Your <em>plans</em></>} description={`${upcoming.filter((e) => e.rsvp === 'going').length} going · ${upcoming.filter((e) => e.rsvp === 'interested').length} interested · ${upcoming.filter((e) => e.rsvp === 'waitlist').length} waitlisted`} />
      {mine.length === 0 ? (
        <EmptyState title="No RSVPs yet" actions={<a className="btn btn-primary" href="#/events">Discover events</a>}>Events you mark as going or interested will gather here.</EmptyState>
      ) : (
        <>
          <h2>Upcoming</h2>
          {upcoming.length ? <div className="event-list">{upcoming.map((e, i) => <EventCard key={e.id} e={e} now={now} i={i} />)}</div> : <p className="muted">Nothing upcoming.</p>}
          {past.length > 0 && (<><h2>Past</h2><div className="event-list">{past.map((e) => <EventCard key={e.id} e={e} now={now} />)}</div></>)}
        </>
      )}
    </div>
  );
}

function Create({ onCreate }: { onCreate: (e: EventItem) => void }) {
  const now = new Date();
  const [form, setForm] = useState({ title: '', category: 'Social', date: toISO(new Date(now.getTime() + 7 * 86_400_000)), start: '18:00', end: '20:00', location: '', capacity: '', host: '', description: '' });
  const [errors, setErrors] = useState<ReturnType<typeof validateEvent>>({});
  const [flash, setFlash] = useFlash();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validateEvent(form, now);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFlash({ kind: 'error', text: 'Not published — fix the highlighted fields.' });
      return;
    }
    onCreate({ id: uid('ev'), title: form.title.trim(), category: form.category, date: form.date, start: form.start, end: form.end, location: form.location.trim(), host: form.host.trim(), description: form.description.trim(), capacity: form.capacity.trim() ? Number(form.capacity) : null, othersGoing: 0, rsvp: 'going' });
  }
  return (
    <div className="stack narrow">
      <PageHead eyebrow="Workspace · Host" title={<>Host an <em>event</em></>} description="Published events are saved in this browser." />
      {flash && <Notice kind={flash.kind}>{flash.text}</Notice>}
      <form className="card stack" onSubmit={submit} noValidate>
        <Field label="Title" error={errors.title}>{(c) => <input type="text" {...c} value={form.title} onChange={set('title')} placeholder="e.g. Saturday park run" />}</Field>
        <div className="form-grid">
          <Field label="Category" error={errors.category}>{(c) => <select {...c} value={form.category} onChange={set('category')}>{CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select>}</Field>
          <Field label="Date" error={errors.date}>{(c) => <input type="date" {...c} value={form.date} onChange={set('date')} />}</Field>
          <Field label="Starts" error={errors.start}>{(c) => <input type="time" {...c} value={form.start} onChange={set('start')} />}</Field>
          <Field label="Ends" error={errors.end}>{(c) => <input type="time" {...c} value={form.end} onChange={set('end')} />}</Field>
          <Field label="Location" error={errors.location}>{(c) => <input type="text" {...c} value={form.location} onChange={set('location')} />}</Field>
          <Field label="Host" error={errors.host}>{(c) => <input type="text" {...c} value={form.host} onChange={set('host')} />}</Field>
          <Field label="Capacity" error={errors.capacity} hint="Leave empty for unlimited">{(c) => <input type="number" min={1} {...c} value={form.capacity} onChange={set('capacity')} />}</Field>
        </div>
        <Field label="Description">{(c) => <textarea {...c} rows={4} value={form.description} onChange={set('description')} />}</Field>
        <button type="submit" className="btn btn-primary">Publish event</button>
      </form>
    </div>
  );
}
