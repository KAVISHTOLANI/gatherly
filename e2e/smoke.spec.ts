import { expect, test } from '@playwright/test';
import { checkMobile, snap } from './helpers';

test('discover in list and calendar, RSVP, see it in My RSVPs', async ({ page }) => {
  await page.goto('./');
  await page.waitForTimeout(1000);
  await snap(page, 'landing');
  await checkMobile(page, 'landing-mobile');
  await page.getByRole('link', { name: 'Discover events' }).first().click();
  await expect(page.locator('.event-card').first()).toBeVisible();
  await snap(page, 'discover');
  await checkMobile(page);

  await page.getByRole('radio', { name: 'Calendar' }).click();
  await page.locator('.cal-day.has-events').first().click();
  await expect(page.locator('.cal-layout .event-card').first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await snap(page, 'calendar');
  await page.getByRole('radio', { name: 'List' }).click();

  await page.getByRole('link', { name: /Intro to bread baking/ }).click();
  await page.getByRole('button', { name: 'I’m going' }).click();
  await expect(page.getByText(/You’re going!/)).toBeVisible();
  await page.reload();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'My RSVPs' }).click();
  await expect(page.getByRole('link', { name: /Intro to bread baking/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open mic poetry/ })).toBeVisible();
});
