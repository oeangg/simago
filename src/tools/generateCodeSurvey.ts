// lib/utils/generateSurveyCode.ts
import {
  Prisma,
  PrismaClient,
  ShipmentDetail,
  ShipmentType,
} from "@prisma/client";

interface GenerateSurveyCodeOptions {
  db: PrismaClient;
  shipmentType: ShipmentType;
  shipmentDetail: ShipmentDetail;
}

export async function generateSurveyCode({
  db,
  shipmentType,
  shipmentDetail,
}: GenerateSurveyCodeOptions): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  // Generate prefix based on shipment type and detail
  const shipmentTypeCode = shipmentType === "DOMESTIC" ? "D" : "I";
  const shipmentDetailCode =
    shipmentDetail === "SEA" ? "S" : shipmentDetail === "DOM" ? "D" : "A";

  const basePrefix = `S${shipmentTypeCode}-${shipmentDetailCode}`;
  const fullPrefix = `${basePrefix}${year}${month}`;

  // Query to find the latest survey number with the same prefix pattern
  const result = await db.$queryRaw<Array<{ surveyNo: string }>>`
    SELECT "surveyNo" 
    FROM "surveys" 
    WHERE "surveyNo" LIKE ${`${fullPrefix}%`}
    ORDER BY "surveyNo" DESC 
    LIMIT 1
  `;

  let sequence = 1;
  if (result.length > 0 && result[0].surveyNo) {
    // Extract sequence number from the last 4 digits
    const lastSurveyNo = result[0].surveyNo;
    const sequencePart = lastSurveyNo.slice(-4);
    const lastSequence = parseInt(sequencePart);
    sequence = lastSequence + 1;
  }

  const sequenceString = String(sequence).padStart(4, "0");
  return `${fullPrefix}${sequenceString}`;
}

// Alternative function that matches your original pattern more closely
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

  const fullPrefix = `${prefix}${yearMonth}`;

  // Use parameterized query for better security
  const result = await db.$queryRaw<Array<Record<string, string>>>`
    SELECT ${Prisma.raw(`"${fieldName}"`)} 
    FROM ${Prisma.raw(`"${tableName}"`)} 
    WHERE ${Prisma.raw(`"${fieldName}"`)} LIKE ${`${fullPrefix}%`}
    ORDER BY ${Prisma.raw(`"${fieldName}"`)} DESC 
    LIMIT 1
  `;

  let sequence = 1;
  if (result.length > 0 && result[0][fieldName]) {
    // Extract the last 4 digits as sequence number
    const lastTransactionNo = result[0][fieldName];
    const sequencePart = lastTransactionNo.slice(-4);
    const lastSequence = parseInt(sequencePart);
    sequence = lastSequence + 1;
  }

  const sequenceString = String(sequence).padStart(4, "0");
  return `${fullPrefix}${sequenceString}`;
}
