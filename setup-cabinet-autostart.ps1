$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$startupScript = Join-Path $projectRoot 'start-cabinet-server.ps1'
$taskName = 'CabinetOfNotes'
$taskCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$startupScript`""

if (-not (Test-Path -LiteralPath $startupScript)) {
  throw "启动脚本不存在：$startupScript"
}

$previousErrorAction = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$taskOutput = & schtasks.exe /Create /TN $taskName /SC ONLOGON /TR $taskCommand /F 2>&1
$taskExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorAction
if ($taskExitCode -ne 0) {
  $startupDirectory = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
  New-Item -ItemType Directory -Force -Path $startupDirectory | Out-Null
  $shortcutPath = Join-Path $startupDirectory 'CabinetOfNotes.lnk'
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = (Get-Command powershell.exe).Source
  $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$startupScript`""
  $shortcut.WorkingDirectory = $projectRoot
  $shortcut.WindowStyle = 7
  $shortcut.Save()
  Write-Host "计划任务创建被系统拒绝，已改用用户启动文件夹：$shortcutPath"
} else {
  Write-Host "已创建计划任务：$taskName"
}
& $startupScript
Write-Host "访问地址：http://127.0.0.1:4174/"
