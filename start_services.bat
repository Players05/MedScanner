@echo off
echo Starting MedScanner Services...
echo.

echo Starting Python TTS Service...
start "Python TTS Service" "C:\Users\dell\anaconda3\python.exe" src/services/tts_service.py

echo Waiting for TTS service to start...
timeout /t 10 /nobreak > nul

echo Starting Node.js Server...
start "Node.js Server" npm start

echo.
echo Services started! 
echo - Python TTS Service: http://localhost:5001
echo - Node.js Server: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
