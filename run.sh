#!/bin/bash

# Ferma ed elimina il container se è già in esecuzione
echo "🛑 Fermo il container precedente (se esiste)..."
docker rm -f seven-days-game-app 2>/dev/null

# Ricostruisce l'immagine
echo "🔨 Compilo la nuova immagine Docker..."
docker build -t seven-days-game .

# Lancia il container in background (detached mode) sulla porta 8080
echo "🚀 Avvio il gioco sulla porta 8080..."
docker run -d --name seven-days-game-app -p 8080:80 seven-days-game

# Apre il browser (supporta vari ambienti Linux)
echo "🌐 Apro il browser..."
if command -v python3 &> /dev/null; then
    python3 -m webbrowser "http://localhost:8080"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:8080"
else
    echo "Per favore, apri manualmente http://localhost:8080 nel tuo browser."
fi
