import fs from "node:fs";
import path from "node:path";

type StoreSchema = {
  processed: Record<string, { at: string; txHash: string }>;
};

export type ProcessedEntry = {
  eventId: string;
  at: string;
  txHash: string;
};

export class JsonStore {
  private readonly filePath: string;
  private data: StoreSchema;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
    this.ensureFile();
    this.data = this.read();
  }

  has(eventId: string): boolean {
    return Boolean(this.data.processed[eventId]);
  }

  set(eventId: string, txHash: string): void {
    this.data.processed[eventId] = {
      at: new Date().toISOString(),
      txHash,
    };
    this.write();
  }

  count(): number {
    return Object.keys(this.data.processed).length;
  }

  recent(limit = 20): ProcessedEntry[] {
    return Object.entries(this.data.processed)
      .map(([eventId, v]) => ({
        eventId,
        at: v.at,
        txHash: v.txHash,
      }))
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, Math.max(1, limit));
  }

  private ensureFile(): void {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({ processed: {} }, null, 2), "utf8");
    }
  }

  private read(): StoreSchema {
    const raw = fs.readFileSync(this.filePath, "utf8");
    return JSON.parse(raw) as StoreSchema;
  }

  private write(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf8");
  }
}
