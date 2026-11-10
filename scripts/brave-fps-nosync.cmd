@echo off
rem ---------------------------------------------------------------------------
rem  Launch Brave with vsync / frame limiter disabled (frames faster than the
rem  display). This is the "max FPS" variant.
rem
rem  WARNING: with vsync off the compositor has no frame boundary to align to,
rem  so you will see tearing (เส้นหยัก/ภาพฉีก) when the FPS is above the monitor
rem  refresh rate. Use brave-fps.cmd if you want a clean picture.
rem
rem  Tip: you can still cap inside the game (CORE -> เพดานเฟรม) to reduce it,
rem  but the cleanest fix is running with vsync on.
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

echo Launching (vsync OFF -> tearing possible): %EXE%
start "" "%EXE%" --disable-gpu-vsync --disable-frame-rate-limit --max-gum-fps=9999
endlocal
