@echo off
rem Construit et sert l'image de production du CV (double-clic), sur http://localhost:8090.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\lancer-local.ps1" -Docker
if errorlevel 1 pause
