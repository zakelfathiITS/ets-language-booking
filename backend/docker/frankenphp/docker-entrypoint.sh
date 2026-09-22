#!/bin/sh
set -e

if [ "$1" = 'frankenphp' ] || [ "$1" = 'php' ] || [ "$1" = 'bin/console' ]; then
	# Dev image: sources are bind-mounted, so vendor/ may be missing on first run.
	if [ -z "$(ls -A 'vendor/' 2>/dev/null)" ]; then
		composer install --prefer-dist --no-progress --no-interaction
	fi

	# Let both the web server and CLI users write to the cache and log dirs.
	mkdir -p var/cache var/log
	setfacl -R -m u:www-data:rwX -m u:"$(whoami)":rwX var
	setfacl -dR -m u:www-data:rwX -m u:"$(whoami)":rwX var
fi

if [ "$1" = 'frankenphp' ]; then
	# JWT signing keys are never baked into an image. Hosted deployments pass
	# them base64-encoded (see `make deploy-secrets`), so they survive restarts
	# of an ephemeral filesystem; otherwise they are created on first start.
	if [ -n "${JWT_SECRET_KEY_BASE64:-}" ] && [ -n "${JWT_PUBLIC_KEY_BASE64:-}" ]; then
		mkdir -p config/jwt
		printf '%s' "$JWT_SECRET_KEY_BASE64" | base64 -d > config/jwt/private.pem
		printf '%s' "$JWT_PUBLIC_KEY_BASE64" | base64 -d > config/jwt/public.pem
	fi
	bin/console lexik:jwt:generate-keypair --skip-if-exists

	# Create or update the indexes declared in the XML mapping. Idempotent, so
	# it is safe on every start; MongoDB has no schema migrations beyond this.
	# No validation rules are declared: skipping them also avoids "collMod",
	# which shared database tiers restrict.
	bin/console doctrine:mongodb:schema:update --skip-search-indexes --disable-validators --no-interaction

	# Demo accounts and sessions for reviewers (skipped when data already exists).
	if [ "${APP_SEED_DEMO_DATA:-0}" = '1' ]; then
		bin/console app:seed --no-interaction
	fi
fi

exec docker-php-entrypoint "$@"
