export function adminPageHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MergeMint Admin</title>
    <style>
      :root {
        --bg: #f5f7fb;
        --card: #ffffff;
        --ink: #0f172a;
        --muted: #475569;
        --line: #dbe4f0;
        --primary: #155eef;
        --danger: #c01048;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-sans-serif, -apple-system, Segoe UI, Helvetica, Arial, sans-serif;
        background: radial-gradient(circle at 10% 10%, #e9f0ff 0, #f5f7fb 45%);
        color: var(--ink);
      }
      .wrap { max-width: 1000px; margin: 24px auto; padding: 0 16px; }
      .card {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 16px;
        margin-bottom: 14px;
      }
      h1 { font-size: 24px; margin: 0 0 12px; }
      h2 { font-size: 16px; margin: 0 0 10px; }
      .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
      input, button {
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 14px;
      }
      input { min-width: 320px; }
      button { background: var(--primary); color: #fff; cursor: pointer; }
      button.danger { background: var(--danger); }
      .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; }
      .kpi { border: 1px solid var(--line); border-radius: 10px; padding: 10px; overflow: hidden; min-width: 0; }
      .kpi .v { font-weight: 700; font-size: 18px; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { text-align: left; border-bottom: 1px solid var(--line); padding: 8px 4px; }
      .muted { color: var(--muted); font-size: 12px; }
      code { background: #ecf2ff; padding: 2px 6px; border-radius: 6px; }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 14px;
        word-break: break-all;
        white-space: normal;
      }
      .nowrap { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
      @media (max-width: 820px) {
        input { min-width: 220px; width: 100%; }
        .row { align-items: stretch; }
      }
      .err { color: var(--danger); white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>MergeMint Admin Dashboard</h1>
        <div class="row">
          <input id="token" type="password" placeholder="ADMIN_TOKEN" />
          <button id="saveToken">Save Token</button>
          <button id="refresh">Refresh</button>
        </div>
        <div class="muted">Token is stored in localStorage for this browser only.</div>
      </div>

      <div class="card">
        <h2>Service / Contract</h2>
        <div class="kpis" id="kpis"></div>
      </div>

      <div class="card">
        <h2>Admin Actions</h2>
        <div class="row">
          <button id="pause" class="danger">Pause Rewards</button>
          <button id="resume">Resume Rewards</button>
        </div>
        <div class="muted" id="actionResult"></div>
      </div>

      <div class="card">
        <h2>Recent Rewards</h2>
        <table>
          <thead><tr><th>Time</th><th>Event</th><th>Tx</th></tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
      <div id="err" class="err"></div>
    </div>
    <script>
      const tokenInput = document.getElementById("token");
      const errEl = document.getElementById("err");
      const actionResult = document.getElementById("actionResult");

      const LEGACY_TOKEN_KEY = "gitpay_admin_token";
      const TOKEN_KEY = "mergemint_admin_token";
      const legacyValue = localStorage.getItem(LEGACY_TOKEN_KEY) || "";
      const currentValue = localStorage.getItem(TOKEN_KEY) || "";
      if (!currentValue && legacyValue) {
        localStorage.setItem(TOKEN_KEY, legacyValue);
      }
      tokenInput.value = localStorage.getItem(TOKEN_KEY) || "";

      function token() {
        return localStorage.getItem(TOKEN_KEY) || "";
      }

      function headers() {
        return { "X-Admin-Token": token(), "Content-Type": "application/json" };
      }

      function setErr(msg) {
        errEl.textContent = msg || "";
      }

      function shortAddr(addr) {
        if (!addr || addr.length < 14) return addr || "-";
        return addr.slice(0, 8) + "..." + addr.slice(-6);
      }

      function kpi(label, value, options = {}) {
        const cls = options.valueClass ? ("v " + options.valueClass) : "v";
        const title = options.title ? (' title="' + String(options.title).replaceAll('"', "&quot;") + '"') : "";
        return '<div class="kpi"><div class="muted">' + label + '</div><div class="' + cls + '"' + title + '>' + value + '</div></div>';
      }

      async function refresh() {
        setErr("");
        const r = await fetch("/admin/api/status", { headers: headers() });
        if (!r.ok) {
          const t = await r.text();
          throw new Error("status failed: " + r.status + "\\n" + t);
        }
        const d = await r.json();
        document.getElementById("kpis").innerHTML = [
          kpi("Bot", '<span class="mono nowrap">' + shortAddr(d.bot) + '</span>', { title: d.bot }),
          kpi("Mock Mode", String(d.mockReward)),
          kpi("Paused", String(d.contract.paused)),
          kpi("Processed", String(d.processedCount)),
          kpi("Open Reward", d.config.openRewardUsdc + " USDC"),
          kpi("Merge Reward", d.config.mergeRewardUsdc + " USDC"),
          kpi("Contract USDC", d.contract.contractUsdcBalance),
          kpi("Bot USDC", d.contract.botUsdcBalance)
        ].join("");

        const rows = d.recent.map((x) => (
          "<tr><td>" + x.at + "</td><td><code>" + x.eventId + "</code></td><td><code>" + x.txHash + "</code></td></tr>"
        )).join("");
        document.getElementById("rows").innerHTML = rows || '<tr><td colspan="3" class="muted">No records</td></tr>';
      }

      async function setPaused(paused) {
        setErr("");
        actionResult.textContent = "Submitting...";
        const r = await fetch("/admin/api/pause", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ paused })
        });
        const body = await r.text();
        if (!r.ok) throw new Error("pause failed: " + r.status + "\\n" + body);
        actionResult.textContent = "OK: " + body;
        await refresh();
      }

      document.getElementById("saveToken").onclick = async () => {
        localStorage.setItem(TOKEN_KEY, tokenInput.value.trim());
        await refresh().catch((e) => setErr(String(e)));
      };
      document.getElementById("refresh").onclick = () => refresh().catch((e) => setErr(String(e)));
      document.getElementById("pause").onclick = () => setPaused(true).catch((e) => setErr(String(e)));
      document.getElementById("resume").onclick = () => setPaused(false).catch((e) => setErr(String(e)));

      refresh().catch((e) => setErr(String(e)));
    </script>
  </body>
</html>`;
}
