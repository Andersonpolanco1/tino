@echo off
REM Doble clic para compilar Tino para Google Play (AAB) en WSL. Ver build-android.ps1.
REM -ExecutionPolicy Bypass: solo para esta corrida. -NoExit: deja la ventana abierta para leer el log.
powershell -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0build-android.ps1" %*
