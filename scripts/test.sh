#!/bin/sh
# Build, run the C self-tests, the node web-engine tests, and check generated files are in sync.
set -e
cd "$(dirname "$0")/../src"
make
./iut selftest
if command -v node >/dev/null 2>&1; then node ../htdocs/test.js; fi
make check
