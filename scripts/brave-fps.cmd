@echo off
rem ---------------------------------------------------------------------------
rem  Launch Brave normally (vsync ON) for the PB ESP workflow.
rem
rem  Why: the game can remove ITS OWN FPS cap (CORE -> เพดานเฟรม = ตามจอ / 144 ...),
rem  but Chromium's rAF is still paced by the display. Running the browser with
rem  --disable-gpu-vsync lets frames outrun the display -> visible tearing
rem  (เส้นหยัก/ภาพฉีก). This script keeps vsync so the picture stays clean.
rem
rem  Want frames above the refresh rate anyway? Use brave-fps-nosync.cmd
rem  (same flags as before, tearing possible).
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

echo Launching (vsync ON, no tearing): %EXE%
start "" "%EXE%"
endlocal
