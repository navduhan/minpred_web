#!/bin/bash
# Author: Naveen Duhan
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_TAG="${1:-minpred_web:latest}"

docker build -t "${IMAGE_TAG}" "${SCRIPT_DIR}"

echo "Built ${IMAGE_TAG}. Start it with:"
echo "docker compose --env-file deploy/docker.env -f deploy/compose.yaml -f deploy/compose.ssh-key.yaml up -d"
