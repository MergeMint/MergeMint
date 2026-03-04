#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/send_pr_webhook.sh opened
#   ./scripts/send_pr_webhook.sh merged

ACTION="${1:-opened}"
PORT="${PORT:-3000}"
SECRET="${GITHUB_WEBHOOK_SECRET:-testsecret}"
REPO="${TEST_REPO:-acme/payroll}"
PR_NUMBER="${TEST_PR_NUMBER:-42}"
AUTHOR="${TEST_PR_AUTHOR:-alice}"

if [[ "$ACTION" != "opened" && "$ACTION" != "merged" ]]; then
  echo "ACTION must be opened or merged"
  exit 1
fi

if [[ "$ACTION" == "opened" ]]; then
  PAYLOAD="{\"action\":\"opened\",\"repository\":{\"full_name\":\"${REPO}\"},\"pull_request\":{\"number\":${PR_NUMBER},\"merged\":false,\"user\":{\"login\":\"${AUTHOR}\"}}}"
else
  PAYLOAD="{\"action\":\"closed\",\"repository\":{\"full_name\":\"${REPO}\"},\"pull_request\":{\"number\":${PR_NUMBER},\"merged\":true,\"user\":{\"login\":\"${AUTHOR}\"}}}"
fi

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT
printf '%s' "$PAYLOAD" >"$TMP_FILE"

SIG="$(openssl dgst -sha256 -hmac "$SECRET" "$TMP_FILE" | awk '{print $2}')"

curl -s -X POST "http://127.0.0.1:${PORT}/webhooks/github" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-Hub-Signature-256: sha256=${SIG}" \
  --data-binary @"$TMP_FILE"
echo
