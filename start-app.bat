@echo off
ECHO ===== Demarrage de Contrat Manager =====
ECHO.

REM Vérifier si Node.js est installé
WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  ECHO Node.js n'est pas installe sur ce systeme.
  ECHO Veuillez installer Node.js depuis https://nodejs.org/
  PAUSE
  EXIT /B 1
)

REM Vérifier si les modules sont installés
IF NOT EXIST node_modules (
  ECHO Installation des dependances...
  CALL npm install
  IF %ERRORLEVEL% NEQ 0 (
    ECHO Erreur lors de l'installation des dependances.
    PAUSE
    EXIT /B 1
  )
)

REM Lancer l'application
ECHO Demarrage de l'application...
CALL npm run dev

PAUSE
EXIT /B 0