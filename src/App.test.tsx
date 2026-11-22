import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Gatherly workflow', () => {
  it('lists labelled demo events and filters them', async () => {
    window.location.hash = '/events';
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getAllByText('Demo data').length).toBe(9); // 10 demo events, one already ended
    await user.selectOptions(screen.getByLabelText('Category'), 'Arts');
    expect(screen.getByText('Life drawing (untutored)')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('When'), 'past');
    expect(screen.getByText('Open mic poetry')).toBeInTheDocument();
    expect(screen.getByText('Ended')).toBeInTheDocument();
  });

  it('RSVPs going, and joins the waitlist when an event is full', async () => {
    window.location.hash = '/event/demo-1';
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'I’m going' }));
    expect(screen.getByText(/You’re going!/)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    unmount();
    window.location.hash = '/event/demo-2';
    render(<App />);
    expect(screen.getByText('Full · waitlist open')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Join waitlist' }));
    expect(screen.getByText(/you are on the waitlist/)).toBeInTheDocument();
  });

  it('validates and publishes a hosted event', async () => {
    window.location.hash = '/create';
    const user = userEvent.setup();
    render(<App />);
    await user.clear(screen.getByLabelText('Ends'));
    await user.type(screen.getByLabelText('Ends'), '17:00');
    await user.type(screen.getByLabelText('Capacity'), '0');
    await user.click(screen.getByRole('button', { name: 'Publish event' }));
    expect(screen.getByText('Give the event a title.')).toBeInTheDocument();
    expect(screen.getByText('The event must end after it starts.')).toBeInTheDocument();
    expect(screen.getByText(/Capacity must be a whole number/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Title'), 'Park run');
    await user.clear(screen.getByLabelText('Ends'));
    await user.type(screen.getByLabelText('Ends'), '20:00');
    await user.clear(screen.getByLabelText('Capacity'));
    await user.type(screen.getByLabelText('Location'), 'Victoria Park');
    await user.type(screen.getByLabelText('Host'), 'Me');
    await user.click(screen.getByRole('button', { name: 'Publish event' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Park run' })).toBeInTheDocument();
    expect(screen.getByText(/is published/)).toBeInTheDocument();
  });

  it('shows the empty RSVP state', () => {
    localStorage.setItem('gatherly:events', '[]');
    window.location.hash = '/mine';
    render(<App />);
    expect(screen.getByText('No RSVPs yet')).toBeInTheDocument();
  });
});
