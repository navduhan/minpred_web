#!/usr/bin/env bash
#SBATCH --job-name=minpred-web
#SBATCH --partition=mahaguru
#SBATCH --nodelist=chela-g01
#SBATCH --cpus-per-task=6
#SBATCH --mem=48G
#SBATCH --time=12:00:00

set -euo pipefail
umask 077

app_dir="${MINPRED_APP_DIR:-$HOME/naveen_tools/minpred}"
launcher="$app_dir/minpred.sl"
if [[ ! -f "$launcher" ]]; then
  echo "The maintained MINpred launcher is missing: $launcher" >&2
  echo "Set MINPRED_APP_DIR to the deployed standalone repository." >&2
  exit 69
fi

export MINPRED_APP_DIR="$app_dir"
export MINPRED_MODULE="${MINPRED_MODULE:-dl-gpu}"
export MINPRED_MODEL_DIR="${MINPRED_MODEL_DIR:-$app_dir/models}"
export TF_FORCE_GPU_ALLOW_GROWTH=true
export TF_CPP_MIN_LOG_LEVEL=2

exec bash "$launcher" "$@"
