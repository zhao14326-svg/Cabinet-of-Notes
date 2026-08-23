# Cabinet of Notes

这是一个 Vite + Three.js 作品集站点。作品文件默认位于 `src/assets/images/<文件夹>/`，现在也可以通过管理面板在运行中的 Node 服务上维护这些文件。

## 本地运行

```powershell
npm install
$env:PORTFOLIO_ADMIN_PASSWORD = '请替换为管理密码'
npm run dev
```

打开 `http://localhost:4174/`，点击右上角“编辑作品”。管理面板支持：

- 新建、重命名和删除空文件夹
- 一次选择多个文件上传到指定文件夹
- 移动文件到其他文件夹
- 重命名和删除文件

上传内容默认写入 `src/assets/images`。生产环境建议把数据目录放到持久化磁盘：

```powershell
$env:PORTFOLIO_DATA_DIR = 'F:\portfolio-data'
$env:PORTFOLIO_ADMIN_PASSWORD = '请替换为管理密码'
npm run build
npm run preview
```

`PORTFOLIO_ADMIN_PASSWORD` 只在服务器环境变量中设置，不要写入前端代码、提交到仓库或放进 GitHub Actions 日志。生产服务默认监听 `0.0.0.0`，可通过 `PORT` 和 `HOST` 覆盖。

## Windows 自动启动

如果希望每次登录 Windows 后自动打开管理服务，在 PowerShell 中执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-cabinet-autostart.ps1
```

它会创建名为 `CabinetOfNotes` 的登录启动任务，并启动 `http://127.0.0.1:4174/`。日志位于 `work/server-autostart.log` 和 `work/server-autostart.error.log`。删除自动启动任务：

```powershell
schtasks /Delete /TN CabinetOfNotes /F
```

## GitHub 部署边界

GitHub Pages 是静态托管，浏览器不能安全地直接把文件写回 GitHub 仓库，也不能把 GitHub Token 放进网页。可以把仓库连接到 Render、Railway、Fly.io、VPS 等能运行 Node 的服务，再使用上面的管理面板；代码从 GitHub 自动部署，作品文件写入服务的持久化磁盘。

如果只部署到 GitHub Pages，网站仍会使用构建时的 `import.meta.glob` 静态作品列表，管理面板不会启用上传功能。
