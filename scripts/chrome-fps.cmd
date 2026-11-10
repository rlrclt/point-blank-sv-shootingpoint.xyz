@echo off
rem ---------------------------------------------------------------------------
rem  Launch Chrome with game-friendly flags (vsync stays ON).
rem
rem  What these do:
rem    --disable-background-timer-throttling      เกมไม่ถูกหรี่ timer ตอนหน้าต่างไม่ focus
rem    --disable-renderer-backgrounding           renderer ไม่ถูกลด priority
rem    --disable-backgrounding-occluded-windows   หน้าต่างที่ถูกบังยังวาดเต็มที่
rem    --disable-features=CalculateNativeWinOcclusion
rem                                               ไม่ให้ Chrome ตัดสินว่าเกม "มองไม่เห็น"
rem
rem  vsync is intentionally NOT disabled: --disable-gpu-vsync causes tearing
rem  (เส้นหยัก/ภาพฉีก) unless the FPS is capped to the monitor refresh rate.
rem
rem  NOTE: Chrome 137+ ignores --load-extension, so the PB ESP extension has to
rem  be loaded once manually: chrome://extensions -> Developer mode -> Load
rem  unpacked -> C:\Users\<you>\Desktop\pb-esp-ext-cf
rem
rem  Close every Chrome window first; flags only apply to a new process.
rem ---------------------------------------------------------------------------
setlocal
set "EXE="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined EXE if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined EXE if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if not defined EXE (
  echo Chrome not found in the usual locations.
  pause
  exit /b 1
)

echo Launching: %EXE%
start "" "%EXE%" ^
  --disable-background-timer-throttling ^
  --disable-renderer-backgrounding ^
  --disable-backgrounding-occluded-windows ^
  --disable-features=CalculateNativeWinOcclusion
endlocal
