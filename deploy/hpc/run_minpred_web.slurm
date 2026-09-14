#!/usr/bin/env bash
#SBATCH --job-name=minpred-web
#SBATCH --partition=mahaguru
#SBATCH --nodelist=chela-g01
#SBATCH --cpus-per-task=6
#SBATCH --mem=48G
#SBATCH --time=12:00:00

set -euo pipefail
umask 077

if [[ $# -ne 5 ]]; then
  echo "Usage: $0 input.fasta Phase1|Phase2|Phase3|Phase4 enzyme-class output-directory protein|nucleotide" >&2
  exit 64
fi

input_fasta=$1
level=$2
enzyme_class=$3
output_dir=$4
sequence_type=$5
app_dir="${MINPRED_APP_DIR:-$HOME/naveen_tools/minpred}"
conda_env="${MINPRED_CONDA_ENV:-deepml}"
conda_exe="${MINPRED_CONDA_EXE:-$(command -v conda || true)}"
cli="$app_dir/minpred.py"

[[ -f "$input_fasta" ]] || { echo "Input FASTA is missing: $input_fasta" >&2; exit 66; }
[[ -f "$cli" ]] || { echo "MINpred CLI is missing: $cli" >&2; exit 69; }
[[ -n "$conda_exe" && -x "$conda_exe" ]] || { echo "Conda executable was not found. Set MINPRED_CONDA_EXE." >&2; exit 69; }
[[ "$level" =~ ^Phase[1-4]$ ]] || { echo "Invalid prediction level: $level" >&2; exit 64; }
[[ "$sequence_type" == protein || "$sequence_type" == nucleotide ]] || { echo "Invalid sequence type: $sequence_type" >&2; exit 64; }
[[ "$enzyme_class" =~ ^(all|amidohydrolases|aminopeptidases|aspartic|cysteine|dipeptidases|dipeptidyl|metalloendopeptidases|metallopeptidases|omega|serine)$ ]] || { echo "Invalid Phase IV enzyme class: $enzyme_class" >&2; exit 64; }

mkdir -p "$output_dir"
export MINPRED_MODEL_DIR="${MINPRED_MODEL_DIR:-$app_dir/models}"
export PYTHONNOUSERSITE=1
export TF_CPP_MIN_LOG_LEVEL=2

"$conda_exe" run --no-capture-output -n "$conda_env" python "$cli" \
  -i "$input_fasta" \
  -od "$output_dir" \
  -o minpred_predictions.tsv \
  -l "$level" \
  -n "$enzyme_class" \
  --sequence-type "$sequence_type"

# The CLI keeps detailed phase logs as .txt files. Expose read-only TSV copies
# to the web collector while preserving the standalone output contract.
for result in "$output_dir"/Phase_*_log.txt; do
  [[ -f "$result" ]] || continue
  cp -- "$result" "${result%.txt}.tsv"
done
