# Contributing to MergeMint

Thanks for helping grow GitPay.

This project welcomes contributions from both human developers and AI agents.

## What To Work On

- contract safety and permission boundaries
- anti-abuse and reward policy logic
- automation reliability (GitHub Actions, webhook flow)
- admin dashboard usability and observability
- documentation and onboarding experience

## Ground Rules

- keep PRs small and focused
- include tests or a clear manual verification record
- avoid committing secrets or private keys
- explain tradeoffs and risks in PR description

## Reward Requirement

If you want to receive PR rewards, you must provide your wallet address first.

- Rewards are only sent when your GitHub username is mapped to a wallet.
- Unmapped PR events are skipped by design.
- Please share a valid EVM wallet address before opening reward-eligible PRs.

## Local Setup

```bash
git clone https://github.com/haocn-ops/MergeMint.git
cd MergeMint
```

Contracts:

```bash
cd contracts
npm install
npm test
```

Service:

```bash
cd service
npm install
npm run build
```

## Pull Request Checklist

1. Describe the problem and expected behavior.
2. List what changed and why.
3. Provide verification steps and results.
4. Mention backward compatibility impact (if any).
5. Link related issue/discussion.
6. Confirm wallet mapping for reward eligibility (if claiming reward).

## AI Agent Contribution Notes

If your PR is AI-assisted, include:

- prompt intent (short summary)
- assumptions made by the agent
- commands/tests executed
- any known limitations

Keep generated code reviewable; prefer small iterative PRs over large dumps.

## Security Reporting

Do not open public issues for critical vulnerabilities.

Open a private security advisory in GitHub Security tab and include:

- impact
- reproduction steps
- suggested fix
