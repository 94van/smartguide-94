#!/bin/zsh
cd "${0:A:h}"
if ! command -v node >/dev/null; then
  export PATH="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
fi
node scripts/dev.mjs
