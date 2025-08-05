// lib/utils/generateSurveyCode.ts
import { PrismaClient } from "@prisma/client";

interface GenerateSurveyCodeOptions {
  db: PrismaClient;
}

export async function generateQuotationDomNumber({
  db,
}: GenerateSurveyCodeOptions): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  // Generate prefix based on shipment type and detail

  const basePrefix = `QDOM`;
  const fullPrefix = `${basePrefix}-${year}${month}`;

  // Query to find the latest survey number with the same prefix pattern
  const result = await db.$queryRaw<Array<{ quotationNo: string }>>`
    SELECT "quotationNo" 
    FROM "quotation_domestics" 
    WHERE "quotationNo" LIKE ${`${fullPrefix}%`}
    ORDER BY "quotationNo" DESC 
    LIMIT 1
  `;

  let sequence = 1;
  if (result.length > 0 && result[0].quotationNo) {
    // Extract sequence number from the last 4 digits
    const lastSurveyNo = result[0].quotationNo;
    const sequencePart = lastSurveyNo.slice(-4);
    const lastSequence = parseInt(sequencePart);
    sequence = lastSequence + 1;
  }

  const sequenceString = String(sequence).padStart(4, "0");
  return `${fullPrefix}${sequenceString}`;
}
