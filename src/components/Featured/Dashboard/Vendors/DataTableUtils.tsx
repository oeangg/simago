import { VendorColumnsProps } from "./Columns";

// Type guard untuk memastikan data adalah SupplierColumnsProps
export function isVendorData(data: unknown): data is VendorColumnsProps {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    "name" in data &&
    "vendorType" in data &&
    "statusActive" in data &&
    "vendorContacts" in data &&
    "vendorAddresses" in data
  );
}

// Utility function untuk mendapatkan data dari row dengan type safety
export function getVendorFromRow<T>(row: { original: T }): VendorColumnsProps {
  const vendor = row.original;

  if (!isVendorData(vendor)) {
    throw new Error("Invalid vendor data structure");
  }

  return vendor;
}

// Search utility function
export function searchVendor(
  vendor: VendorColumnsProps,
  searchTerm: string
): boolean {
  const search = searchTerm.toLowerCase().trim();

  if (!search) return true;

  const searchableFields = [
    vendor.name,
    vendor.code,
    vendor.npwpNumber || "",
    ...vendor.vendorContacts.map((contact) => contact.name),
    ...vendor.vendorContacts.map((contact) => contact.phoneNumber),
    ...vendor.vendorContacts.map((contact) => contact.email || ""),
    ...vendor.vendorAddresses.map((address) => address.addressLine1),
    ...vendor.vendorBankings.map((banking) => banking.bankingNumber),
  ];

  return searchableFields.some((field) => field.toLowerCase().includes(search));
}
