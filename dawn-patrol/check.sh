#!/usr/bin/env bash
# Runs the headless checks for every milestone.
# Usage: GODOT=/path/to/godot ./check.sh
set -euo pipefail
GODOT="${GODOT:-godot}"
cd "$(dirname "$0")"

echo "== Import / parse =="
"$GODOT" --headless --path . --import

echo "== Boot main scene =="
"$GODOT" --headless --path . --quit

if [ -d addons/gut ]; then
	echo "== Unit tests (GUT) =="
	"$GODOT" --headless --path . -s addons/gut/gut_cmdln.gd -gconfig=res://.gutconfig.json
else
	echo "GUT not installed (addons/gut missing) - skipping tests."
fi
