import { config as loadEnv } from "dotenv";

loadEnv();

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing env: ${name}`);
  }
  return v.trim();
}

function parseRepoList(raw: string): Set<string> {
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

function parseWalletMap(raw: string): Record<string, string> {
  const parsed = JSON.parse(raw) as Record<string, string>;
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    normalized[k.toLowerCase()] = v;
  }
  return normalized;
}

export const settings = {
  port: Number(process.env.PORT || 3000),
  githubSecret: getEnv("GITHUB_WEBHOOK_SECRET"),
  allowedRepos: parseRepoList(getEnv("ALLOWED_REPOS")),
  walletMap: parseWalletMap(getEnv("GITHUB_TO_WALLET_JSON")),
  mockReward: process.env.MOCK_REWARD === "true",
  rpcUrl: process.env.RPC_URL || "",
  botPrivateKey: process.env.BOT_PRIVATE_KEY || "",
  distributorContract: process.env.DISTRIBUTOR_CONTRACT || "",
  openRewardUsdc: Number(process.env.OPEN_REWARD_USDC || "1"),
  mergeRewardUsdc: Number(process.env.MERGE_REWARD_USDC || "10"),
  storePath: process.env.STORE_PATH || "./data/store.json",
};

if (!settings.mockReward) {
  if (!settings.rpcUrl.trim()) {
    throw new Error("Missing env: RPC_URL");
  }
  if (!settings.botPrivateKey.trim()) {
    throw new Error("Missing env: BOT_PRIVATE_KEY");
  }
  if (!settings.distributorContract.trim()) {
    throw new Error("Missing env: DISTRIBUTOR_CONTRACT");
  }
}
