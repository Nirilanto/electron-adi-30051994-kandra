@echo off
echo === Construction de l'application React ===
call npm run build

echo === Préparation de l'exécutable portable ===
mkdir dist\portable-app
mkdir dist\portable-app\resources

xcopy /E /I build dist\portable-app\resources\app\build
copy main.js dist\portable-app\resources\app\
copy preload.js dist\portable-app\resources\app\
copy config.js dist\portable-app\resources\app\
copy package.json dist\portable-app\resources\app\

echo === Copie des fichiers Electron ===
xcopy /E /I node_modules\electron\dist\* dist\portable-app\

echo === Création terminée ===
echo L'application portable se trouve dans le dossier dist\portable-app