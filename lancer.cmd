@echo off
rem Lance le CV en local avec ng serve (double-clic), sur http://localhost:4201.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\lancer-local.ps1" %*
if errorlevel 1 pause
