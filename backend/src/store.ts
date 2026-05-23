import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sessionPath = path.resolve(__dirname, "..", "session.json");

type Session = { currentUserId: string };

function read(): Session {
  try {
    return JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  } catch {
    return { currentUserId: "u-leo" };
  }
}

function write(s: Session) {
  fs.writeFileSync(sessionPath, JSON.stringify(s, null, 2));
}

export const session = {
  getCurrentUserId(): string {
    return read().currentUserId;
  },
  setCurrentUserId(id: string) {
    write({ currentUserId: id });
  },
};
