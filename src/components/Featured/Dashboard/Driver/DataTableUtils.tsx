import { DriverColumnsProps } from "./Columns";

// Type guard untuk memastikan data adalah EmployeeColumns
export function isDriverData(data: unknown): data is DriverColumnsProps {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    "name" in data &&
    "statusActive" in data && // Fixed: was "statusActive", should be "isActive"
    "activeDate" in data &&
    "phoneNumber" in data &&
    "city" in data
  );
}

// Utility function untuk mendapatkan data dari row dengan type safety
export function getDriverFromRow<T>(row: { original: T }): DriverColumnsProps {
  const driver = row.original;

  if (!isDriverData(driver)) {
    console.error("Invalid driver data structure:", driver);
    throw new Error("Invalid driver data structure");
  }

  return driver;
}

// Search utility function with better error handling
export function searchDriver(
  driver: DriverColumnsProps,
  searchTerm: string
): boolean {
  const search = searchTerm.toLowerCase().trim();

  if (!search) return true;

  try {
    const searchableFields = [
      driver.name || "",
      driver.code || "",
      driver.city || "",
      driver.addressLine1 || "",
      driver.phoneNumber || "",
    ];

    return searchableFields.some((field) =>
      field.toString().toLowerCase().includes(search)
    );
  } catch (error) {
    console.error("Error in search function:", error);
    return false;
  }
}
