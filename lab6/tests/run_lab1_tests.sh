#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8880}"

function run_one() {
  local counter_id="$1"
  local clients="$2"
  local per_client="$3"
  local total=$((clients * per_client))

  echo ""
  echo "=== TEST (counter=$counter_id) clients=$clients totalRequests=$total ==="
  curl -s -X POST "$BASE_URL/reset" >/dev/null

  # Measure wall time
  local start end
  start=$(date +%s)

  # Fire clients in parallel
  for c in $(seq 1 "$clients"); do
    (
      for i in $(seq 1 "$per_client"); do
        curl -s "$BASE_URL/inc/$counter_id" >/dev/null
      done
    ) &
  done
  wait

  end=$(date +%s)
  local elapsed=$((end - start))

  # Throughput (req/s) with integer arithmetic
  local rps=0
  if [ "$elapsed" -gt 0 ]; then
    rps=$(( total / elapsed ))
  fi

  local val
  val=$(curl -s "$BASE_URL/count/$counter_id")
  echo "Final /count/$counter_id = $val"
  echo "Elapsed seconds (wall): $elapsed"
  echo "Throughput (req/s approx): $rps"
}

# Same 4 tests as in Lab1 table, mapped to counters 1..4
run_one 1 1 10000
run_one 2 2 10000
run_one 3 5 10000
run_one 4 10 10000
