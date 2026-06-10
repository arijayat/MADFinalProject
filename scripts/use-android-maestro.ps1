$ProjectRoot = Split-Path -Parent $PSScriptRoot
$JdkHome = Join-Path $ProjectRoot ".local-tools\jdk\jdk-17.0.19+10"
$AndroidHome = Join-Path $ProjectRoot ".android-sdk"
$AndroidPlatformTools = Join-Path $AndroidHome "platform-tools"
$ExistingPlatformTools = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools"
$AndroidCmdlineTools = Join-Path $AndroidHome "cmdline-tools\latest\bin"
$MaestroBin = Join-Path $ProjectRoot ".local-tools\maestro\maestro\bin"
$MaestroLogs = Join-Path $env:LOCALAPPDATA "mobile_dev\maestro\Logs"

New-Item -ItemType Directory -Force -Path $MaestroLogs | Out-Null

$env:JAVA_HOME = $JdkHome
$env:ANDROID_HOME = $AndroidHome
$env:ANDROID_SDK_ROOT = $AndroidHome
$env:Path = @(
  Join-Path $JdkHome "bin"
  $AndroidCmdlineTools
  $AndroidPlatformTools
  $ExistingPlatformTools
  $MaestroBin
  $env:Path
) -join ";"

Write-Host "Configured JAVA_HOME=$env:JAVA_HOME"
Write-Host "Configured ANDROID_HOME=$env:ANDROID_HOME"
