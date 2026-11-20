import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 7).replace("-", "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `UPK-${dateStr}-${randomSuffix}`;
}
