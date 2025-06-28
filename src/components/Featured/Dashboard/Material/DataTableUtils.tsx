import { MaterialColumnsProps } from "./Columns";

// Type guard untuk memastikan data adalah SupplierColumnsProps
export function isMaterialData(data: unknown): data is MaterialColumnsProps {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    "name" in data &&
    "category" in data &&
    "unit" in data &&
    "brand" in data &&
    "currentStock" in data &&
    "minimumStock" in data
  );
}

// Utility function untuk mendapatkan data dari row dengan type safety
export function getMaterialFromRow<T>(row: {
  original: T;
}): MaterialColumnsProps {
  const material = row.original;

  if (!isMaterialData(material)) {
    throw new Error("Invalid material data structure");
  }

  return material;
}

// Search utility function
export function searchMaterial(
  material: MaterialColumnsProps,
  searchTerm: string
): boolean {
  const search = searchTerm.toLowerCase().trim();

  if (!search) return true;

  const searchableFields = [
    material.name,
    material.code,
    material.category,
    material.brand,
  ];

  return searchableFields.some((field) => field.toLowerCase().includes(search));
}
