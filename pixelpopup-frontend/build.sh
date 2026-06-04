#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 22
nvm use 22
cd /home/bomiku1/projects/pixelpopup/pixelpopup-frontend
npm install
npm run build
