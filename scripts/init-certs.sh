#!/bin/sh
# Generates a self-signed TLS certificate into ./certs/ for local/dev use.
# Run this ONCE before `make build-prod`.
#
# Usage: ./scripts/init-certs.sh

set -e

DOMAIN="${DOMAIN:-localhost}"
CERTS_DIR="$(dirname "$0")/../certs"

mkdir -p "$CERTS_DIR"

echo "[*] Generating self-signed certificate for: $DOMAIN"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERTS_DIR/privkey.pem" \
  -out    "$CERTS_DIR/fullchain.pem" \
  -subj   "/C=MA/ST=42/L=42Network/O=Hive/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,IP:127.0.0.1" 2>/dev/null

echo "[*] Generating DH parameters (this takes a minute)..."
openssl dhparam -out "$CERTS_DIR/dhparam.pem" 2048 2>/dev/null

chmod 644 "$CERTS_DIR/privkey.pem"

echo ""
echo "[OK] Certificates written to $CERTS_DIR"
echo "     Now run: make build-prod"
