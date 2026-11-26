#!/usr/bin/env bash
set -euo pipefail
revision=4f1f2cc9bc07dcada5b0df184f281c6bd411c8e6
destination=${1:-/opt/minpred-downloads}
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
git clone --no-checkout https://github.com/usubioinfo/minpred.git "$work/repo"
git -C "$work/repo" checkout --detach "$revision"
mkdir -p "$destination"
git -C "$work/repo" archive --format=tar.gz --prefix=minpred/ --output="$destination/minpred-standalone.tar.gz" "$revision"
printf '%s\n' "$revision" > "$destination/REVISION.txt"
(cd "$destination" && sha256sum minpred-standalone.tar.gz > SHA256SUMS)
