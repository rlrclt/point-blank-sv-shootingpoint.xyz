@echo off
rem ---------------------------------------------------------------------------
rem  Launch Brave with the vsync / frame limiter disabled.
rem
rem  The game can only remove ITS OWN cap (settings -> FPS limit: Unlimited).
rem  requestAnimationFrame still follows the monitor refresh rate, so on a
rem  75 Hz display the page stays at 75 even with the game cap removed.
rem  These flags let Chromium produce frames faster than the display refresh.
rem
rem  IMPORTANT: close every Brave window first. Flags only apply to a new
rem  browser process; an already running Brave ignores them.
rem ---------------------------------------------------------------------------
setlocal
set "EXE="

if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" set "EXE=%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
if not defined EXE if exist "%ProgramFiles(x86)%\BraveSoftware\Brave-Browser\Application\brave.exe" set "EXE=%ProgramFiles(x86)%\BraveSoftware\Brave-Browser\Application\brave.exe"
if not defined EXE if exist "%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe" set "EXE=%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe"

if not defined EXE (
  echo Brave not found in the usual locations.
  echo Edit this file and set EXE to your brave.exe path.
  pause
  exit /b 1
)

echo Launching: %EXE%
start "" "%EXE%" --disable-gpu-vsync --disable-frame-rate-limit --max-gum-fps=9999
endlocal
