#!/bin/sh
# Prints fresh secrets for a hosted API (see docs/DEPLOYMENT.md): a passphrase
# and an RS256 key pair protected by it, base64-encoded on one line each so
# they can be pasted into any hosting dashboard. Nothing is written to disk.
set -eu

command -v openssl > /dev/null || { echo "openssl is required" >&2; exit 1; }

workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT

passphrase=$(openssl rand -hex 32)
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -aes-256-cbc \
	-pass "pass:$passphrase" -out "$workdir/private.pem" 2> /dev/null
openssl pkey -in "$workdir/private.pem" -passin "pass:$passphrase" -pubout -out "$workdir/public.pem"

echo "JWT_PASSPHRASE=$passphrase"
echo "JWT_SECRET_KEY_BASE64=$(base64 < "$workdir/private.pem" | tr -d '\n')"
echo "JWT_PUBLIC_KEY_BASE64=$(base64 < "$workdir/public.pem" | tr -d '\n')"
