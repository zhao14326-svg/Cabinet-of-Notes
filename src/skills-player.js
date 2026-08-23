export const skillRecords = [
  {
    eyebrow: 'CREATIVE CODE',
    title: 'Creative Code',
    description: '用实时图形、动效与空间叙事，把浏览器变成可探索的创作媒介。',
    tags: ['Three.js', 'GSAP', 'WebGL'],
    accent: '#b20f4c',
  },
  {
    eyebrow: 'FRONTEND SYSTEMS',
    title: 'Frontend Systems',
    description: '构建清晰、可靠且可维护的前端系统，让复杂交互拥有稳定的工程基础。',
    tags: ['React', 'TypeScript', 'Vite'],
    accent: '#167f9d',
  },
  {
    eyebrow: 'INTERACTION DESIGN',
    title: 'Interaction Design',
    description: '从原型到视觉语言，组织操作节奏、信息层级与具有记忆点的体验叙事。',
    tags: ['交互原型', '视觉系统', '叙事'],
    accent: '#d99a2b',
  },
];

export function wrapSkillIndex(index, length) {
  if (!Number.isInteger(length) || length <= 0) throw new Error('length must be a positive integer');
  return ((index % length) + length) % length;
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export function renderSkillsPlayer(record, index, total) {
  const current = String(index + 1).padStart(2, '0');
  const count = String(total).padStart(2, '0');
  const tags = record.tags.map((tag) => `<span class="skill-tag">${escapeHtml(tag)}</span>`).join('');

  return `
    <section class="skills-player" style="--record-accent:${escapeHtml(record.accent)}" data-skill-index="${index}">
      <div class="turntable-stage" aria-label="正在播放 ${escapeHtml(record.title)}">
        <div class="turntable-shadow"></div>
        <div class="turntable-plinth">
          <div class="vinyl-motion" aria-hidden="true">
            <div class="vinyl-record">
              <span class="vinyl-groove vinyl-groove--outer"></span>
              <span class="vinyl-groove vinyl-groove--inner"></span>
              <span class="vinyl-label"><i></i></span>
            </div>
          </div>
          <div class="tonearm" aria-hidden="true"><span class="tonearm-base"></span><span class="tonearm-bar"></span><span class="tonearm-head"></span></div>
          <div class="turntable-controls" aria-hidden="true">
            <span class="control-knob"></span><span class="control-knob"></span><span class="control-light"></span>
          </div>
        </div>
        <div class="playback-status"><span class="playback-dot"></span><span>NOW PLAYING</span></div>
      </div>
      <div class="skill-copy">
        <p class="skill-track">TRACK ${current}</p>
        <p class="skill-eyebrow">${escapeHtml(record.eyebrow)}</p>
        <h2>${escapeHtml(record.title)}</h2>
        <p class="skill-description">${escapeHtml(record.description)}</p>
        <div class="skill-tags">${tags}</div>
        <div class="skill-player-footer">
          <button class="skill-nav" type="button" data-skill-direction="-1" aria-label="上一张能力唱片" title="上一张">←</button>
          <div class="skill-progress" aria-label="第 ${index + 1} 张，共 ${total} 张">
            <span class="skill-progress-count">${current} / ${count}</span>
            <span class="skill-progress-rail"><i style="width:${((index + 1) / total) * 100}%"></i></span>
          </div>
          <button class="skill-nav" type="button" data-skill-direction="1" aria-label="下一张能力唱片" title="下一张">→</button>
        </div>
        <p class="skill-gesture">SCROLL OR SWIPE TO CHANGE RECORD</p>
      </div>
    </section>
  `;
}
