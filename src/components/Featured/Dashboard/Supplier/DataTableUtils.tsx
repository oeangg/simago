import { SupplierColumnsProps } from "./Columns";

// Type guard untuk memastikan data adalah SupplierColumnsProps
export function isSupplierData(data: unknown): data is SupplierColumnsProps {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    "name" in data &&
    "supplierType" in data &&
    "statusActive" in data &&
    "contacts" in data &&
    "addresses" in data
  );
}

// Utility function untuk mendapatkan data dari row dengan type safety
export function getSupplierFromRow<T>(row: {
  original: T;
}): SupplierColumnsProps {
  const supplier = row.original;

  if (!isSupplierData(supplier)) {
    throw new Error("Invalid supplier data structure");
  }

  return supplier;
}

// Utility function untuk safe access ke supp code
// export function getSupplierCode<T>(row: { original: T }): string | null {
//   try {
//     const supplier = getSupplierFromRow(row);
//     return supplier.code;
//   } catch {
//     return null;
//   }
// }

// Search utility function
export function searchSupplier(
  supplier: SupplierColumnsProps,
  searchTerm: string
): boolean {
  const search = searchTerm.toLowerCase().trim();

  if (!search) return true;

  const searchableFields = [
    supplier.name,
    supplier.code,
    supplier.npwpNumber || "",
    ...supplier.contacts.map((contact) => contact.name),
    ...supplier.contacts.map((contact) => contact.phoneNumber),
    ...supplier.contacts.map((contact) => contact.email || ""),
    ...supplier.addresses.map((address) => address.addressLine1),
  ];

  return searchableFields.some((field) => field.toLowerCase().includes(search));
}
