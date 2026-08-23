import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import multer from 'multer';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const defaultDataDir = path.join(projectRoot, 'src', 'assets', 'images');
const uploadTempDir = path.join(os.tmpdir(), 'cabinet-of-notes-uploads');
const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif']);

await fs.mkdir(uploadTempDir, { recursive: true });

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validateName(value, label) {
  const name = String(value || '').trim().normalize('NFC');
  if (!name || name === '.' || name === '..') throw httpError(400, `${label}不能为空`);
  if (name.length > 120 || /[<>:"/\\|?*\u0000-\u001f]/.test(name)) throw httpError(400, `${label}包含不允许的字符`);
  if (path.basename(name) !== name) throw httpError(400, `${label}格式无效`);
  return name;
}

function normalizeOriginalName(value) {
  const original = path.basename(String(value || ''));
  const decoded = Buffer.from(original, 'latin1').toString('utf8');
  return decoded.includes('\uFFFD') ? original : decoded;
}

function resolveDataDir(value = process.env.PORTFOLIO_DATA_DIR) {
  if (!value) return defaultDataDir;
  return path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function moveAcrossVolumes(source, target) {
  try {
    await fs.rename(source, target);
  } catch (error) {
    if (error.code !== 'EXDEV') throw error;
    await fs.copyFile(source, target, fs.constants.COPYFILE_EXCL);
    await fs.unlink(source);
  }
}

function publicFile(folder, entry) {
  const extension = path.extname(entry.name).slice(1).toLowerCase();
  return {
    name: entry.name,
    extension,
    visual: imageExtensions.has(extension),
    size: entry.size,
    updatedAt: entry.mtime.toISOString(),
    url: `/portfolio-assets/${encodeURIComponent(folder)}/${encodeURIComponent(entry.name)}`,
  };
}

export async function createPortfolioApp(options = {}) {
  const app = express();
  const dataDir = path.resolve(options.dataDir || resolveDataDir());
  const production = options.production ?? (process.argv.includes('--production') || process.env.NODE_ENV === 'production');
  const adminPassword = options.adminPassword ?? process.env.PORTFOLIO_ADMIN_PASSWORD ?? (production ? '' : 'admin');
  const sessions = new Map();
  const upload = multer({
    dest: uploadTempDir,
    limits: { fileSize: 40 * 1024 * 1024, files: 20 },
  });

  await fs.mkdir(dataDir, { recursive: true });
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  async function listPortfolio() {
    const directoryEntries = await fs.readdir(dataDir, { withFileTypes: true });
    const folderNames = directoryEntries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).map((entry) => entry.name).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    return Promise.all(folderNames.map(async (folder) => {
      const folderPath = path.join(dataDir, folder);
      const entries = await fs.readdir(folderPath, { withFileTypes: true });
      const files = await Promise.all(entries.filter((entry) => entry.isFile() && !entry.name.startsWith('.')).map(async (entry) => {
        const stats = await fs.stat(path.join(folderPath, entry.name));
        return publicFile(folder, { name: entry.name, size: stats.size, mtime: stats.mtime });
      }));
      files.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
      return { id: folder, title: folder, files };
    }));
  }

  function requireAdmin(req, _res, next) {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    const expiresAt = token ? sessions.get(token) : null;
    if (!expiresAt || expiresAt < Date.now()) {
      if (token) sessions.delete(token);
      next(httpError(401, '管理会话已过期，请重新登录'));
      return;
    }
    sessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
    next();
  }

  app.get('/api/portfolio', async (_req, res) => {
    res.json({ folders: await listPortfolio(), writable: Boolean(adminPassword) });
  });

  app.post('/api/admin/login', (req, res, next) => {
    if (!adminPassword) {
      next(httpError(503, '服务器尚未设置 PORTFOLIO_ADMIN_PASSWORD'));
      return;
    }
    const supplied = Buffer.from(String(req.body?.password || ''));
    const expected = Buffer.from(adminPassword);
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      next(httpError(401, '管理密码不正确'));
      return;
    }
    const token = crypto.randomBytes(32).toString('base64url');
    sessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
    res.json({ token, expiresIn: 8 * 60 * 60 });
  });

  app.post('/api/admin/logout', requireAdmin, (req, res) => {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    sessions.delete(token);
    res.status(204).end();
  });

  app.post('/api/admin/folders', requireAdmin, async (req, res) => {
    const name = validateName(req.body?.name, '文件夹名称');
    const target = path.join(dataDir, name);
    if (await pathExists(target)) throw httpError(409, '同名文件夹已经存在');
    await fs.mkdir(target);
    res.status(201).json({ folder: name });
  });

  app.patch('/api/admin/folders/:folder', requireAdmin, async (req, res) => {
    const folder = validateName(req.params.folder, '原文件夹名称');
    const name = validateName(req.body?.name, '新文件夹名称');
    const source = path.join(dataDir, folder);
    const target = path.join(dataDir, name);
    if (!(await pathExists(source))) throw httpError(404, '原文件夹不存在');
    if (source !== target && await pathExists(target)) throw httpError(409, '同名文件夹已经存在');
    if (source !== target) await fs.rename(source, target);
    res.json({ folder: name });
  });

  app.delete('/api/admin/folders/:folder', requireAdmin, async (req, res) => {
    const folder = validateName(req.params.folder, '文件夹名称');
    const target = path.join(dataDir, folder);
    const entries = await fs.readdir(target).catch((error) => {
      if (error.code === 'ENOENT') throw httpError(404, '文件夹不存在');
      throw error;
    });
    if (entries.length > 0) throw httpError(409, '只能删除空文件夹');
    await fs.rmdir(target);
    res.status(204).end();
  });

  app.post('/api/admin/files', requireAdmin, upload.array('files', 20), async (req, res) => {
    const temporaryFiles = req.files || [];
    try {
      const folder = validateName(req.body?.folder, '目标文件夹');
      const folderPath = path.join(dataDir, folder);
      if (!(await pathExists(folderPath))) throw httpError(404, '目标文件夹不存在');
      if (temporaryFiles.length === 0) throw httpError(400, '请选择需要上传的文件');
      const uploaded = [];
      for (const file of temporaryFiles) {
        const name = validateName(normalizeOriginalName(file.originalname), '文件名');
        const target = path.join(folderPath, name);
        if (await pathExists(target)) throw httpError(409, `文件 ${name} 已存在`);
        await moveAcrossVolumes(file.path, target);
        uploaded.push(name);
      }
      res.status(201).json({ folder, uploaded });
    } finally {
      await Promise.all(temporaryFiles.map((file) => fs.unlink(file.path).catch(() => {})));
    }
  });

  app.patch('/api/admin/files', requireAdmin, async (req, res) => {
    const sourceFolder = validateName(req.body?.sourceFolder, '原文件夹');
    const targetFolder = validateName(req.body?.targetFolder, '目标文件夹');
    const fileName = validateName(req.body?.fileName, '原文件名');
    const newName = validateName(req.body?.newName || fileName, '新文件名');
    const source = path.join(dataDir, sourceFolder, fileName);
    const targetDirectory = path.join(dataDir, targetFolder);
    const target = path.join(targetDirectory, newName);
    if (!(await pathExists(source))) throw httpError(404, '原文件不存在');
    if (!(await pathExists(targetDirectory))) throw httpError(404, '目标文件夹不存在');
    if (source !== target && await pathExists(target)) throw httpError(409, '目标位置已有同名文件');
    if (source !== target) await moveAcrossVolumes(source, target);
    res.json({ folder: targetFolder, name: newName });
  });

  app.delete('/api/admin/files', requireAdmin, async (req, res) => {
    const folder = validateName(req.body?.folder, '文件夹名称');
    const fileName = validateName(req.body?.fileName, '文件名');
    await fs.unlink(path.join(dataDir, folder, fileName)).catch((error) => {
      if (error.code === 'ENOENT') throw httpError(404, '文件不存在');
      throw error;
    });
    res.status(204).end();
  });

  app.get('/portfolio-assets/:folder/:file', async (req, res, next) => {
    try {
      const folder = validateName(req.params.folder, '文件夹名称');
      const fileName = validateName(req.params.file, '文件名');
      res.sendFile(path.join(dataDir, folder, fileName), (error) => {
        if (error) next(error.statusCode === 404 ? httpError(404, '文件不存在') : error);
      });
    } catch (error) {
      next(error);
    }
  });

  if (options.serveFrontend !== false) {
    if (production) {
      const distDir = path.join(projectRoot, 'dist');
      app.use(express.static(distDir));
      app.use((req, res, next) => {
        if (req.method !== 'GET' || !req.accepts('html')) return next();
        res.sendFile(path.join(distDir, 'index.html'));
      });
    } else {
      const { createServer } = await import('vite');
      const vite = await createServer({ root: projectRoot, server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
    }
  }

  app.use((error, _req, res, _next) => {
    const status = error instanceof multer.MulterError ? 400 : (error.status || error.statusCode || 500);
    const message = status >= 500 ? '服务器处理请求时出现错误' : error.message;
    if (status >= 500) console.error(error);
    res.status(status).json({ error: message });
  });

  return { app, dataDir, adminEnabled: Boolean(adminPassword) };
}

async function start() {
  const port = Number(process.env.PORT || 4174);
  const host = process.env.HOST || '0.0.0.0';
  const { app, dataDir, adminEnabled } = await createPortfolioApp();
  app.listen(port, host, () => {
    console.log(`Cabinet of Notes: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
    console.log(`Portfolio data: ${dataDir}`);
    if (!adminEnabled) console.log('Portfolio editor is disabled until PORTFOLIO_ADMIN_PASSWORD is set.');
    else if (!process.env.PORTFOLIO_ADMIN_PASSWORD) console.log('Development editor password: admin');
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) start();
