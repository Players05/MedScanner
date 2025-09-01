@echo off
echo Starting AI4Bharat TTS Service...
echo.
echo This will start the Python TTS service on port 5001
echo Make sure you have all Python dependencies installed:
echo - flask, torch, transformers, soundfile, numpy
echo.
echo Starting service...
"C:\Users\dell\anaconda3\python.exe" src/services/tts_service.py
pause
