# Atlantis website task runner. `just` with no arguments lists everything.

default:
    @just --list

# Serve the site with live reload on http://localhost:8080.
dev:
    pnpm dev

# Build the site into _site, the way the deploy workflow does.
build:
    pnpm build

format:
    pnpm format

lint:
    pnpm lint

check: lint build
