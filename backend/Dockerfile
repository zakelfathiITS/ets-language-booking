# syntax=docker/dockerfile:1

#------------------------------------------------------------------------------
# Base: FrankenPHP (Caddy web server + PHP 8.3) with the API's PHP extensions.
#------------------------------------------------------------------------------
FROM dunglas/frankenphp:1-php8.3-bookworm AS base

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends acl curl file git unzip \
    && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    install-php-extensions \
        @composer \
        apcu \
        intl \
        mongodb \
        opcache \
        zip \
    ;

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    SERVER_NAME=":80"

# The base image lets FrankenPHP bind ports below 1024 through a file
# capability. Hosts that drop all capabilities (e.g. Render) refuse to start a
# binary carrying one ("Operation not permitted"), and the server does not need
# it: it runs as root locally, on a high port (10000) when hosted.
RUN setcap -r /usr/local/bin/frankenphp

COPY --link docker/frankenphp/conf.d/10-app.ini $PHP_INI_DIR/conf.d/
COPY --link --chmod=755 docker/frankenphp/docker-entrypoint.sh /usr/local/bin/docker-entrypoint
COPY --link docker/frankenphp/Caddyfile /etc/caddy/Caddyfile

# The health endpoint also checks MongoDB, so "healthy" means ready to serve.
HEALTHCHECK --interval=10s --timeout=5s --start-period=90s --retries=10 \
    CMD curl -fsS "http://127.0.0.1${SERVER_NAME}/api/health" > /dev/null || exit 1

ENTRYPOINT ["docker-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]

#------------------------------------------------------------------------------
# Dev: sources are bind-mounted, dependencies installed at startup.
#------------------------------------------------------------------------------
FROM base AS dev

ENV APP_ENV=dev

RUN set -eux; \
    mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"; \
    install-php-extensions pcov

COPY --link docker/frankenphp/conf.d/20-app.dev.ini $PHP_INI_DIR/conf.d/

CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile", "--watch"]

#------------------------------------------------------------------------------
# Prod: immutable image with optimized autoloader and warmed-up cache.
#------------------------------------------------------------------------------
FROM base AS prod

ENV APP_ENV=prod \
    APP_DEBUG=0

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY --link docker/frankenphp/conf.d/20-app.prod.ini $PHP_INI_DIR/conf.d/

# Dependencies first: this layer stays cached until composer files change.
COPY --link composer.* symfony.* ./
RUN composer install --no-dev --prefer-dist --no-autoloader --no-scripts --no-progress --no-interaction

COPY --link . ./
RUN set -eux; \
    rm -rf docker; \
    mkdir -p var/cache var/log; \
    composer dump-autoload --classmap-authoritative --no-dev; \
    composer dump-env prod; \
    composer run-script --no-dev post-install-cmd; \
    chmod +x bin/console; \
    sync
