#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="${ROOT_DIR}/src-tauri/icon-source.png"
TAURI_ICONS="${ROOT_DIR}/src-tauri/icons"
WEB_ICONS="${ROOT_DIR}/public/icons"
STAMP="${TAURI_ICONS}/.source.sha256"

if [[ ! -f "${SOURCE}" ]]; then
  echo "Missing icon source: ${SOURCE}" >&2
  exit 1
fi

mkdir -p "${TAURI_ICONS}" "${WEB_ICONS}"

SOURCE_HASH="$(sha256sum "${SOURCE}" | awk '{print $1}')"

if [[ -f "${STAMP}" && "$(<"${STAMP}")" == "${SOURCE_HASH}" ]]; then
  echo "Icon assets are current for ${SOURCE_HASH}."
  exit 0
fi

# Tauri owns the platform-specific output: ICO, ICNS, Windows Store logos,
# Android adaptive icons, iOS AppIcon sizes, and desktop PNGs.
bunx tauri icon "${SOURCE}" --output "${TAURI_ICONS}"

# Generate deterministic web/PWA sizes using the same source image.
bunx tauri icon "${SOURCE}" --output "${WEB_ICONS}" --png 16,32,180,192,512
cp "${TAURI_ICONS}/icon.ico" "${ROOT_DIR}/public/favicon.ico"
cp "${WEB_ICONS}/180x180.png" "${ROOT_DIR}/public/apple-touch-icon.png"
cp "${WEB_ICONS}/192x192.png" "${ROOT_DIR}/public/icons/icon-192.png"
cp "${WEB_ICONS}/512x512.png" "${WEB_ICONS}/icon-512.png"
cp "${WEB_ICONS}/512x512.png" "${ROOT_DIR}/public/icons/icon-512-maskable.png"
printf '%s' "${SOURCE_HASH}" > "${STAMP}"
