// lib/utils/generateSurveyCode.ts
import { PrismaClient, ShipmentDetail, ShipmentType } from "@prisma/client";

interface GenerateSurveyCodeOptions {
  db: PrismaClient;
  shipmentType: ShipmentType;
  shipmentDetail: ShipmentDetail;
}

export async function generateSurveyNumber({
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
