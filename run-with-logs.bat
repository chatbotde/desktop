@echo off
REM This script runs the built app and captures console output
REM Usage: After building with npm run dist:win, run this from the dist directory

echo Starting SonicThinking with console output...
echo.
echo Output will be saved to app-logs.txt
echo.

set ELECTRON_ENABLE_LOGGING=1
set ELECTRON_LOG_FILE=app-logs.txt

REM Run the portable exe if it exists
if exist "SonicThinking-*-portable.exe" (
    for %%f in (SonicThinking-*-portable.exe) do (
        echo Running %%f
        "%%f" > app-logs.txt 2>&1
    )
) else (
    echo Portable exe not found in current directory
    echo Please run this script from the dist folder
)

pause
