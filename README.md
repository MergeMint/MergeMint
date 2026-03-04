# MergeMint (Experimental)

Merge code. Mint rewards.

MergeMint is an open experiment for programmable OSS incentives.

Goal: make contribution rewards verifiable, automatic, and easy to extend by both humans and AI agents.

GitHub PR lifecycle auto-reward using USDC:

- PR opened: `0.1 USDC` (test value)
- PR merged: `0.1 USDC` (test value)

Reward network plan:

- Current (experimental): `Base Sepolia` testnet USDC rewards
- Production target: `Base Mainnet` real USDC rewards

This repository contains:

- `contracts/PrBountyDistributor.sol`: reward distribution contract
- `service/`: GitHub webhook service that triggers rewards on-chain
- `.github/workflows/pr-reward.yml`: GitHub Actions auto-reward on PR events
- `service/src/admin-page.ts`: admin dashboard UI and controls

## Join This Experiment

This is an early-stage project. We actively welcome:

- builders who want to improve protocol and product design
- maintainers who can harden security and operations
- AI agents that can propose code, tests, docs, and automation improvements

If you are exploring AI-native open source collaboration, this repo is meant for you.

Contribution details: see `CONTRIBUTING.md`.
This repo also includes GitHub issue/PR templates for standardized collaboration.

## Contribution Guide (Human + AI Agents)

Recommended contribution areas:

- smart contract safety, upgrade path, and auditing readiness
- anti-abuse rules (sybil resistance, policy engine, reputation weighting)
- wallet identity mapping UX and developer tooling
- observability, incident response, and dashboard improvements
- multi-chain support and payout strategy optimization

Suggested workflow:

1. Open an issue with problem statement and expected outcome.
2. Submit a small PR with tests and clear scope.
3. For AI-generated changes, include assumptions and verification steps in PR description.

## Reward Eligibility (Important)

To receive rewards, contributors must submit their wallet address in advance.

- If your GitHub account has no wallet mapping, reward payout will be skipped.
- No retroactive payout is guaranteed for unmapped PR events.
- Use a valid EVM address on the target network.

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

## Current Status

- Live test setup is running with `0.1 / 0.1 USDC` rewards (opened / merged).
- Current payouts are on `Base Sepolia` testnet USDC.
- Mainnet launch will switch payouts to real USDC on `Base Mainnet`.
- Parameters are intentionally conservative for faucet and testnet limits.
- Architecture is still evolving; breaking changes are expected.

## GitHub Actions mode (recommended for repo testing)

This repo includes `.github/workflows/pr-reward.yml` to reward directly from GitHub Actions:

- `pull_request.opened` => `OPEN_REWARD_USDC` (default `0.1`)
- merged PR (`pull_request.closed` + `merged=true`) => `MERGE_REWARD_USDC` (default `0.1`)

Set repository secrets:

- `RPC_URL`
- `BOT_PRIVATE_KEY`
- `DISTRIBUTOR_CONTRACT`
- `WALLET_MAP_JSON` (JSON map, for example `{"alice":"0x..."}`)

Optional repository variables:

- `OPEN_REWARD_USDC` (default `0.1`)
- `MERGE_REWARD_USDC` (default `0.1`)
- `USDC_DECIMALS` (default `6`)

## Admin dashboard

Service provides an admin UI at `/admin` when `ADMIN_TOKEN` is set.
It includes:

- reward config and processed counters
- contract pause state and USDC balances
- one-click pause/resume reward transactions

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

## Vision

We want MergeMint to become a shared public sandbox where:

- contributors can be rewarded transparently
- maintainers keep policy control
- AI agents become first-class collaborators in open source growth
