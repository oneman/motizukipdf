#!/bin/sh
# Check that the IUT_GAP("Id") marks in the sources and the table in src/iut_gaps.c agree:
# every mark names an entry, and every entry that is not "fixed" has at least one mark.
set -e
cd "$(dirname "$0")/.."
marks=$(grep -rhoE 'IUT_GAP\("[A-Za-z]+"\)' src scripts/manual/lib lean --include='*.c' --include='*.h' --include='*.js' --include='*.lean' --include='*.md' 2>/dev/null | sed -E 's/IUT_GAP\("([A-Za-z]+)"\)/\1/' | sort -u)
table=$(src/iut gaps --json | grep -oE '"id": "[A-Za-z]+", "stage": -?[0-9]+, "status": "[a-z]+"' | sed -E 's/"id": "([A-Za-z]+)".*"status": "([a-z]+)"/\1 \2/')
bad=0
for m in $marks; do
  [ "$m" = "Id" ] && continue
  echo "$table" | grep -q "^$m " || { echo "IUT_GAP(\"$m\") has no entry in src/iut_gaps.c"; bad=1; }
done
echo "$table" | while read -r id status; do
  [ "$status" = "fixed" ] && continue
  echo "$marks" | grep -qx "$id" || { echo "gap $id ($status) has no IUT_GAP mark in the sources"; exit 1; }
done || bad=1
[ "$bad" = 0 ] && echo "IUT_GAP marks and src/iut_gaps.c agree ($(echo "$table" | wc -l) entries)"
exit $bad
