// utils/transaction-number.ts

export function generateTransactionNumber(
  prefix: string,
  lastNumber?: string | null
): string {
  const today = new Date();
  const yearMonth = `${today.getFullYear()}${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
  const fullPrefix = `${prefix}-${yearMonth}`;

  let sequence = 1;

  if (lastNumber && lastNumber.startsWith(fullPrefix)) {
    const lastSequence = parseInt(lastNumber.split("-").pop() || "0");
    sequence = lastSequence + 1;
  }

  return `${fullPrefix}-${String(sequence).padStart(4, "0")}`;
}

// Specific function for Material In
export function generateMaterialInNumber(lastNumber?: string | null): string {
  return generateTransactionNumber("MI", lastNumber);
}

// Specific function for Material Out
export function generateMaterialOutNumber(lastNumber?: string | null): string {
  return generateTransactionNumber("MO", lastNumber);
}

// Function to extract sequence from transaction number
export function extractSequence(transactionNo: string): number {
  const parts = transactionNo.split("-");
  return parseInt(parts[parts.length - 1] || "0");
}

// Function to check if transaction number is from current month
export function isCurrentMonthTransaction(transactionNo: string): boolean {
  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  // Extract year-month from transaction number (format: PREFIX-YYYYMM-XXXX)
  const parts = transactionNo.split("-");
  if (parts.length >= 2) {
    const yearMonth = parts[1];
    return yearMonth === currentYearMonth;
  }

  return false;
}
