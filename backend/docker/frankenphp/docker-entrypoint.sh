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
	# Create or update the indexes declared in the XML mapping. Idempotent, so
	# it is safe on every start; MongoDB has no schema migrations beyond this.
	bin/console doctrine:mongodb:schema:update --skip-search-indexes --no-interaction
fi

exec docker-php-entrypoint "$@"
