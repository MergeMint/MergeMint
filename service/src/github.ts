import crypto from "node:crypto";

export type PullRequestEvent = {
  action: string;
  repository: {
    full_name: string;
  };
  pull_request: {
    number: number;
    merged: boolean;
    user: {
      login: string;
    };
  };
};

export function verifyGithubSignature(rawBody: Buffer, secret: string, signatureHeader?: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const given = signatureHeader;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export function buildEventId(payload: PullRequestEvent, kind: "opened" | "merged"): string {
  return `${payload.repository.full_name.toLowerCase()}#${payload.pull_request.number}:${kind}`;
}

export function resolveRewardKind(
  payload: PullRequestEvent,
): { kind: "opened" | "merged"; githubUser: string } | null {
  if (payload.action === "opened") {
    return { kind: "opened", githubUser: payload.pull_request.user.login.toLowerCase() };
  }
  if (payload.action === "closed" && payload.pull_request.merged) {
    return { kind: "merged", githubUser: payload.pull_request.user.login.toLowerCase() };
  }
  return null;
}
