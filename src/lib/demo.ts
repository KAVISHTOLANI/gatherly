import { addDays, toISO, type EventItem } from './events';

export function demoEvents(now = new Date()): EventItem[] {
  const t = toISO(now);
  const e = (id: string, title: string, category: string, day: number, start: string, end: string, location: string, host: string, capacity: number | null, othersGoing: number, description: string, rsvp: EventItem['rsvp'] = null): EventItem => ({ id, title, category, date: addDays(t, day), start, end, location, host, capacity, othersGoing, description, rsvp, demo: true });
  return [
    e('demo-1', 'Community garden work morning', 'Volunteering', 1, '09:00', '12:00', 'Elm Street Allotments', 'Elm Street Gardeners', 20, 11, 'Weeding, compost turning and planting garlic. Gloves and tea provided.'),
    e('demo-2', 'Beginner bouldering social', 'Sport', 2, '18:30', '20:30', 'Crux Climbing Centre', 'Climb Together', 12, 12, 'Shoe hire included. No experience needed — instructors on hand.'),
    e('demo-3', 'Board game night', 'Social', 3, '19:00', '22:30', 'The Corner Café (back room)', 'Dice & Coffee', 30, 26, 'Bring a game or borrow one of ours. Snacks for sale.', 'going'),
    e('demo-4', 'Intro to bread baking', 'Learning', 5, '10:00', '13:00', 'Community Kitchen, Hall B', 'Neighbourhood Bakers', 8, 5, 'Hands-on session: shaping, proofing and scoring a basic loaf. Take your loaf home.', 'interested'),
    e('demo-5', 'Riverside litter pick', 'Volunteering', 6, '10:00', '12:00', 'Meet at the footbridge', 'Clean River Group', null, 34, 'Bags, pickers and hi-vis provided. Families welcome.'),
    e('demo-6', 'Life drawing (untutored)', 'Arts', 8, '19:00', '21:00', 'Studio 4, Arts Centre', 'Open Studio Collective', 15, 9, 'Bring your own materials. Easels available.'),
    e('demo-7', 'Sunset walk up Beacon Hill — moderate pace, about 8 km with one steep climb and a café stop on the way down', 'Outdoors', 9, '16:00', '19:00', 'Beacon Hill car park', 'Weekend Walkers', 25, 7, 'Sturdy shoes and a head torch recommended.'),
    e('demo-8', 'Neighbourhood potluck', 'Food', 13, '18:00', '21:00', 'St Anne’s Community Hall', 'Residents’ Association', 60, 18, 'Bring a dish to share and a label listing allergens.'),
    e('demo-9', 'Repair café', 'Learning', 20, '13:00', '16:00', 'Library meeting room', 'Fix-It Volunteers', null, 0, 'Bring broken lamps, clothes, bikes or small electronics. Free.'),
    e('demo-10', 'Open mic poetry', 'Arts', -4, '19:30', '22:00', 'The Lantern Bar', 'Verse Night', 40, 32, 'Sign-up sheet at the door from 19:00.', 'going'),
  ];
}
