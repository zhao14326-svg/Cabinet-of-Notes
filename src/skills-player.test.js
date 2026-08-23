import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { renderSkillsPlayer, skillRecords, wrapSkillIndex } from './skills-player.js';

test('defines the three approved skill records', () => {
  assert.deepEqual(skillRecords.map((record) => record.title), [
    'Creative Code',
    'Frontend Systems',
    'Interaction Design',
  ]);
  assert.deepEqual(skillRecords[0].tags, ['Three.js', 'GSAP', 'WebGL']);
  assert.deepEqual(skillRecords[1].tags, ['React', 'TypeScript', 'Vite']);
  assert.deepEqual(skillRecords[2].tags, ['交互原型', '视觉系统', '叙事']);
});

test('wraps skill indexes in both directions', () => {
  assert.equal(wrapSkillIndex(-1, 3), 2);
  assert.equal(wrapSkillIndex(3, 3), 0);
  assert.equal(wrapSkillIndex(1, 3), 1);
  assert.throws(() => wrapSkillIndex(0, 0), /positive/);
});

test('renders the approved vinyl player structure and controls', () => {
  const markup = renderSkillsPlayer(skillRecords[0], 0, skillRecords.length);

  assert.match(markup, /class="skills-player"/);
  assert.match(markup, /class="vinyl-record"/);
  assert.match(markup, /Creative Code/);
  assert.match(markup, /Three\.js/);
  assert.match(markup, /GSAP/);
  assert.match(markup, /WebGL/);
  assert.match(markup, /01 \/ 03/);
  assert.match(markup, /aria-label="上一张能力唱片"/);
  assert.match(markup, /aria-label="下一张能力唱片"/);
});

test('main binds Skills player navigation without affecting other panels', () => {
  const source = fs.readFileSync(new URL('./main.js', import.meta.url), 'utf8');
  assert.match(source, /changeSkillRecord/);
  assert.match(source, /wrapSkillIndex\(state\.activeSkillRecord/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /data-skill-direction/);
  assert.match(source, /skillPointerStartY/);
  assert.match(source, /applySkillWheelPreview/);
  assert.doesNotMatch(source, /skillWheelStep/);
});
