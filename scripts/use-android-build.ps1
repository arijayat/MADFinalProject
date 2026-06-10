$ProjectRoot = Split-Path -Parent $PSScriptRoot
$JdkHome = Join-Path $ProjectRoot ".local-tools\jdk\jdk-17.0.19+10"
$AndroidHome = Join-Path $ProjectRoot ".android-sdk"
$AndroidPlatformTools = Join-Path $AndroidHome "platform-tools"
$AndroidCmdlineTools = Join-Path $AndroidHome "cmdline-tools\latest\bin"
$GradleUserHome = Join-Path $ProjectRoot ".gradle"

if (-not (Test-Path (Join-Path $JdkHome "bin\java.exe"))) {
  throw "Java not found at $JdkHome"
}

if (-not (Test-Path $AndroidHome)) {
  throw "Android SDK not found at $AndroidHome"
}

$env:JAVA_HOME = $JdkHome
$env:ANDROID_HOME = $AndroidHome
$env:ANDROID_SDK_ROOT = $AndroidHome
$env:ORG_GRADLE_PROJECT_reactNativeArchitectures = "arm64-v8a"
$env:Path = @(
  Join-Path $JdkHome "bin"
  $AndroidCmdlineTools
  $AndroidPlatformTools
  $env:Path
) -join ";"

Write-Host "Configured JAVA_HOME=$env:JAVA_HOME"
Write-Host "Configured ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "Configured release ABI=$env:ORG_GRADLE_PROJECT_reactNativeArchitectures"
Write-Host ""
Write-Host "Release build command:"
Write-Host "  cd android"
Write-Host "  .\gradlew assembleRelease --build-cache --parallel --max-workers=8"
