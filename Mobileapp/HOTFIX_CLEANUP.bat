@echo off
REM Android 15 Hotfix - Dependency Recovery Script
REM This script cleans up the broken dependency state from version mismatch

echo ============================================
echo Nile Flow - Android 15 Hotfix Recovery
echo ============================================
echo.

echo Step 1: Killing Expo dev server...
taskkill /F /IM node.exe /T 2>nul

echo Step 2: Removing node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo Removed node_modules
) else (
    echo node_modules not found
)

echo Step 3: Removing package-lock.json...
if exist package-lock.json (
    del package-lock.json
    echo Removed package-lock.json
) else (
    echo package-lock.json not found
)

echo Step 4: Clearing npm cache...
call npm cache clean --force
echo npm cache cleared

echo Step 5: Reinstalling dependencies...
call npm install --legacy-peer-deps
if %ERRORLEVEL% EQU 0 (
    echo Dependencies installed successfully
) else (
    echo ERROR: npm install failed
    exit /b 1
)

echo.
echo ============================================
echo Step 6: Clearing Metro/Expo cache...
echo ============================================
call npx expo start --clear

echo.
echo ============================================
echo Recovery Complete!
echo ============================================
echo.
echo The app should now start correctly.
echo If you still see errors, try:
echo   1. Close this window and the dev server
echo   2. Run this script again
echo   3. Check that package.json has:
echo      - react: 19.2.3 (exact version)
echo      - react-native: 0.85.3 (exact version)
echo.
pause
