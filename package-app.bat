@echo off
setlocal

echo === Preparation du packaging de l'application Contrat Manager ===

:: Créer un dossier temporaire avec timestamp pour éviter les conflits
set TIMESTAMP=%DATE:~6,4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set TEMP_DIR=temp_%TIMESTAMP%
set DIST_DIR=dist_%TIMESTAMP%

echo Creation des dossiers temporaires...
mkdir %TEMP_DIR%
mkdir %DIST_DIR%
mkdir %DIST_DIR%\portable-app
mkdir %DIST_DIR%\portable-app\resources
mkdir %DIST_DIR%\portable-app\resources\app
mkdir %DIST_DIR%\portable-app\resources\app\node_modules
mkdir %DIST_DIR%\portable-app\resources\templates
mkdir %DIST_DIR%\portable-app\resources\templates\contracts
mkdir %DIST_DIR%\portable-app\resources\templates\certificates

echo Verification des dependances...
call npm list electron-store || call npm install --save electron-store
call npm list handlebars || call npm install --save handlebars
call npm list puppeteer || call npm install --save puppeteer
call npm list electron-is-dev || call npm install --save electron-is-dev

echo Copie des fichiers principaux...
copy main.js %DIST_DIR%\portable-app\resources\app\
copy preload.js %DIST_DIR%\portable-app\resources\app\
copy config.js %DIST_DIR%\portable-app\resources\app\

echo Creation du fichier portable.txt...
echo Cette application s'execute en mode portable. > %DIST_DIR%\portable-app\resources\portable.txt
echo Ne pas supprimer ce fichier. >> %DIST_DIR%\portable-app\resources\portable.txt

echo Creation du package.json simplifié...
echo {> %TEMP_DIR%\package.json
echo   "name": "contrat-manager",>> %TEMP_DIR%\package.json
echo   "version": "1.0.0",>> %TEMP_DIR%\package.json
echo   "description": "Application de gestion de contrats de mission temporaire",>> %TEMP_DIR%\package.json
echo   "main": "main.js",>> %TEMP_DIR%\package.json
echo   "dependencies": {>> %TEMP_DIR%\package.json
echo     "electron-store": "^8.1.0",>> %TEMP_DIR%\package.json
echo     "handlebars": "^4.7.8",>> %TEMP_DIR%\package.json
echo     "puppeteer": "^24.7.2",>> %TEMP_DIR%\package.json
echo     "electron-is-dev": "^2.0.0">> %TEMP_DIR%\package.json
echo   }>> %TEMP_DIR%\package.json
echo }>> %TEMP_DIR%\package.json

copy %TEMP_DIR%\package.json %DIST_DIR%\portable-app\resources\app\

echo Copie du dossier build...
if exist build (
  xcopy /E /I /Y build %DIST_DIR%\portable-app\resources\app\build
) else (
  echo ATTENTION: Le dossier build n'existe pas!
  echo Voulez-vous construire l'application React maintenant? (O/N)
  set /p BUILD_NOW=
  if /i "%BUILD_NOW%"=="O" (
    echo Construction de l'application React...
    call npm run build
    if exist build (
      xcopy /E /I /Y build %DIST_DIR%\portable-app\resources\app\build
    ) else (
      echo ERREUR: La construction a échoué!
    )
  )
)

echo Installation des dependances dans le dossier de l'application...
cd %DIST_DIR%\portable-app\resources\app
call npm install --only=prod
cd ..\..\..\..

echo Copie des fichiers Electron...
if exist node_modules\electron\dist (
  xcopy /E /I /Y node_modules\electron\dist %DIST_DIR%\portable-app
) else (
  echo ERREUR: Le dossier Electron n'a pas été trouvé!
)

echo Création du script de lancement...
echo @echo off> %DIST_DIR%\ContratManager.bat
echo start "" "%%~dp0portable-app\electron.exe" "%%~dp0portable-app\resources\app">> %DIST_DIR%\ContratManager.bat

echo.
echo === Packaging terminé avec succès! ===
echo.
echo L'application se trouve dans: %CD%\%DIST_DIR%
echo Utilisez le fichier %CD%\%DIST_DIR%\ContratManager.bat pour lancer l'application
echo.

:: Nettoyage
rmdir /S /Q %TEMP_DIR%

endlocal