import { VehicleType } from "@prisma/client";
import { VehicleColumnsProps } from "./Columns";
// Type guard untuk memastikan data adalah EmployeeColumns
export function isVehicleData(data: unknown): data is VehicleColumnsProps {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "vehicleNumber" in data &&
    "vehicleType" in data &&
    "vehicleMake" in data &&
    "vehicleYear" in data
  );
}

// Utility function untuk mendapatkan data dari row dengan type safety
export function getVehicleFromRow<T>(row: {
  original: T;
}): VehicleColumnsProps {
  const vehicle = row.original;

  if (!isVehicleData(vehicle)) {
    console.error("Invalid vehicle data structure:", vehicle);
    throw new Error("Invalid vehicle data structure");
  }

  return vehicle;
}

// Search utility function with better error handling
export function searchVehicle(
  vehicle: VehicleColumnsProps,
  searchTerm: string
): boolean {
  const search = searchTerm.toLowerCase().trim();

  if (!search) return true;

  try {
    const searchableFields = [
      vehicle.vehicleNumber || "",
      vehicle.vehicleType || VehicleType.BOX,
      vehicle.vehicleMake || "",
      vehicle.vehicleYear || "",
    ];

    return searchableFields.some((field) =>
      field.toString().toLowerCase().includes(search)
    );
  } catch (error) {
    console.error("Error in search function:", error);
    return false;
  }
}
