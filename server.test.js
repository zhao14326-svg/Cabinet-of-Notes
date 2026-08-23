import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createPortfolioApp } from './server.js';

test('portfolio editor authenticates and manages folders and files', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cabinet-portfolio-test-'));
  const { app } = await createPortfolioApp({ dataDir, adminPassword: 'secret', serveFrontend: false });
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const unauthenticated = await fetch(`${base}/api/admin/folders`, { method: 'POST', body: JSON.stringify({ name: '接单' }), headers: { 'content-type': 'application/json' } });
    assert.equal(unauthenticated.status, 401);
    const login = await fetch(`${base}/api/admin/login`, { method: 'POST', body: JSON.stringify({ password: 'secret' }), headers: { 'content-type': 'application/json' } });
    assert.equal(login.status, 200);
    const { token } = await login.json();
    const auth = { authorization: `Bearer ${token}` };
    const created = await fetch(`${base}/api/admin/folders`, { method: 'POST', body: JSON.stringify({ name: '接单' }), headers: { ...auth, 'content-type': 'application/json' } });
    assert.equal(created.status, 201);
    const form = new FormData();
    form.set('folder', '接单');
    form.append('files', new Blob(['image data'], { type: 'image/jpeg' }), '室内.jpg');
    const upload = await fetch(`${base}/api/admin/files`, { method: 'POST', body: form, headers: auth });
    assert.equal(upload.status, 201);
    const renamedFolder = await fetch(`${base}/api/admin/folders/%E6%8E%A5%E5%8D%95`, { method: 'PATCH', body: JSON.stringify({ name: '项目' }), headers: { ...auth, 'content-type': 'application/json' } });
    assert.equal(renamedFolder.status, 200);
    const movedFile = await fetch(`${base}/api/admin/files`, { method: 'PATCH', body: JSON.stringify({ sourceFolder: '项目', targetFolder: '项目', fileName: '室内.jpg', newName: '客厅.jpg' }), headers: { ...auth, 'content-type': 'application/json' } });
    assert.equal(movedFile.status, 200);
    const listing = await fetch(`${base}/api/portfolio`);
    const payload = await listing.json();
    assert.deepEqual(payload.folders.map((folder) => folder.id), ['项目']);
    assert.equal(payload.folders[0].files[0].name, '客厅.jpg');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});
