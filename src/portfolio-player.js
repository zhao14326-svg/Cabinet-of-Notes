const portfolioAssetModules = typeof import.meta.glob === 'function'
  ? import.meta.glob('./assets/images/*/*', { eager: true, query: '?url', import: 'default' })
  : {
    './assets/images/接单/0a6c049ca9d5ddad4209ef7dab4e5750.jpg': '/src/assets/images/接单/0a6c049ca9d5ddad4209ef7dab4e5750.jpg',
    './assets/images/接单/2d3cecc5920fe8c5ffd46db1845459b2.jpg': '/src/assets/images/接单/2d3cecc5920fe8c5ffd46db1845459b2.jpg',
    './assets/images/接单/77a7c774396ce6f211a00e7e81853f85.jpg': '/src/assets/images/接单/77a7c774396ce6f211a00e7e81853f85.jpg',
    './assets/images/接单/7c55236dda4f22573b62698699d7de95.jpg': '/src/assets/images/接单/7c55236dda4f22573b62698699d7de95.jpg',
    './assets/images/接单/冰激淋车.jpg': '/src/assets/images/接单/冰激淋车.jpg',
    './assets/images/接单/冰激凌车2.jpg': '/src/assets/images/接单/冰激凌车2.jpg',
    './assets/images/接单/餐车.jpg': '/src/assets/images/接单/餐车.jpg',
    './assets/images/接单/c55d1955bfa9ed3928f3c77eb7ba2e41.jpg': '/src/assets/images/接单/c55d1955bfa9ed3928f3c77eb7ba2e41.jpg',
    './assets/images/接单/c581723bec223597d13924e7f53d61b8.jpg': '/src/assets/images/接单/c581723bec223597d13924e7f53d61b8.jpg',
    './assets/images/接单/cd0cd9d951b7f45a368ccaf3b3635ba8.jpg': '/src/assets/images/接单/cd0cd9d951b7f45a368ccaf3b3635ba8.jpg',
    './assets/images/练习/练1.jpg': '/src/assets/images/练习/练1.jpg',
    './assets/images/练习/阅览中心.jpg': '/src/assets/images/练习/阅览中心.jpg',
    './assets/images/练习/展厅1.jpg': '/src/assets/images/练习/展厅1.jpg',
    './assets/images/作业/餐厅.jpg': '/src/assets/images/作业/餐厅.jpg',
    './assets/images/作业/厨房.jpg': '/src/assets/images/作业/厨房.jpg',
    './assets/images/作业/次卧.jpg': '/src/assets/images/作业/次卧.jpg',
    './assets/images/作业/电视机背景墙.jpg': '/src/assets/images/作业/电视机背景墙.jpg',
    './assets/images/作业/儿童房.jpg': '/src/assets/images/作业/儿童房.jpg',
    './assets/images/作业/客餐厅1.jpg': '/src/assets/images/作业/客餐厅1.jpg',
    './assets/images/作业/客餐厅2.jpg': '/src/assets/images/作业/客餐厅2.jpg',
    './assets/images/作业/平面布置图.dwg': '/src/assets/images/作业/平面布置图.dwg',
    './assets/images/作业/沙发背景墙.jpg': '/src/assets/images/作业/沙发背景墙.jpg',
    './assets/images/作业/书房.jpg': '/src/assets/images/作业/书房.jpg',
    './assets/images/作业/院子.jpg': '/src/assets/images/作业/院子.jpg',
    './assets/images/作业/主卧.jpg': '/src/assets/images/作业/主卧.jpg',
  };

const folderOrder = ['接单', '练习', '作业'];
const folderMeta = {
  接单: { eyebrow: 'COMMISSIONED WORK', code: 'ORDER', accent: '#c87554', description: '来自真实委托的空间与视觉项目，记录从需求到成稿的完整过程。' },
  练习: { eyebrow: 'STUDIES / EXERCISES', code: 'STUDY', accent: '#4f8e98', description: '持续练习中的空间、构图与材质实验，保留每一次尝试的痕迹。' },
  作业: { eyebrow: 'COURSEWORK / 01', code: 'WORK', accent: '#bb557d', description: '课程与阶段性作业归档，展示从平面图到空间效果的推演过程。' },
};
const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif']);

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function fileName(path) {
  return decodeURIComponent(path.split('/').pop() || path);
}

