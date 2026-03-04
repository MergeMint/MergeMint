import fs from "node:fs";
import path from "node:path";

type StoreSchema = {
  processed: Record<string, { at: string; txHash: string }>;
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
