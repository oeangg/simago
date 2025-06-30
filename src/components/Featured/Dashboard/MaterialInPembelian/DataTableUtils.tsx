import { format } from "date-fns";
import { MaterialInColumnsProps } from "./Columns";

// Type guard untuk memastikan data adalah SupplierColumnsProps
export function isMaterialData(data: unknown): data is MaterialInColumnsProps {
  return (
    typeof data === "object" &&
    data !== null &&
    "transactionNo" in data &&
    "transactionDate" in data &&
    "invoiceNo" in data &&
    "supplierName" in data &&
    "items" in data
  );
}

// Utility function untuk mendapatkan data dari row dengan type safety
export function getMaterialInFromRow<T>(row: {
  original: T;
}): MaterialInColumnsProps {
  const material = row.original;

  if (!isMaterialData(material)) {
    throw new Error("Invalid material data structure");
  }

  return material;
}

// Search utility function
// Simple search utility function (sesuai dengan router)
export function searchMaterialIn(
  materialIn: MaterialInColumnsProps,
  searchTerm: string
): boolean {
  const search = searchTerm.toLowerCase().trim();

  if (!search) return true;

  // Search in main fields only (like in the router)
  return (
    materialIn.transactionNo?.toLowerCase().includes(search) ||
    materialIn.supplierName?.toLowerCase().includes(search) ||
    materialIn.invoiceNo?.toLowerCase().includes(search) ||
    format(new Date(materialIn.transactionDate), "dd/MM/yyyy").includes(search)
  );
}
