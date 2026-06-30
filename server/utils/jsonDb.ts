import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// Helper to ensure data directory exists and returns file path
function getFilePath(filename: string): string {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf-8");
  }
  return filePath;
}

// Read data from a file
export function readData<T>(filename: string): T[] {
  try {
    const filePath = getFilePath(filename);
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content || "[]") as T[];
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return [];
  }
}

// Write data to a file
export function writeData<T>(filename: string, data: T[]): void {
  try {
    const filePath = getFilePath(filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing to ${filename}:`, err);
  }
}

// Abstract JSON collection builder
export class JsonCollection<T extends { id: string; createdAt?: Date | string }> {
  private filename: string;

  constructor(collectionName: string) {
    this.filename = `${collectionName}.json`;
  }

  find(filter?: Partial<T> | ((item: T) => boolean)): T[] {
    const data = readData<T>(this.filename);
    if (!filter) return data;

    if (typeof filter === "function") {
      return data.filter(filter);
    }

    return data.filter((item) => {
      for (const key in filter) {
        if (item[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });
  }

  findOne(filter: Partial<T> | ((item: T) => boolean)): T | null {
    const items = this.find(filter);
    return items.length > 0 ? items[0] : null;
  }

  findById(id: string): T | null {
    return this.findOne({ id } as any);
  }

  create(doc: Omit<T, "id" | "createdAt">): T {
    const data = readData<T>(this.filename);
    const newDoc = {
      ...doc,
      id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
      createdAt: new Date().toISOString()
    } as unknown as T;

    data.push(newDoc);
    writeData(this.filename, data);
    return newDoc;
  }

  findByIdAndUpdate(id: string, update: Partial<T>): T | null {
    const data = readData<T>(this.filename);
    const index = data.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...data[index],
      ...update
    };

    data[index] = updatedItem;
    writeData(this.filename, data);
    return updatedItem;
  }

  findByIdAndDelete(id: string): boolean {
    const data = readData<T>(this.filename);
    const filtered = data.filter((item) => item.id !== id);
    if (filtered.length === data.length) return false;

    writeData(this.filename, filtered);
    return true;
  }
}
