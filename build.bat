@echo off
REM Double-click to produce a production build in the dist/ folder.

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ================================================================
    echo  Node.js is not installed on this computer.
    echo ================================================================
    echo.
    echo  This game needs Node.js to run.
    echo  Download it from:  https://nodejs.org
    echo  Pick the "LTS" version, install it, then run this script again.
    echo.
    echo  Opening the download page in your browser...
    timeout /t 3 /nobreak >nul
    start https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo First-time setup: installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo npm install failed. Make sure Node.js is installed: https://nodejs.org
        pause
        exit /b 1
    )
)

echo.
echo Building production bundle...
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo Build failed. See errors above.
    pause
    exit /b 1
)

echo.
echo Build complete. Output is in the dist\ folder.
pause
