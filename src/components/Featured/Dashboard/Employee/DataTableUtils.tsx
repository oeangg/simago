import { EmployeeColumns } from "./Columns";

// Type guard untuk memastikan data adalah EmployeeColumns
export function isEmployeeData(data: unknown): data is EmployeeColumns {
  return (
    typeof data === "object" &&
    data !== null &&
    "nik" in data &&
    "name" in data &&
    "isActive" in data && // Fixed: was "statusActive", should be "isActive"
    "activeDate" in data &&
    "phoneNumber" in data &&
    "city" in data &&
    "employments" in data
  );
}

// Utility function untuk mendapatkan data dari row dengan type safety
export function getEmployeeFromRow<T>(row: { original: T }): EmployeeColumns {
  const employee = row.original;

  if (!isEmployeeData(employee)) {
    console.error("Invalid employee data structure:", employee);
    throw new Error("Invalid employee data structure");
  }

  return employee;
}

// export function getEmployeeNIK<T>(row: { original: T }): string | null {
//   try {
//     const employee = getEmployeeFromRow(row);
//     return employee.nik;
//   } catch (error) {
//     console.error("Error getting employee NIK:", error);
//     return null;
//   }
// }

// Search utility function with better error handling
export function searchEmployee(
  employee: EmployeeColumns,
  searchTerm: string
): boolean {
  const search = searchTerm.toLowerCase().trim();

  if (!search) return true;

  try {
    const searchableFields = [
      employee.name || "",
      employee.nik || "",
      employee.city || "",
      employee.address || "",
      employee.phoneNumber || "",
      employee.employments?.[0]?.division?.name || "",
      employee.employments?.[0]?.position?.name || "",
    ];

    return searchableFields.some((field) =>
      field.toString().toLowerCase().includes(search)
    );
  } catch (error) {
    console.error("Error in search function:", error);
    return false;
  }
}
