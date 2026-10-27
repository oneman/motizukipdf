#!/bin/sh
# Serve the web app at http://localhost:${PORT:-8000}/
cd "$(dirname "$0")/../htdocs" && exec python3 -m http.server "${PORT:-8000}"
