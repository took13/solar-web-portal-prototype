import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('clearly marks simulated data, without implying live SQL connectivity', async ({ page }) => {
  await expect(page.getByText('DEMO / SYNTHETIC DATA')).toBeVisible();
  await expect(page.getByText('STATIC · NO BACKEND')).toBeVisible();
  await expect(page.getByText('No login · No SQL')).toBeVisible();
});

test('requires explicit preview and filters individual sites', async ({ page }) => {
  await page.locator('#nav-explorer').click();
  await expect(page.locator('#explorerTbody')).toContainText('Ready to explore');
  await page.locator('#sourceFilter').selectOption('huawei');
  await page.locator('#ux-site-Plant-HW-01').uncheck();
  await expect(page.locator('#explorerQueryState')).toContainText('Query not run');
  await page.locator('#runPreviewBtn').click();
  await expect(page.locator('#explorerTbody')).toContainText('Plant-HW-04');
  await expect(page.locator('#explorerTbody')).not.toContainText('Plant-HW-01');
  await expect(page.locator('#gridMetaCount')).toContainText('illustrative');
  await page.locator('#explorerOpenTrendBtn').click();
  await expect(page.locator('#uxSeriesLegend')).toContainText('HW-04');
  await expect(page.locator('#uxSeriesLegend')).not.toContainText('HW-01');
  await page.locator('#trendBackExplorerBtn').click();
  await expect(page.locator('#explorerQueryState')).toContainText('Demo preview ready');
  await page.locator('#paramChkEnergy').uncheck();
  await expect(page.locator('#explorerQueryState')).toContainText('Query not run');
});

test('preserves NULL gaps for SolarEdge and supports keyboard trend readout', async ({ page }) => {
  await page.locator('#nav-explorer').click();
  await page.locator('#expGroupSelect').selectOption('custom');
  await page.locator('#sourceFilter').selectOption('solaredge');
  await page.locator('#runPreviewBtn').click();
  await page.locator('#explorerOpenTrendBtn').click();
  await expect(page.locator('#uxSeriesLegend')).toContainText('SE-02');
  await expect(page.locator('#uxTrendTable')).toContainText('NULL');
  await page.locator('#trendCanvas').focus();
  await page.keyboard.press('End');
  await expect(page.locator('#trendReadout')).toContainText('18:00');
});

test('disables 5-minute resolution for selected Glow utility source', async ({ page }) => {
  await page.locator('#nav-explorer').click();
  await page.locator('#expGroupSelect').selectOption('glow_meter');
  await expect(page.locator('#res-5m')).toBeDisabled();
  await expect(page.locator('#resHint')).toContainText('5m unavailable');
});

test('remembers theme and supports keyboard command palette', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('solar-prototype-theme', 'dark'));
  await page.reload();
  await page.locator('#themeToggleBtn').click();
  await expect(page.locator('#app')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('#app')).toHaveAttribute('data-theme', 'light');
  await page.keyboard.press('Control+k');
  await expect(page.locator('#cmdInput')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#cmdModal')).not.toHaveClass(/open/);
});

test('mobile navigation shows and closes after choosing a page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#mobileMenuBtn').click();
  await expect(page.locator('#sidebar')).toHaveClass(/mobile-open/);
  await page.locator('#nav-catalog').click();
  await expect(page.locator('#sidebar')).not.toHaveClass(/mobile-open/);
  await expect(page.locator('#pageTitle')).toHaveText('Data Catalog');
});

test('simulated export cannot claim a real file or worker', async ({ page }) => {
  await page.locator('#nav-explorer').click();
  await page.locator('#runPreviewBtn').click();
  await page.locator('#explorerQueueExportBtn').click();
  await page.locator('#nav-exports').click();
  await expect(page.locator('#exportsTbody')).toContainText('DEMO QUEUED');
  await expect(page.locator('#exportsTbody')).toContainText('No file / no TTL');
  await page.locator('[id^="cancelJobBtn-"]').first().click();
  await expect(page.locator('#exportsTbody')).toContainText('Demo cancelled');
});
