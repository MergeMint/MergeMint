# GitPay Service

Webhook receiver that maps GitHub PR events to on-chain USDC rewards.

## Required env

Copy and edit:

```bash
cp .env.example .env
```

Fields:

- `GITHUB_WEBHOOK_SECRET`: shared secret from GitHub webhook settings
- `ALLOWED_REPOS`: comma-separated `owner/repo`
- `GITHUB_TO_WALLET_JSON`: GitHub username -> EVM wallet mapping
- `MOCK_REWARD`: set `true` to skip on-chain tx for local testing
- `RPC_URL`: JSON-RPC endpoint
- `BOT_PRIVATE_KEY`: private key of reward bot / contract owner
- `DISTRIBUTOR_CONTRACT`: deployed `PrBountyDistributor` address
- `OPEN_REWARD_USDC`: amount for `pull_request.opened`
- `MERGE_REWARD_USDC`: amount for merged PR

## Run

```bash
npm install
npm run dev
```

For local test without chain:

```bash
MOCK_REWARD=true npm run dev
```

Send a signed test webhook:

```bash
GITHUB_WEBHOOK_SECRET=your_secret ./scripts/send_pr_webhook.sh opened
GITHUB_WEBHOOK_SECRET=your_secret ./scripts/send_pr_webhook.sh merged
```

Run direct reward from a GitHub event payload (used by Actions):

```bash
node scripts/reward_from_github_event.mjs
```

## Endpoints

- `GET /healthz`
- `POST /webhooks/github`

`POST /webhooks/github` expects raw `application/json` body from GitHub.

## Event rules

- `pull_request.opened` => reward `OPEN_REWARD_USDC`
- `pull_request.closed` with `merged=true` => reward `MERGE_REWARD_USDC`

Non-matching events are ignored with HTTP 200.

## Idempotency

Service-level:

- `STORE_PATH` JSON tracks processed event IDs.
- Event ID format: `owner/repo#pr_number:opened|merged`

Contract-level:

- `processed[bytes32(eventId)]` blocks duplicate reward calls.
