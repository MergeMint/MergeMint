#!/usr/bin/env node
import fs from "node:fs";
import { ethers } from "ethers";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing env: ${name}`);
  }
  return value.trim();
}

function parseWalletMap(raw) {
  const parsed = JSON.parse(raw);
  const normalized = {};
  for (const [k, v] of Object.entries(parsed)) {
    normalized[k.toLowerCase()] = v;
  }
  return normalized;
}

function parseAllowedRepos(raw) {
  if (!raw || !raw.trim()) {
    return null;
  }
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

const eventPath = requiredEnv("GITHUB_EVENT_PATH");
const payload = JSON.parse(fs.readFileSync(eventPath, "utf8"));

const action = payload?.action;
const merged = payload?.pull_request?.merged === true;

let kind = null;
let rewardUsdc = null;
if (action === "opened") {
  kind = "opened";
  rewardUsdc = process.env.OPEN_REWARD_USDC || "0.1";
} else if (action === "closed" && merged) {
  kind = "merged";
  rewardUsdc = process.env.MERGE_REWARD_USDC || "0.1";
} else {
  console.log(`ignored event: action=${action} merged=${merged}`);
  process.exit(0);
}

const repoFullName = String(payload?.repository?.full_name || "").toLowerCase();
if (!repoFullName) {
  throw new Error("Invalid event payload: missing repository.full_name");
}

const allowedRepos = parseAllowedRepos(process.env.ALLOWED_REPOS || "");
if (allowedRepos && !allowedRepos.has(repoFullName)) {
  console.log(`ignored repo: ${repoFullName}`);
  process.exit(0);
}

const prNumber = payload?.pull_request?.number;
const githubUser = String(payload?.pull_request?.user?.login || "").toLowerCase();
if (!prNumber || !githubUser) {
  throw new Error("Invalid event payload: missing pull_request.number or pull_request.user.login");
}

const walletMapRaw = process.env.WALLET_MAP_JSON || process.env.GITHUB_TO_WALLET_JSON;
if (!walletMapRaw || !walletMapRaw.trim()) {
  throw new Error("Missing env: WALLET_MAP_JSON");
}
const walletMap = parseWalletMap(walletMapRaw);
const recipient = walletMap[githubUser];
if (!recipient) {
  console.log(`no wallet mapping for user=${githubUser}, skipped`);
  process.exit(0);
}
if (!ethers.isAddress(recipient)) {
  throw new Error(`Invalid mapped wallet for ${githubUser}: ${recipient}`);
}

const decimals = Number(process.env.USDC_DECIMALS || "6");
if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
  throw new Error(`Invalid USDC_DECIMALS: ${process.env.USDC_DECIMALS}`);
}

const eventId = `${repoFullName}#${prNumber}:${kind}`;
const amount = ethers.parseUnits(String(rewardUsdc), decimals);

const provider = new ethers.JsonRpcProvider(requiredEnv("RPC_URL"));
const signer = new ethers.Wallet(requiredEnv("BOT_PRIVATE_KEY"), provider);
const distributor = new ethers.Contract(
  requiredEnv("DISTRIBUTOR_CONTRACT"),
  [
    "function reward(address to, uint256 amount, bytes32 eventId) external",
  ],
  signer,
);

const tx = await distributor.reward(recipient, amount, ethers.id(eventId));
const receipt = await tx.wait();

console.log(
  JSON.stringify(
    {
      ok: true,
      repository: repoFullName,
      eventId,
      kind,
      githubUser,
      to: recipient,
      amountUsdc: Number(rewardUsdc),
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
    },
    null,
    2,
  ),
);
