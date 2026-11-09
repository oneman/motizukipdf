#!/bin/sh
# Build, run the C self-tests, the node web-engine tests, and check generated files are in sync.
set -e
cd "$(dirname "$0")/../src"
make
./iut selftest
if command -v node >/dev/null 2>&1; then node ../htdocs/test.js; fi
make check
# the GUI (only when GTK 3 is installed): every example through every stage, compared with `iut pipeline`
if pkg-config --exists gtk+-3.0 2>/dev/null; then make gui-check; else echo "GTK 3 not found: skipping iut-gui --check"; fi
