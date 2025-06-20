import { CustomerColumnsProps } from "./Columns";

// Type guard untuk memastikan data adalah CustomerColumnsProps
export function isCustomerData(data: unknown): data is CustomerColumnsProps {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    "name" in data &&
    "customerType" in data &&
    "statusActive" in data &&
    "contacts" in data &&
    "addresses" in data
  );
}

// Utility function untuk mendapatkan customer dari row dengan type safety
export function getCustomerFromRow<T>(row: {
  original: T;
}): CustomerColumnsProps {
  const customer = row.original;

  if (!isCustomerData(customer)) {
    throw new Error("Invalid customer data structure");
  }

  return customer;
}

// Utility function untuk safe access ke customer code
export function getCustomerCode<T>(row: { original: T }): string | null {
  try {
    const customer = getCustomerFromRow(row);
    return customer.code;
  } catch {
    return null;
  }
}

// Export utility untuk CSV
export function exportCustomersToCSV(customers: CustomerColumnsProps[]): void {
  const headers = ["Code", "Name", "Type", "Status", "NPWP"];
  const csvContent = [
    headers.join(","),
    ...customers.map((customer) =>
      [
        customer.code,
        `"${customer.name}"`, // Escape quotes for names with commas
        customer.customerType,
        customer.statusActive,
        customer.npwpNumber || "",
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `customers_${new Date().toISOString().split("T")[0]}.csv`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// Search utility function
export function searchCustomer(
  customer: CustomerColumnsProps,
  searchTerm: string
): boolean {
  const search = searchTerm.toLowerCase().trim();

  if (!search) return true;

  const searchableFields = [
    customer.name,
    customer.code,
    customer.npwpNumber || "",
    ...customer.contacts.map((contact) => contact.name),
    ...customer.contacts.map((contact) => contact.phoneNumber),
    ...customer.contacts.map((contact) => contact.email || ""),
    ...customer.addresses.map((address) => address.addressLine1),
  ];

  return searchableFields.some((field) => field.toLowerCase().includes(search));
}
