import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { portfolioRecords, renderPortfolioDetail, renderPortfolioPlayer, wrapPortfolioIndex } from './portfolio-player.js';

test('builds portfolio folders from the image asset directories', () => {
  assert.deepEqual(portfolioRecords.map((record) => record.title), ['接单', '练习', '作业']);
  portfolioRecords.forEach((record) => {
    assert.equal(record.tags.length, 3);
    assert.match(record.accent, /^#[0-9a-f]{6}$/i);
    assert.ok(Array.isArray(record.files));
  });
  assert.equal(portfolioRecords.find((record) => record.id === '作业').files.some((file) => file.name.endsWith('.dwg')), true);
});

test('renders an animated file-box player with folder navigation', () => {
  const html = renderPortfolioPlayer(portfolioRecords[2], 2, portfolioRecords.length);

  assert.match(html, /class="portfolio-player"/);
  assert.match(html, /class="portfolio-file-box"/);
  assert.match(html, /class="portfolio-folder is-active"/);
  assert.match(html, /portfolio-folder-tab">WORK/);
  assert.doesNotMatch(html, /portfolio-folder-preview/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /data-portfolio-direction="-1"/);
  assert.match(html, /data-portfolio-direction="1"/);
  assert.match(html, /作业/);
  assert.match(html, /03 \/ 03/);
  assert.match(html, /data-portfolio-open/);
  assert.match(html, /portfolio-title-link/);
});

test('renders an actionable detail view for the active portfolio record', () => {
  const html = renderPortfolioDetail(portfolioRecords[2], 2, portfolioRecords.length);

  assert.match(html, /class="portfolio-detail"/);
  assert.match(html, /data-portfolio-back/);
  assert.match(html, /作业/);
  assert.match(html, /WORKS \/ 11/);
  assert.match(html, /ARCHIVE FILES/);
  assert.match(html, /class="portfolio-detail-preview"/);
  assert.match(html, /data-portfolio-image="0"/);
  assert.match(html, /class="portfolio-gallery-button"/);
});

test('wraps folder navigation indexes', () => {
  assert.equal(wrapPortfolioIndex(-1, portfolioRecords.length), 2);
  assert.equal(wrapPortfolioIndex(3, portfolioRecords.length), 0);
});

test('main binds the Work panel to the four-folder portfolio player', () => {
  const source = fs.readFileSync(new URL('./main.js', import.meta.url), 'utf8');

  assert.match(source, /portfolioRecords/);
  assert.match(source, /renderPortfolioPlayer/);
  assert.match(source, /detail-panel--portfolio/);
  assert.match(source, /changePortfolioRecord/);
  assert.match(source, /data-portfolio-direction/);
  assert.match(source, /portfolioWheelThreshold/);
  assert.match(source, /renderPortfolioDetail/);
  assert.match(source, /openPortfolioDetail/);
  assert.match(source, /data-portfolio-back/);
  assert.match(source, /portfolioDetailOpen/);
  assert.match(source, /portfolioLightboxIndex/);
  assert.match(source, /openPortfolioLightbox/);
  assert.match(source, /stepPortfolioLightbox/);
  assert.match(source, /addEventListener\('keydown'/);
});
