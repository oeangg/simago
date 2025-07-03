import { Prisma, PrismaClient } from "@prisma/client";

interface GenerateTransactionOptions {
  db: PrismaClient;
  tableName: string;
  prefix: string;
  fieldName?: string;
}

export async function generateAutoNumberTransaksi({
  db,
  tableName,
  prefix,
  fieldName = "transactionNo",
}: GenerateTransactionOptions): Promise<string> {
  const today = new Date();
  const yearMonth = `${today.getFullYear()}${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const fullPrefix = `${prefix}-${yearMonth}`;

  // Fix: Gunakan template literal dengan escape yang benar
  const result = await db.$queryRaw<Array<Record<string, string>>>`
    SELECT ${Prisma.raw(`"${fieldName}"`)} 
    FROM ${Prisma.raw(`"${tableName}"`)} 
    WHERE ${Prisma.raw(`"${fieldName}"`)} LIKE ${`${fullPrefix}%`}
    ORDER BY ${Prisma.raw(`"${fieldName}"`)} DESC 
    LIMIT 1
  `;

  let sequence = 1;
  if (result.length > 0 && result[0][fieldName]) {
    const lastSequence = parseInt(result[0][fieldName].split("-").pop() || "0");
    sequence = lastSequence + 1;
  }

  return `${fullPrefix}-${String(sequence).padStart(4, "0")}`;
}

export async function generateCodeAutoNumber({
  db,
  tableName,
  prefix,
  fieldName = "transactionNo",
}: GenerateTransactionOptions): Promise<string> {
  const fullPrefix = `${prefix}`;

  // Fix: Gunakan template literal dengan escape yang benar
  const result = await db.$queryRaw<Array<Record<string, string>>>`
    SELECT ${Prisma.raw(`"${fieldName}"`)} 
    FROM ${Prisma.raw(`"${tableName}"`)} 
    WHERE ${Prisma.raw(`"${fieldName}"`)} LIKE ${`${fullPrefix}%`}
    ORDER BY ${Prisma.raw(`"${fieldName}"`)} DESC 
    LIMIT 1
  `;

  let sequence = 1;
  if (result.length > 0 && result[0][fieldName]) {
    const lastSequence = parseInt(result[0][fieldName].split("-").pop() || "0");
    sequence = lastSequence + 1;
  }

  return `${fullPrefix}-${String(sequence).padStart(5, "0")}`;
}
