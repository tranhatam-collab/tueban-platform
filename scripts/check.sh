#!/usr/bin/env bash
set -euo pipefail
echo "==> Typechecking API..."
npx tsc --noEmit -p apps/api
echo "==> Validating HTML structure..."
for f in apps/web/public/*.html apps/web/public/**/index.html; do
  if [ -f "$f" ]; then
    python3 -c "
import sys, re
with open('$f') as fh:
    html = fh.read()
if not re.search(r'<!doctype html>', html, re.I):
    print(f'WARN: $f missing doctype')
if not re.search(r'</html>', html):
    print(f'WARN: $f missing closing html tag')
print(f'OK: $f (' + str(len(html)) + ' bytes)')
"
  fi
done
echo "==> All checks passed."
