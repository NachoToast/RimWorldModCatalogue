@echo off

CALL :NORMALIZEPATH "%~dp0\..\src\types\shared"
SET CLIENT=%RETVAL%

CALL :NORMALIZEPATH "%~dp0\..\..\server\src\types\shared"
SET SERVER=%RETVAL%

MKLINK /D "%CLIENT%" "%SERVER%"

pause

@REM https://stackoverflow.com/a/33404867/15257167
:NORMALIZEPATH
  SET RETVAL=%~f1
  EXIT /B
