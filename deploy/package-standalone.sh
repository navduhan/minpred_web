#!/usr/bin/env bash
set -euo pipefail

destination="${1:-/opt/minpred-downloads}"
requested_ref="${2:-${MINPRED_STANDALONE_REF:-main}}"
repo_slug="${MINPRED_REPO_SLUG:-usubioinfo/minpred}"
repo_git_url="https://github.com/${repo_slug}.git"

resolve_ref() {
    local ref="$1" sha="" candidate=""
    if [[ "$ref" =~ ^[0-9a-f]{40}$ ]]; then
        printf '%s\n' "$ref"
        return 0
    fi
    for candidate in "refs/heads/${ref}" "refs/tags/${ref}^{}" "refs/tags/${ref}" "${ref}"; do
        sha="$(git ls-remote "$repo_git_url" "$candidate" | awk 'NR==1 {print $1}')"
        if [[ "$sha" =~ ^[0-9a-f]{40}$ ]]; then
            printf '%s\n' "$sha"
            return 0
        fi
    done
    return 1
}

revision="$(resolve_ref "$requested_ref" || true)"
if [[ ! "$revision" =~ ^[0-9a-f]{40}$ ]]; then
    printf 'Failed to resolve GitHub ref "%s" from %s\n' "$requested_ref" "$repo_git_url" >&2
    exit 1
fi

work="$(mktemp -d)"
trap 'rm -rf -- "$work"' EXIT

mkdir -p "$work/extract" "$destination"
printf 'Packaging %s @ %s ...\n' "$repo_slug" "$revision"
curl --fail --silent --show-error --location --retry 3 --retry-delay 2 \
    "https://codeload.github.com/${repo_slug}/tar.gz/${revision}" \
    -o "$work/source.tar.gz"

tar -xzf "$work/source.tar.gz" -C "$work/extract"
extracted_dir="$(find "$work/extract" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
if [[ -z "$extracted_dir" || ! -f "$extracted_dir/pyproject.toml" || ! -f "$extracted_dir/minpred.sl" ]]; then
    printf 'Downloaded archive for %s did not contain a valid MINpred source tree.\n' "$revision" >&2
    exit 1
fi

mv "$extracted_dir" "$work/minpred"
tar -czf "$destination/minpred-standalone.tar.gz" -C "$work" minpred
printf '%s\n' "$revision" > "$destination/REVISION.txt"
(
    cd "$destination"
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum minpred-standalone.tar.gz > SHA256SUMS
    else
        shasum -a 256 minpred-standalone.tar.gz > SHA256SUMS
    fi
)
