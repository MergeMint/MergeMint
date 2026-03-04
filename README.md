# GitPay MVP

GitHub PR lifecycle auto-reward using USDC:

- PR opened: `1 USDC`
- PR merged: `10 USDC`

This repository contains:

- `contracts/PrBountyDistributor.sol`: reward distribution contract
- `service/`: GitHub webhook service that triggers rewards on-chain

## Flow

1. GitHub sends `pull_request` webhook events.
2. Service verifies `X-Hub-Signature-256`.
3. Service validates repo whitelist and event type.
4. Service resolves recipient wallet (from config map).
5. Service calls `reward(to, amount, eventId)` on contract.
6. Contract enforces idempotency (`eventId` cannot be reused).

## Security controls included

- GitHub webhook signature verification
- Repo whitelist
- Service-level idempotency store
- Contract-level idempotency guard
- Contract owner-only reward calls

## Quick start

### 1) Deploy contract

Use Hardhat:

```bash
cd contracts
cp .env.example .env
# set USDC_ADDRESS, DEPLOYER_PRIVATE_KEY, RPC URL
npm install
npm run deploy:base-sepolia
```

Deploy params for `contracts/PrBountyDistributor.sol`:

- `usdc`: USDC token contract address on your target chain
- `owner`: bot signer address (same key used by service)

Fund contract with USDC after deployment.

### 2) Configure service

```bash
cd service
cp .env.example .env
# edit .env
```

### 3) Install and run

```bash
cd service
npm install
npm run dev
```

### 4) Configure GitHub webhook

- Payload URL: `https://your-domain/webhooks/github`
- Content type: `application/json`
- Secret: same as `GITHUB_WEBHOOK_SECRET` in `.env`
- Events: `Pull requests`

## Wallet mapping

Use `GITHUB_TO_WALLET_JSON` in `.env`, e.g.:

```json
{"alice":"0x1111111111111111111111111111111111111111","bob":"0x2222222222222222222222222222222222222222"}
```

If a user has no mapped wallet, reward is skipped.
