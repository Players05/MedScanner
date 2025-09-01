@echo off
echo Starting MedScanner with JavaScript TTS...
echo.

echo Starting Node.js MedScanner on port 3000...
start "MedScanner" cmd /k "npm start"

echo.
echo MedScanner is starting...
echo - App: http://localhost:3000
echo - TTS: Built-in Web Speech API (no additional service needed)
echo.
echo Press any key to exit this window...
pause > nul

