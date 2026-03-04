import express from "express";
import { settings } from "./config.js";
import { buildEventId, resolveRewardKind, verifyGithubSignature, type PullRequestEvent } from "./github.js";
import { Rewarder } from "./rewarder.js";
import { JsonStore } from "./store.js";

const app = express();
const rewarder = new Rewarder(
  settings.rpcUrl,
  settings.botPrivateKey,
  settings.distributorContract,
  settings.mockReward,
);
const store = new JsonStore(settings.storePath);

app.get("/healthz", (_req, res) => {
  res.status(200).json({
    ok: true,
    bot: rewarder.botAddress,
    mockReward: settings.mockReward,
  });
});

app.post(
  "/webhooks/github",
  express.raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    try {
      const rawBody = req.body as Buffer;
      const signature = req.header("X-Hub-Signature-256");
      const event = req.header("X-GitHub-Event");

      if (event !== "pull_request") {
        res.status(200).json({ ok: true, ignored: "non pull_request event" });
        return;
      }

      if (!verifyGithubSignature(rawBody, settings.githubSecret, signature)) {
        res.status(401).json({ ok: false, error: "invalid signature" });
        return;
      }

      const payload = JSON.parse(rawBody.toString("utf8")) as PullRequestEvent;
      const repo = payload.repository.full_name.toLowerCase();
      if (!settings.allowedRepos.has(repo)) {
        res.status(200).json({ ok: true, ignored: "repo not allowed" });
        return;
      }

      const rewardKind = resolveRewardKind(payload);
      if (!rewardKind) {
        res.status(200).json({ ok: true, ignored: "action not target" });
        return;
      }

      const eventIdText = buildEventId(payload, rewardKind.kind);
      if (store.has(eventIdText)) {
        res.status(200).json({ ok: true, ignored: "already processed", eventId: eventIdText });
        return;
      }

      const wallet = settings.walletMap[rewardKind.githubUser];
      if (!wallet) {
        res.status(200).json({ ok: true, ignored: "wallet not found", user: rewardKind.githubUser });
        return;
      }

      const amount = rewardKind.kind === "opened" ? settings.openRewardUsdc : settings.mergeRewardUsdc;
      const txHash = await rewarder.reward(wallet, amount, eventIdText);
      store.set(eventIdText, txHash);

      res.status(200).json({
        ok: true,
        eventId: eventIdText,
        kind: rewardKind.kind,
        amountUsdc: amount,
        to: wallet,
        txHash,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      res.status(500).json({ ok: false, error: message });
    }
  },
);

app.listen(settings.port, () => {
  // Keep logs minimal; service is expected to run behind a process manager.
  console.log(`gitpay service listening on :${settings.port}`);
});
