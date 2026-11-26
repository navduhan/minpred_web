#!/usr/bin/env bash
set -euo pipefail
revision=35a508cb38451c6c964d4a27eee87745b4e4d70c
destination=${1:-/opt/minpred-downloads}
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
git clone --no-checkout https://github.com/usubioinfo/minpred.git "$work/repo"
git -C "$work/repo" checkout --detach "$revision"
mkdir -p "$destination"
git -C "$work/repo" archive --format=tar.gz --prefix=minpred/ --output="$destination/minpred-standalone.tar.gz" "$revision"
printf '%s\n' "$revision" > "$destination/REVISION.txt"
(cd "$destination" && sha256sum minpred-standalone.tar.gz > SHA256SUMS)
