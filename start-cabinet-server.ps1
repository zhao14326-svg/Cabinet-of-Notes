$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 4174

$listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) { exit 0 }

$nodeCommand = Get-Command node -ErrorAction Stop
$logDirectory = Join-Path $projectRoot 'work'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
$stdoutPath = Join-Path $logDirectory 'server-autostart.log'
$stderrPath = Join-Path $logDirectory 'server-autostart.error.log'

Start-Process -FilePath $nodeCommand.Source `
  -ArgumentList @('server.js') `
  -WorkingDirectory $projectRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutPath `
  -RedirectStandardError $stderrPath
