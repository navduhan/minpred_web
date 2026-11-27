#!/bin/bash
# Author: Naveen Duhan
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_TAG="${1:-minpred_web:latest}"
STANDALONE_REF="${MINPRED_STANDALONE_REF:-$(git ls-remote https://github.com/usubioinfo/minpred.git refs/heads/main 2>/dev/null | awk 'NR==1 {print $1}' || true)}"
STANDALONE_REF="${STANDALONE_REF:-main}"

docker build \
  --build-arg "MINPRED_STANDALONE_REF=${STANDALONE_REF}" \
  -t "${IMAGE_TAG}" \
  "${SCRIPT_DIR}"

echo "Built ${IMAGE_TAG}. Start it with:"
echo "docker compose --env-file deploy/docker.env -f deploy/compose.yaml -f deploy/compose.ssh-key.yaml up -d"