function buildPortfolioRecords() {
  const filesByFolder = new Map(folderOrder.map((folder) => [folder, []]));
  Object.entries(portfolioAssetModules).forEach(([path, url]) => {
    const match = path.match(/^\.\/assets\/images\/([^/]+)\/(.+)$/);
    if (!match || !filesByFolder.has(match[1])) return;
    const name = fileName(match[2]);
    const extension = name.split('.').pop()?.toLowerCase() || '';
    filesByFolder.get(match[1]).push({ name, url, extension, visual: imageExtensions.has(extension) });
  });

  return folderOrder.map((folder) => {
    const meta = folderMeta[folder];
    const files = filesByFolder.get(folder).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    return {
      id: folder,
      title: folder,
      eyebrow: meta.eyebrow,
      description: meta.description,
      tags: [`${files.length} 个文件`, `${files.filter((file) => file.visual).length} 张图片`, '本地资产'],
      accent: meta.accent,
      code: meta.code,
      year: '2026',
      scope: `${folder} / 作品归档`,
      deliverables: files.map((file) => file.name).join('、') || '等待添加作品文件',
      files,
    };
  });
}

export let portfolioRecords = buildPortfolioRecords();

function mergeRemotePortfolioFolders(folders) {
  if (!Array.isArray(folders) || folders.length === 0) return false;
  const records = folders.map((folder, index) => {
    const fallback = folderMeta[folder.id] || {};
    const files = Array.isArray(folder.files) ? folder.files.map((file) => ({
      ...file,
      url: file.url,
      visual: Boolean(file.visual),
    })) : [];
    return {
      id: folder.id,
      title: folder.title || folder.id,
      eyebrow: fallback.eyebrow || `PORTFOLIO / ${String(index + 1).padStart(2, '0')}`,
      description: fallback.description || '本地作品归档，记录项目过程与最终成果。',
      tags: [`${files.length} 个文件`, `${files.filter((file) => file.visual).length} 张图片`, '云端资产'],
      accent: fallback.accent || ['#c87554', '#4f8e98', '#bb557d'][index % 3],
      code: fallback.code || `FOLDER ${String(index + 1).padStart(2, '0')}`,
      year: '2026',
      scope: `${folder.id} / 作品归档`,
      deliverables: files.map((file) => file.name).join('、') || '等待添加作品文件',
      files,
    };
  });
  portfolioRecords = records;
  return true;
}

export async function loadPortfolioRecords(endpoint = '/api/portfolio') {
  if (typeof fetch !== 'function') return portfolioRecords;
  try {
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) return portfolioRecords;
    const payload = await response.json();
    mergeRemotePortfolioFolders(payload.folders);
  } catch {
    // Static Vite hosting has no content API; keep the build-time asset list.
  }
  return portfolioRecords;
}

export function wrapPortfolioIndex(index, length) {
  if (!Number.isInteger(length) || length <= 0) throw new Error('length must be a positive integer');
  return ((index % length) + length) % length;
}

function renderDetailPreview(record) {
  const image = record.files.find((file) => file.visual);
  return image
    ? `<img class="portfolio-detail-preview" src="${escapeHtml(image.url)}" alt="${escapeHtml(image.name)}" />`
    : '<span class="portfolio-folder-empty">暂无图片</span>';
}

export function renderPortfolioPlayer(record, index, total) {
  const current = String(index + 1).padStart(2, '0');
  const count = String(total).padStart(2, '0');
  const folders = portfolioRecords.map((item, folderIndex) => `
    <div class="portfolio-folder ${folderIndex === index ? 'is-active' : ''}" data-folder-index="${folderIndex}" style="--folder-accent:${escapeHtml(item.accent)};--folder-index:${folderIndex};--folder-offset:${folderIndex - index};--folder-depth:${Math.abs(folderIndex - index)}">
      <span class="portfolio-folder-tab">${escapeHtml(item.code)}</span>
      <span class="portfolio-folder-number">${String(folderIndex + 1).padStart(2, '0')}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.eyebrow.split(' / ')[0])}</small>
    </div>
  `).join('');
  const tags = record.tags.map((tag) => `<span class="portfolio-tag">${escapeHtml(tag)}</span>`).join('');

  return `
    <section class="portfolio-player" style="--portfolio-accent:${escapeHtml(record.accent)}" data-portfolio-index="${index}">
      <div class="portfolio-stage portfolio-open-target" role="button" tabindex="0" data-portfolio-open aria-label="打开 ${escapeHtml(record.title)} 展示页面">
        <div class="portfolio-file-shadow"></div>
        <div class="portfolio-file-box">
          <div class="portfolio-file-top"><span>PERSONAL ARCHIVE</span><span>${String(total).padStart(2, '0')} FOLDERS</span></div>
          <div class="portfolio-drawer"><div class="portfolio-drawer-rail"></div>${folders}</div>
          <div class="portfolio-file-front"><span>WORK / 2026</span><span class="portfolio-file-dots">•••</span></div>
          <div class="portfolio-file-handle" aria-hidden="true"><span></span></div>
        </div>
        <div class="portfolio-playback-status"><span class="portfolio-playback-dot"></span><span>FOLDER OPEN</span></div>
      </div>
      <div class="portfolio-copy">
        <p class="portfolio-track">FOLDER ${current} / ${count}</p>
        <p class="portfolio-eyebrow">${escapeHtml(record.eyebrow)}</p>
        <h2><button class="portfolio-title-link" type="button" data-portfolio-open aria-label="打开 ${escapeHtml(record.title)} 展示页面">${escapeHtml(record.title)}</button></h2>
        <p class="portfolio-description">${escapeHtml(record.description)}</p>
        <div class="portfolio-tags">${tags}</div>
        <div class="portfolio-player-footer"><button class="portfolio-nav" type="button" data-portfolio-direction="-1" aria-label="上一个作品文件夹" title="上一个">←</button><div class="portfolio-progress" aria-label="第 ${index + 1} 个，共 ${total} 个"><span class="portfolio-progress-count">${current} / ${count}</span><span class="portfolio-progress-rail"><i style="width:${((index + 1) / total) * 100}%"></i></span></div><button class="portfolio-nav" type="button" data-portfolio-direction="1" aria-label="下一个作品文件夹" title="下一个">→</button></div>
        <p class="portfolio-gesture">SCROLL OR SWIPE TO CHANGE FOLDER</p>
      </div>
    </section>
  `;
}

