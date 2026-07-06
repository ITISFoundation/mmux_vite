#!/usr/bin/env bash
# Prints the first free TCP port on localhost, starting at <base_port> and
# probing upward. Exits 1 if no free port is found within the search range.
set -euo pipefail

base_port="${1:?usage: find-free-port.sh <base_port> [max_tries]}"
max_tries="${2:-50}"

port="$base_port"
tries=0
while (( tries < max_tries )); do
  if ! timeout 1 bash -c "echo > /dev/tcp/127.0.0.1/$port" 2>/dev/null; then
    echo "$port"
    exit 0
  fi
  port=$((port + 1))
  tries=$((tries + 1))
done

echo "find-free-port.sh: no free port found in range $base_port-$((base_port + max_tries - 1))" >&2
exit 1
