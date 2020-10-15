#!/bin/bash
rnpx(){
  if ! command -v pnpx &> /dev/null
  then
    pnpx "$@"
  else
    npx  "$@"
  fi
}

rnpx prettier --write --print-width 150 index.js builder/build.js
cd builder/
node build.js > ../.github/workflows/build.yml

cd ..

git add index.js builder/build.js .github/workflows/build.yml
