#!/bin/bash
rnpx(){
  if ! command -v pnpx &> /dev/null
  then
    pnpx "$@"
  else
    npx  "$@"
  fi
}

rnpx prettier --write index.js --print-width 150 builder/build.js
cd builder/
node build.js > ../.github/workflows/build.yml
