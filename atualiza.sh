#!/bin/bash
set -e
#echo "==> Baixando atualizações do repositório..."
#git pull

#echo "==> Atualizando pacotes JS..."
#npm install --legacy-peer-deps

echo "==> Compilando novo binário nativo macOS..."
npx tauri build

echo "==> Substituindo o app em /Applications..."
rm -rf /Applications/Chronicle.app
cp -R src-tauri/target/release/bundle/macos/Chronicle.app /Applications/

echo "==> Pronto! Chronicle atualizado com sucesso."