export function renderPortfolioDetail(record, index, total) {
  const current = String(index + 1).padStart(2, '0');
  const count = String(total).padStart(2, '0');
  const images = record.files.filter((file) => file.visual);
  const files = record.files.map((file) => file.visual
    ? `<div class="portfolio-file-row"><span>${escapeHtml(file.name)}</span><span>IMAGE</span></div>`
    : `<a class="portfolio-file-row" href="${escapeHtml(file.url)}" download="${escapeHtml(file.name)}"><span>${escapeHtml(file.name)}</span><span>DOWNLOAD</span></a>`).join('');
  const gallery = images.length
    ? images.map((file, imageIndex) => `<figure class="portfolio-gallery-item"><button class="portfolio-gallery-button" type="button" data-portfolio-image="${imageIndex}" aria-label="放大查看 ${escapeHtml(file.name)}"><img src="${escapeHtml(file.url)}" alt="${escapeHtml(file.name)}" loading="lazy" /><span class="portfolio-gallery-zoom" aria-hidden="true">+</span></button><figcaption>${String(imageIndex + 1).padStart(2, '0')} / ${escapeHtml(file.name)}</figcaption></figure>`).join('')
    : '<p class="portfolio-gallery-empty">此文件夹暂无可预览图片。</p>';
  const tags = record.tags.map((tag) => `<span class="portfolio-tag">${escapeHtml(tag)}</span>`).join('');
  const heroTag = images.length ? 'button' : 'div';
  const heroAction = images.length ? ` type="button" data-portfolio-image="0" aria-label="放大查看 ${escapeHtml(images[0].name)}"` : '';

  return `
    <section class="portfolio-detail" style="--portfolio-accent:${escapeHtml(record.accent)}" data-portfolio-detail-index="${index}">
      <div class="portfolio-detail-head"><button class="portfolio-back" type="button" data-portfolio-back aria-label="返回作品文件夹" title="返回作品文件夹"><span aria-hidden="true">←</span><span>返回文件夹</span></button><span class="portfolio-detail-count">${current} / ${count}</span></div>
      <div class="portfolio-detail-hero"><${heroTag} class="portfolio-detail-art"${heroAction}>${renderDetailPreview(record)}<span class="portfolio-detail-art-code">${escapeHtml(record.code)}</span><span class="portfolio-detail-art-title">${escapeHtml(record.title)}</span><span class="portfolio-detail-art-zoom" aria-hidden="true">+</span></${heroTag}><div class="portfolio-detail-intro"><p class="portfolio-eyebrow">${escapeHtml(record.eyebrow)}</p><h2>${escapeHtml(record.title)}</h2><p>${escapeHtml(record.description)}</p><div class="portfolio-tags">${tags}</div></div></div>
      <div class="portfolio-detail-gallery"><div class="portfolio-detail-section-label">WORKS / ${String(images.length).padStart(2, '0')}</div><div class="portfolio-gallery-grid">${gallery}</div></div>
      <div class="portfolio-detail-meta"><div><span>FOLDER</span><strong>${escapeHtml(record.id)}</strong></div><div><span>SCOPE</span><strong>${escapeHtml(record.scope)}</strong></div><div><span>FILES</span><strong>${String(record.files.length).padStart(2, '0')}</strong></div></div>
      <div class="portfolio-detail-files"><div class="portfolio-detail-section-label">ARCHIVE FILES</div>${files || '<p class="portfolio-gallery-empty">暂无文件。</p>'}</div>
    </section>
  `;
}
