@echo off
rem ---------------------------------------------------------------------------
rem  Launch Brave WITH remote debugging (port 9222) for live testing.
rem
rem  Debug flags only apply to a NEW browser process. If Brave is already
rem  running, close every window (and the tray icon) first, then run this.
rem
rem  Also keeps vsync ON and disables background throttling.
rem ---------------------------------------------------------------------------
setlocal
set "EXE="
if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" set "EXE=%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
if not defined EXE if exist "%ProgramFiles(x86)%\BraveSoftware\Brave-Browser\Application\brave.exe" set "EXE=%ProgramFiles(x86)%\BraveSoftware\Brave-Browser\Application\brave.exe"
if not defined EXE if exist "%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe" set "EXE=%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe"

if not defined EXE (
  echo Brave not found in the usual locations.
  pause
  exit /b 1
)

tasklist /FI "IMAGENAME eq brave.exe" 2>nul | find /I "brave.exe" >nul
if not errorlevel 1 (
  echo.
  echo Brave is already running.
  echo Debug flags are ignored unless Brave starts fresh.
  echo Close every Brave window ^(check the tray icon^) and run this again.
  echo.
  pause
  exit /b 1
)

echo Launching with debug port 9222: %EXE%
start "" "%EXE%" ^
  --remote-debugging-port=9222 ^
  --disable-background-timer-throttling ^
  --disable-renderer-backgrounding ^
  --disable-backgrounding-occluded-windows ^
  --disable-features=CalculateNativeWinOcclusion
endlocal
