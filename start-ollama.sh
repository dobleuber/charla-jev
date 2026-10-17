#!/usr/bin/env bash
set -euo pipefail
runtime_dir="${XDG_DATA_HOME:-$HOME/.local/share}/charla-jev/ollama"
model_dir="${XDG_DATA_HOME:-$HOME/.local/share}/charla-jev/models"
if [[ ! -x "$runtime_dir/bin/ollama" ]]; then
  printf '%s\n' 'Ollama no está instalado en el directorio dedicado de la presentación.' >&2
  exit 1
fi
# Inherit no provider keys or unrelated configuration. HOME retains its actual value.
exec env -i PATH="$PATH" HOME="$HOME" \
  OLLAMA_HOST=127.0.0.1:11434 OLLAMA_MODELS="$model_dir" OLLAMA_NO_CLOUD=1 \
  OLLAMA_CONTEXT_LENGTH=4096 OLLAMA_NUM_PARALLEL=1 OLLAMA_MAX_LOADED_MODELS=1 \
  "$runtime_dir/bin/ollama" serve
