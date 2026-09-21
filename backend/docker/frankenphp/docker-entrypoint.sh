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
	# JWT signing keys are created on first start and never baked into an image.
	bin/console lexik:jwt:generate-keypair --skip-if-exists

	# Create or update the indexes declared in the XML mapping. Idempotent, so
	# it is safe on every start; MongoDB has no schema migrations beyond this.
	bin/console doctrine:mongodb:schema:update --skip-search-indexes --no-interaction

	# Demo accounts and sessions for reviewers (skipped when data already exists).
	if [ "${APP_SEED_DEMO_DATA:-0}" = '1' ]; then
		bin/console app:seed --no-interaction
	fi
fi

exec docker-php-entrypoint "$@"
